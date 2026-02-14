import { AudioPlayer, StreamType, VoiceConnection, createAudioPlayer } from "@discordjs/voice";
import { SessionMode, TranscriptEntry, VoiceStyle } from "../types";

export interface TtsQueueItem {
  text: string;
  audio: Buffer;
  inputType: StreamType;
}

export interface GuildSession {
  guildId: string;
  connection?: VoiceConnection;
  player: AudioPlayer;
  mode: SessionMode;
  voiceStyle: VoiceStyle;
  textChannelId?: string;
  transcript: TranscriptEntry[];
  cooldownUntilByUser: Map<string, number>;
  ttsQueue: TtsQueueItem[];
  isQueueProcessing: boolean;
  activeSpeakers: Set<string>;
  activeCaptureUsers: Set<string>;
  lastUserSpeechAt: number;
  guildCooldownUntilMs: number;
  detachReceiver?: () => void;
}

const sessions = new Map<string, GuildSession>();

export function getOrCreateSession(guildId: string, modeDefault: SessionMode): GuildSession {
  const existing = sessions.get(guildId);
  if (existing) {
    return existing;
  }

  const created: GuildSession = {
    guildId,
    player: createAudioPlayer(),
    mode: modeDefault,
    voiceStyle: "deep",
    transcript: [],
    cooldownUntilByUser: new Map<string, number>(),
    ttsQueue: [],
    isQueueProcessing: false,
    activeSpeakers: new Set<string>(),
    activeCaptureUsers: new Set<string>(),
    lastUserSpeechAt: 0,
    guildCooldownUntilMs: 0
  };

  sessions.set(guildId, created);
  return created;
}

export function getSession(guildId: string): GuildSession | undefined {
  return sessions.get(guildId);
}

export function removeSession(guildId: string): void {
  const session = sessions.get(guildId);
  if (!session) {
    return;
  }
  session.detachReceiver?.();
  session.connection?.destroy();
  sessions.delete(guildId);
}

export function addTranscriptEntry(
  session: GuildSession,
  entry: TranscriptEntry,
  windowMs = 60_000
): void {
  session.transcript.push(entry);
  const cutoff = Date.now() - windowMs;
  session.transcript = session.transcript.filter((item) => item.atMs >= cutoff);
}
