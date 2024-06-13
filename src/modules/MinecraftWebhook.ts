import { APIEmbed, Message } from "discord.js"
import { sendMessage } from "@h/bot"
import query from "@m/mysql2"
import CustomEmbed, { EmbedColours } from "@m/CustomEmbed"
import WebSocketController from "@c/WebSocketController"

export type McPlayerActivity = {
    player: string
    date: string
}

type McChatData = {
    message: string
} & McPlayerActivity

type McAdvancementData = {
    advancement: string
} & McPlayerActivity

type McLeaveJoinData = McPlayerActivity

type McDeathData = {
    cause: string
} & McPlayerActivity

type DiscordChatData = {
    name: string
    message: string
}

type SubscriberListRow = {
    id_channel: string // Channel ID
    id_guild: string // Server ID
    id_creator: string // User ID
    type: string
    created_at: string
}

const HEAD_URL = "https://mc-heads.net/avatar/"

export default class MinecraftWebhook {
    private static minecraftSubscribers: SubscriberListRow[] = []
        get subscribers() {
            return MinecraftWebhook.minecraftSubscribers
        }

    static async refreshSubscribers() {
        try {
            MinecraftWebhook.minecraftSubscribers = await query<SubscriberListRow[]>(`SELECT * FROM subscribers WHERE type = 'minecraft';`)
        } catch (e: any) {
            console.error(e)
            MinecraftWebhook.minecraftSubscribers = []
        }
    }
    static async checkChat(msg: Message) {
        // if this was sent in a Minecraft channel
        const list = MinecraftWebhook.minecraftSubscribers
        if (list.map(row => row.id_channel).includes(msg.channel.id)) {
            MinecraftWebhook.sendDiscordMessage({
                name: msg.author.displayName,
                message: msg.content
            })
        }
    }

    static async sendDiscordMessage(data: DiscordChatData) {
        WebSocketController.sendToWsMinecraft({
            type: "dc_chat",
            data: data
        })
    }

    static async onChatReceived(data: McChatData) {
        const list = MinecraftWebhook.minecraftSubscribers
        sendMessage(`**${data.player}**: ${data.message}`, list.map(row => row.id_channel))
    }

    static async onAdvancementReceived(data: McAdvancementData) {
        const list = MinecraftWebhook.minecraftSubscribers
        sendMessage(`**${data.player}** has made the advancement **${data.advancement}**`, list.map(row => row.id_channel))
    }

    static async onLeaveReceived(data: McLeaveJoinData) {
        const list = MinecraftWebhook.minecraftSubscribers
        const embed: APIEmbed = {
            color: EmbedColours.ERROR,
            footer: {
                icon_url: `${HEAD_URL}${data.player}`,
                text: data.player + " left the game"
            }
        }
        sendMessage(CustomEmbed.sendable(embed), list.map(row => row.id_channel))
    }

    static async onJoinReceived(data: McLeaveJoinData) {
        const list = MinecraftWebhook.minecraftSubscribers
        const embed: APIEmbed = {
            color: EmbedColours.SUCCESS,
            footer: {
                icon_url: `${HEAD_URL}${data.player}`,
                text: data.player + " joined the game"
            }
        }
        sendMessage(CustomEmbed.sendable(embed), list.map(row => row.id_channel))
    }

    static async onDeathReceived(data: McDeathData) {
        const list = MinecraftWebhook.minecraftSubscribers
        const embed: APIEmbed = {
            color: EmbedColours.ERROR,
            footer: {
                icon_url: `${HEAD_URL}${data.player}`,
                text: data.player + " was killed by " + data.cause
            }
        }
        sendMessage(CustomEmbed.sendable(embed), list.map(row => row.id_channel))
    }
}