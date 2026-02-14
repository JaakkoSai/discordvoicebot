import { SlashCommandBuilder } from "discord.js";
import { getOrCreateSession } from "../../state/sessionStore";
import { BotCommand } from "./types";

export const costCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("cost")
    .setDescription("Näytä nykyiset kustannusasetukset"),
  async execute(interaction, context) {
    if (!interaction.inGuild()) {
      await interaction.reply({ content: "Tämä komento toimii vain palvelimella.", ephemeral: true });
      return;
    }

    const session = getOrCreateSession(interaction.guildId!, context.runtime.config.modeDefault);
    await interaction.reply(
      [
        `mode: ${session.mode}`,
        `max_utterance_seconds: ${context.runtime.config.maxUtteranceSeconds}`,
        `user_cooldown_seconds: ${context.runtime.config.userCooldownSeconds}`,
        `llm_model: ${context.runtime.config.openaiModel}`,
        `stt_provider: ${context.runtime.stt.name}`,
        `tts_provider: ${context.runtime.tts.name}`
      ].join("\n")
    );
  }
};
