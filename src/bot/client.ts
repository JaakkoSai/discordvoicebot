import { Client, Events, GatewayIntentBits, Interaction, REST, Routes } from "discord.js";
import { commands } from "./commands";
import { BotRuntime } from "./runtime";
import { logger } from "../utils/logger";

async function registerSlashCommands(runtime: BotRuntime): Promise<void> {
  const rest = new REST({ version: "10" }).setToken(runtime.config.discordToken);
  const body = commands.map((command) => command.data.toJSON());

  if (runtime.config.discordGuildId) {
    await rest.put(
      Routes.applicationGuildCommands(runtime.config.discordClientId, runtime.config.discordGuildId),
      { body }
    );
    logger.info("Registered guild slash commands", { guildId: runtime.config.discordGuildId });
    return;
  }

  await rest.put(Routes.applicationCommands(runtime.config.discordClientId), { body });
  logger.info("Registered global slash commands");
}

async function handleInteraction(
  interaction: Interaction,
  runtime: BotRuntime
): Promise<void> {
  if (!interaction.isChatInputCommand()) {
    return;
  }

  const command = commands.find((item) => item.data.name === interaction.commandName);
  if (!command) {
    await interaction.reply({ content: "Tuntematon komento.", ephemeral: true });
    return;
  }

  try {
    await command.execute(interaction, { runtime });
  } catch (error) {
    logger.error("Command execution failed", {
      command: interaction.commandName,
      guildId: interaction.guildId,
      error
    });

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: "Komennon suoritus epäonnistui.", ephemeral: true });
      return;
    }

    await interaction.reply({ content: "Komennon suoritus epäonnistui.", ephemeral: true });
  }
}

export async function createBotClient(runtime: BotRuntime): Promise<Client> {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.GuildMessages
    ]
  });

  client.once(Events.ClientReady, (readyClient) => {
    logger.info(`Logged in as ${readyClient.user.tag}`);
  });

  client.on(Events.InteractionCreate, (interaction) => {
    void handleInteraction(interaction, runtime);
  });

  await registerSlashCommands(runtime);
  return client;
}
