

import { client, clientDev, sendMessage, startupTime } from '@h/bot';

// import * as monitor from './modules/ping-monitor';
import { TextColorFormat } from '@h/utils';
import query from '@m/mysql2';

import express, { Request, Response } from 'express';
import https from 'https';
import * as utils from '@h/utils';
import wh_process from "@m/webhook";
import deployCommands from './regcmd';
import MinecraftWebhook from '@m/MinecraftWebhook';
import WebSocketController from '@c/WebSocketController';


let mysqlCheckCount: number = 0;
async function checkMySql(): Promise<void> {
  if (mysqlCheckCount++ > 9) {
    console.log(TextColorFormat.RED + "\r\n", "[MySQL] Aborting connection check, too many attempts.");
    return;
  }
  query("SELECT 1;")
    .then((res) => {
      console.log(TextColorFormat.CYAN, "[MySQL] Connection time circa " + (new Date().getTime() - startupTime) + " ms")

      // Start ping monitor
      // monitor.start()
    })
    .catch((e) => {
      console.log(TextColorFormat.RED + "\r\n", "[MySQL]", e)
      setTimeout(checkMySql, 5000)
    })
}
checkMySql();

process.on('uncaughtException', async (e: Error) => {
  console.log(new Date());
  console.log(":: uncaughtException");
  console.log(TextColorFormat.RED + "\r\n", e)
  await sendMessage("> **Uncaught Exception:**\r\n" + e.message, ["971697363615899688"]);
});

/*
 * Module Exports
 */
export default {
  client,
  clientDev,
  sendMsg: sendMessage
  // setRRI as resetRRI
};

deployCommands()

/**
 * Web Server
 */
const app = express()

async function processWH(data: any) {
  switch (data.src) {
    case "tg":
      wh_process.tg_send(data);
      break;
    case "tw":
      wh_process.tw_send(data);
      break;
    case "tw_advanced":
      wh_process.tw_send_adv(data);
      break;
    case "mc_chat":
      MinecraftWebhook.onChatReceived(data.data);
      break;
    case "mc_advancement":
      MinecraftWebhook.onAdvancementReceived(data.data);
      break;
    case "mc_join":
      MinecraftWebhook.onJoinReceived(data.data);
      break;
    case "mc_leave":
      MinecraftWebhook.onLeaveReceived(data.data);
      break;
    case "mc_death":
      MinecraftWebhook.onDeathReceived(data.data);
      break;
    case "ping":
      console.log(data)
      break;
  }
}

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
app.get("/", (_req: Request, res: Response) => {
  https.get('https://jbotextra.jollyfrankle.repl.co/').on('error', (err: Error) => {
    console.log('JBotExtra error: ', err.message);
  }).end();

  res.send({
    status: 200,
    message: "Bot is up",
    data: {
      pid: process.pid,
      uptime: process.uptime(),
      version: process.version,
      up_since: `${new Date(startupTime)?.toLocaleString()} (${process.env.TZ})`,
      discord: {
        up_since_main: `${client.readyAt?.toLocaleString()} (${process.env.TZ})`,
        up_since_dev: `${clientDev.readyAt?.toLocaleString()} (${process.env.TZ})`,
      },
    }
  });
})

let containerActivity: NodeJS.Timeout | null = null;
// app.post("/update_status", async (req: Request, res: Response) => {
//   // can not be moved into auth because of technical limitation (see RDJ/NowPlayingInfoExporter)
//   let qStr: any = req.body;

//   // Validate secret:
//   if (qStr.secret !== process.env['V3_SECRET']) {
//     return res.status(401).send({
//       success: false,
//       message: "Unauthorized"
//     })
//   }

//   // Reset timer containerActivity jika tidak null:
//   if (containerActivity !== null) {
//     clearTimeout(containerActivity);
//   }

//   // Set lagu:
//   dcBot?.client.user?.setActivity(utils.truncate(qStr.title, 96), {
//     type: ActivityType.Listening
//   });

//   containerActivity = setTimeout(async () => {
//     // remove activity
//     dcBot?.client.user?.setActivity(undefined);
//   }, Number(qStr.dur) + 5000); // + toleransi 5 detik setelah lagu berakhir

//   res.send({
//     success: true,
//     title: qStr.title,
//     duration: Number(qStr.dur)
//   })
// });

app.post("/webhook", async (req: Request, res: Response) => {
  // check for URL for token
  const token = req.query.token;
  if (token !== process.env['AUTH_TOKEN']) {
    return res.status(401).send({
      success: false,
      message: "Unauthorized"
    })
  }

  // process webhook
  processWH(req.body);
  console.log(req.body)

  res.send({
    success: true,
    message: req.body
  })
})

/**
 * Auth middleware
 */
app.all("/auth/*", (req: Request, res: Response, next: Function) => {
  if (req.headers.authorization === `Bearer ${process.env['AUTH_TOKEN']}`) {
    next()
  } else {
    res.status(401).send({
      status: 401,
      message: "Unauthorized"
    })
  }
})

app.post("/auth/sql", async (req: Request, res: Response) => {
  let sql: string = req.body.query;

  if (!sql) {
    res.send({
      "error": true,
      "message": "Parameter SQL tidak terdefinisi di POST!",
      "params": req.body
    })
  } else {
    try {
      let result = await query(sql);

      return res.send({
        "success": true,
        "data": result
      })
    } catch (e) {
      return res.send({
        "error": e
      })
    }
  }
})

app.post("/auth/message", async (req: Request, res: Response) => {
  let qStr: any = req.body;

  let message = null, destChannel = null;
  try {
    message = JSON.parse(qStr.message);
  } catch (e) {
    return res.send({
      status: 400,
      message: "Parameter `message` should be passed as a JSON string.",
      data: qStr
    })
  }

  if (typeof (qStr.channel) != "undefined" && Array.isArray(qStr.channel)) {
    destChannel = qStr.channel;
  } else {
    return res.send({
      status: 400,
      message: "Parameter `channel` should be passed as an array.",
      data: qStr
    })
  }

  try {
    if (message) {
      // @ts-ignore
      let sentTo = await sendMessage(message, destChannel);

      await sendMessage("**New Message Sent:**\r\njson\r\n" + JSON.stringify(message) + "", ["971697363615899688"])

      return res.send({
        status: 200,
        sent_to: sentTo
      })
    }
  } catch (e) {
    return res.send({
      status: 500,
      message: e
    })
  }
})

app.post("/auth/webhook", async (req: Request, res: Response) => {
  // console.log(req.body);
  processWH(req.body);

  res.send({
    "status": "OK",
    "query": req.body
  })
})

/**
 * API routes with auth using /auth
 */
app.post("/auth/api/register_device", async (req: Request, res: Response) => {
  const qStr: any = req.body;
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

  try {
    const result = await query("INSERT INTO android_devices (token, manufacturer, model, sdk_version) VALUES (?, ?, ?, ?)", [data.token, data.manufacturer, data.model, data.sdk_version])

    return res.send({
      status: 200,
      message: "OK"
    })
  } catch (e) {
    return res.send({
      status: 500,
      message: e
    })
  }
})

/**
 * API routes (without auth)
 */
app.post("/api/sla-summary", async (req: Request, res: Response) => {
  let qStr: any = req.body, sql: string = '';

  // Dapatkan detail dari ID yang diminta:
  if (!qStr.id_host) {
    qStr.id_host = "1";
  }

  try {
    sql = `SELECT id, nama, display_url, interval_sec, timeout_ms, sla_tolerance_ms FROM pm_host WHERE id = ?;`;
    var result = await query(sql, [qStr.id_host])
    let detail_host = result[0];

    // Dapatkan summary
    sql = `SELECT CONCAT(LEFT(DATE_FORMAT(DATE_ADD(timestamp, INTERVAL '0 7' DAY_HOUR), '%Y-%m-%d %H:%i'), 15), '0') AS time,
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

    return res.send({
      success: true,
      data: result,
      meta: {
        tanggal: qStr.tanggal,
        detail_host: detail_host
      }
    })
  } catch (e) {
    return res.send({
      "error": e
    })
  }
})

/**
 * View terminal output
 */
app.get("/terminal", async (req: Request, res: Response) => {
  if (req.query.token !== process.env['AUTH_TOKEN']) {
    return res.status(401).send("Unauthorized");
  }

  let file = "./web.log";

  const Convert = (await import("ansi-to-html")).default;
  const fs = (await import("fs"));
  const convert = new Convert();

  // read file every line
  let lines = fs.readFileSync(file, "utf8").split("\n");
  let htmlOutput = "";
  for (let line of lines) {
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
(() => {
  let port = process.env.PORT || 3000;
  const server = app.listen(port, () => {
    client.login(process.env['TOKEN']).then().catch(reason => {
      console.log("Login failed: " + reason);
    });

    clientDev.login(process.env['TOKEN_DEV']).then().catch(reason => {
      console.log("Login failed: " + reason);
    });

    WebSocketController.wsMinecraft(server, "/ws/mc");

    // Init
    MinecraftWebhook.refreshSubscribers();
  })
})();

export const baseURL = "https://bot.jolly.my.id";