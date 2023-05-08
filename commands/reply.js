import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';

export default {
  isDev: true,
  data: new SlashCommandBuilder()
	.setName('reply')
	.setDescription('Send message to specific channel!')
  .addStringOption(op =>
    op.setName("channel")
      .setDescription("Channel ID")
      .setMaxLength(32)
      .setRequired(true))
  .addStringOption(op =>
    op.setName("message")
      .setDescription("Konten yang ingin dikirim")
      .setMaxLength(2048)
      .setRequired(true))
  .addStringOption(op =>
    op.setName("reply-to")
      .setDescription("Message ID yang ingin di-reply")
      .setMaxLength(32)),
  /**
   * @param {ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    let channel = interaction.options.getString("channel")
    let message = interaction.options.getString("message")
    let replyTo = interaction.options.getString("reply-to")

    const { client } = await import("../helpers/bot.js")

    await client.channels.fetch(channel)
      .then(async (ch) => {
        if (replyTo) {
          await ch.messages.fetch(replyTo)
            .then(async (msg) => {
              await msg.reply(message)
              await interaction.reply(`Replied to **${replyTo}** with message:\n${message}`)
            })
            .catch(async (err) => {
              await interaction.reply(`Error: ${err}`)
            })
          return
        } else {
          await ch.send(message)
          await interaction.reply(`Sent to **${channel}** with message:\n${message}`)
        }
      })
      .catch(async (err) => {
        await interaction.reply(`Error: ${err}`)
      })
  }
};