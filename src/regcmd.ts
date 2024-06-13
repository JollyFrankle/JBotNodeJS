import { Routes } from 'discord.js';
import { REST } from '@discordjs/rest';
import fs from 'node:fs';
import path from 'node:path';

const token = process.env["TOKEN"]!!;
const clientId = process.env["DC_CLIENT_ID"]!!;
// const tokenDev = process.env['TOKEN_DEV']!!;
// const clientIdDev = process.env['DC_CLIENT_ID_DEV']!!;
const guildId = "346135882983538698";

// Grab all the command files from the commands directory you created earlier
const commandsPath = path.resolve(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));

// Construct and prepare an instance of the REST module
const rest = new REST({ version: '10' }).setToken(token);

// and deploy your commands!
const commands: string[] = [];
const commandsDev: string[] = [];

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file)).default;
  if (command?.data) {
    if(command.isDev) {
      commandsDev.push(command.data.toJSON());
    } else {
      commands.push(command.data.toJSON());
    }
  }
}

// Deploy
export default function deployCommands() {
  rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commandsDev })
    .then((data: any) => console.log(`Deployed ${data.length} application (/) commands [DEV GUILD].`))
    .catch((err) => {
      console.error(err);
      console.log(commandsDev)
    });

  rest.put(Routes.applicationCommands(clientId), { body: commands })
    .then((data: any) => console.log(`Deployed ${data.length} application (/) commands [PROD].`))
    .catch((err) => {
      console.error(err);
      console.log(commands)
    });
}

// export async function deployDev(): Promise<void> {
//   // const restDev: REST = new REST({ version: '10' }).setToken(token);
//   try {
//     let commands: any[] = [];
//     for (let file of commandFiles) {
//       const command = await (await import(path.join(commandsPath, file)))?.default;
//       console.log(command?.isDev, command?.data?.toJSON());
//       if(command?.isDev && command?.data) {
//         commands.push(command.data.toJSON());
//       }
//     }

//     const data: any = await rest.put(
//       Routes.applicationGuildCommands(clientId, guildId),
//       { body: commands },
//     );

//     console.log(`Deployed ${data.length} application (/) commands [DEV GUILD].`);
//   } catch (error) {
//     console.error(error);
//   }
// }

// export async function deployProd(): Promise<void> {
//   try {
//     let commands: any[] = [];
//     for (let file of commandFiles) {
//       const command: any = (await import(path.join(commandsPath, file))).default;
//       if(!command?.isDev && command?.data) {
//         commands.push(command.data.toJSON());
//       }
//     }

//     const data: any = await rest.put(
//       Routes.applicationCommands(clientId),
//       { body: commands },
//     );

//     console.log(`Deployed ${data.length} application (/) commands [PROD].`);
//   } catch (error) {
//     console.error(error);
//   }
// }