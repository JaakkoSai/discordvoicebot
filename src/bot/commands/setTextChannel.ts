import { ChannelType, SlashCommandBuilder } from "discord.js";
import { getOrCreateSession } from "../../state/sessionStore";
import { BotCommand } from "./types";
import { ensureControlAccess } from "./guards";

export const setTextChannelCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("settextchannel")
    .setDescription("Aseta tekstikanava, johon botin vastaukset lähetetään")
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("Tekstikanava (jätä tyhjäksi käyttääksesi nykyistä)")
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(false)
    ),
  async execute(interaction, context) {
    if (!interaction.inGuild()) {
      await interaction.reply({ content: "Tämä komento toimii vain palvelimella.", ephemeral: true });
      return;
    }
    if (!(await ensureControlAccess(interaction, context.runtime.config))) {
      return;
    }

    const optionChannel = interaction.options.getChannel("channel");
    const target = optionChannel
      ? (await interaction.guild!.channels.fetch(optionChannel.id).catch(() => null))
      : interaction.channel;

    if (!target || !("isTextBased" in target) || !target.isTextBased()) {
      await interaction.reply({ content: "Valitse kelvollinen tekstikanava.", ephemeral: true });
      return;
    }

    const session = getOrCreateSession(interaction.guildId!, context.runtime.config.modeDefault);
    session.textChannelId = target.id;
    await interaction.reply(`Tekstivastaukset ohjataan nyt kanavaan <#${target.id}>.`);
  }
};
