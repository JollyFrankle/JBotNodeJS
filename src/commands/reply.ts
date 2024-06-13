import { SlashCommandBuilder, ChatInputCommandInteraction, TextChannel } from 'discord.js';

const command = {
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
  execute: async (interaction: ChatInputCommandInteraction) => {
    let channel: string = interaction.options.getString("channel")!!;
    let message: string = interaction.options.getString("message")!!;
    let replyTo: string = interaction.options.getString("reply-to")!!;

    const { client } = await import("@h/bot.js");

    await client.channels.fetch(channel)
      .then(async (ch) => {
        if (replyTo) {
          await (ch as TextChannel | undefined)?.messages.fetch(replyTo)
            .then(async (msg) => {
              await msg.reply(message);
              await interaction.reply(`Replied to **${replyTo}** with message:\n${message}`);
            })
            .catch(async (err) => {
              await interaction.reply(`Error: ${err}`);
            });
          return;
        } else {
          await (ch as TextChannel | undefined)?.send(message);
          await interaction.reply(`Sent to **${channel}** with message:\n${message}`);
        }
      })
      .catch(async (err) => {
        await interaction.reply(`Error: ${err}`);
      });
  }
};

export default command;