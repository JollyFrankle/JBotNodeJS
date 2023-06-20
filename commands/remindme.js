import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { query } from '../modules/mysql2.js'
import { sqlDate, dateFormatIndo } from '../helpers/utils.js';
import { client } from '../helpers/bot.js';
// import Database from '@replit/database';
import db from '../helpers/database.js';
// const db = new Database();

async function checkEveryMinute() {
  let currentReminders = await getCurrentReminders();
  // console.log(`${new Date()}: Found ${currentReminders.length} reminders for this minute.`)

  for (let reminder of currentReminders) {
    let user = reminder.user_id;
    let message = reminder.message;

    let isDeleted = await deleteReminderById(reminder.id);
    if (isDeleted) {
      // send reminder
      let userObj = await client.users.fetch(user);
      userObj.send(`<@${user}>\n**Reminder** for ${dateFormatIndo(new Date(reminder.timestamp), true)}:\nMessage:\n${message}`);

      console.log(`Sent reminder to ${user} at ${dateFormatIndo(new Date(reminder.timestamp), true)}`);
    }
  }
}

(() => {
  let millisBeforeNextMinute = 60000 - (Date.now() % 60000);
  setInterval(checkEveryMinute, millisBeforeNextMinute)
  checkEveryMinute()
})();

/**
 * Inserts a reminder into the database
 * @param {Date} time
 * @param {String} user
 * @param {String} message
 * @returns {Promise<Boolean>} - True if successful, false if not
 */
async function addReminder(time, user, message) {
  let sql = "INSERT INTO reminders (user_id, message, timestamp) VALUES (?, ?, ?)";
  let values = [user, message, sqlDate(time)];
  let result = await query(sql, values);
  if (result.status == 200) {
    return true;
  }
  return false;
}

/**
 * Gets all active reminders
 * @returns {Promise<Array>} - An array of objects representing the reminders
 */
async function getActiveReminders() {
  let sql = "SELECT * FROM reminders WHERE timestamp > ?";
  let values = [Date.now()];
  let result = await query(sql, values);
  if (result.status == 200) {
    return result.data;
  }
  return [];
}

/**
 * Deletes a reminder by its ID
 * @param {Number} id
 * @returns {Promise<Boolean>} - True if successful, false if not
 */
async function deleteReminderById(id) {
  let sql = "DELETE FROM reminders WHERE id = ?";
  let values = [id];
  let result = await query(sql, values);
  if (result.status == 200) {
    return true;
  }
  return false;
}

/**
 * Gets all reminders that are the current minute
 * @returns {Promise<Array>} - An array of objects representing the reminders
 */
async function getCurrentReminders() {
  let sql = "SELECT * FROM reminders WHERE LEFT(timestamp, 16) = LEFT(?, 16)";
  let values = [sqlDate(new Date())];
  let result = await query(sql, values);
  if (result.status == 200) {
    return result.data;
  }
  return [];
}

export default {
  isDev: true,
  data: new SlashCommandBuilder()
    .setName('remindme')
    .setDescription('Remind me in ... hours and ... minutes')
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
    let then = new Date(now + time)
    then = new Date(then.setSeconds(0, 0))

    let user = interaction.user.id

    let message = interaction.options.getString("message")

    // add reminder to database
    let result = await addReminder(then, user, message)
    if (result) {
      await interaction.reply({ content: `**Reminder** set for ${dateFormatIndo(then)}:\nMessage:\n${message}\n\nCheck your DMs for the reminder!`, ephemeral: true })
    } else {
      await interaction.reply({ content: `Failed to set reminder!`, ephemeral: true })
    }
  }
};