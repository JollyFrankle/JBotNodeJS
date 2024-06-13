import { SlashCommandBuilder, ChatInputCommandInteraction, Message, TextChannel } from 'discord.js';

const removeMsgCommand = {
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
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    let link: string = interaction.options.getString("link")!!
    let [guildId, channelId, messageId]: string[] = link.split("/").slice(4)
    let { client } = require("@h/bot.js")

    let channel = client.channels.cache.get(channelId);
    let message = await (channel as TextChannel | undefined)?.messages.fetch(messageId);
    if (message) {
        message.delete().then(() => {
          interaction.reply({
            content: `Message successfully deleted.`,
            embeds: [
              {
                description: `Message detail:`,
                fields: [
                  { name: `Channel`, value: `<#${channelId}>` },
                  { name: `Author`, value: `<@${message!!.author.id}>` },
                  { name: `Content`, value: message!!.content },
                ],
                color: 0x198754
              }
            ]
          });
        }).catch(() => {
          interaction.reply(`Message not found!`);
        });
    }
  }
};

export default removeMsgCommand;