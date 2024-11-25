import { SlashCommandBuilder, ChatInputCommandInteraction, AutocompleteInteraction } from 'discord.js';
import query from '@m/mysql2'
import { sqlDate, dateFormatIndo, TextColorFormat, truncate } from '@h/utils';
import { client } from '@h/bot';
import { sendNotification } from '@h/firebaseAdmin';
import CustomEmbed from '@/modules/CustomEmbed';
import Authentication from '@/helpers/Authentication';

async function checkEveryMinute(): Promise<void> {
    let currentReminders = await getCurrentReminders();
    // console.log(`${new Date()}: Found ${currentReminders.length} reminders for this minute.`)

    for (let reminder of currentReminders) {
        let user: string = reminder.user_id;
        let message: string = reminder.message;

        let isDeleted: boolean = await deleteReminderById(reminder.id);
        if (isDeleted) {
            // send reminder
            const embed = CustomEmbed.withContent(
                `**Reminder:**\n${message}`,
                undefined,
                0x20c997
            )
            let userObj = await client.users.fetch(user);
            userObj.send(CustomEmbed.sendable(embed, { content: `<@${user}>` }));

            // send to channel
            if (reminder.id_channel) {
                let channel = await client.channels.fetch(reminder.id_channel);
                if (channel && channel.isTextBased()) {
                    channel.send(CustomEmbed.sendable(embed))
                }
            }

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
    let millisBeforeNextMinute = 60000 - (Date.now() % 60000);
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
async function addReminder(time: Date, user: string, id_channel: string | null, message: string): Promise<boolean> {
    let sql = "INSERT INTO reminders (user_id, id_channel, message, timestamp) VALUES (?, ?, ?, ?)";
    let values: any[] = [user, id_channel, message, sqlDate(time)];
    try {
        await query(sql, values);
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
}

/**
 * Gets all active reminders
 * @returns {Promise<Array>} - An array of objects representing the reminders
 */
async function getActiveReminders(idUser: string, isAdmin: boolean, idChannel: string): Promise<any[]> {
    let sql = "SELECT * FROM reminders WHERE timestamp > ? AND (user_id = ? OR (1 = ? AND id_channel = ?))";
    let values: any[] = [Date.now(), idUser, isAdmin ? 1 : 0, idChannel];
    try {
        let result = await query(sql, values);
        return result || [];
    } catch (e) {
        return [];
    }
}

/**
 * Deletes a reminder by its ID
 * @param {Number} id
 * @returns {Promise<Boolean>} - True if successful, false if not
 */
async function deleteReminderById(id: number): Promise<boolean> {
    let sql = "DELETE FROM reminders WHERE id = ?";
    let values: any[] = [id];
    try {
        await query(sql, values);
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
}

/**
 * Gets all reminders that are the current minute
 * @returns {Promise<Array>} - An array of objects representing the reminders
 */
async function getCurrentReminders(): Promise<any[]> {
    let sql = "SELECT * FROM reminders WHERE LEFT(timestamp, 16) = LEFT(?, 16)";
    let values: any[] = [sqlDate(new Date())];
    try {
        let result = await query(sql, values);
        return result || [];
    } catch (e) {
        return [];
    }
}

export default {
    isDev: false,
    data: new SlashCommandBuilder()
        .setName('reminder')
        .setDescription("Set a reminder")
        .addSubcommandGroup(sc =>
            sc.setName("add")
                .setDescription("Add a reminder")
                .addSubcommand(sc =>
                    sc.setName("relative")
                        .setDescription("Add a reminder")
                        .addStringOption(op =>
                            op.setName("message")
                                .setDescription("Message (tuliskan \\n untuk baris baru)")
                                .setMaxLength(1024)
                                .setRequired(true))
                        .addIntegerOption(op =>
                            op.setName("hours")
                                .setDescription("Hours")
                                .setRequired(true))
                        .addIntegerOption(op =>
                            op.setName("minutes")
                                .setDescription("Minutes")
                                .setRequired(true))
                        .addChannelOption(op =>
                            op.setName("channel")
                                .setDescription("Channel (jika tidak diisi, maka akan dikirim ke private message)")
                                .setRequired(false)
                        )
                )
                .addSubcommand(sc =>
                    sc.setName("absolute")
                        .setDescription("Add a reminder")
                        .addStringOption(op =>
                            op.setName("message")
                                .setDescription("Message (tuliskan \\n untuk baris baru)")
                                .setRequired(true))
                        .addStringOption(op =>
                            op.setName("date")
                                .setDescription("Date and time (valid date format)")
                                .setRequired(true))
                        .addChannelOption(op =>
                            op.setName("channel")
                                .setDescription("Channel (jika tidak diisi, maka akan dikirim ke private message)")
                                .setRequired(false)
                        )
                )
        )
        .addSubcommand(sc =>
            sc.setName("remove")
                .setDescription("Remove a reminder")
                .addStringOption(op =>
                    op.setName("id")
                        .setDescription("Nama reminder")
                        .setAutocomplete(true)
                        .setRequired(true)
                )
        )
        .addSubcommand(sc =>
            sc.setName("list")
                .setDescription("List all reminders")
        ),
    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const subcommand = interaction.options.getSubcommandGroup() || interaction.options.getSubcommand()
        switch (subcommand) {
            case "add":
                await addReminderCmd(interaction)
                break
            case "remove":
                await removeReminderCmd(interaction)
                break
            case "list":
                await listReminderCmd(interaction)
                break
        }
    },
    async autocomplete(interaction: AutocompleteInteraction): Promise<void> {
        const subcommand = interaction.options.getSubcommandGroup() || interaction.options.getSubcommand()
        if (subcommand === "remove") {
            const isAdmin = await Authentication.verify(interaction.user.id, interaction.guildId)
            let reminders = await getActiveReminders(interaction.user.id, isAdmin, interaction.channelId)
            let options = reminders.map(r => ({ name: truncate(`${dateFormatIndo(new Date(r.timestamp), true)} - ${r.message}`, 100), value: r.id.toString() }))
            interaction.respond(options)
        }
    }
};

async function addReminderCmd(interaction: ChatInputCommandInteraction): Promise<void> {
    const subcommand = interaction.options.getSubcommand()
    const user = interaction.user.id
    const channel = interaction.options.getChannel("channel")?.id ?? null
    const message = interaction.options.getString("message")!!.replace(/\\n/g, "\n")
    let then: Date
    if (subcommand === "relative") {
        let hours = interaction.options.getInteger("hours")!!
        let minutes = interaction.options.getInteger("minutes")!!

        let time = (hours * 60 * 60 * 1000) + (minutes * 60 * 1000)
        let now = Date.now()
        then = new Date(new Date(now + time).setSeconds(0, 0))
    } else if (subcommand === "absolute") {
        const date = interaction.options.getString("date")!!
        then = new Date(date)
        then.setSeconds(0, 0)
        // check if date is valid
        if (isNaN(then.getTime())) {
            await interaction.reply(CustomEmbed.sendableReply(
                CustomEmbed.shortError(`Format tanggal tidak valid`), { ephemeral: true }
            ))
            return
        }
        // check if minute is <= current minute
        if (then.getTime() <= Date.now()) {
            await interaction.reply(CustomEmbed.sendableReply(
                CustomEmbed.shortError(`Tanggal dan waktu harus lebih dari sekarang`), { ephemeral: true }
            ))
            return
        }
    } else {
        return
    }

    // add reminder to database
    let result = await addReminder(then, user, channel, message)
    if (result) {
        await interaction.reply(CustomEmbed.sendableReply(
            CustomEmbed.shortSuccess(`Reminder berhasil ditambahkan\nTanggal: ${dateFormatIndo(then)}\n\n${message}`), { ephemeral: true }
        ))
    } else {
        await interaction.reply(CustomEmbed.sendableReply(
            CustomEmbed.shortError(`Gagal menambahkan reminder`), { ephemeral: true }
        ))
    }
}

async function removeReminderCmd(interaction: ChatInputCommandInteraction): Promise<void> {
    const id = +interaction.options.getString("id")!!
    let result = await deleteReminderById(id)
    if (result) {
        await interaction.reply(CustomEmbed.sendableReply(
            CustomEmbed.shortSuccess(`Reminder berhasil dihapus`), { ephemeral: true }
        ))
    } else {
        await interaction.reply(CustomEmbed.sendableReply(
            CustomEmbed.shortError(`Gagal menghapus reminder`), { ephemeral: true }
        ))
    }
}

async function listReminderCmd(interaction: ChatInputCommandInteraction): Promise<void> {
    const isAdmin = await Authentication.verify(interaction.user.id, interaction.guildId)
    let reminders = await getActiveReminders(interaction.user.id, isAdmin, interaction.channelId)
    let msg = ""
    for (let reminder of reminders) {
        msg += `*${dateFormatIndo(new Date(reminder.timestamp), true)}*\nPesan: ${reminder.message}\n\n`
    }
    if (msg === "") {
        msg = "*Tidak ada reminder aktif*"
    }
    await interaction.reply(CustomEmbed.sendableReply(
        CustomEmbed.withContent("**Daftar Reminder saat ini:**\n" + msg), { ephemeral: true }
    ))
}