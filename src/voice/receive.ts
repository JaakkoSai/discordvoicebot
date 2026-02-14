import {
  AudioPlayerStatus,
  EndBehaviorType,
  StreamType,
  createAudioResource,
  entersState
} from "@discordjs/voice";
import { Guild, GuildTextBasedChannel } from "discord.js";
import { Readable } from "node:stream";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import prism from "prism-media";
import { FI_WAKEWORDS } from "../config";
import { discordPcm48kStereoToWav16kMono } from "../audio/convert";
import { BotRuntime } from "../bot/runtime";
import { addTranscriptEntry, GuildSession, TtsQueueItem } from "../state/sessionStore";
import { TranscriptEntry } from "../types";
import { logger } from "../utils/logger";

const SILENCE_END_MS = 800;
const PLAYBACK_SILENCE_REQUIRED_MS = 1_200;
const MAX_TRANSCRIPT_WINDOW_MS = 60_000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function hasWakeWord(input: string): boolean {
  const text = input.toLowerCase();
  return FI_WAKEWORDS.some((wake) => text.includes(wake));
}

function stripWakeWord(input: string): string {
  return input.replace(/\bhei\s+(botti|bot)\b/gi, "").trim();
}

function shouldIgnoreCooldown(session: GuildSession, userId: string): boolean {
  const until = session.cooldownUntilByUser.get(userId) || 0;
  return Date.now() < until;
}

function markCooldown(session: GuildSession, userId: string, cooldownSeconds: number): void {
  session.cooldownUntilByUser.set(userId, Date.now() + cooldownSeconds * 1000);
}

function isTextChannel(channel: unknown): channel is GuildTextBasedChannel {
  return Boolean(channel && typeof (channel as GuildTextBasedChannel).send === "function");
}

async function maybeSendTextReply(session: GuildSession, guild: Guild, text: string): Promise<void> {
  if (!session.textChannelId) {
    return;
  }
  const channel = guild.channels.cache.get(session.textChannelId)
    ?? (await guild.channels.fetch(session.textChannelId).catch(() => null));

  if (isTextChannel(channel)) {
    await channel.send(`**Botti:** ${text}`);
  }
}

function getRecentTranscript(session: GuildSession): TranscriptEntry[] {
  const cutoff = Date.now() - MAX_TRANSCRIPT_WINDOW_MS;
  return session.transcript.filter((entry) => entry.atMs >= cutoff);
}

function enqueueTts(session: GuildSession, item: TtsQueueItem): void {
  session.ttsQueue.push(item);
}

async function waitForPlayerIdle(session: GuildSession): Promise<void> {
  try {
    await entersState(session.player, AudioPlayerStatus.Playing, 5_000);
  } catch {
    // No-op: short clips can skip explicit playing transition.
  }

  try {
    await entersState(session.player, AudioPlayerStatus.Idle, 30_000);
  } catch {
    logger.warn("Player idle wait timed out, forcing stop");
    session.player.stop(true);
  }
}

async function waitForSilence(session: GuildSession): Promise<void> {
  for (;;) {
    const now = Date.now();
    const silentForMs = now - session.lastUserSpeechAt;

    if (session.activeSpeakers.size > 0 && silentForMs > 5_000) {
      // Fallback when "end" was missed; prevents queue deadlock.
      session.activeSpeakers.clear();
    }

    if (session.activeSpeakers.size === 0 && silentForMs >= PLAYBACK_SILENCE_REQUIRED_MS) {
      return;
    }
    await delay(120);
  }
}

async function processQueue(session: GuildSession): Promise<void> {
  if (session.isQueueProcessing) {
    return;
  }
  session.isQueueProcessing = true;

  try {
    while (session.ttsQueue.length > 0) {
      const next = session.ttsQueue.shift();
      if (!next) {
        continue;
      }
      if (!session.connection) {
        continue;
      }

      await waitForSilence(session);
      const resource = createAudioResource(Readable.from(next.audio), { inputType: next.inputType });
      session.player.play(resource);
      logger.info("TTS played", { guildId: session.guildId, text: next.text });
      await waitForPlayerIdle(session);
    }
  } finally {
    session.isQueueProcessing = false;
  }
}

async function maybeRecordDebugAudio(
  guildId: string,
  userId: string,
  wavBuffer: Buffer,
  runtime: BotRuntime
): Promise<void> {
  if (!runtime.config.debugRecordAudio) {
    return;
  }

  const dir = join(process.cwd(), "debug-audio");
  await mkdir(dir, { recursive: true });
  const file = join(dir, `${guildId}-${userId}-${Date.now()}.wav`);
  await writeFile(file, wavBuffer);
}

async function handleUtterance(
  session: GuildSession,
  guild: Guild,
  userId: string,
  pcm48Stereo: Buffer,
  runtime: BotRuntime
): Promise<void> {
  const member = guild.members.cache.get(userId) ?? (await guild.members.fetch(userId).catch(() => null));
  const username = member?.displayName || member?.user.username || `user:${userId}`;

  const wav16Mono = discordPcm48kStereoToWav16kMono(pcm48Stereo);
  await maybeRecordDebugAudio(guild.id, userId, wav16Mono, runtime);

  logger.info("Heard utterance", { guildId: guild.id, userId, pcmBytes: pcm48Stereo.length });

  const transcript = (await runtime.stt.transcribe(wav16Mono, "fi")).trim();
  if (!transcript) {
    return;
  }

  logger.info("Transcribed", { guildId: guild.id, userId, text: transcript });
  addTranscriptEntry(session, {
    userId,
    username,
    text: transcript,
    atMs: Date.now()
  });

  if (session.mode === "off") {
    return;
  }

  const wakewordDetected = hasWakeWord(transcript);
  if (wakewordDetected) {
    logger.info("Wakeword detected", { guildId: guild.id, userId });
  }
  if (session.mode === "wakeword" && !wakewordDetected) {
    logger.debug("Wakeword not detected; skipping LLM", { guildId: guild.id, userId });
    return;
  }

  if (shouldIgnoreCooldown(session, userId)) {
    logger.debug("User in cooldown; skipping response", { guildId: guild.id, userId });
    return;
  }
  markCooldown(session, userId, runtime.config.userCooldownSeconds);

  const latestUtterance = wakewordDetected ? stripWakeWord(transcript) || transcript : transcript;
  logger.info("LLM called", { guildId: guild.id, userId, wakewordDetected, mode: session.mode });
  const reply = (await runtime.llm.generateReply({
    transcript: getRecentTranscript(session),
    latestSpeaker: username,
    latestUtterance
  })).trim();
  if (!reply) {
    return;
  }

  if (runtime.config.postTextResponses) {
    await maybeSendTextReply(session, guild, reply).catch((error) => {
      logger.warn("Failed to send text reply", { guildId: guild.id, error });
    });
  }

  const ttsAudio = await runtime.tts.speak(reply, {
    language: "fi-FI",
    voiceStyle: session.voiceStyle
  });

  enqueueTts(session, {
    text: reply,
    audio: ttsAudio,
    inputType: StreamType.OggOpus
  });
  await processQueue(session);
}

function captureUserAudio(
  session: GuildSession,
  guild: Guild,
  userId: string,
  runtime: BotRuntime
): void {
  const connection = session.connection;
  if (!connection) {
    return;
  }

  if (session.activeCaptureUsers.has(userId)) {
    return;
  }
  session.activeCaptureUsers.add(userId);

  const maxBytes = runtime.config.maxUtteranceSeconds * 48_000 * 2 * 2;
  const chunks: Buffer[] = [];
  let total = 0;
  let ended = false;
  const receiver = connection.receiver;

  const opusStream = receiver.subscribe(userId, {
    end: {
      behavior: EndBehaviorType.AfterSilence,
      duration: SILENCE_END_MS
    }
  });
  const decoder = new prism.opus.Decoder({
    frameSize: 960,
    channels: 2,
    rate: 48_000
  });

  const timeout = setTimeout(() => {
    opusStream.destroy();
  }, runtime.config.maxUtteranceSeconds * 1000 + 250);

  const done = async (): Promise<void> => {
    if (ended) {
      return;
    }
    ended = true;
    clearTimeout(timeout);
    session.activeCaptureUsers.delete(userId);
    session.activeSpeakers.delete(userId);
    session.lastUserSpeechAt = Date.now();

    if (total < 20_000) {
      return;
    }

    try {
      await handleUtterance(session, guild, userId, Buffer.concat(chunks, total), runtime);
    } catch (error) {
      logger.error("Failed to process utterance", { guildId: guild.id, userId, error });
    }
  };

  opusStream
    .pipe(decoder)
    .on("data", (chunk: Buffer) => {
      session.lastUserSpeechAt = Date.now();
      if (total >= maxBytes) {
        return;
      }
      const remaining = maxBytes - total;
      if (chunk.length > remaining) {
        chunks.push(chunk.subarray(0, remaining));
        total += remaining;
        opusStream.destroy();
        return;
      }
      chunks.push(chunk);
      total += chunk.length;
    })
    .once("end", () => {
      void done();
    })
    .once("close", () => {
      void done();
    })
    .once("error", (error) => {
      logger.warn("Capture stream error", { guildId: guild.id, userId, error });
      void done();
    });
}

export function attachReceiver(session: GuildSession, guild: Guild, runtime: BotRuntime): () => void {
  const connection = session.connection;
  if (!connection) {
    return () => undefined;
  }
  const receiver = connection.receiver;
  const botId = guild.client.user?.id;

  const onStart = (userId: string): void => {
    if (userId === botId) {
      return;
    }
    session.activeSpeakers.add(userId);
    session.lastUserSpeechAt = Date.now();
    captureUserAudio(session, guild, userId, runtime);
  };

  const onEnd = (userId: string): void => {
    session.activeSpeakers.delete(userId);
    session.lastUserSpeechAt = Date.now();
  };

  receiver.speaking.on("start", onStart);
  receiver.speaking.on("end", onEnd);

  return () => {
    receiver.speaking.off("start", onStart);
    receiver.speaking.off("end", onEnd);
  };
}
