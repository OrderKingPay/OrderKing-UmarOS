import * as crypto from 'crypto';

export interface JWTPayload {
  [key: string]: any;
  exp?: number;
}

function base64urlEncode(str: string | Buffer): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64urlDecode(str: string): string {
  let paddedStr = str;
  while (paddedStr.length % 4 !== 0) {
    paddedStr += '=';
  }
  return Buffer.from(paddedStr.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
}

export function signToken(payload: any, secretKey: string, expiresInSec: number): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const currentUnixTime = Math.floor(Date.now() / 1000);
  const jwtPayload: JWTPayload = {
    ...payload,
    iat: currentUnixTime,
    exp: currentUnixTime + expiresInSec
  };

  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(jwtPayload));

  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const hmac = crypto.createHmac('sha256', secretKey);
  hmac.update(signatureInput);
  const signature = base64urlEncode(hmac.digest());

  return `${signatureInput}.${signature}`;
}

export function verifyToken(token: string, secretKey: string): JWTPayload | null {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }

  const [encodedHeader, encodedPayload, signature] = parts;
  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  
  const hmac = crypto.createHmac('sha256', secretKey);
  hmac.update(signatureInput);
  const expectedSignature = base64urlEncode(hmac.digest());

  if (signature !== expectedSignature) {
    return null;
  }

  try {
    const payload = JSON.parse(base64urlDecode(encodedPayload)) as JWTPayload;
    const currentUnixTime = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < currentUnixTime) {
      return null;
    }
    return payload;
  } catch (err) {
    return null;
  }
}
