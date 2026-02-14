import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder
} from "discord.js";
import { BotRuntime } from "../runtime";

export interface CommandContext {
  runtime: BotRuntime;
}

export interface BotCommand {
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
  execute(interaction: ChatInputCommandInteraction, context: CommandContext): Promise<void>;
}
