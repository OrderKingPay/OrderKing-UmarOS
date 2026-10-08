import crypto from 'crypto';
import { getSql } from '../../db';

export async function handleWebhook(
    payload: Buffer | string,
    signature: string,
    secret: string,
    provider: string,
    headers: Record<string, string>
) {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    const expectedSignature = hmac.digest('hex');

    // Timing safe comparison to prevent timing attacks
    const a = Buffer.from(signature);
    const b = Buffer.from(expectedSignature);

    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        throw new Error('Invalid webhook signature');
    }

    const jsonPayload = typeof payload === 'string' ? JSON.parse(payload) : JSON.parse(payload.toString('utf8'));

    const sql = await getSql();
    await sql`
        INSERT INTO plugin_webhook_logs (provider, payload, headers, received_at)
        VALUES (${provider}, ${jsonPayload}, ${headers}, NOW())
    `;

    return jsonPayload;
}
