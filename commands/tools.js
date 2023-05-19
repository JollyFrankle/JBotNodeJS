import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
// import * as mysql from '../modules/mysql2.js';
import { getConfig, start } from '../modules/ping-monitor.js';
import { client, clientDev, restartContainer } from '../helpers/bot.js';
import { boootupTime } from '../index.js';

export default {
  isDev: true,
	data: new SlashCommandBuilder()
    .setName("tools")
    .setDescription("JollyBOT management tools")
    .addSubcommandGroup(sc =>
      sc.setName("ping")
        .setDescription("Ping monitor management")
        .addSubcommand(sc =>
          sc.setName("status")
            .setDescription("Get the current status of the ping monitor")
        )
        .addSubcommand(sc =>
          sc.setName("start")
            .setDescription("Start the ping monitor if it is not already running")
        ),
    )
    .addSubcommandGroup(sc =>
      sc.setName("system")
        .setDescription("System management")
        .addSubcommand(sc =>
          sc.setName("restart")
            .setDescription("Restart the system")
        )
        .addSubcommand(sc =>
          sc.setName("stats")
            .setDescription("Get the current system stats")
        )
    ),
  /**
   * @param {ChatInputCommandInteraction} interaction
   */
	async execute(interaction) {
    const scg = interaction.options.getSubcommandGroup();
    const sc = interaction.options.getSubcommand();
    if(scg === "ping") {
        if (sc === "status") {
          await interaction.reply("```json\n" + JSON.stringify(getConfig(), null, "  ") + "```");
        } else if (sc === "start") {
          await interaction.reply("Starting ping monitor...");
          try {
            await start();
            await interaction.editReply("Ping monitor successfully started!");
          } catch (err) {
            await interaction.editReply("Failed to start ping monitor: " + err.message);
            throw err;
          }
        }
    } else if(scg === "system") {
      if(sc === "restart") {
        await interaction.reply({
          content: "Restarting container...",
          ephemeral: true
        })
        restartContainer();
      } else if (sc === "stats") {
        const os = await import("os");
        let output = {
          "Memory (MB)": {
            "RSS (Resident Set Size)": (process.memoryUsage().rss / 1024 / 1024).toFixed(2),
            "Heap Total": (process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2),
            "Heap Used": (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2),
            "External": (process.memoryUsage().external / 1024 / 1024).toFixed(2)
          },
          "CPU Usage (%)": (process.cpuUsage().user / 1000).toFixed(2),
          "OS": {
            "Platform": os.platform(),
            "Arch": os.arch(),
            "Release": os.release(),
            "Uptime": os.uptime(),
            "Total Memory (MB)": (os.totalmem() / 1024 / 1024).toFixed(2),
            "Free Memory (MB)": (os.freemem() / 1024 / 1024).toFixed(2)
          },
          "NodeJS": {
            "Uptime": process.uptime(),
            "Version": process.version,
            "Boootup Time": `${new Date(boootupTime)} (${process.env.TZ})`,
            "Memory Usage (MB)": (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2),
            "Discord": {
              "Main": {
                "Ping": client.ws.ping,
                "Uptime": client.uptime,
                "Ready At": `${client.readyAt?.toLocaleString()} (${process.env.TZ})`,
              },
              "Dev": {
                "Ping": clientDev.ws.ping,
                "Uptime": clientDev.uptime,
                "Ready At": `${clientDev.readyAt?.toLocaleString()} (${process.env.TZ})`,
              }
            }
          }
        }
        return interaction.reply("```json\n" + JSON.stringify(output, null, "  ") + "```");
      }
    }
	}
};
