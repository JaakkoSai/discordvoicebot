import { SlashCommandBuilder } from "discord.js";
import { leaveGuildVoice } from "../../voice/join";
import { BotCommand } from "./types";
import { ensureControlAccess } from "./guards";

export const leaveCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("leave")
    .setDescription("Poistu puhekanavasta ja lopeta kuuntelu"),
  async execute(interaction, context) {
    if (!interaction.inGuild()) {
      await interaction.reply({ content: "Tämä komento toimii vain palvelimella.", ephemeral: true });
      return;
    }
    if (!(await ensureControlAccess(interaction, context.runtime.config))) {
      return;
    }

    const left = leaveGuildVoice(interaction.guildId!);
    await interaction.reply(left ? "Poistuin puhekanavasta." : "En ollut puhekanavassa.");
  }
};
