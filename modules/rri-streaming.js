// import Database from '@replit/database';
// const db = new Database();
// import * as dcMain from '../index.js';

// let client = dcMain.client;

import { join } from 'node:path';

import dcVoice from '@discordjs/voice';

let streamPlayer = dcVoice.createAudioPlayer({
  behaviors: {
    noSubscriber: dcVoice.NoSubscriberBehavior.Play,
  },
});

streamPlayer.addListener("stateChange", (e) => {
  if (e.status === "playing") {
    // kalau audio streaming, state "buffering" itu yang default, kalau sampai state "playing", berarti sudah terjadi buffer, maka restart playernya otomatis
    streamPlayer.stop();
    let newRsc = dcVoice.createAudioResource("http://36.66.101.141:9213/rrikupangpro1.mp3", { inlineVolume: true });
    newRsc.volume.setVolume(1);
    streamPlayer.play(newRsc);
    // delete newRsc;
  }
  console.log(e.status);
});

export function join(targetChannel, targetGuild, targetAdC, radioCh) {
  let url = null, volume = null;
  switch (radioCh) {
    case "pro2":
      url = "http://36.66.101.141:9213/rrikupangpro2.mp3";
      volume = 1.1;
      break;
    case "pro4":
      url = "http://36.66.101.141:9213/rrikupangpro4.mp3";
      volume = 2;
      break;
    case "pro1": default:
      url = "http://36.66.101.141:9213/rrikupangpro1.mp3";
      volume = 1;
      break;
  }

  if (!targetChannel || !targetGuild || !targetAdC) {
    return [0, "Error konfigurasi dan/atau passing parameter!"];
  }

  let connection = dcVoice.joinVoiceChannel({
    channelId: targetChannel,
    guildId: targetGuild,
    adapterCreator: targetAdC
  });

  connection.addListener("stateChange", (oldSt, newSt) => {
    console.log("Connection old: ");
    console.log(oldSt.status);
    console.log("Connection new:");
    console.log(newSt.status);
  })

  let resource = dcVoice.createAudioResource(url, { inlineVolume: true });
  if (msgKeys["volume"] && Number(msgKeys["volume"]) > 10) {
    resource.volume.setVolume(Number(msgKeys["volume"]) / 100);
  } else {
    resource.volume.setVolume(volume);
  }

  connection.subscribe(streamPlayer);
  streamPlayer.play(resource);
  // break;
  // case "stop":
  //   let vCon = dcVoice.getVoiceConnection(msg.guildId);
  //   if (vCon)
  //     vCon.destroy();
  // break;
}