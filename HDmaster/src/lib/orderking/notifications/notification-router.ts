import { getSql } from '../../db';
import { sendEmail } from './email-sender';
import { sendSMS } from './sms-sender';
import { sendPush } from './push-notification';

export async function notify(
    userId: string, 
    channel: 'email' | 'sms' | 'push' | 'all', 
    template: string, 
    data: any
) {
    const sql = await getSql();
    
    const users = await sql`
        SELECT email, phone_number, fcm_token, notification_preferences 
        FROM users 
        WHERE id = ${userId}
    `;

    if (!users || users.length === 0) {
        throw new Error(`User with ID ${userId} not found`);
    }

    const user: any = users[0];
    const results: any = {};

    const subject = `Notification: ${template}`;
    const body = `Data: ${JSON.stringify(data)}`;

    if ((channel === 'email' || channel === 'all') && user.email) {
        results.email = await sendEmail(user.email, subject, body);
    }

    if ((channel === 'sms' || channel === 'all') && user.phone_number) {
        results.sms = await sendSMS(user.phone_number, body);
    }

    if ((channel === 'push' || channel === 'all') && user.fcm_token) {
        results.push = await sendPush(user.fcm_token, subject, body, data);
    }

    return results;
}
