import { getSql } from '../../db';

export async function sendSMS(phoneNumber: string, message: string): Promise<any> {
    const sql = await getSql();

    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioFrom = process.env.TWILIO_FROM_NUMBER;

    if (!twilioSid || !twilioToken || !twilioFrom) {
        throw new Error('Twilio credentials are not fully set');
    }

    const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');

    const body = new URLSearchParams({
        To: phoneNumber,
        From: twilioFrom,
        Body: message
    });

    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body.toString()
    });

    const result = await response.json();

    await sql`
        INSERT INTO sms_logs (phone_number, message, status, response, created_at)
        VALUES (${phoneNumber}, ${message}, ${response.ok ? 'sent' : 'failed'}, ${JSON.stringify(result)}, NOW())
    `;

    return result;
}
