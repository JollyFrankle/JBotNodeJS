import admin from 'firebase-admin';
import serviceAccount from '../adminSDK.json' assert { type: "json" };
import { TextColorFormat } from './utils.js';

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env['FB_DBURL']
});

export async function sendNotification(token, title, body, data) {
    const message = {
        notification: {
            title: title,
            body: body
        },
        data: data,
        priority: 'high',
        token: token
    };

    try {
        const response = await admin.messaging().send(message);
        console.log(TextColorFormat.GREEN, 'Successfully sent message: ' + response);
        return response;
    } catch (error) {
        console.log(TextColorFormat.RED, 'Error sending message: ' + error);
        throw error;
    }
}