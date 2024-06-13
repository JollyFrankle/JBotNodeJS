import admin, { messaging } from 'firebase-admin';
import { TextColorFormat } from '@h/utils';
import fs from 'fs';

admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(fs.readFileSync('./firebaseAdmin.json', 'utf8')) as admin.ServiceAccount),
    databaseURL: process.env['FB_DBURL']
});

export async function sendNotification(token: string, title: string, body: string, data: any): Promise<any> {
    const message: messaging.Message = {
        notification: {
            title: title,
            body: body
        },
        data: data,
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