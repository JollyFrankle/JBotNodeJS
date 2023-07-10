import express from 'express';
import https from 'https';
import fs from 'fs';
import { query, insert, update } from './modules/mysql2.js';
import { ActivityType } from 'discord.js';
import * as dcBot from './index.js';
import * as utils from './helpers/utils.js';
import * as ReminderController from './controllers/ReminderController.js';

const app = express()

/**
 * Configurations
 */
// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded({ extended: true }));

// Parse JSON bodies (as sent by API clients)
app.use(express.json());

// JSON pretty-printing
app.set('json spaces', 2);

/**
 * Free-to-access routes
 */
app.get("/", (_req, res) => {
  https.get('https://jbotextra.jollyfrankle.repl.co/').on('error', err => {
    console.log('JBotExtra error: ', err.message);
  }).end();

  res.send({
    status: 200,
    message: "Bot is up",
    data: {
      uptime: process.uptime(),
      version: process.version,
      up_since: `${new Date(dcBot.boootupTime)?.toLocaleString()} (${process.env.TZ})`,
      discord: {
        up_since_main: `${dcBot.client.readyAt?.toLocaleString()} (${process.env.TZ})`,
        up_since_dev: `${dcBot.clientDev.readyAt?.toLocaleString()} (${process.env.TZ})`,
      },
    }
  });
})

let containerActivity = null;
app.post("/update_status", async (req, res) => {
  // can not be moved into auth because of technical limitation (see RDJ/NowPlayingInfoExporter)
  let qStr = req.body;

  // Validate secret:
  if (qStr.secret !== process.env['V3_SECRET']) {
    return res.status(401).send({
      success: false,
      message: "Unauthorized"
    })
  }

  // Reset timer containerActivity jika tidak null:
  if (containerActivity !== null) {
    clearTimeout(containerActivity);
  }

  // Set lagu:
  dcBot.client.user.setActivity(utils.truncate(qStr.title, 96), {
    type: ActivityType.Listening
  });

  containerActivity = setTimeout(async () => {
    // remove activity
    dcBot.client.user.setActivity(null);
  }, Number(qStr.dur) + 5000); // + toleransi 5 detik setelah lagu berakhir

  res.send({
    success: true,
    title: qStr.title,
    duration: Number(qStr.dur)
  })
});

/**
 * Auth middleware
 */
app.all("/auth/*", (req, res, next) => {
  if(req.headers.authorization === process.env['AUTH_TOKEN']) {
    next()
  } else {
    res.status(401).send({
      status: 401,
      message: "Unauthorized"
    })
  }
})

/**
 * @deprecated
 * @see /auth/message
 */
app.post("/auth/send", async (req, res) => {
  var qStr = req.body;

  const dcEmbed = await import("./modules/embed.js");

  // Validate data: wajib ada itu title dan desc
  if (!qStr.data.title || !qStr.data.desc) {
    console.log(new Date().toUTCString() + ": [X-EMBED] Embed without title or desc!");
    return res.send("ERROR: Embed without title or desc!");
  }

  let embed = dcEmbed.fromQ(qStr.data), sendTo = [];
  if (typeof (qStr.groups) !== "undefined" && Array.isArray(qStr.groups)) {
    const dcNotify = await import("./modules/notify.js");
    // apakah ada input 'groups'?
    for (i in qStr.groups) {
      let gChannels = await dcNotify.getChannels(qStr.groups[i]);
      sendTo = sendTo.concat(gChannels);
    }
  }

  if (typeof (qStr.channels) !== "undefined" && Array.isArray(qStr.channels)) {
    // apakah ada input 'channels'?
    sendTo = sendTo.concat(qStr.channels);
  }

  if (sendTo.length > 0) {
    // Send if there is at least something to send to
    dcBot.sendMsg({ embeds: [embed] }, sendTo);
  }

  console.log(new Date().toUTCString() + ": [X-EMBED] Send OK to: " + sendTo);
  res.send({
    "success": true,
    "recipients": sendTo
  });
})

app.post("/auth/sql", async (req, res) => {
  let sql = req.body.query;

  if (!sql) {
    res.send({
      "error": true,
      "message": "Parameter SQL tidak terdefinisi di POST!",
      "params": req.body
    })
  } else {
    let result = await query(sql);
    // console.log(result);
    if (result.status == 200) {
      return res.send({
        "success": true,
        "data": result.data
      })
    } else {
      return res.send({
        "error": result.error
      })
    }
  }
})

app.post("/auth/message", async (req, res) => {
  let qStr = req.body;

  let message = null, destChannel = null;
  try {
    message = JSON.parse(qStr.message);
  } catch(e) {
    return res.send({
      status: 400,
      message: "Parameter `message` should be passed as a JSON string.",
      data: qStr
    })
  }

  if(typeof(qStr.channel) != "undefined" && Array.isArray(qStr.channel)) {
    destChannel = qStr.channel;
  } else {
    return res.send({
      status: 400,
      message: "Parameter `channel` should be passed as an array.",
      data: qStr
    })
  }

  try {
    let sent_to = await dcBot.sendMsg(message, destChannel);

    await dcBot.sendMsg("**New Message Sent:**\r\n```json\r\n" + JSON.stringify(message) + "```", ["971697363615899688"])

    return res.send({
      status: 200,
      sent_to: sent_to
    })
  } catch(e) {
    return res.send({
      status: 500,
      message: e
    })
  }
})

app.post("/auth/webhook", async (req, res) => {
  const wh_process = await import("./modules/webhook.js")

  // console.log(req.body);
  let qStr = req.body;
  switch (qStr.src) {
    case "tg":
      wh_process.tg_send(qStr);
      break;
    case "tw":
      wh_process.tw_send(qStr);
      break;
    case "tw_advanced":
      wh_process.tw_send_adv(qStr);
      break;
    case "ping":
      // console.log(qStr);
      break;
  }

  res.send({
    "status": "OK",
    "query": qStr
  })
})

app.post("/auth/notify", async (req, res) => {
  const type = req.body?.type;
  if (typeof(type) == "undefined") {
    return res.status(400).send({
      status: 400,
      message: "Bad Request"
    })
  }

  switch(type) {
    case "kkn":
      const embed = (await import("./modules/quotesKKN.js")).getTodayQuotesAsDcEmbed();
      if (!embed) {
        return res.status(404).send({
          status: 404,
          message: "No KKN quotes found"
        })
      }
      dcBot.sendMsg({ embeds: [embed] }, ["1095722406972239934"]);
      return res.send({
        status: 200,
        message: "OK"
      })
    default:
      return res.status(400).send({
        status: 400,
        message: "Bad Request"
      })
  }
})

/**
 * API routes with auth using /auth
 */
app.post("/auth/api/register_device", async (req, res) => {
  const qStr = req.body;
  const data = {
    token: qStr.token,
    manufacturer: qStr.manufacturer,
    model: qStr.model,
    sdk_version: qStr.sdk_version,
  }

  if (utils.isAnyEmptyObject(data)) {
    return res.send({
      status: 400,
      message: "Bad Request",
      data: data
    })
  }

  const result = await query("INSERT INTO android_devices (token, manufacturer, model, sdk_version) VALUES (?, ?, ?, ?)", [data.token, data.manufacturer, data.model, data.sdk_version])

  if (result.status == 200) {
    return res.send({
      status: 200,
      message: "OK"
    })
  } else {
    return res.send({
      status: 500,
      message: "Internal Server Error"
    })
  }
})

app.get("/auth/api/reminders", ReminderController.funIndex)
app.get("/auth/api/reminders/:id", ReminderController.funGet)
app.post("/auth/api/reminders", ReminderController.funCreate)
app.put("/auth/api/reminders/:id", ReminderController.funUpdate)
app.delete("/auth/api/reminders/:id", ReminderController.funDelete)
app.get("/auth/api/reminders/nearest", ReminderController.funGetNearestReminder)

/**
 * API routes (without auth)
 */
app.post("/api/sla-summary", async (req, res) => {
  let qStr = req.body, sql = '';

  // Dapatkan detail dari ID yang diminta:
  if (!qStr.id_host) {
    qStr.id_host = "1";
  }
  sql = `SELECT id, nama, display_url, interval_sec, timeout_ms, sla_tolerance_ms FROM pm_host WHERE id = ?;`;
  var result = await query(sql, [qStr.id_host])
  if (result.status !== 200 || !result.data[0]) {
    res.send({
      "error": true,
      "message": "Detail host dengan ID = " + qStr.id_host + " tidak ditemukan."
    })
    return;
  }
  let detail_host = result.data[0];

  // Dapatkan summary
  sql = `
SELECT CONCAT(LEFT(DATE_FORMAT(DATE_ADD(timestamp, INTERVAL '0 7' DAY_HOUR), '%Y-%m-%d %H:%i'), 15), '0') AS time,
COUNT(id) AS samples,
AVG(resp_time) AS avg_resp_time,
SUM(IF(resp_time IS NULL, 1, 0)) AS down_count,
((COUNT(id)-SUM(IF(resp_time IS NULL OR resp_time > ?, 1, 0))) / COUNT(id)) * 100 AS sla
FROM pm_results
WHERE id_host = ?
AND (timestamp BETWEEN ? AND ?)
GROUP BY time; `;

  // API Key Check OK
  if (!new Date(qStr.tanggal)) {
    qStr.tanggal = new Date().toISOString().slice(0, 10);
  }

  let ts1 = new Date(new Date(qStr.tanggal).getTime() - (7 * 3600 * 1000));
  let ts2 = new Date(ts1.getTime() + 86400000);

  // console.log("ts1: " + utils.sqlDate(ts1) + ", ts2: " + utils.sqlDate(ts2));

  var result = await query(sql, [detail_host.sla_tolerance_ms, qStr.id_host, utils.sqlDate(ts1), utils.sqlDate(ts2)])
  if (result.status == 200) {
    return res.send({
      success: true,
      data: result.data,
      meta: {
        tanggal: qStr.tanggal,
        detail_host: detail_host
      }
    })
  }

  return res.status(500).send({
    "error": result.error
  })
})

/**
 * View terminal output
 */
app.get("/terminal", async (req, res) => {
  if(req.query.token !== process.env['AUTH_TOKEN']) {
    return res.status(401).send("Unauthorized");
  }

  let file = "./storage/output.log";

  const Convert = (await import("ansi-to-html")).default;
  const fs = await import("fs");
  const convert = new Convert();

  // read file every line
  let lines = fs.readFileSync(file, "utf8").split("\n");
  let htmlOutput = "";
  for(let line of lines) {
    htmlOutput += convert.toHtml(line) + "\n";
  }

  return res.send(`
  <head>
    <title>JBot Node Terminal</title>
  </head>
  <body style="background-color: #000000; color: #d3d7cf">
    <pre>${htmlOutput}</pre>
  </body>`);
})

/**
 * Static route: `public` folder
 */
app.use("/public", express.static("public"));

/**
 * Exported functions
 */
export function keepAlive() {
  let port = process.env.PORT || 3000;
  app.listen(port);

  // HTTPS
  if (process.env.HTTPS_PORT && process.env.HTTPS_URL) {
    const httpsOptions = {
      key: fs.readFileSync(`/etc/letsencrypt/live/${process.env.HTTPS_URL}/privkey.pem`),
      cert: fs.readFileSync(`/etc/letsencrypt/live/${process.env.HTTPS_URL}/cert.pem`),
      ca: fs.readFileSync(`/etc/letsencrypt/live/${process.env.HTTPS_URL}/fullchain.pem`)
    }
    https.createServer(httpsOptions, app).listen(process.env.HTTPS_PORT);
  }
}

export const url = "https://jbotnode.jollyfrankle.repl.co";