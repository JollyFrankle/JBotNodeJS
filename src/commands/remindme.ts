import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import query from '@m/mysql2'
import { sqlDate, dateFormatIndo, TextColorFormat } from '@h/utils';
import { client } from '@h/bot';
import { sendNotification } from '@h/firebaseAdmin';

async function checkEveryMinute(): Promise<void> {
  let currentReminders = await getCurrentReminders();
  // console.log(`${new Date()}: Found ${currentReminders.length} reminders for this minute.`)

  for (let reminder of currentReminders) {
    let user: string = reminder.user_id;
    let message: string = reminder.message;

    let isDeleted: boolean = await deleteReminderById(reminder.id);
    if (isDeleted) {
      // send reminder
      let userObj = await client.users.fetch(user);
      userObj.send(`<@${user}>\n**Reminder** for ${dateFormatIndo(new Date(reminder.timestamp), true)}:\nMessage:\n${message}`);

      console.log(TextColorFormat.GREEN, `Sent reminder to ${user} at ${dateFormatIndo(new Date(reminder.timestamp), true)}`);
    }

    // Send notification to device
    const reminderList = await query("SELECT * FROM android_devices")
    for (let device of reminderList) {
      try {
        await sendNotification(
          device.token,
          message,
          dateFormatIndo(new Date(reminder.timestamp), true),
          {
            type: "reminder",
            category: reminder.category || "",
          }
        )
      } catch (e: any) {
        if (e.code == "messaging/invalid-registration-token" || e.code == "messaging/registration-token-not-registered") {
          await query("DELETE FROM android_devices WHERE token = ?", [device.token])
        }
      }
    }
  }

  // Next reminder
  let millisBeforeNextMinute: number = 60000 - (Date.now() % 60000);
  setTimeout(checkEveryMinute, millisBeforeNextMinute);
}

checkEveryMinute();

/**
 * Inserts a reminder into the database
 * @param {Date} time
 * @param {String} user
 * @param {String} message
 * @returns {Promise<Boolean>} - True if successful, false if not
 */
async function addReminder(time: Date, user: string, message: string): Promise<boolean> {
  let sql: string = "INSERT INTO reminders (user_id, message, timestamp) VALUES (?, ?, ?)";
  let values: any[] = [user, message, sqlDate(time)];
  let result = await query(sql, values);
  return true;
}

/**
 * Gets all active reminders
 * @returns {Promise<Array>} - An array of objects representing the reminders
 */
async function getActiveReminders(): Promise<any[]> {
  let sql: string = "SELECT * FROM reminders WHERE timestamp > ?";
  let values: any[] = [Date.now()];
  let result = await query(sql, values);
  return result || [];
}

/**
 * Deletes a reminder by its ID
 * @param {Number} id
 * @returns {Promise<Boolean>} - True if successful, false if not
 */
async function deleteReminderById(id: number): Promise<boolean> {
  let sql: string = "DELETE FROM reminders WHERE id = ?";
  let values: any[] = [id];
  let result = await query(sql, values);
  return true;
}

/**
 * Gets all reminders that are the current minute
 * @returns {Promise<Array>} - An array of objects representing the reminders
 */
async function getCurrentReminders(): Promise<any[]> {
  let sql: string = "SELECT * FROM reminders WHERE LEFT(timestamp, 16) = LEFT(?, 16)";
  let values: any[] = [sqlDate(new Date())];
  let result = await query(sql, values);
  return result || [];
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
  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    let hours: number = interaction.options.getInteger("hours")!!
    let minutes: number = interaction.options.getInteger("minutes")!!

    let time: number = (hours * 60 * 60 * 1000) + (minutes * 60 * 1000)
    let now: number = Date.now()
    let then: Date = new Date(now + time)
    then = new Date(then.setSeconds(0, 0))

    let user: string = interaction.user.id

    let message: string = interaction.options.getString("message")!!

    // add reminder to database
    let result: boolean = await addReminder(then, user, message)
    if (result) {
      await interaction.reply({ content: `**Reminder** set for ${dateFormatIndo(then)}:\nMessage:\n${message}\n\nCheck your DMs for the reminder!`, ephemeral: true })
    } else {
      await interaction.reply({ content: `Failed to set reminder!`, ephemeral: true })
    }
  }
};