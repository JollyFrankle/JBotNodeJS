import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import query, { OnDuplicate, insert } from '@m/mysql2'
import { TextColorFormat } from '@h/utils';
import { client } from '@h/bot';
import Authentication from '@h/Authentication';
import CustomEmbed from '@m/CustomEmbed';

async function fetchUserAndGuild(user: string | null, guild: string | null) {
  if (!guild || !user) {
    throw new Error('Server ID atau User ID tidak ada.');
  }

  const userDetail = await client.users.fetch(user);
  if (!userDetail) {
    throw new Error('User ini tidak ditemukan pada berbagai server Discord yang dimasuki bot ini.');
  }

  const guildDetail = await client.guilds.fetch(guild);
  if (!guildDetail) {
    throw new Error('Server ini tidak tidak dimasuki bot ini.');
  }

  return { user: userDetail, guild: guildDetail };
}

export default {
  isDev: true,
  data: new SlashCommandBuilder()
    .setName('admin')
    .setDescription('Perintah untuk mengatur hak akses administrator bot.')
    .addSubcommand(sc =>
      sc.setName('add')
        .setDescription(`Tambahkan hak akses administrator ke pengguna`)
        .addStringOption(op =>
          op.setName('server')
            .setDescription('Server ID')
            .setRequired(true))
        .addStringOption(op =>
          op.setName('user')
            .setDescription('User ID')
            .setRequired(true))
    )
    .addSubcommand(sc =>
      sc.setName('remove')
        .setDescription(`Cabut hak akses administrator dari pengguna`)
        .addStringOption(op =>
          op.setName('server')
            .setDescription('Server ID')
            .setRequired(true))
        .addStringOption(op =>
          op.setName('user')
            .setDescription('User ID')
            .setRequired(true))
    ),
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const sc = interaction.options.getSubcommand();
    if (await Authentication.verify(interaction.user.id)) {
      if (sc === 'add') {
        await fetchUserAndGuild(interaction.options.getString('user'), interaction.options.getString('server'))
          .then(({ user, guild }) => {
            insert(`administrators`, {
              id: user.id,
              id_guild: guild.id,
            }, OnDuplicate.Ignore)
              .then(() => {
                interaction.reply(CustomEmbed.sendableReply(
                  CustomEmbed.shortSuccess(`Berhasil menambahkan pengguna ${user.globalName} (${user.tag}) sebagai administrator untuk server ${guild.name}`), { ephemeral: true }
                ));
              })
              .catch((e) => {
                interaction.reply(CustomEmbed.sendableReply(
                  CustomEmbed.shortError('Gagal menambahkan pengguna sebagai administrator.'), { ephemeral: true }
                ));
                console.log(TextColorFormat.RED + '\r\n', '[MySQL]', e);
              });
          })
          .catch((e) => {
            interaction.reply(CustomEmbed.sendableReply(
              CustomEmbed.shortError(e.message), { ephemeral: true }
            ));
          });
      } else if (sc === 'remove') {
        await fetchUserAndGuild(interaction.options.getString('user'), interaction.options.getString('server'))
          .then(({ user, guild }) => {
            query(`DELETE FROM administrators WHERE id = ? AND id_guild = ?`, [user.id, guild.id])
              .then(() => {
                interaction.reply(CustomEmbed.sendableReply(
                  CustomEmbed.shortSuccess(`Berhasil mencabut hak akses administrator dari pengguna ${user}`), { ephemeral: true }
                ));
              })
              .catch((e) => {
                interaction.reply({ content: 'Failed to revoke admin permission', ephemeral: true });
                console.log(TextColorFormat.RED + '\r\n', '[MySQL]', e);
              });
          })
          .catch((e) => {
            interaction.reply(CustomEmbed.sendableReply(
              CustomEmbed.shortError(e.message), { ephemeral: true }
            ));
          })
      }
    } else {
      interaction.reply(CustomEmbed.sendableReply(
        CustomEmbed.shortError('Anda tidak memiliki akses untuk menggunakan perintah ini.'), { ephemeral: true }
      ));
    }
  }
};