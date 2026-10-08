import { getSql } from '../../db';

export async function sendEmail(to: string, subject: string, htmlBody: string): Promise<any> {
    const sql = await getSql();
    
    // Resend API example
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY is not set');

    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            from: 'noreply@orderking.com',
            to,
            subject,
            html: htmlBody
        })
    });

    const result = await response.json();
    
    await sql`
        INSERT INTO email_logs (to_address, subject, status, response, created_at)
        VALUES (${to}, ${subject}, ${response.ok ? 'sent' : 'failed'}, ${JSON.stringify(result)}, NOW())
    `;

    return result;
}
