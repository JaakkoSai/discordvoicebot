import { SlashCommandBuilder } from "discord.js";
import { getOrCreateSession } from "../../state/sessionStore";
import { SessionMode } from "../../types";
import { BotCommand } from "./types";
import { ensureControlAccess } from "./guards";

export const modeCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("mode")
    .setDescription("Aseta vastaustila")
    .addStringOption((option) =>
      option
        .setName("mode")
        .setDescription("wakeword = halvin")
        .setRequired(true)
        .addChoices(
          { name: "wakeword", value: "wakeword" },
          { name: "always", value: "always" },
          { name: "off", value: "off" }
        )
    ),
  async execute(interaction, context) {
    if (!interaction.inGuild()) {
      await interaction.reply({ content: "Tämä komento toimii vain palvelimella.", ephemeral: true });
      return;
    }
    if (!(await ensureControlAccess(interaction, context.runtime.config))) {
      return;
    }

    const nextMode = interaction.options.getString("mode", true) as SessionMode;
    const session = getOrCreateSession(interaction.guildId!, context.runtime.config.modeDefault);
    session.mode = nextMode;
    await interaction.reply(`Tila asetettu: **${nextMode}**.`);
  }
};
