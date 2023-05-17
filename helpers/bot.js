import { Client, GatewayIntentBits, Events } from 'discord.js';

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent
  ],
  fetchAllMembers: true,
  autoReconnect: true,
});

export const clientDev = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent
  ],
  fetchAllMembers: true,
  autoReconnect: true,
});

/**
 * Chat input command interaction template
 * @param {import('discord.js').Interaction} interaction
 * @returns
 */
async function onInteractionReceived(interaction) {
  if (interaction.isChatInputCommand()) {
    try {
      const cmd = (await import(`../commands/${interaction.commandName}.js`)).default;
      cmd.execute(interaction)
    } catch (error) {
      console.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
      } else {
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
      }
    }
  } else if (interaction.isAutocomplete()) {
    const cmd = (await import(`../commands/${interaction.commandName}.js`)).default;

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

// Register InteractionCreate
client.on(Events.InteractionCreate, onInteractionReceived)
clientDev.on(Events.InteractionCreate, onInteractionReceived)

/**
 * Send message to specific channel(s)
 * @param {*} msgText
 * @param {Array<string>} list
 * @returns Daftar pesan yang berhasil dikirim
 */
export async function sendMessage(msgText, list) {
  let sentMsgs = [];
  if (list && list.length > 0 && msgText && client) {
    for (let cId of list) {
      try {
        await client.channels.cache.get(cId).send(msgText)
          .then((res) => {
            sentMsgs.push([cId, res.id])
          });
      } catch (e) {
        console.log(new Date());
        console.log(":: sendMessage (was sendGeneralCL)");
        console.log("\x1b[31m%s\x1b[0m\r\n", e)

        let eStr = e.toString();
        if (eStr.includes("Cannot read properties of undefined (reading 'send')")) {
          // 429 probably:
          restartContainer()
        }
      }
    }
  }
  return sentMsgs;
}

/**
 * Restart container
 * @returns {never}
 */
export function restartContainer() {
 console.log("\x1b[33m%s\x1b[0m", "[!] restartContainer triggered");
 process.exit(1)
}