import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";

// const { SlashCommandBuilder } = require('discord.js');
// const * as mysql = require("../modules/mysql2.js")

export default {
  isDev: true,
	data: new SlashCommandBuilder()
    .setName("radio")
    .setDescription("JBot Radio")
    .addSubcommand(sc  =>
      sc.setName("join")
        .setDescription("Dengarkan salah satu stasiun")
        .addStringOption( op =>
          op.setName("stasiun")
            .setDescription("Nama stasiun")
            .setRequired(true)
            .addChoices(
              { name: "RRI Pro 1 Kupang", value: "P1_KPG" },
              { name: "RRI Pro 2 Kupang", value: "P2_KPG" },
              { name: "RRI Pro 4 Kupang", value: "P4_KPG" },
              { name: "RRI Pro 1 Atambua", value: "P1_ATB" },
              { name: "RRI Pro 2 Atambua", value: "P2_ATB" },
            ))
        .addIntegerOption( op =>
          op.setName("volume")
            .setDescription("Volume")
            .setRequired(false)
            .setMinValue(0)
            .setMaxValue(200))
    )
    .addSubcommand(sc  =>
      sc.setName("leave")
        .setDescription("Keluar dari voice channel")
    ),
  /**
   * @param {ChatInputCommandInteraction} interaction
   */
	async execute(interaction) {
    let subcommand = interaction.options.getSubcommand()
    if(subcommand == "join") {
      let stasiun = interaction.options.getString("stasiun")
      let url, volume;
      switch (stasiun) {
        case "P2_KPG":
          url = "https://stream-node2.rri.co.id/streaming/13/9213/rrikupangpro2.mp3";
          volume = 1.1;
          break;
        case "P4_KPG":
          url = "https://stream-node2.rri.co.id/streaming/13/9213/rrikupangpro4.mp3";
          volume = 2;
          break;
        case "P1_KPG": default:
          url = "https://stream-node2.rri.co.id/streaming/13/9213/rrikupangpro1.mp3";
          volume = 1;
          break;
      }
      let volumeInput = interaction.options.getInteger("volume")
      if(volumeInput) {
        volume = volumeInput/100
      }

      // use main client not dev client
      let { client } = await import("../helpers/bot.js")

      let voiceChannel = interaction.member.voice.channel
      if(!voiceChannel) {
        await interaction.reply("Kamu harus berada di voice channel terlebih dahulu")
        return;
      }
      let guild = interaction.guild

      let dcVoice = await import('@discordjs/voice');
      let vCon = dcVoice.getVoiceConnection(guild.id)
      if (!vCon) {
        vCon = dcVoice.joinVoiceChannel({
          channelId: voiceChannel.id,
          guildId: guild.id,
          adapterCreator: guild.voiceAdapterCreator,
        });
        console.log("Masukkk")
      }

      let player = dcVoice.createAudioPlayer();
      let resource = dcVoice.createAudioResource(url, {
        inlineVolume: true,
      });
      resource.volume.setVolume(volume);
      player.play(resource);
      vCon.subscribe(player);

      console.log(`[RADIO] ${interaction.user.tag} memutar radio ${stasiun} di ${guild.name}`)

      await interaction.reply("Sedang memutar radio...")
    } else if(subcommand == "leave") {
      // use main client not dev client
      let { client } = await import("../helpers/bot.js")

      let voiceChannel = interaction.member.voice.channel
      if(!voiceChannel) {
        await interaction.reply("Kamu harus berada di voice channel terlebih dahulu")
        return;
      }
      let guild = interaction.guild

      let dcVoice = await import('@discordjs/voice');
      let vCon = dcVoice.getVoiceConnection(guild.id)
      if (!vCon) {
        await interaction.reply("Bot tidak sedang memutar radio")
        return;
      }

      vCon.destroy()
      console.log(`[RADIO] ${interaction.user.tag} keluar dari voice channel di ${guild.name}`)

      await interaction.reply("Sedang keluar dari voice channel...")
    }
  }
};
