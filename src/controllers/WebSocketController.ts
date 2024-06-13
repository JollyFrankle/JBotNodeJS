import WebSocket from "ws";
import { Server } from "http";
import MinecraftWebhook from "@m/MinecraftWebhook";

// function getTargetClients(wsProtocol: string, wss: WebSocket.Server) {
//     switch (wsProtocol) {
//         case "as-admin":
//             // filter wss clients to only have the req.headers['sec-websocket-protocol'] === 'as-controller'
//             return Array.from(wss.clients)
//                 .filter(client => client.protocol === 'as-controller')
//         default:
//             return []
//     }
// }

export default class WebSocketController {
    private static mcWss: WebSocket.Server

    static async sendToWsMinecraft(data: any) {
        if (!WebSocketController.mcWss) {
            console.error(new Date(), "WebSocketController.mcWss is not initialized")
            return
        }

        WebSocketController.mcWss.clients.forEach(client => {
            client.send(JSON.stringify(data))
        })
    }

    static async wsMinecraft(server: Server, path: string) {
        WebSocketController.mcWss = new WebSocket.Server({
            noServer: true,
            path: path
        })

        server.on('upgrade', (parent, socket, head) => {
            WebSocketController.mcWss.handleUpgrade(parent, socket, head, ws => {
                WebSocketController.mcWss.emit('connection', ws, parent)
            })
        })

        WebSocketController.mcWss.on('connection', (ws, req) => {
            if (process.env.NODE_ENV === "development") {
            console.log(new Date(), `[WS ${req.headers['sec-websocket-protocol'] ?? 'NULL!'}] established connection from ${req.socket.remoteAddress} to ${req.url}`)
            }

            // get token from URL (?token=...)
            let token: string | null = null
            try {
                const url = new URL(req.url ?? "", `http://${req.headers.host}`)
                token = url.searchParams.get("token")
            } catch (e) {
                console.error(e)
            }

            if (!token || token !== process.env.AUTH_TOKEN) {
                ws.send(JSON.stringify({
                    type: "error",
                    data: "Token not found"
                }))
                ws.close()
                return
            }

            ws.on('message', (message, isBinary) => {
                if (isBinary) {
                    console.log(message)
                    return ws.send(JSON.stringify({
                        type: "error",
                        data: "Binary message is not supported"
                    }))
                }
                const data = JSON.parse(message.toString())

                switch (data.type) {
                    case "mc_chat":
                        MinecraftWebhook.onChatReceived(data.data)
                        break;
                    case "mc_advancement":
                        MinecraftWebhook.onAdvancementReceived(data.data)
                        break;
                    case "mc_join":
                        MinecraftWebhook.onJoinReceived(data.data)
                        break;
                    case "mc_leave":
                        MinecraftWebhook.onLeaveReceived(data.data)
                        break;
                    case "mc_death":
                        MinecraftWebhook.onDeathReceived(data.data)
                        break;
                    default:
                        console.log(new Date(), `[WS ${req.headers['sec-websocket-protocol'] ?? 'NULL!'}] received unknown message:`, data)
                }

                // reply to client
                ws.send(JSON.stringify({ type: "ack" }))
            })
        })
    }
}