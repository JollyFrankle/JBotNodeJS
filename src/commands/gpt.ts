/**
 * @deprecated
 */
// import { SlashCommandBuilder, SlashCommandStringOption, ChatInputCommandInteraction } from 'discord.js';
// import { personas, generateCompletion, markAsDeleted } from '../modules/openai.js';

// interface PersonaChoice {
//   name: string;
//   value: string;
// }

// let out: PersonaChoice[] = [];
// Object.keys(personas).forEach((k: string, i: number) => {
//   out.push({ name: personas[k].name, value: k })
// })

// const persona: SlashCommandStringOption = new SlashCommandStringOption()
//   .setName("persona")
//   .setDescription("ChatGPT dengan persona (sifat) apa?")
//   .setRequired(true)
//   .addChoices(...out)

// const gptCommand = {
//   isDev: true,
//   data: new SlashCommandBuilder()
//     .setName("gpt")
//     .setDescription("All-things related to GPT-3!")
//     .addSubcommand(sc =>
//       sc.setName("chat")
//         .setDescription("Tanyakan apapun kepada ChatGPT (GPT 3.5)")
//         .addStringOption(persona)
//         .addStringOption(op =>
//           op.setName('prompt')
//             .setDescription('Apa yang ingin disampaikan kepada ChatGPT')
//             .setMaxLength(2048)
//             .setRequired(true))
//     ).addSubcommand(sc =>
//       sc.setName("clear")
//         .setDescription("Hapus history interaksi dengan ChatGPT")
//         .addStringOption(persona)
//     ),
//   /**
//    * @param {ChatInputCommandInteraction} interaction
//    */
//   async execute(interaction: ChatInputCommandInteraction) {
//     if (interaction.options.getSubcommand() === "chat") {
//       let prompt: string = interaction.options.getString("prompt")!!;
//       let persona: string = interaction.options.getString('persona')!!;
//       await interaction.reply({
//         content: `Persona: **${persona}**\n${prompt}`,
//         embeds: [{
//           color: 0x6c757d,
//           description: 'Loading...',
//         }]
//       })
//       let result = await generateCompletion(
//         prompt,
//         interaction.user.id,
//         interaction.channelId,
//         persona
//       )
//       await interaction.editReply(result)
//     }
//     if(interaction.options.getSubcommand() === "clear") {
//       let persona: string = interaction.options.getString('persona');

//       await interaction.reply(await markAsDeleted(
//         interaction.user.id,
//         interaction.channelId,
//         persona
//       ))
//     }
//   }
// };

// export default gptCommand;