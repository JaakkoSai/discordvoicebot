import {
  AudioPlayerStatus,
  DiscordGatewayAdapterCreator,
  VoiceConnectionStatus,
  entersState,
  getVoiceConnection,
  joinVoiceChannel
} from "@discordjs/voice";
import { GuildMember, VoiceBasedChannel } from "discord.js";
import { BotRuntime } from "../bot/runtime";
import { getOrCreateSession, removeSession } from "../state/sessionStore";
import { logger } from "../utils/logger";
import { attachReceiver } from "./receive";

export async function joinMemberVoiceChannel(
  member: GuildMember,
  channel: VoiceBasedChannel,
  runtime: BotRuntime
): Promise<void> {
  const session = getOrCreateSession(member.guild.id, runtime.config.modeDefault);

  if (session.connection) {
    session.detachReceiver?.();
    session.connection.destroy();
    session.connection = undefined;
  }

  const connection = joinVoiceChannel({
    guildId: member.guild.id,
    channelId: channel.id,
    adapterCreator: member.guild.voiceAdapterCreator as unknown as DiscordGatewayAdapterCreator,
    selfDeaf: false,
    selfMute: false
  });

  connection.on("stateChange", (_oldState, newState) => {
    logger.debug("Voice connection state change", {
      guildId: member.guild.id,
      connectionStatus: newState.status
    });
  });

  connection.on(VoiceConnectionStatus.Disconnected, async () => {
    try {
      await Promise.race([
        entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
        entersState(connection, VoiceConnectionStatus.Connecting, 5_000)
      ]);
      logger.warn("Voice connection disconnected; attempting resume", { guildId: member.guild.id });
    } catch {
      logger.warn("Voice connection lost permanently; cleaning up session", { guildId: member.guild.id });
      removeSession(member.guild.id);
    }
  });

  await entersState(connection, VoiceConnectionStatus.Ready, 20_000);
  session.connection = connection;
  connection.subscribe(session.player);
  session.player.on(AudioPlayerStatus.Idle, () => {
    logger.debug("Audio player idle", { guildId: member.guild.id });
  });
  session.detachReceiver = attachReceiver(session, member.guild, runtime);
}

export function leaveGuildVoice(guildId: string): boolean {
  const existing = getVoiceConnection(guildId);
  removeSession(guildId);
  if (existing) {
    existing.destroy();
    return true;
  }
  return false;
}
