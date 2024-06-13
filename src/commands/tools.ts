import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
// import { getConfig, start } from '@m/ping-monitor';
import { client, clientDev, restartContainer, startupTime } from '@h/bot';
import { checkConnectionTime, resolveForYogyakarta } from '@h/resolve-time';
import { dateFormatIndo } from '@h/utils';

interface PingTime {
  time: number;
  duration: number | null;
  error?: string;
}

const cmdPingContime = async (interaction: ChatInputCommandInteraction): Promise<void> => {
  let count: number = interaction.options.getInteger("count") || 3;
  count = (count < 1 || count > 10) ? 3 : count;
  let url: string = interaction.options.getString("url") || "";

  await interaction.reply({
    content: `URL: **${url}**\nAttempt count: ${count}`,
    embeds: [{
      color: 0x6c757d,
      description: 'Loading...',
    }]
  });

  let arrTimes: PingTime[] = [];
  for (let i = 0; i < count; i++) {
    let time = new Date().getTime();
    try {
      let duration = await checkConnectionTime(url);
      arrTimes.push({
        time: time,
        duration: duration
      });
    } catch (err: any) {
      arrTimes.push({
        time: time,
        duration: null,
        error: err
      });
    }
  }

  let response = arrTimes.map(r => {
    let text = `${dateFormatIndo(new Date(r.time))}: ${r.duration}`;
    if (r.error) {
      text += `\n**[E]**: ${r.error}`;
    }
    return text;
  }).join("\n");

  let okCount = 0, avgRTime = 0;
  arrTimes.forEach(r => {
    if (!r.error) {
      okCount++;
      avgRTime += r.duration!;
    }
  });
  if (okCount > 0) {
    avgRTime /= okCount;
  }
  response += `\n\n**Summary:**\n`;
  response += `Total pings: **${count}**\nSuccess pings: **${okCount}**\nAverage res time: **${avgRTime}**`;

  await interaction.editReply({
    embeds: [{
      color: 0x0d6efd,
      description: response
    }]
  });
};

const cmdPingResolve = async (interaction: ChatInputCommandInteraction): Promise<void> => {
  await interaction.reply({
    embeds: [{
      color: 0x6c757d,
      description: 'Loading...',
    }]
  });

  let data = await resolveForYogyakarta();

  let description = 'Ping times from server:\n';
  description += '```json\n' + JSON.stringify(data.results, null, "  ") + '```\n';
  description += 'Average _[adjusted +25ms +0,1x]_: **' + data.average + ' ms**';

  await interaction.editReply({
    embeds: [{
      color: 0x0d6efd,
      description: description
    }]
  });
};

const command = {
  isDev: true,
  data: new SlashCommandBuilder()
    .setName("tools")
    .setDescription("JollyBOT management tools")
    .addSubcommandGroup(sc =>
      sc.setName("ping")
        .setDescription("Ping monitor management")
        // .addSubcommand(sc =>
        //   sc.setName("status")
        //     .setDescription("Get the current status of the ping monitor")
        // )
        // .addSubcommand(sc =>
        //   sc.setName("start")
        //     .setDescription("Start the ping monitor if it is not already running")
        // )
        .addSubcommand(sc =>
          sc.setName("contime")
            .setDescription("Check connection time to a URL")
            .addStringOption(op =>
              op.setName("url")
                .setDescription("URL yang ingin dicek")
                .setRequired(true)
            )
            .addIntegerOption(op =>
              op.setName("count")
                .setDescription("Jumlah ping")
                .setMaxValue(10)
                .setMinValue(1)
            )
        )
        .addSubcommand(sc =>
          sc.setName("resolve")
            .setDescription("All connection times to Indonesia (JKT, YOG, SBY)")
        )
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
  execute: async (interaction: ChatInputCommandInteraction): Promise<void> => {
    const scg = interaction.options.getSubcommandGroup();
    const sc = interaction.options.getSubcommand();
    if (scg === "ping") {
      // if (sc === "status") {
      //   await interaction.reply("json\n" + JSON.stringify(getConfig(), null, "  ") + "");
      // } else if (sc === "start") {
      //   await interaction.reply("Starting ping monitor...");
      //   try {
      //     await start();
      //     await interaction.editReply("Ping monitor successfully started!");
      //   } catch (err: any) {
      //     await interaction.editReply("Failed to start ping monitor: " + err.message);
      //     throw err;
      //   }
      // } else
      if (sc === "contime") {
        await cmdPingContime(interaction);
      } else if (sc === "resolve") {
        await cmdPingResolve(interaction);
      }
    } else if (scg === "system") {
      if (sc === "restart") {
        await interaction.reply({
          content: "Restarting container...",
          ephemeral: true
        });
        restartContainer();
      } else if (sc === "stats") {
        const os = await import("os");
        const output = {
          "Memory Usage (MB)": {
            "RSS (Resident Set Size)": (process.memoryUsage().rss / 1024 / 1024).toFixed(2),
            "Heap Total": (process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2),
            "Heap Used": (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2),
            "External": (process.memoryUsage().external / 1024 / 1024).toFixed(2)
          },
          // "CPU Usage (%)": (process.cpuUsage().user / 1000).toFixed(2),
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
            "PID": process.pid,
            "Boootup Time": `${new Date(startupTime)} (${process.env.TZ})`,
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
        };
        interaction.reply("```json\n" + JSON.stringify(output, null, "  ") + "```");
      }
    }
  }
};

export default command;