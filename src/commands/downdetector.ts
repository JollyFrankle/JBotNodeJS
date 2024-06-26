// import { SlashCommandBuilder, SlashCommandStringOption, ChatInputCommandInteraction, AutocompleteInteraction } from 'discord.js';
// import query from '@m/mysql2';
// import { muteChannel as muteChannelPM, unmuteChannel as unmuteChannelPM } from '@m/ping-monitor';

// let cache: any[] = [];

// async function getPMHosts(channelId: string | null = null, findNotIn: boolean = false): Promise<{ name: string, value: string }[]> {

//     // if(cache.length == 0) {
//     const result = await query("SELECT id, nama, channels FROM pm_host ORDER BY nama ASC;")
//     if (result.length > 0) {
//         let rows = result;
//         for (let row of rows) {
//             row.channels = JSON.parse(row.channels)
//             row.id = row.id.toString()
//         }
//         cache = rows
//     }

//     // let result = await queryLegacy("SELECT id, nama, channels FROM pm_host ORDER BY nama ASC;")
//     // if (result.status == 200) {
//     //     let rows = result.data;
//     //     for (let row of rows) {
//     //         row.channels = JSON.parse(row.channels)
//     //         row.id = row.id.toString()
//     //     }
//     //     //   cache = rows
//     // }
//     // // }

//     if (channelId === null) {
//         return cache.map(c => ({ name: c.nama, value: c.id }))
//     } else {
//         if (findNotIn) {
//             return cache
//                 .filter(c => !Object.keys(c.channels).includes(channelId))
//                 .map(c => ({ name: c.nama, value: c.id }))
//         }
//         return cache
//             .filter(c => Object.keys(c.channels).includes(channelId))
//             .map(c => ({ name: c.nama, value: c.id }))
//     }
// }

// const soSite = (desc: string): SlashCommandStringOption =>
//     new SlashCommandStringOption()
//         .setName('site')
//         .setDescription(desc)
//         .setAutocomplete(true)
//         .setRequired(true)


// /**
//  * Command for muting a site on a channel
//  * @param {ChatInputCommandInteraction} interaction
//  */
// async function muteCommand(interaction: ChatInputCommandInteraction): Promise<void> {
//     const siteId = +interaction.options.getString('site')!!
//     const channelId = interaction.channelId
//     const duration = interaction.options.getString('duration')!!

//     let muteUntil: Date = new Date()
//     muteUntil.setHours(muteUntil.getHours() + parseInt(duration))
//     let muteUntilTime = (muteUntil.getTime() / 1000)
//     let result = await muteChannelPM(siteId, channelId, muteUntilTime)

//     if (result.success) {
//         await interaction.reply(`Down detector **${result.data?.nama}** telah dimute sementara di channel ini hingga ${muteUntil.toLocaleString()} (${process.env.TZ}).`)
//     } else {
//         await interaction.reply(`Situs yang diminta gagal dimute sementara di channel ini: **${result.message}**.`)
//     }
// }

// /**
//  * Command for unmuting a site on a channel
//  * @param {ChatInputCommandInteraction} interaction
//  */
// async function unmuteCommand(interaction: ChatInputCommandInteraction): Promise<void> {
//     const siteId = +interaction.options.getString('site')!!
//     const channelId = interaction.channelId

//     let result = await unmuteChannelPM(siteId, channelId)
//     if (result.success) {
//         await interaction.reply(`Down detector **${result.data?.nama}** telah diunmute di channel ini.`)
//     } else {
//         await interaction.reply(`Situs yang diminta gagal diunmute di channel ini: **${result.message}**.`)
//     }
// }

// export default {
//     isDev: false,
//     data: new SlashCommandBuilder()
//         .setName("downdetector")
//         .setDescription("Down detector management tool")
//         .addSubcommand(sc =>
//             sc.setName("mute")
//                 .setDescription("Mute sementara down detector pada channel ini.")
//                 .addStringOption(soSite("Situs yang ingin di-mute sementara"))
//                 .addStringOption(op =>
//                     op.setName("duration")
//                         .setDescription("Durasi mute")
//                         .setRequired(true)
//                         .addChoices(
//                             { name: "1 jam", value: "1" },
//                             { name: "4 jam", value: "4" },
//                             { name: "8 jam", value: "8" },
//                             { name: "24 jam", value: "24" }
//                         )
//                 )
//         )
//         .addSubcommand(sc =>
//             sc.setName("unmute")
//                 .setDescription("Unmute down detector pada channel ini.")
//                 .addStringOption(soSite("Situs yang ingin di-unmute"))
//         )
//     // .addSubcommand(sc =>
//     //   sc.setName("subscribe")
//     //     .setDescription("Subscribe ke sebuah situs down detector")
//     //     .addStringOption(soSite("Situs yang ingin di-subscribe"))
//     // )
//     // .addSubcommand(sc =>
//     //   sc.setName("unsubscribe")
//     //     .setDescription("Unsubscribe dari sebuah situs down detector")
//     //     .addStringOption(soSite("Situs yang ingin di-unsubscribe"))
//     // )
//     // .addSubcommand(sc =>
//     //   sc.setName("report")
//     //     .setDescription("Generate laporan down detector")
//     //     .addStringOption(soSite("Situs yang ingin dilihat laporannya"))
//     //     .addStringOption(op =>
//     //       op.setName("periode")
//     //         .setDescription("Periode laporan")
//     //         .setRequired(true)
//     //         .addChoices(
//     //           { name: "24 jam", value: "1" },
//     //           { name: "7 hari", value: "2" },
//     //           { name: "30 hari", value: "3" }
//     //         )
//     //     )
//     // )
//     ,
//     /**
//      * @param {ChatInputCommandInteraction} interaction
//      */
//     async execute(interaction: ChatInputCommandInteraction): Promise<void> {
//         const subcommand: string = interaction.options.getSubcommand()
//         if (subcommand == "mute") {
//             await muteCommand(interaction)
//         } else if (subcommand == "unmute") {
//             await unmuteCommand(interaction)
//         } else if (subcommand == "report") {

//         } else if (subcommand == "subscribe") {

//         } else if (subcommand == "unsubscribe") {

//         }

//         if (!interaction.replied) {
//             await interaction.reply("Tidak ada perintah yang dijalankan.");
//         }
//     },
//     async autocomplete(interaction: AutocompleteInteraction): Promise<void> {
//         const focusedOption = interaction.options.getFocused(true);
//         const subcommand: string = interaction.options.getSubcommand()
//         let choices: { name: string, value: string }[] = [];

//         if (focusedOption.name == 'site') {
//             if (["mute", "unmute", "report", "unsubscribe"].includes(subcommand)) {
//                 // Get all sites that is currently monitored
//                 choices.push(...await getPMHosts(interaction.channelId))
//             } else if (["subscribe"].includes(subcommand)) {
//                 // Get all sites that is not currently monitored
//                 choices.push(...await getPMHosts(interaction.channelId, true))
//             } else {
//                 choices = []
//             }
//         }

//         let filtered: { name: string, value: string }[];
//         if (focusedOption.value.trim()) {
//             filtered = choices.filter(
//                 choice => choice.name.toLowerCase().includes(focusedOption.value.trim())
//             )
//         } else {
//             filtered = choices;
//         }

//         await interaction.respond(filtered)
//     }
// };