import { query, insert, update } from '../modules/mysql2.js';
import * as utils from '../helpers/utils.js'
import express from 'express';

/**
 * @param {express.Request} req
 * @param {express.Response} res
 */
export async function funIndex(req, res) {
    const reminders = await query("SELECT * FROM reminders ORDER BY timestamp ASC");

    return res.send({
        status: 200,
        data: reminders.data
    });
}

/**
 * @param {express.Request} req
 * @param {express.Response} res
 */
export async function funGet(req, res) {
    const id = req.params.id;
    const reminders = await query("SELECT * FROM reminders WHERE id = ?", [id]);

    if (reminders.data.length == 0) {
        return res.status(404).send({
            status: 404,
            message: "Reminder not found"
        });
    }

    return res.send({
        status: 200,
        data: reminders.data[0]
    });
}

/**
 * @param {express.Request} req
 * @param {express.Response} res
 */
export async function funCreate(req, res) {
    const qStr = req.body;
    const data = {
        user_id: qStr.user_id || process.env.DC_USER_ID,
        message: qStr.message,
        timestamp: utils.sqlDate(new Date(qStr.timestamp)),
    }

    if (utils.isAnyEmptyObject(data)) {
        return res.status(400).send({
            status: 400,
            message: "Bad Request",
            data: data
        })
    }
    data.category = qStr.category || null

    const result = await insert("reminders", data)

    if (result.status == 200) {
        return res.send({
            status: 200,
            message: "Successfully added reminder",
            data: data
        })
    }

    return res.status(500).send({
        status: 500,
        message: "Internal Server Error"
    })
}

/**
 * @param {express.Request} req
 * @param {express.Response} res
 */
export async function funUpdate(req, res) {
    const qStr = req.body;
    const data = {
        id: req.params.id,
        user_id: qStr.user_id || process.env.DC_USER_ID,
        message: qStr.message,
        timestamp: utils.sqlDate(new Date(qStr.timestamp)),
    }

    if (utils.isAnyEmptyObject(data)) {
        return res.status(400).send({
            status: 400,
            message: "Bad Request",
            data: data
        })
    }

    data.category = qStr.category || null

    const result = await update("reminders", data, { id: data.id })

    if (result.status == 200) {
        return res.send({
            status: 200,
            message: "Successfully updated reminder",
            data: data
        })
    }

    return res.status(500).send({
        status: 500,
        message: "Internal Server Error"
    })
}

/**
 * @param {express.Request} req
 * @param {express.Response} res
 */
export async function funDelete(req, res) {
    const id = req.params.id;
    const result = await query("DELETE FROM reminders WHERE id = ?", [id]);

    if (result.status == 200) {
        return res.send({
            status: 200,
            message: "Successfully deleted reminder"
        })
    }

    return res.status(500).send({
        status: 500,
        message: "Internal Server Error"
    })
}

/**
 * @param {express.Request} req
 * @param {express.Response} res
 */
export async function funGetNearestReminder(req, res) {
    const result = await query("SELECT * FROM reminders WHERE timestamp > NOW() ORDER BY timestamp ASC LIMIT 1");

    if (result.status == 200) {
        return res.send({
            status: 200,
            data: result.data[0] || null
        })
    }

    return res.status(500).send({
        status: 500,
        message: "Internal Server Error"
    })
}