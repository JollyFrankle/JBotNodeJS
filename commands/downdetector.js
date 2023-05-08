import { SlashCommandBuilder, SlashCommandStringOption, ChatInputCommandInteraction } from 'discord.js';
import * as mysql from '../modules/mysql2.js';

let cache = [];

async function getPMHosts(channelId = null, findNotIn = false) {

  // if(cache.length == 0) {
    let result = await mysql.query(
      "SELECT id, nama, channels FROM pm_host ORDER BY nama ASC;"
    )
    if(result.status == 200) {
      let rows = result.data;
      for(row of rows) {
        row.channels = JSON.parse(row.channels)
        row.id = row.id.toString()
      }
      cache = rows
    }
  // } else {
  //   let result = mysql.query(
  //     "SELECT id, nama, channels FROM pm_host ORDER BY nama ASC;"
  //   ).then(result => {
  //     if(result.status == 200) {
  //       let rows = result.data;
  //       for(row of rows) {
  //         row.channels = JSON.parse(row.channels)
  //         row.id = row.id.toString()
  //       }
  //       cache = rows
  //     }
  //   })
  // }

  if(channelId === null) {
    return cache.map(c => ({ name: c.nama, value: c.id }))
  } else {
    if(findNotIn) {
      return cache
        .filter(c => !Object.keys(c.channels).includes(channelId))
        .map(c => ({ name: c.nama, value: c.id }))
    }
    return cache
      .filter(c => Object.keys(c.channels).includes(channelId))
      .map(c => ({ name: c.nama, value: c.id }))
  }
}

const soSite = (desc) => new SlashCommandStringOption()
  .setName('site')
  .setDescription(desc)
  .setAutocomplete(true)
  .setRequired(true)

export default {
  isDev: true,
	data: new SlashCommandBuilder()
    .setName("downdetector")
    .setDescription("Down detector management tool")
    .addSubcommand(sc =>
      sc.setName("mute")
        .setDescription("Mute sementara down detector pada channel ini.")
        .addStringOption(soSite("Situs yang ingin di-mute sementara"))
        .addStringOption(op =>
          op.setName("duration")
            .setDescription("Durasi mute")
            .setRequired(true)
            .addChoices(
              { name: "1 jam", value: "1" },
              { name: "4 jam", value: "4" },
              { name: "8 jam", value: "8" },
              { name: "24 jam", value: "24" }
            )
        )
    )
    .addSubcommand(sc =>
      sc.setName("subscribe")
        .setDescription("Subscribe ke sebuah situs down detector")
        .addStringOption(soSite("Situs yang ingin di-subscribe"))
    )
    .addSubcommand(sc =>
      sc.setName("unsubscribe")
        .setDescription("Unsubscribe dari sebuah situs down detector")
        .addStringOption(soSite("Situs yang ingin di-unsubscribe"))
    )
    .addSubcommand(sc =>
      sc.setName("report")
        .setDescription("Generate laporan down detector")
        .addStringOption(soSite("Situs yang ingin dilihat laporannya"))
        .addStringOption(op =>
          op.setName("periode")
            .setDescription("Periode laporan")
            .setRequired(true)
            .addChoices(
              { name: "24 jam", value: "1" },
              { name: "7 hari", value: "2" },
              { name: "30 hari", value: "3" }
            )
        )
    )
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
    ,
  /**
   * @param {ChatInputCommandInteraction} interaction
   */
	async execute(interaction) {
    const subcommand = interaction.options.getSubcommand()
    if(subcommand == "mute") {

    } else if (subcommand == "report") {

    } else if (subcommand == "subscribe") {

    } else if (subcommand == "unsubscribe") {

    } else if (subcommand == "contime") {
      const { checkConnectionTime } = await import('../helpers/resolve-time.js')
      const { dateFormatIndo } = await import('../helpers/date.js')
      let count = interaction.options.getInteger("count")
      count = (count<1 || count>10) ? 3 : count;
      let url = interaction.options.getString("url")

      // Reply first
      await interaction.reply({
        content: `URL: **${url}**\nAttempt count: ${count}`,
        embeds: [{
          color: 0x6c757d,
          description: 'Loading...',
        }]
      })

      let arrTimes = []
      for(let i=0; i<count; i++) {
        let time = new Date().getTime()
        try {
          let duration = await checkConnectionTime(url)
          arrTimes.push({
            time: time,
            duration: duration
          })
        } catch(e) {
          arrTimes.push({
            time: time,
            duration: null,
            error: e
          })
        }
      }

      // Response time every pings
      let response = arrTimes.map(r => {
        let text = `${dateFormatIndo(r.time)}: ${r.duration}`
        if(r.error) {
          text += `\n**[E]**: ${r.error}`
        }
        return text
      }).join("\n")

      // Average response time
      let okCount = 0, avgRTime = 0;
      arrTimes.forEach(r => {
        if(!r.error) {
          okCount++
          avgRTime += r.duration
        }
      })
      if(okCount > 0) {
        avgRTime /= okCount
      }
      response += `\n\n**Summary:**\n`
      response += `Total pings: **${count}**\nSuccess pings: **${okCount}**\nAverage res time: **${avgRTime}**`

      await interaction.editReply({
        embeds: [{
          color: 0x0d6efd,
          description: response
        }]
      })
    } else if (subcommand == 'resolve') {
      // Reply first
      await interaction.reply({
        embeds: [{
          color: 0x6c757d,
          description: 'Loading...',
        }]
      })

      const { resolveForYogyakarta } = await import('../helpers/resolve-time.js')
      let data = await resolveForYogyakarta()

      let description = 'Ping times from server:\n'
      description += '```json\n' + JSON.stringify(data.results, null, "  ") + '```\n'
      description += 'Average _[adjusted +25ms +0,1x]_: **' + data.average + ' ms**'

      await interaction.editReply({
        embeds: [{
          color: 0x0d6efd,
          description: description
        }]
      })
    }

    if(!interaction.replied) {
  		await interaction.reply("```json\n" + JSON.stringify(await import("../modules/ping-monitor.js").getConfig(), null, "  ") + "```");
    }
	},
  async autocomplete(interaction) {
    const focusedOption = interaction.options.getFocused(true);
    const subcommand = interaction.options.getSubcommand()
    let choices;

    if(focusedOption.name == 'site') {
      if (subcommand == "mute") {
        choices = await getPMHosts(interaction.channelId)
      } else if (subcommand == "report") {
        choices = await getPMHosts(interaction.channelId)
      } else if (subcommand == "subscribe") {
        choices = await getPMHosts(interaction.channelId, true)
      } else if (subcommand == "unsubscribe") {
        choices = await getPMHosts(interaction.channelId)
      }
    }

    let filtered;
    if(focusedOption.value.trim()) {
      filtered = choices.filter(
        choice => choice.name.toLowerCase().includes(focusedOption.value.trim())
      )
    } else {
      filtered = choices;
    }

    await interaction.respond(filtered)
  }
};
