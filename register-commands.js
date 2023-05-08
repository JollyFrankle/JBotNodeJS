import { Routes } from 'discord.js';
import { REST } from '@discordjs/rest';
import fs from 'node:fs';
import path from 'node:path';

const clientId = process.env["DC_CLIENT_ID"]
const token = process.env["TOKEN"]
const guildId = "346135882983538698"

// Grab all the command files from the commands directory you created earlier
const commandsPath = path.join(path.resolve(), 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// Construct and prepare an instance of the REST module
const rest = new REST({ version: '10' }).setToken(token);

// and deploy your commands!
export async function deployDev() {
  const restDev = new REST({ version: '10' }).setToken(process.env['TOKEN_DEV']);
  try {
    let commands = [];
    for (let file of commandFiles) {
      const command = (await import(`./commands/${file}`)).default;
      if(command.isDev === true && typeof command.data != 'undefined') {
        commands.push(command.data.toJSON());
      }
    }

    const data = await restDev.put(
      Routes.applicationCommands(process.env['DC_CLIENT_ID_DEV']),
      { body: commands },
    );

    console.log(`Deployed ${data.length} application (/) commands [DEV BOT].`);
  } catch (error) {
    console.error(error);
  }
}

export async function deployProd() {
  try {
    let commands = [];
    for (let file of commandFiles) {
      const command = (await import(`./commands/${file}`)).default;
      if(command.isDev === false && typeof command.data != 'undefined') {
        commands.push(command.data.toJSON());
      }
    }

    const data = await rest.put(
      Routes.applicationCommands(clientId),
      { body: commands },
    );

    console.log(`Deployed ${data.length} application (/) commands [PROD].`);
  } catch (error) {
    console.error(error);
  }
}