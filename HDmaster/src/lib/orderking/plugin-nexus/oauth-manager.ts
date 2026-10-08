import { getSql } from '../../db';

export async function exchangeAuthCode(tokenEndpoint: string, clientId: string, clientSecret: string, code: string, redirectUri: string, provider: string, accountId: string) {
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('code', code);
    params.append('redirect_uri', redirectUri);

    const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
        },
        body: params.toString()
    });

    if (!response.ok) {
        throw new Error(`Failed to exchange auth code: ${response.statusText}`);
    }

    const data = await response.json();
    
    const sql = await getSql();
    await sql`
        INSERT INTO plugin_oauth_tokens (account_id, provider, access_token, refresh_token, expires_in, created_at)
        VALUES (${accountId}, ${provider}, ${data.access_token}, ${data.refresh_token || null}, ${data.expires_in || null}, NOW())
        ON CONFLICT (account_id, provider) DO UPDATE SET
            access_token = EXCLUDED.access_token,
            refresh_token = COALESCE(EXCLUDED.refresh_token, plugin_oauth_tokens.refresh_token),
            expires_in = EXCLUDED.expires_in,
            updated_at = NOW();
    `;

    return data;
}

export async function getAccessToken(accountId: string, provider: string) {
    const sql = await getSql();
    const rows = await sql`SELECT access_token FROM plugin_oauth_tokens WHERE account_id = ${accountId} AND provider = ${provider}`;
    return rows.length > 0 ? rows[0].access_token : null;
}
