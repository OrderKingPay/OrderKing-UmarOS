import fetch from 'node-fetch';

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authEndpoint: string;
  tokenEndpoint: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
}

export function getAuthUrl(config: OAuthConfig, codeChallenge: string, state: string, scope: string): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: scope,
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256'
  });
  
  return `${config.authEndpoint}?${params.toString()}`;
}

export async function exchangeCodeForToken(config: OAuthConfig, code: string, codeVerifier: string): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    code: code,
    code_verifier: codeVerifier
  });

  const response = await fetch(config.tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: body.toString()
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Token exchange failed: ${response.status} ${response.statusText} - ${errorData}`);
  }

  return (await response.json()) as TokenResponse;
}
