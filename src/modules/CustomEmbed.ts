import { APIEmbed, InteractionReplyOptions, MessageCreateOptions } from "discord.js";

export const EmbedColours = {
    SUCCESS: 0x198754,
    ERROR: 0xdc3545,
    INFO: 0x0d6efd,
    WARNING: 0xffc107,
    DEFAULT: 0x6c757d
}

export default class CustomEmbed {
    static shortError(message: string, title?: string): APIEmbed {
        return {
            description: `**${title ?? "Error"}:** ${message}`,
            color: EmbedColours.ERROR
        }
    }

    static loading(message: string, title?: string): APIEmbed {
        return {
            description: `**${title ?? "Loading"}:** ${message}`,
            color: EmbedColours.DEFAULT
        }
    }

    static shortSuccess(message: string, title?: string): APIEmbed {
        return {
            description: `**${title ?? "Success"}:** ${message}`,
            color: EmbedColours.SUCCESS
        }
    }

    static shortInfo(message: string, title?: string): APIEmbed {
        return {
            description: `**${title ?? "Info"}:** ${message}`,
            color: EmbedColours.INFO
        }
    }

    static withContent(content: string, title?: string, colour: number = EmbedColours.DEFAULT, otherOptions?: APIEmbed): APIEmbed {
        return {
            ...otherOptions,
            description: content,
            color: colour,
            title: title
        }
    }

    /**
     * Generate a sendable embed
     */
    static sendable(embed: APIEmbed, otherOptions?: MessageCreateOptions): MessageCreateOptions {
        return {
            ...otherOptions,
            embeds: [embed]
        }
    }

    static sendableReply(embed: APIEmbed, otherOptions?: InteractionReplyOptions): InteractionReplyOptions {
        return {
            ...otherOptions,
            embeds: [embed]
        }
    }
}