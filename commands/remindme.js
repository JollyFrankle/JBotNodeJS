import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
// import Database from '@replit/database';
import db from '../helpers/database.js';
// const db = new Database();

async function checkEveryMinute() {
  return;
  let reminders = await db.get("reminders")
  let now = new Date()
  now.setMinutes(0, 0, 0)
  // console.log(`Checking reminders at ${now}`)
  for (let i in reminders) {
    let { time, user, channel, message } = reminders[i]
    if (time <= now) {
      const { client } = await import("../helpers/bot.js")

      await client.channels.fetch(channel)
        .then(async (ch) => {
          await ch.send(`<@${user}> Reminder: ${message}`)
          reminders.splice(i, 1)
          await db.set("reminders", reminders)
        })
        .catch(async (err) => {
          console.log(`Error: ${err}`)
        })
    }
  }
}

async function setup() {
  if (typeof (await db.get("reminders")) == "undefined") {
    await db.set("reminders", [])
  }

  setInterval(checkEveryMinute, 60000)
  checkEveryMinute()
}
setup()

export default {
  isDev: true,
  data: new SlashCommandBuilder()
	.setName('remindme')
	.setDescription('Remind me when the time is up')
  .addStringOption(op =>
    op.setName("message")
      .setDescription("Message")
      .setRequired(true))
  .addIntegerOption(op =>
    op.setName("hours")
      .setDescription("Hours")
      .setRequired(true))
  .addIntegerOption(op =>
    op.setName("minutes")
      .setDescription("Minutes")
      .setRequired(true)),
  /**
   * @param {ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    let hours = interaction.options.getInteger("hours")
    let minutes = interaction.options.getInteger("minutes")

    let time = (hours * 60 * 60 * 1000) + (minutes * 60 * 1000)
    let now = Date.now()
    let then = now + time

    let user = interaction.user.id
    let channel = interaction.channel.id

    let message = interaction.options.getString("message")

    let reminders = await db.get("reminders")
    reminders.push({ time: then, user, channel, message })

    // await db.set
  }
};