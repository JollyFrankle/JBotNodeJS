import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
// import * as mysql from '../modules/mysql2.js';
import { getConfig, start } from '../modules/ping-monitor.js';

export default {
  isDev: true,
	data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Ping Monitor Management Tool")
    .addSubcommand(sc =>
      sc.setName("status")
        .setDescription("Get the current status of the ping monitor")
    )
    .addSubcommand(sc =>
      sc.setName("start")
        .setDescription("Start the ping monitor if it is not already running")
    ),

  /**
   * @param {ChatInputCommandInteraction} interaction
   */
	async execute(interaction) {
    let subcommand = interaction.options.getSubcommand();
    if (subcommand === "status") {
		  await interaction.reply("```json\n" + JSON.stringify(getConfig(), null, "  ") + "```");
    } else if (subcommand === "start") {
      await interaction.reply("Starting ping monitor...");
      try {
        await start();
        await interaction.editReply("Ping monitor successfully started!");
      } catch (err) {
        await interaction.editReply("Failed to start ping monitor: " + err.message);
        throw err;
      }
    }
	}
};
