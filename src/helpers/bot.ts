import { Client, GatewayIntentBits, Interaction, Message, MessageCreateOptions, MessagePayload, TextChannel } from 'discord.js';
import { TextColorFormat } from '@h/utils';
import { OnDuplicate, insert } from '@m/mysql2';
import MinecraftWebhook from '@m/MinecraftWebhook';

export const startupTime: number = new Date().getTime()

export const client: Client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
  ]
});

export const clientDev: Client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent
  ]
});

/**
 * Chat input command interaction template
 * @param {Interaction} interaction
 * @returns
 */
async function onInteractionReceived(interaction: Interaction): Promise<void> {
  if (interaction.isChatInputCommand()) {
    try {
      const cmd = require(`../commands/${interaction.commandName}`).default;
      cmd.execute(interaction)
    } catch (error) {
      console.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          embeds: [{
            description: '**Error:** There was an error while executing this command!',
            color: 0xdc3545
          }], ephemeral: true
        });
      } else {
        await interaction.reply({
          embeds: [{
            description: '**Error:** There was an error while executing this command!',
            color: 0xdc3545
          }], ephemeral: true
        });
      }
    }
  } else if (interaction.isAutocomplete()) {
    const cmd = require(`../commands/${interaction.commandName}`).default;

    if (!cmd) {
      console.error(`No command matching ${interaction.commandName} was found.`);
      return;
    }

    try {
      await cmd.autocomplete(interaction);
    } catch (error) {
      console.error(error);
    }
  }
}

// Event handlers
client.on('interactionCreate', onInteractionReceived)
clientDev.on('interactionCreate', onInteractionReceived)

client.on("ready", async () => {
  console.log(TextColorFormat.CYAN, "[Discord] Main Bot Connected in " + (new Date().getTime() - startupTime) + " ms")
  await sendMessage(`> **Bot Reboot:**\r\nReboot done at <t:${client.readyTimestamp!! / 1000}:F>`, ["971697363615899688"]);

  const guilds = client.guilds.cache
  guilds.forEach((g) => {
    insert(`guilds`, {
      id: g.id,
      name: g.name,
      owner: g.ownerId,
      joined_at: g.joinedAt,
    }, OnDuplicate.Update)
  })
});

client.on("messageCreate", async (msg) => {
  if (msg.author.bot) {
    return;
  }

  MinecraftWebhook.checkChat(msg);
});

clientDev.on("ready", async () => {
  console.log(TextColorFormat.CYAN, "[Discord] Dev Bot connected in " + (new Date().getTime() - startupTime) + " ms")
})

client
  .on("debug", (msg) => {
    // console.log("[dcC] " + TextColorFormat.YELLOW, e)
    if (msg.includes("Hit a 429 while executing a request.")) {
      // hit a 429, kill 1
      console.log("We've really hit a 429!")
      restartContainer()
    }
  })
  .on("warn", (msg) => {
    console.log(new Date())
    console.log(":: Discord Bot WARNING")
    console.log(TextColorFormat.YELLOW + "\r\n", msg)
  })
  .on("error", (msg) => {
    console.log(new Date())
    console.log(":: Discord Bot ERROR")
    console.log(TextColorFormat.RED + "\r\n", msg)
  })

export async function sendMessage(msgText: string | MessagePayload | MessageCreateOptions, list: string[]): Promise<[string, string][]> {
  let sentMsgs: [string, string][] = [];
  if (list && list.length > 0 && msgText && client) {
    for (let cId of list) {
      try {
        await (client.channels.cache.get(cId) as TextChannel)?.send(msgText)
          .then((res: Message) => {
            sentMsgs.push([cId, res.id])
          });
      } catch (e) {
        console.log(new Date());
        console.log(":: sendMessage (was sendGeneralCL)");
        console.log(TextColorFormat.RED + "\r\n", e)

        // let eStr = e.toString();
        // if (eStr.includes("Cannot read properties of undefined (reading 'send')")) {
        //   // 429 probably:
        //   restartContainer()
        // }
      }
    }
  }
  return sentMsgs;
}

export function restartContainer(): never {
  console.log(TextColorFormat.RED, "[!] restartContainer triggered");
  process.exit(1)
}

// export function emergencyShutdown() {
//   console.log(TextColorFormat.RED, "[!] emergencyShutdown triggered");
//   client.destroy();
//   clientDev.destroy();
// }