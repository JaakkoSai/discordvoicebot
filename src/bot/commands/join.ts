import { GuildMember, SlashCommandBuilder } from "discord.js";
import { getOrCreateSession } from "../../state/sessionStore";
import { joinMemberVoiceChannel } from "../../voice/join";
import { BotCommand } from "./types";
import { ensureControlAccess } from "./guards";

export const joinCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("join")
    .setDescription("Liity puhekanavaan ja aloita kuuntelu"),
  async execute(interaction, context) {
    if (!interaction.inGuild()) {
      await interaction.reply({ content: "Tämä komento toimii vain palvelimella.", ephemeral: true });
      return;
    }
    if (!(await ensureControlAccess(interaction, context.runtime.config))) {
      return;
    }

    const member = interaction.member as GuildMember;
    const voiceChannel = member.voice.channel;
    if (!voiceChannel) {
      await interaction.reply({
        content: "Mene ensin puhekanavaan ja käytä sitten /join.",
        ephemeral: true
      });
      return;
    }

    await joinMemberVoiceChannel(member, voiceChannel, context.runtime);
    const session = getOrCreateSession(interaction.guildId!, context.runtime.config.modeDefault);
    if (!session.textChannelId && interaction.channelId) {
      session.textChannelId = interaction.channelId;
    }

    await interaction.reply(
      `Liityin kanavaan **${voiceChannel.name}**. Wakeword: "hei botti" tai "hei bot".`
    );
  }
};
