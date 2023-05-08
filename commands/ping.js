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
		await interaction.reply("```json\n" + JSON.stringify((await import("../modules/ping-monitor.js")).getConfig(), null, "  ") + "```");
	}
};
