import crypto from 'crypto';

export interface PKCEData {
  code_verifier: string;
  code_challenge: string;
}

function base64URLEncode(buffer: Buffer): string {
  return buffer.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export function generatePKCE(): PKCEData {
  const verifier = base64URLEncode(crypto.randomBytes(32));
  const challenge = base64URLEncode(crypto.createHash('sha256').update(verifier).digest());
  
  return {
    code_verifier: verifier,
    code_challenge: challenge
  };
}
