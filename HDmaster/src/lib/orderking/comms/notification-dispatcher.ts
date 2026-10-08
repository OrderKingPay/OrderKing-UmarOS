import * as crypto from 'crypto';

export type NotificationChannel = 'email' | 'sms' | 'push';

export interface DispatchParams {
  channel: NotificationChannel;
  recipient: string; // email, phone, or push subscription JSON string
  subject?: string;
  body: string;
}

export interface DispatchResult {
  sent: boolean;
  reason?: string;
  data?: any;
}

export async function dispatchNotification(params: DispatchParams): Promise<DispatchResult> {
  try {
    switch (params.channel) {
      case 'email':
        return await sendEmail(params);
      case 'sms':
        return await sendSms(params);
      case 'push':
        return await sendPush(params);
      default:
        return { sent: false, reason: 'INVALID_CHANNEL' };
    }
  } catch (error: any) {
    return { sent: false, reason: error.message || 'UNKNOWN_ERROR' };
  }
}

async function sendEmail(params: DispatchParams): Promise<DispatchResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: false, reason: 'CREDENTIALS_MISSING' };

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || 'noreply@orderking.com',
      to: params.recipient,
      subject: params.subject || 'Notification from OrderKing',
      html: params.body
    })
  });

  if (!res.ok) {
    const errorText = await res.text();
    return { sent: false, reason: `API_ERROR: ${errorText}` };
  }

  const data = await res.json();
  return { sent: true, data };
}

async function sendSms(params: DispatchParams): Promise<DispatchResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return { sent: false, reason: 'CREDENTIALS_MISSING' };
  }

  const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');
  
  const formData = new URLSearchParams();
  formData.append('To', params.recipient);
  formData.append('From', fromNumber);
  formData.append('Body', params.body);

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: formData.toString()
  });

  if (!res.ok) {
    const errorText = await res.text();
    return { sent: false, reason: `API_ERROR: ${errorText}` };
  }

  const data = await res.json();
  return { sent: true, data };
}

function toBase64Url(base64: string): string {
  return base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function signJwtEs256(payload: any, privateKeyPem: string): string {
  const header = { typ: 'JWT', alg: 'ES256' };
  const encodedHeader = toBase64Url(Buffer.from(JSON.stringify(header)).toString('base64'));
  const encodedPayload = toBase64Url(Buffer.from(JSON.stringify(payload)).toString('base64'));
  
  const signInput = `${encodedHeader}.${encodedPayload}`;
  
  const sign = crypto.createSign('SHA256');
  sign.update(signInput);
  sign.end();
  
  const signature = sign.sign(privateKeyPem);
  
  // Convert DER encoded signature to raw R and S components for ES256
  let offset = 2;
  offset++;
  const rLength = signature[offset++];
  let r = signature.slice(offset, offset + rLength);
  offset += rLength;
  offset++;
  const sLength = signature[offset++];
  let s = signature.slice(offset, offset + sLength);
  
  if (r.length > 32) r = r.slice(r.length - 32);
  else if (r.length < 32) r = Buffer.concat([Buffer.alloc(32 - r.length, 0), r]);
  
  if (s.length > 32) s = s.slice(s.length - 32);
  else if (s.length < 32) s = Buffer.concat([Buffer.alloc(32 - s.length, 0), s]);
  
  const rawSignature = Buffer.concat([r, s]);
  const encodedSignature = toBase64Url(rawSignature.toString('base64'));
  
  return `${signInput}.${encodedSignature}`;
}

async function sendPush(params: DispatchParams): Promise<DispatchResult> {
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@orderking.com';

  if (!vapidPrivateKey || !vapidPublicKey) {
    return { sent: false, reason: 'CREDENTIALS_MISSING' };
  }

  let subscription;
  try {
    subscription = JSON.parse(params.recipient);
  } catch {
    return { sent: false, reason: 'INVALID_SUBSCRIPTION_JSON' };
  }
  
  const endpoint = subscription.endpoint;
  if (!endpoint) {
    return { sent: false, reason: 'INVALID_ENDPOINT' };
  }

  const endpointUrl = new URL(endpoint);
  
  const jwtPayload = {
    aud: `${endpointUrl.protocol}//${endpointUrl.host}`,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
    sub: vapidSubject
  };

  const jwt = signJwtEs256(jwtPayload, vapidPrivateKey);

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `WebPush ${jwt}`,
      'Crypto-Key': `p256ecdsa=${vapidPublicKey}`,
      'TTL': '60'
    }
  });

  if (!res.ok) {
    const errorText = await res.text();
    return { sent: false, reason: `API_ERROR: ${errorText}` };
  }

  return { sent: true };
}
