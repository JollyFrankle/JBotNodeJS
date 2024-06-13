import { SlashCommandBuilder, ChatInputCommandInteraction, SlashCommandStringOption } from 'discord.js';
import query, { OnDuplicate, insert } from '@m/mysql2'
import { TextColorFormat } from '@h/utils';
import Authentication from '@h/Authentication';
import CustomEmbed from '@m/CustomEmbed';
import MinecraftWebhook from '@m/MinecraftWebhook';

const typeDropdown = new SlashCommandStringOption()
  .setName('type')
  .setDescription('Jenis notifikasi yang ingin di-subscribe/unsubscribe')
  .setRequired(true)
  .addChoices([
    { name: 'Minecraft Server', value: 'minecraft' },
    { name: "Telegram Himaforka", value: 'tg' },
    { name: "X (Twitter) FTI UAJY", value: 'x_advanced' }
  ])

export default {
  isDev: false,
  data: new SlashCommandBuilder()
    .setName('notification')
    .setDescription('Subscribe, unsubscribe, and tampilkan semua jenis notifikasi yang channel ini subscribe')
    .addSubcommand(sc =>
      sc.setName('subscribe')
        .setDescription(`Subscribe ke salah satu jenis notifikasi`)
        .addStringOption(typeDropdown)
    )
    .addSubcommand(sc =>
      sc.setName('unsubscribe')
        .setDescription(`Unsubscribe dari salah satu jenis notifikasi`)
        .addStringOption(typeDropdown)
    )
    .addSubcommand(sc =>
      sc.setName('list')
        .setDescription(`List notifikasi yang di subscribe`)
    ),
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    // Check if user is an admin
    const user = interaction.user.id;
    const guildId = interaction.guildId;
    const channel = interaction.channelId;
    if (!guildId) {
      interaction.reply(CustomEmbed.sendableReply(
        CustomEmbed.shortError('Perintah ini hanya bisa digunakan di server.'), { ephemeral: true }
      ));
      return;
    }

    if (await Authentication.verify(user, guildId)) {
      const sc = interaction.options.getSubcommand();
      if (sc === 'subscribe') {
        const type = interaction.options.getString('type');
        insert(`subscribers`, {
          id_channel: channel,
          id_guild: guildId,
          id_creator: user,
          type: type,
          created_at: new Date()
        }, OnDuplicate.Ignore)
          .then(() => {
            interaction.reply(CustomEmbed.sendableReply(
              CustomEmbed.shortSuccess(`Berhasil subscribe ke notifikasi **${type?.toUpperCase()}**`), { ephemeral: true }
            ));
          })
          .catch((e) => {
            interaction.reply(CustomEmbed.sendableReply(
              CustomEmbed.shortError('Gagal subscribe ke notifikasi'), { ephemeral: true }
            ));
            console.log(TextColorFormat.RED + '\r\n', '[MySQL]', e);
          });
      } else if (sc === 'unsubscribe') {
        const type = interaction.options.getString('type');
        query(`DELETE FROM subscribers WHERE id_channel = ? AND type = ?`, [channel, type])
          .then(() => {
            interaction.reply(CustomEmbed.sendableReply(
              CustomEmbed.shortSuccess(`Berhasil unsubscribe dari notifikasi **${type?.toUpperCase()}**`), { ephemeral: true }
            ));
          })
          .catch((e) => {
            interaction.reply(CustomEmbed.sendableReply(
              CustomEmbed.shortError('Gagal unsubscribe dari notifikasi'), { ephemeral: true }
            ));
            console.log(TextColorFormat.RED + '\r\n', '[MySQL]', e);
          });
      } else if (sc === 'list') {
        query(`SELECT * FROM subscribers WHERE id_channel = ?`, [channel])
          .then((rows) => {
            if (rows.length > 0) {
              let msg = '';
              for (let row of rows) {
                msg += `- ${row.type}\n`;
              }
              interaction.reply(CustomEmbed.sendableReply(
                CustomEmbed.withContent(`Kanal notifikasi yang di-subscribe:\n${msg}`), { ephemeral: true }
              ));
            } else {
              interaction.reply(CustomEmbed.sendableReply(
                CustomEmbed.shortInfo('Anda belum subscribe ke notifikasi apapun.'), { ephemeral: true }
              ));
            }
          })
          .catch((e) => {
            interaction.reply(CustomEmbed.sendableReply(
              CustomEmbed.shortError('Gagal menampilkan daftar notifikasi yang di-subscribe'), { ephemeral: true }
            ));
            console.log(TextColorFormat.RED + '\r\n', '[MySQL]', e);
          });
      }

      if (interaction.options.getString('type') === "minecraft") {
        MinecraftWebhook.refreshSubscribers();
      }
    } else {
      interaction.reply(CustomEmbed.sendableReply(
        CustomEmbed.shortError('Anda tidak memiliki akses untuk menggunakan perintah ini.'), { ephemeral: true }
      ));
    }
  }
};