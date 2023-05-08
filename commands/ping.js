import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
// import * as mysql from '../modules/mysql2.js';

export default {
  isDev: true,
	data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Ping Monitor Management Tool"),
  /**
   * @param {ChatInputCommandInteraction} interaction
   */
	async execute(interaction) {
    const { getConfig } = await import("../modules/ping-monitor.js");
		await interaction.reply("```json\n" + JSON.stringify(getConfig(), null, "  ") + "```");
	}
};
