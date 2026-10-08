import { getSql } from '../../db';

export async function sendPush(fcmToken: string, title: string, body: string, data?: Record<string, string>): Promise<any> {
    const sql = await getSql();
    
    const projectId = process.env.FCM_PROJECT_ID;
    const bearerToken = process.env.FCM_BEARER_TOKEN;

    if (!projectId || !bearerToken) {
        throw new Error('FCM credentials are not set');
    }

    const response = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${bearerToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message: {
                token: fcmToken,
                notification: {
                    title,
                    body
                },
                data
            }
        })
    });

    const result = await response.json();

    if (result.error && (result.error.status === 'UNREGISTERED' || result.error.status === 'INVALID_ARGUMENT')) {
        await sql`
            UPDATE user_fcm_tokens SET status = 'expired', updated_at = NOW() WHERE token = ${fcmToken}
        `;
    }

    await sql`
        INSERT INTO push_logs (fcm_token, title, body, status, response, created_at)
        VALUES (${fcmToken}, ${title}, ${body}, ${response.ok ? 'sent' : 'failed'}, ${JSON.stringify(result)}, NOW())
    `;

    return result;
}
