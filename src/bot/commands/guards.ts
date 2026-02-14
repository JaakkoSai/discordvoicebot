import { ChatInputCommandInteraction, PermissionsBitField } from "discord.js";
import { AppConfig } from "../../types";

function hasManageGuild(interaction: ChatInputCommandInteraction): boolean {
  return interaction.memberPermissions?.has(PermissionsBitField.Flags.ManageGuild) ?? false;
}

export function canRunControlCommand(
  interaction: ChatInputCommandInteraction,
  config: AppConfig
): boolean {
  if (config.adminUserIds.includes(interaction.user.id)) {
    return true;
  }

  if (!config.allowOnlyAdminsForControlCommands) {
    return true;
  }

  return hasManageGuild(interaction);
}

export async function ensureControlAccess(
  interaction: ChatInputCommandInteraction,
  config: AppConfig
): Promise<boolean> {
  if (canRunControlCommand(interaction, config)) {
    return true;
  }

  await interaction.reply({
    content: "Sinulla ei ole oikeutta käyttää tätä komentoa.",
    ephemeral: true
  });
  return false;
}
