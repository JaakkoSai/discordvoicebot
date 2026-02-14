import { SlashCommandBuilder } from "discord.js";
import { BotCommand } from "./types";

export const privacyCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("privacy")
    .setDescription("Näytä tietosuoja- ja kuunteluilmoitus"),
  async execute(interaction) {
    await interaction.reply(
      "Tietosuojailmoitus: Kun botti on /join-tilassa, se kuuntelee puhekanavaa ja tekee puheentunnistusta " +
      "vastatakseen. Oletuksena raakaa ääntä ei tallenneta (DEBUG_RECORD_AUDIO=false). " +
      "Voit lopettaa kuuntelun komennolla /mode off tai /leave."
    );
  }
};
