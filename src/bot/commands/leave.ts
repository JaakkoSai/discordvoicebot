import { SlashCommandBuilder } from "discord.js";
import { leaveGuildVoice } from "../../voice/join";
import { BotCommand } from "./types";

export const leaveCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("leave")
    .setDescription("Poistu puhekanavasta ja lopeta kuuntelu"),
  async execute(interaction) {
    if (!interaction.inGuild()) {
      await interaction.reply({ content: "Tämä komento toimii vain palvelimella.", ephemeral: true });
      return;
    }

    const left = leaveGuildVoice(interaction.guildId!);
    await interaction.reply(left ? "Poistuin puhekanavasta." : "En ollut puhekanavassa.");
  }
};
