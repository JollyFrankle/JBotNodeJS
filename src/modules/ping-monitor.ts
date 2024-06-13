// import query from './mysql2';
// import { sqlDate, dateFormatIndo } from '../helpers/utils';
// import { baseURL } from '../index';
// import { sendMsg, client } from '../index';

// // @ts-ignore
// import Monitor from 'ping-monitor';

// const FAILURE_THRES: number = 4;
// const CONFIG: any[] = [];
// let isStarted: boolean = false;

// function getConfig(): any[] {
//   return CONFIG.map(c => ({
//     config: c.config,
//     httpOptions: c.httpOptions
//   }))
// }

// function checkChannel(ch_in: any[], siteId: number): any[] {
//   let ch_list: any[] = ch_in;
//   let ch_allowed: any[] = [];

//   let currentTime: number = Date.now();

//   for (let ch in ch_list) {
//     const val = ch_list[ch];
//     if (val.active) {
//       if (typeof (val.attrs) !== "undefined" && val.attrs !== null) {
//         if (typeof (val.attrs.muteUntil) === "number") {
//           if (currentTime < val.attrs.muteUntil * 1000) {
//             // Masih dalam waktu mute, skip channel ini
//             continue;
//           } else {
//             // Waktu mute sudah lewat, hapus atribut muteUntil
//             unmuteChannel(siteId, ch);
//           }
//         }
//       }
//       let sch = val.schedule;
//       if (typeof (sch) === "undefined" || sch === null) {
//         ch_allowed.push(ch);
//         continue;
//       } else {
//         for (let i = 0; i < sch.length; i++) {
//           let start = new Date();
//           let end = new Date();
//           start.setHours(sch[i][0].split(":")[0], sch[i][0].split(":")[1], 0);
//           end.setHours(sch[i][1].split(":")[0], sch[i][1].split(":")[1], 0);

//           if (currentTime >= start.getTime() && currentTime <= end.getTime()) {
//             ch_allowed.push(ch);
//             break;
//           }
//         }
//       }
//     }
//   }

//   return ch_allowed;
// }

// /**
//  * Mute channel for certain time
//  * @param {Number} siteId
//  * @param {Number} channelId
//  * @param {Number} until
//  */
// export async function muteChannel(siteId: number, channelId: string, until: number): Promise<any> {
//   let dbData = CONFIG.find(c => c.config._db.id == siteId)?.config._db;
//   let ch_list = dbData?.channels;
//   if (typeof (ch_list) === "undefined" || ch_list === null) {
//     return {
//       success: false,
//       message: "Site not found"
//     }
//   }

//   let ch = ch_list[channelId];
//   if (typeof (ch) === "undefined" || ch === null) {
//     return {
//       success: false,
//       message: "Channel not found"
//     }
//   }

//   if (typeof (ch.attrs) === "undefined" || ch.attrs === null) {
//     ch.attrs = {};
//   }

//   ch.attrs.muteUntil = until;

//   // Update database
//   let res = await mysql.queryLegacy(
//     "UPDATE pm_host SET channels = ? WHERE id = ?",
//     [JSON.stringify(ch_list), siteId],
//     true
//   );

//   if (res.status == 200) {
//     return {
//       success: true,
//       message: "Channel muted",
//       data: dbData
//     }
//   }

//   return {
//     success: false,
//     message: "Failed to mute channel"
//   }
// }

// export async function unmuteChannel(siteId: number, channelId: string): Promise<any> {
//   let dbData = CONFIG.find(c => c.config._db.id == siteId)?.config._db;
//   let ch_list = dbData?.channels;
//   if (typeof (ch_list) === "undefined" || ch_list === null) {
//     return {
//       success: false,
//       message: "Site not found"
//     }
//   }

//   let ch = ch_list[channelId];
//   if (typeof (ch) === "undefined" || ch === null) {
//     return {
//       success: false,
//       message: "Channel not found"
//     }
//   }

//   if (ch.attrs) {
//     delete ch.attrs.muteUntil;
//     if (Object.keys(ch.attrs).length === 0) {
//       delete ch.attrs;
//     }
//   }

//   // Update database
//   let res = await mysql.queryLegacy(
//     "UPDATE pm_host SET channels = ? WHERE id = ?",
//     [JSON.stringify(ch_list), siteId],
//     true
//   );

//   if (res.status == 200) {
//     return {
//       success: true,
//       message: "Channel unmuted",
//       data: dbData
//     }
//   }

//   return {
//     success: false,
//     message: "Failed to unmute channel"
//   }
// }

// function timeDiff(start: number, end: number): number[] {
//   let diff = end - start;
//   let hours = Math.floor(diff / 1000 / 60 / 60);
//   let minutes = Math.floor(diff / 1000 / 60) - (hours * 60);
//   let seconds = Math.floor(diff / 1000) - (hours * 60 * 60) - (minutes * 60);

//   return [hours, minutes, seconds];
// }

// async function onMonitorError(dbData: any): Promise<void> {
//   let log = dbData.log;

//   // Insert to database pm_results
//   if (!process.env["IS_DEV"]) {
//     mysql.queryLegacy(
//       "INSERT INTO pm_results (id_host, resp_time, timestamp) VALUES (?,?,?)",
//       [dbData.id, null, sqlDate()],
//       true
//     );
//   }

//   if (log.status == "up") {
//     let temp = {
//       sent_to: [],
//       prev_down: 0,
//       down_time: 0,
//       count: 1
//     };
//     if (log.prev_down !== 0) {
//       temp.down_time = log.prev_down;
//       temp.prev_down = 0;
//       temp.count = FAILURE_THRES;
//       if (typeof (log.sent_to) !== "undefined" && Array.isArray(log.sent_to)) {
//         temp.sent_to = log.sent_to;
//       }
//     }
//     log = {
//       status: "down",
//       down_time: new Date().getTime(),
//       prev_down: log.prev_down,
//       count: 1
//     }

//     dbData.log = { ...log, ...temp };
//   } else {
//     log.count++;
//     if (log.count == FAILURE_THRES) {
//       let embedSend = {
//         title: dbData.nama + " sulit diakses saat ini",
//         description: `Situs tidak dapat dijangkau dengan semestinya sejak **${dateFormatIndo(new Date(log.down_time))}**.`,
//         color: 0xdc3545,
//         fields: [
//           {
//             name: "Sulit diakses sejak",
//             value: dateFormatIndo(new Date(log.down_time))
//           },
//         ],
//         footer: {
//           text: "JollyBOT",
//           icon_url: `${url}/public/images/logo.jpg`
//         },
//         timestamp: new Date(),
//         thumbnail: {
//           url: `${url}/public/images/no-signal.png`
//         }
//       }

//       let channels = checkChannel(dbData.channels, dbData.id);

//       let sentToList = await sendMsg({ embeds: [embedSend] }, channels);
//       dbData.log.sent_to = sentToList;

//       await mysql.queryLegacy(
//         "UPDATE pm_host SET log = ? WHERE id = ?",
//         [JSON.stringify(log), dbData.id],
//         true
//       )
//     }
//   }
//   console.log(new Date().toLocaleString() + ": [DOWN] " + dbData.nama);
// }

// async function onMonitorUp(dbData: any): Promise<void> {
//   let log = dbData.log;

//   if (log.status == "down") {
//     let temp = {};

//     if (log.count >= FAILURE_THRES) {
//       temp.count = 1;
//       temp.prev_down = log.down_time;
//       if (typeof (log.sent_to) !== "undefined" && Array.isArray(log.sent_to)) {
//         temp.sent_to = log.sent_to;
//       }
//     }
//     log = {
//       status: "up",
//       up_time: new Date().getTime(),
//       prev_down: 0,
//       count: FAILURE_THRES
//     }
//     delete log.down_time;

//     dbData.log = { ...log, ...temp };
//   } else {
//     log.count++;
//     if (log.count == FAILURE_THRES && log.prev_down != 0) {
//       let durasi = timeDiff(log.prev_down, log.up_time)
//       let durasiTxtArr = []
//       if (durasi[0] > 0) {
//         durasiTxtArr.push(durasi[0] + ' jam')
//       }
//       if (durasi[1] > 0) {
//         durasiTxtArr.push(durasi[1] + ' menit')
//       }
//       if (durasi[2] > 0) {
//         durasiTxtArr.push(durasi[2] + ' detik')
//       }

//       let embedSend = {
//         title: dbData.nama + " kembali dapat diakses seperti biasa",
//         url: `${url}/public/sla-monitor.html?id=${dbData.id}&date=${new Date(Date.now() + (7 * 60 * 60 * 1000)).toISOString().slice(0, 10)}`,
//         description: `Situs sudah dapat diakses kembali seperti biasa setelah _down_ kurang lebih **${durasiTxtArr.join(" ")}**.`,
//         color: 0x198754,
//         fields: [
//           {
//             name: "Sulit diakses sejak",
//             value: dateFormatIndo(new Date(log.prev_down))
//           },
//           {
//             name: "Dapat diakses kembali pada",
//             value: dateFormatIndo(new Date(log.up_time))
//           },
//           {
//             name: "Durasi",
//             value: durasiTxtArr.join(" ")
//           }
//         ],
//         footer: {
//           text: "JollyBOT",
//           icon_url: `${url}/public/images/logo.jpg`
//         },
//         timestamp: new Date(),
//         thumbnail: {
//           url: `${url}/public/images/yes-signal.png`
//         }
//       }

//       log.prev_down = 0;

//       if (typeof (log.sent_to) !== "undefined" && Array.isArray(log.sent_to)) {
//         let msgInfo = log.sent_to;

//         let channels = log.sent_to.map((dt) => dt[0])

//         sendMsg({ embeds: [embedSend] }, channels);

//         for (let i in msgInfo) {
//           client.channels.cache.find(ch => ch.id == msgInfo[i][0]).messages.fetch(msgInfo[i][1]).then((msg) => {
//             msg.delete();
//           });
//         }
//         delete log.sent_to;
//       }

//       await mysql.queryLegacy(
//         "UPDATE pm_host SET log = ? WHERE id = ?",
//         [JSON.stringify(log), dbData.id],
//         true
//       )
//     }
//   }
// }

// async function getSLAToleranceMs(prev: number | null): Promise<number> {
//   const { resolveForYogyakarta } = await import('../helpers/resolve-time')
//   let data = await resolveForYogyakarta()
//   let avg = data.average
//   let prev10 = Math.round(prev * 0.07)

//   const { sendMsg } = await import('../index.js')
//   let chToSend = ["955043376372252702"]

//   if (prev === null) {
//     sendMsg(`New avg: **${avg}** [M1]`, chToSend)
//     return avg
//   } else if (avg > prev + prev10) {
//     let newAvg = prev + prev10
//     sendMsg(`New avg: **${newAvg}** [adjusted from: ${avg}] [M2]`, chToSend)
//     return newAvg
//   } else if (avg < prev - prev10) {
//     let newAvg = prev - prev10
//     sendMsg(`New avg: **${newAvg}** [adjusted from: ${avg}] [M3]`, chToSend)
//     return newAvg
//   } else {
//     sendMsg(`New avg: **${avg}** [M4]`, chToSend)
//     return avg
//   }
// }

// let pingToleranceLevel: number | null = null;
// function autoAdjustCT(): void {
//   const __innerAACT = () => {
//     getSLAToleranceMs(pingToleranceLevel).then(res => {
//       pingToleranceLevel = res
//       for (let monitor of CONFIG) {
//         monitor.httpOptions.timeout = monitor.config._db.timeout_ms + pingToleranceLevel
//       }
//     }).catch(e => {
//       console.error(e)
//     })
//   }
//   setInterval(__innerAACT, 60 * 1000)
//   __innerAACT()
// }

// async function startMonitor(): Promise<any> {
//   if (isStarted) {
//     console.log("Monitor already started");
//     throw new Error("Monitor already started");
//   }

//   let result = await mysql.queryLegacy("SELECT * FROM pm_host;");
//   let list = result.data || [];

//   if (list.length > 0) {
//     isStarted = true;
//   }

//   for (let dbData of list) {
//     let channels = JSON.parse(dbData.channels)
//     let log = {
//       status: "up",
//       up_time: 0,
//       prev_down: 0,
//       count: 1
//     };
//     try {
//       if (dbData.log !== null) {
//         log = JSON.parse(dbData.log)
//       }
//     } catch (e) { }

//     dbData.channels = channels;
//     dbData.log = log;

//     let monitor = new Monitor({
//       website: dbData.display_url,
//       title: dbData.nama,
//       interval: dbData.interval_sec,
//       ignoreSSL: true,

//       httpOptions: {
//         timeout: dbData.timeout_ms + 300
//       },

//       config: {
//         intervalUnits: 'seconds',
//         _db: dbData
//       },
//     })

//     CONFIG.push(monitor);
//   }

//   autoAdjustCT()

//   for (let monitor of CONFIG) {
//     let dbData = monitor.config._db;

//     monitor.on("up", async (res, state) => {
//       res.responseTime = (res.responseTime - pingToleranceLevel > 1) ? res.responseTime - pingToleranceLevel : 1;
//       if (!process.env["IS_DEV"]) {
//         mysql.queryLegacy(
//           "INSERT INTO pm_results (id_host, resp_time, timestamp) VALUES (?,?,?)",
//           [dbData.id, res.responseTime, sqlDate()],
//           true
//         );
//       }

//       onMonitorUp(dbData);
//     });

//     monitor.on("error", (_) => {
//       onMonitorError(dbData);
//     })

//     monitor.on("timeout", (_) => {
//       onMonitorError(dbData);
//     })

//     monitor.on("down", (_, __) => {
//       onMonitorError(dbData);
//     });
//   }

//   return {
//     status: "success",
//     message: "Monitor started"
//   }
// }

// export {
//   startMonitor as start,
//   getConfig
// };