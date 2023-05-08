import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
// import * as mysql from '../modules/mysql2.js';

export default {
  isDev: true,
	data: new SlashCommandBuilder()
    .setName("remove-msg")
    .setDescription("Remove message from specific channel")
    .addStringOption(op =>
      op.setName("link")
        .setDescription("Message link (klik kanan message > Copy Message Link)")
        .setRequired(true)
    ),
  /**
   * @param {ChatInputCommandInteraction} interaction
   */
	async execute(interaction) {
    // https://discord.com/channels/823485117980213268/823485117980213271/1103913159414251530
		let link = interaction.options.getString("link")
    let [guildId, channelId, messageId] = link.split("/").slice(4)
    let { client } = await import("../helpers/bot.js");

    // interaction.client --> tergantung siapa si client (bisa mainBot atau devBot)
    // client --> sudah pasti mainBot
    // jadi channel2nya juga muncul beda2

    let channel = client.channels.cache.get(channelId)
    let message = await channel.messages.fetch(messageId)
    message.delete().then(() => {
      interaction.reply({
        content: `Message successfully deleted.`,
        embeds: [
          {
            description: `Message detail:`,
            fields: [
              { name: `Channel`, value: `<#${channelId}>` },
              { name: `Author`, value: `<@${message.author.id}>` },
              { name: `Content`, value: message.content },
            ],
            color: 0x198754
          }
        ]
      })
    }).catch(() => {
      interaction.reply(`Message not found!`)
    })
	}
};
