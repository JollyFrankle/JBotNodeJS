// import Database from '@replit/database';
import db from '../helpers/database.js';
import * as mysql from './mysql2.js';
import { sqlDate, dateFormatIndo } from '../helpers/date.js';
import { getURL } from '../server.js';
import { sendMsg, client as dcClient } from '../index.js';

// const db = new Database()

import Monitor from 'ping-monitor';

const FAILURE_THRES = 4;
const CONFIG = [];


function getConfig() {
  return CONFIG.map(c => ({
    config: c.config,
    httpOptions: c.httpOptions
  }))
}

function checkNull(input) {
  return input === null || typeof (input) === "undefined";
}

function checkChannel(ch_in) {
  // console.log(ch_in)
  // let ch_list = JSON.parse(ch_in);
  let ch_list = ch_in;
  let ch_allowed = [];

  let currentTime = new Date();

  for (let ch in ch_list) {
    const val = ch_list[ch];
    if (val.active) {
      let sch = val.schedule;
      if (typeof (sch) === "undefined" || sch === null) {
        ch_allowed.push(ch);
        continue;
      }
      if (typeof (val.attrs) !== "undefined" && val.attrs !== null) {
        if (typeof (val.attrs.muteUntil) !== "undefined" && val.attrs.muteUntil !== null) {
          if (currentTime.getTime() < val.attrs.muteUntil * 1000) {
            // Masih dalam waktu mute, skip channel ini
            continue;
          }
        }
      }
      for (let i = 0; i < sch.length; i++) {
        let start = new Date();
        let end = new Date();
        start.setHours(sch[i][0].split(":")[0], sch[i][0].split(":")[1], 0);
        end.setHours(sch[i][1].split(":")[0], sch[i][1].split(":")[1], 0);

        start.setTime(
          start.getTime() - 7 * 60 * 60 * 1000 - start.getTimezoneOffset()
        );
        end.setTime(
          end.getTime() - 7 * 60 * 60 * 1000 - end.getTimezoneOffset()
        );
        // +7 biar WIB

        if (currentTime >= start && currentTime <= end) {
          ch_allowed.push(ch);
          break;
        }
      }
    }
  }

  return ch_allowed;
}

// function dateFormatIndo(date) {
//   // set time zone to Asia/Jakarta
//   let newDate = new Date(date);
//   newDate.setHours(newDate.getHours() + 7);

//   var monthNames = [
//     "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"
//   ];

//   var day = newDate.getDate();
//   var monthIndex = newDate.getMonth();
//   var year = newDate.getFullYear();
//   // hours, minutes, seconds --> harus 2 digit
//   var hours = newDate.getHours().toString().padStart(2, '0');
//   var minutes = newDate.getMinutes().toString().padStart(2, '0');
//   var seconds = newDate.getSeconds().toString().padStart(2, '0');

//   // 3 karakter pertama dari nama bulan
//   let monthShort = monthNames[monthIndex].substring(0, 3);

//   return day + ' ' + monthShort + ' ' + year + ', pkl. ' + hours + '.' + minutes + '.' + seconds + ' WIB';
// }

function timeDiff(start, end) {
  let diff = end - start;
  let hours = Math.floor(diff / 1000 / 60 / 60);
  let minutes = Math.floor(diff / 1000 / 60) - (hours * 60);
  let seconds = Math.floor(diff / 1000) - (hours * 60 * 60) - (minutes * 60);

  return [hours, minutes, seconds];
}



// [NEW]
async function onMonitorError(dbData) {
  // dbData is JSON Object, jadi PASSING BY REFERENCE
  let log = dbData.log;

  // Insert to database pm_results
  mysql.query(
    "INSERT INTO pm_results (id_host, resp_time, timestamp) VALUES (?,?,?)",
    [dbData.id, null, sqlDate()],
    true
  );

  if (log.status == "up") {
    // kalau masih up tapi sebenarnya sudah down, ubah status log:
    let temp = {};
    if (log.prev_down !== 0) {
      // belum 3x sukses up, berarti anggap masih down sebenarnya situsnya
      temp.down_time = log.prev_down;
      temp.prev_down = 0;
      temp.count = FAILURE_THRES; // supaya tidak kirim ulang pesan ERROR nya
      if (typeof (log.sent_to) !== "undefined" && Array.isArray(log.sent_to)) {
        temp.sent_to = log.sent_to;
      }
    }
    log = {
      status: "down",
      down_time: new Date().getTime(),
      prev_down: log.prev_down,
      count: 1
    }

    dbData.log = { ...log, ...temp }; // yang diisi di temp akan overwrite yg sudah ada di log
    // console.log(log);
  } else {
    // kalau sudah down, inkremen saja, kalau sudah 3 kali maka umumkan:
    log.count++;
    if (log.count == FAILURE_THRES) {
      // sudah > 3 kali ping berhasil, hapus prev down time
      let url = getURL();

      let embedSend = {
        title: dbData.nama + " sulit diakses saat ini",
        description: `Situs tidak dapat dijangkau dengan semestinya sejak **${dateFormatIndo(new Date(log.down_time))}**.`,
        color: 0xdc3545,
        fields: [
          {
            name: "Sulit diakses sejak",
            value: dateFormatIndo(new Date(log.down_time))
          },
        ],
        footer: {
          text: "JollyBOT",
          icon_url: `${url}/public/images/logo.jpg`
        },
        timestamp: new Date(),
        thumbnail: {
          url: `${url}/public/images/no-signal.png`
        }
      }

      let channels = checkChannel(dbData.channels);
      console.log(channels);

      let sentToList = await sendMsg({ embeds: [embedSend] }, channels);
      dbData.log.sent_to = sentToList;

      // update db
      await mysql.query(
        "UPDATE pm_host SET log = ? WHERE id = ?",
        [JSON.stringify(log), dbData.id],
        true
      )
    }
  }
  console.log(new Date().toLocaleString() + ": [DOWN] " + dbData.nama);
  // console.log(log)
}

async function onMonitorUp(dbData) {
  // dbData is JSON Object, jadi PASSING BY REFERENCE
  let log = dbData.log;

  if (log.status == "down") {
    // kalau masih down tapi sebenarnya sudah up, ubah status log:
    let temp = {};

    if (log.count >= FAILURE_THRES) {
      // hanya tambahkan prev_down kalau memang ping 3 kali dan semuanya down
      temp.count = 1;
      temp.prev_down = log.down_time;
      if (typeof (log.sent_to) !== "undefined" && Array.isArray(log.sent_to)) {
        temp.sent_to = log.sent_to;
      }
    }
    log = {
      status: "up",
      up_time: new Date().getTime(),
      prev_down: 0,
      count: FAILURE_THRES
    }
    delete log.down_time;

    dbData.log = { ...log, ...temp };
  } else {
    // inkremen terus, kalau 3 kali up, umumkan:
    log.count++;
    if (log.count == FAILURE_THRES && log.prev_down != 0) {
      // sudah > 3 kali ping berhasil, send web sudah up:
      let url = getURL();

      let durasi = timeDiff(log.prev_down, log.up_time)
      let durasiTxtArr = []
      if (durasi[0] > 0) {
        durasiTxtArr.push(durasi[0] + ' jam')
      }
      if (durasi[1] > 0) {
        durasiTxtArr.push(durasi[1] + ' menit')
      }
      if (durasi[2] > 0) {
        durasiTxtArr.push(durasi[2] + ' detik')
      }

      let embedSend = {
        title: dbData.nama + " kembali dapat diakses seperti biasa",
        url: `${url}/public/sla-monitor.html?id=${dbData.id}&date=${new Date().toISOString().slice(0, 10)}`,
        description: `Situs sudah dapat diakses kembali seperti biasa setelah _down_ kurang lebih **${durasiTxtArr.join(" ")}**.`,
        color: 0x198754,
        fields: [
          {
            name: "Sulit diakses sejak",
            value: dateFormatIndo(new Date(log.prev_down))
          },
          {
            name: "Dapat diakses kembali pada",
            value: dateFormatIndo(new Date(log.up_time))
          },
          {
            name: "Durasi",
            value: durasiTxtArr.join(" ")
          }
        ],
        footer: {
          text: "JollyBOT",
          icon_url: `${url}/public/images/logo.jpg`
        },
        timestamp: new Date(),
        thumbnail: {
          url: `${url}/public/images/yes-signal.png`
        }
      }

      // reset previous down time:
      log.prev_down = 0; // auto save karena passing by reference

      // finally: delete pengumuman down yang sempat dikirim tadi: dan send yg new
      if (typeof (log.sent_to) !== "undefined" && Array.isArray(log.sent_to)) {
        let msgInfo = log.sent_to;

        let channels = log.sent_to.map((dt) => dt[0]) // get index 0 only without affecting log.sent_to

        sendMsg({ embeds: [embedSend] }, channels);

        for (let i in msgInfo) {
          // FORMAT: [chId, msgId]
          let client = dcclient;
          client.channels.cache.find(ch => ch.id == msgInfo[i][0]).messages.fetch(msgInfo[i][1]).then((msg) => {
            msg.delete();
          });
          // entah berhasil atau tidak: don't care
        }
        delete log.sent_to;
      }

      // update db
      await mysql.query(
        "UPDATE pm_host SET log = ? WHERE id = ?",
        [JSON.stringify(log), dbData.id],
        true
      )
    }
  }
}

async function getSLAToleranceMs(prev = null) {
  const { resolveForYogyakarta } = await import('../helpers/resolve-time.js')
  let data = await resolveForYogyakarta()
  let avg = data.average
  let prev10 = Math.round(prev * 0.07)

  const { sendMsg } = await import('../index.js')
  let chToSend = ["955043376372252702"]

  if (prev === null) {
    sendMsg(`New avg: **${avg}** [M1]`, chToSend)
    return avg
  } else if(avg > prev + prev10) {
    // Kalau newAvg > prev + 10% tolerance
    let newAvg = prev + prev10
    sendMsg(`New avg: **${newAvg}** [adjusted from: ${avg}] [M2]`, chToSend)
    return newAvg
  } else if(avg < prev - prev10) {
    // Kalau newAvg < prev - 10% tolerance
    let newAvg = prev - prev10
    sendMsg(`New avg: **${newAvg}** [adjusted from: ${avg}] [M3]`, chToSend)
    return newAvg
  } else {
    // Ok2 aja
    sendMsg(`New avg: **${avg}** [M4]`, chToSend)
    return avg
  }
}



// [NEW] Automatically adjust connection time levels every minute
function autoAdjustCT() {
  let prevToleranceLevel = null;
  function __innerAACT() {
    getSLAToleranceMs(prevToleranceLevel).then(res => {
      prevToleranceLevel = res
      for (let monitor of CONFIG) {
        monitor.httpOptions.timeout = monitor.config._db.timeout_ms + prevToleranceLevel
        monitor.config._db.ping_tolerance_ms = prevToleranceLevel
      }
    }).catch(e => {
      console.error(e)
    })
  }
  setInterval(__innerAACT, 60 * 1000)
  __innerAACT()
}


// [NEW] StartMonitor (using external db)
async function startMonitor() {
  let result = await mysql.query("SELECT * FROM pm_host;");
  let list = result.data;

  // Setup monitor
  for (let dbData of list) {
    let channels = JSON.parse(dbData.channels)
    let log = {
      status: "up",
      up_time: 0,
      prev_down: 0,
      count: 1
    };
    try {
      if (dbData.log !== null) {
        log = JSON.parse(dbData.log)
      }
    } catch (e) { }

    dbData.channels = channels;
    dbData.log = log;

    let monitor = new Monitor({
      website: dbData.display_url,
      title: dbData.nama,
      interval: dbData.interval_sec,
      // port: 80,
      ignoreSSL: true,

      httpOptions: {
        timeout: dbData.timeout_ms + dbData.ping_tolerance_ms
      },

      config: {
        intervalUnits: 'seconds',
        _db: dbData
      },
    })

    CONFIG.push(monitor);
  }

  // Setup tolerance ms
  autoAdjustCT()

  // Setup listeners
  for (let monitor of CONFIG) {
    let dbData = monitor.config._db;

    monitor.on("up", async (res, state) => {
      res.responseTime = (res.responseTime - dbData.ping_tolerance_ms > 1) ? res.responseTime - dbData.ping_tolerance_ms : 1;
      // Insert to database pm_results
      mysql.query(
        "INSERT INTO pm_results (id_host, resp_time, timestamp) VALUES (?,?,?)",
        [dbData.id, res.responseTime, sqlDate()],
        true
      );

      onMonitorUp(dbData);
    });

    monitor.on("error", (_) => {
      onMonitorError(dbData);
    })

    monitor.on("timeout", (_) => {
      onMonitorError(dbData);
      // console.log(dbData);
      // console.log("Timeout: " + error)
    })

    monitor.on("down", (_, __) => {
      onMonitorError(dbData);
    });
  }
}



async function addChannel(pmId, channelId) {

}



async function removeChannel(pmId, channelId) {

}



function getCurrentState() {
  return data;
}

async function getDbState() {
  return await db.get("down_monitor");
}

export {
  startMonitor as start,
  addChannel as addCh,
  removeChannel as removeCh,
  getCurrentState,
  getDbState,
  getConfig
};