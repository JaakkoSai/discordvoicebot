import { SlashCommandBuilder } from "discord.js";
import { getOrCreateSession } from "../../state/sessionStore";
import { VoiceStyle } from "../../types";
import { BotCommand } from "./types";

export const voiceCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("voice")
    .setDescription("Aseta botin puhetyyli")
    .addStringOption((option) =>
      option
        .setName("style")
        .setDescription("deep = matalampi, normal = neutraalimpi")
        .setRequired(true)
        .addChoices(
          { name: "deep", value: "deep" },
          { name: "normal", value: "normal" }
        )
    ),
  async execute(interaction, context) {
    if (!interaction.inGuild()) {
      await interaction.reply({ content: "Tämä komento toimii vain palvelimella.", ephemeral: true });
      return;
    }

    const style = interaction.options.getString("style", true) as VoiceStyle;
    const session = getOrCreateSession(interaction.guildId!, context.runtime.config.modeDefault);
    session.voiceStyle = style;
    await interaction.reply(`Puhetyyli asetettu: **${style}**.`);
  }
};
