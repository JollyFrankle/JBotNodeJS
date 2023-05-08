import db from './helpers/database.js';

import { client, clientDev, sendMessage, restartContainer } from './helpers/bot.js';

import * as dcEmbed from './modules/embed.js';
import * as dcCal from './modules/calendar.js';
// import * as dcNotify from './modules/notify.js';
import * as dcRRI from './modules/rrikupang.js';
import * as monitor from './modules/ping-monitor.js';
import { query } from './modules/mysql2.js';

monitor.start()

// const db = new Database();
// db.delete("mySQL_TEMP_LOCK") // replit
db.delete("mySQL_TEMP_LOCK")

let _startTime = new Date().getTime()
query("SELECT 1;").then((res) => {
  if(res.status == 200) {
    console.log("\x1b[36m%s\x1b[0m", "[MySQL] Connection time circa " + (new Date().getTime() - _startTime) + " ms")
  } else {
    console.log("\x1b[31m%s\x1b[0m\r\n", "[MySQL]\r\n" + res.error)
  }
})

process.on('uncaughtException', async (e) => {
  console.log(new Date());
  console.log(":: uncaughtException");
  console.log("\x1b[31m%s\x1b[0m\r\n", e)
  await sendMessage("> **Uncaught Exception:**\r\n" + e.message, ["971697363615899688"]);
});

function splitToKeys(text, ins = ":") {
  let arr_str = text.split(ins);
  // hapus instruksi awal yang tidak penting:
  arr_str.splice(0, 1);

  var keyVals = {};
  for (let i in arr_str) {
    // to array:
    var arrCopy = arr_str[i].split(" ").map((x) => x);
    // temp instruction code var:
    var label = arrCopy[0];
    // remove instruction code:
    arrCopy.splice(0, 1);
    // to string:
    arrCopy = arrCopy.join(" ");
    // masukkan, rapikan (hapus spasi di awal dan akhir):
    keyVals[label] = arrCopy.trim();
  }
  return keyVals;
}

/*
 * Time interval set
 */

// var nextRefrRRI = null;
// function setRRI() {
//   dcRRI.get().then((res) => {
//     nextRefrRRI = res.nextRefr;
//     client.user.setActivity(res.eventName, {
//       type: ActivityType.Listening
//     });
//     console.log("RRI activity updated [OK]");
//     console.log(nextRefrRRI);
//   })
// }
// var currDate = new Date();
// console.log(new Date());
// setTimeout(() => {
//   checkEveryMinute();
// }, new Date(currDate.getFullYear(), currDate.getMonth(), currDate.getDate(), currDate.getHours(), currDate.getMinutes() + 1, 0).getTime() - new Date().getTime())

// function checkEveryMinute() {
//   const thisIntr = async () => {
//     let thisDate = new Date();
//     // console.log(thisDate.toUTCString());
//     if (thisDate >= nextRefrRRI) {
//       setRRI();
//     }
//     // if (thisDate.getHours() == (15 - 7) && thisDate.getMinutes() == 0) {
//     //   // reminder ujian
//     //   const { genSummary } = await import("./modules/ujian.js");
//     //   let ujianSummary = await genSummary();
//     //   if (ujianSummary[0] === true) {
//     //     sendMessage(ujianSummary[1], await dcNotify.getChannels("himaforka-general"));
//     //   }
//     // }
//     if (thisDate.getMinutes() == 59) {
//       // menit ke-59: reset interval supatya tidak offset
//       setTimeout(thisIntr, (60 - thisDate.getSeconds()) * 1000);
//       return;
//     }
//     setTimeout(thisIntr, 60000);
//   }
//   thisIntr();
// }


/*
 * Module Exports
 */
export {
  client,
  sendMessage as sendMsg
  // setRRI as resetRRI
};


/*
 * Bot config
 */

client.on("ready", async () => {
  console.log("\x1b[36m%s\x1b[0m", "[Discord] Connected in " + (new Date().getTime() - _startTime) + " ms")
  await sendMessage("> **Bot Reboot:**\r\nReboot done at <t:" + parseInt(client.readyTimestamp / 1000) + ":F>", ["971697363615899688"]);
  // setRRI();
});

/*
 * Interaction create (i.e slash commands)
 */
(async () => {
  const slashComs = await import("./register-commands.js");
  slashComs.deployProd()
  slashComs.deployDev()
})();

/*
 * Message create
 */
client.on("messageCreate", async (msg) => {
  if (msg.author.bot)
    return;

  var mCon = msg.content.split(/(\s+)/).filter(function(value, index, arr) {
    return value.trim() != "";
  });
  let cmd = "!jb";

  if (mCon[0] !== cmd)
    return;

  let mConFull = msg.content, mIns = mCon[1].toLowerCase();

  if (mIns === "debug") {
    switch (mCon[2]) {
      case "tempdb_clear":
        await db.set("mySQL_TEMP", [])
        msg.reply("Berhasil clear tempdb")
        break;
      case "tempdb":
        let tempDb = await db.get("mySQL_TEMP");
        for(i in tempDb) {
          let data = tempDb[i], date = null;
          if(/^[\s\S]+T[\s\S]+Z$/.test(data.params[2])) {
            date = data.params[2]
          }
          if(Array.isArray(data.params[2])) {
            date = data.params[2][0]
          }
          if(date !== null) {
            let iso = new Date(date).toISOString().match(/(\d{4}\-\d{2}\-\d{2})T(\d{2}:\d{2}:\d{2})/);
            tempDb[i].params[2] = iso[1] + ' ' + iso[2];
          }
        }
        msg.channel.send("Berhasil! Cek ulang semua isi DB dengan cara `!jb debug db`!");
        console.log(tempDb)
        await db.set("mySQL_TEMP", tempDb)
        break;
      case "monitor":
        let currSt = monitor.getCurrentState(), currDb = await monitor.getDbState();
        msg.channel.send("Non-DB state:\r\n```json\r\n" + JSON.stringify(currSt, null, "  ") + "\r\n```");
        msg.channel.send("DB state:\r\n```json\r\n" + JSON.stringify(currDb, null, "  ") + "\r\n```");
        break;
      case "db":
        const fs = await import('fs');
        const path = await import('path');
        let dbOut = {}, count = 0;
        db.list().then(async (keys) => {
          await keys.forEach(async (dbK) => {
            dbOut[dbK] = await db.get(dbK);
            count++;
            if (count == keys.length - 1) {
              var fileDir = path.join(__dirname, "./public/storage/db_store.json");
              fs.writeFile(fileDir, JSON.stringify(dbOut, null, "\t"), {}, (err) => {
                if (err)
                  throw err;
                // finally, send the file:
                msg.channel.send({ content: "Berhasil mengenerate file:", files: [fileDir] });
              })
            }
          });
        });
        break;
      case "ujian":
        const { genSummary } = await import("./modules/ujian.js");
        let ujianSummary = await genSummary();
        if (ujianSummary[0] === true) {
          sendMessage(ujianSummary[1], [msg.channelId]);
        }
        break;
    }

  }

  if (mIns === "birthday") {
    switch (mCon[2]) {
      case "next":
        var type = mCon[3] !== undefined ? mCon[3] : "current";
        var offset = mCon[4] !== undefined ? Number(mCon[4]) : 0;
        dcCal.getNextBirthday(type, { offset: offset - 1 }).then((res) => {
          msg.channel.send(res);
        });
        break;

      case "npm":
        var npm = mCon[3] !== undefined ? mCon[3] : null;
        if (npm !== null) {
          dcCal.getBirthdayByField("npm", npm).then((res) => {
            msg.channel.send(res);
          });
        } else {
          msg.channel.send({
            embeds: [dcEmbed.sendCmdErrException(mConFull, [
              {
                name: "`" + cmd + " birthday npm [<npm>]`",
                value: "Mendapatkan tanggal ulang tahun pengurus berdasarkan input `[<npm>]`."
              }
            ])]
          });
        }
        break;

      case "nama":
        var nama = mCon[3] !== undefined ? mCon[3] : null;
        if (nama !== null) {
          dcCal.getBirthdayByField("nama", nama).then((res) => {
            msg.channel.send(res);
          });
        } else {
          msg.channel.send({
            embeds: [dcEmbed.sendCmdErrException(mConFull, [
              {
                name: "`" + cmd + " birthday nama [<nama>]`",
                value: "Mendapatkan tanggal ulang tahun pengurus berdasarkan input `[<nama>]` (tidak harus lengkap)."
              }
            ])]
          });
        }
        break;

      default:
        msg.channel.send({
          embeds: [dcEmbed.sendCmdErrException(mConFull, [
            {
              name: "`" + cmd + " birthday next [current|all|<angkatan>] [page (1-20)]`",
              value: "Mendapatkan ulang tahun selanjutnya bagi pengurus.\r\n`all`: semua angkatan\r\n`current`: angkatan saat ini\r\n`<angkatan>`: angkatan (cth. `2021`)"
            },
            {
              name: "`" + cmd + " birthday npm [<npm>]`",
              value: "Mendapatkan tanggal ulang tahun pengurus berdasarkan input `[<npm>]`."
            },
            {
              name: "`" + cmd + " birthday nama [<nama>]`",
              value: "Mendapatkan tanggal ulang tahun pengurus berdasarkan input `[<nama>]` (tidak harus lengkap)."
            }
          ])]
        });
        break;
    }
    return;
  }

  // if (mIns === "notify") {
  //   var target_list = mCon[3] === undefined ? "" : mCon[3];
  //   if (!["notify_list", "ifest", "kominfo", "chill-kita", "PERSONAL", "himaforka-general"].includes(target_list)) {
  //     // tidak benar listnya, batalkan command
  //     mCon[2] = null;
  //   }
  //   let retVal = null;
  //   switch (mCon[2]) {
  //     case "addCh":
  //       if (!mCon[4])
  //         return msg.reply("Channel ID tidak ditulis (urutannya setelah nama list)!");
  //       retVal = await dcNotify.add(mCon[4], target_list);
  //       msg.channel.send(retVal[1]);
  //       break;

  //     case "removeCh":
  //       if (!mCon[4])
  //         return msg.reply("Channel ID tidak ditulis (urutannya setelah nama list)!");
  //       retVal = await dcNotify.remove(mCon[4], target_list);
  //       msg.channel.send(retVal[1]);
  //       break;

  //     case "add":
  //       retVal = await dcNotify.add(msg.channelId, target_list);
  //       msg.channel.send(retVal[1]);
  //       break;

  //     case "remove":
  //       retVal = await dcNotify.remove(msg.channelId, target_list);
  //       msg.channel.send(retVal[1]);
  //       break;

  //     case "status":
  //       retVal = await dcNotify.check(msg.channelId, target_list);
  //       if (retVal === true) {
  //         msg.channel.send("**[!] Notifikasi untuk _" + target_list + "_ di channel ini berstatus AKTIF**");
  //       } else {
  //         msg.channel.send("**[!] Notifikasi untuk _" + target_list + "_ di channel ini berstatus TIDAK AKTIF**");
  //       }
  //       break;

  //     case "get":
  //       retVal = await dcNotify.getChannels(target_list);
  //       let replyMsg = "**Channel penerima kanal notifikasi \"" + target_list + "\"**:\r\n";
  //       retVal.forEach((id) => {
  //         let chInfo = client.channels.cache.get(id);
  //         if (!chInfo) {
  //           replyMsg += "[" + id + "] _Tidak diketahui_";
  //         } else {
  //           replyMsg += "[" + id + "] (" + chInfo.guild.name + "): " + chInfo.name + "\r\n";
  //         }
  //       })
  //       msg.channel.send(replyMsg);
  //       break;

  //     default:
  //       msg.channel.send({
  //         embeds: [dcEmbed.sendCmdErrException(mConFull, [
  //           {
  //             name: "`" + cmd + " notify add [list_name]`",
  //             value: "Menambahkan channel ini ke daftar penerima notifikasi aktif pada list [list_name]."
  //           },
  //           {
  //             name: "`" + cmd + " notify remove [list_name]`",
  //             value: "Menghapus channel ini dari daftar penerima notifikasi aktif pada [list_name]."
  //           },
  //           {
  //             name: "`" + cmd + " notify status [list_name]`",
  //             value: "Mengembalikan status notifikasi untuk channel ini pada [list_name]."
  //           }
  //         ])]
  //       });
  //       break;
  //   }
  // }

  if (mIns == "ujian") {
    const dcUjian = await import("./modules/ujian.js");
    var msgKeys = splitToKeys(mConFull);
    let retVal = null;
    switch (mCon[2]) {
      case "addMK":
        retVal = await dcUjian.addMK(msgKeys["kode"], msgKeys["nama"], msgKeys["tanggal"], msgKeys["sesi"], msgKeys["sifat"])
        msg.channel.send(retVal[1]);
        break;

      case "removeMK":
        retVal = await dcUjian.removeMK(mCon[3]);
        msg.channel.send(retVal[1]);
        break;

      case "setJadwal":
        retVal = await dcUjian.setJadwal(mCon[3], mCon[4]);
        msg.channel.send(retVal[1]);
        break;

      case "getAll":
        retVal = await dcUjian.getAll();
        msg.channel.send(retVal[1]);
        break;

      case "getByKode":
        retVal = await dcUjian.getByKode(mCon[3]);
        msg.channel.send(retVal[1]);
        break;

      case "addNote":
        var content = mCon.map((x) => x);
        content.splice(0, 4);
        console.log(content);
        content = content.join(' ');
        retVal = await dcUjian.addNote(mCon[3], content, msg.author.tag);
        msg.channel.send(retVal[1]);
        break;

      case "removeNote":
        retVal = await dcUjian.removeNote(mCon[3], mCon[4]);
        msg.channel.send(retVal[1]);
        break;

      case "genSummary":
        retVal = await dcUjian.genSummary(mCon[3]);
        msg.channel.send(retVal[1]);
        break;
    }
  }

  if (mIns == "radio") {
    // const dcStream = await import("./modules/rri-streaming");
    // const { join } = await import('node:path');
    const dcVoice = await import('@discordjs/voice');

    // function checkGuildInDB(group, guild) {
    //   // cek apakah guild ini
    // }
    // function subscribePlayerToDB(group, guild, config) {

    // }

    var msgKeys = splitToKeys(mConFull);

    var url = null, volume = null;
    switch (msgKeys["st"]) {
      case "pro2":
        url = "http://36.66.101.141:9213/rrikupangpro2.mp3";
        volume = 1.1;
        break;
      case "pro4":
        url = "http://36.66.101.141:9213/rrikupangpro4.mp3";
        volume = 2;
        break;
      case "bell":
        url = "https://v3.himaforka-uajy.org/api/SFX-2bell.mp3";
        volume = 1;
        break;
      case "pro1": default:
        url = "http://36.66.101.141:9213/rrikupangpro1.mp3";
        volume = 1;
        break;
    }

    let targetChannel = null, targetGuild = null, targetAdC = null;
    if (msgKeys["guild"] && msgKeys["channel"]) {
      let gId = client.guilds.cache.find(n => n.name == msgKeys["guild"]);
      if (!gId)
        return msg.reply("Guild tidak ditemukan!");

      let cId = client.channels.cache.find(n => n.name == msgKeys["channel"] && n.guildId == gId.id);
      if (!cId)
        return msg.reply("Channel tidak ditemukan!");

      targetChannel = cId.id;
      targetGuild = gId.id;
      targetAdC = gId.voiceAdapterCreator;
    } else {
      let voiceChn = client.channels.cache.get(msg.member.voice.channelId);
      if (!voiceChn)
        return msg.reply("User belum join voice channel di sini!");

      targetChannel = msg.member.voice.channelId;
      targetGuild = msg.guildId;
      targetAdC = msg.guild.voiceAdapterCreator;
    }

    let vCon = null;
    switch (mCon[2]) {
      case "join":
        vCon = dcVoice.getVoiceConnection(targetGuild);
        if (!vCon) {
          vCon = dcVoice.joinVoiceChannel({
            channelId: targetChannel,
            guildId: targetGuild,
            adapterCreator: targetAdC
          });
        }

        vCon.addListener("stateChange", async (oldSt, newSt) => {
          if (newSt.status == oldSt.status)
            return;
          await sendMessage("**JBOT Radio:\r\n**`vCon` Status change for player at " + client.guilds.cache.get(vCon.joinConfig.guildId).name + ":\r\nOld status: " + oldSt.status + "\r\nNew status: " + newSt.status, ["971697363615899688"]);
        })

        let resource = dcVoice.createAudioResource(url, { inlineVolume: true });
        if (msgKeys["volume"] && Number(msgKeys["volume"]) > 10) {
          resource.volume.setVolume(Number(msgKeys["volume"]) / 100);
        } else {
          resource.volume.setVolume(volume);
        }

        let streamPlayer = dcVoice.createAudioPlayer({
          behaviors: {
            noSubscriber: dcVoice.NoSubscriberBehavior.Play,
          },
        });
        streamPlayer.addListener("stateChange", async (e) => {
          if (e.status === "playing") {
            // kalau audio streaming, state "buffering" itu yang default, kalau sampai state "playing", berarti sudah terjadi buffer, maka restart playernya otomatis
            streamPlayer.stop();
            let newRsc = dcVoice.createAudioResource("http://36.66.101.141:9213/rrikupangpro1.mp3", { inlineVolume: true });
            newRsc.volume.setVolume(1);
            streamPlayer.play(newRsc);
            newRsc = null;
            await sendMessage("**JBOT Radio:\r\n**`streamPlayer` Status change: " + e.status, ["971697363615899688"]);
          }
          console.log(e.status);
        });

        vCon.subscribe(streamPlayer);
        streamPlayer.play(resource);
        break;
      case "stop":
        vCon = dcVoice.getVoiceConnection(msg.guildId);
        if (vCon)
          vCon.destroy();
        break;
    }
  }

});

(async () => {
  const srv = await import("./server.js")
  srv.keepAlive();
})();

console.log("\x1b[36m%s\x1b[0m", "[Discord] Loading main bot...")

client.login(process.env['TOKEN']).then().catch(reason => {
  console.log("Login failed: " + reason);
});

/*
 * Dev Bot Configurations
 */
clientDev.login(process.env['TOKEN_DEV']).then(() => {
  console.log("\x1b[36m%s\x1b[0m", "[Discord] Dev bot connected in " + (new Date().getTime() - _startTime) + " ms")
}).catch(reason => {
  console.log("Login failed: " + reason);
});

/*
 * Main bot on DEBUG (ERROR/LOG)
 */
client
  .on("debug", (e, logs) => {
    // console.log(new Date())
    // console.log(":: Discord Bot DEBUG")
    // console.log("\x1b[34m%s\x1b[0m\r\n", e)
    if (e.includes("Hit a 429 while executing a request.")) {
      // hit a 429, kill 1
      console.log("We've really hit a 429!")
      restartContainer()
    }
  })
  .on("warn", (e, logs) => {
    console.log(new Date())
    console.log(":: Discord Bot WARNING")
    console.log("\x1b[33m%s\x1b[0m\r\n", logs)
  })