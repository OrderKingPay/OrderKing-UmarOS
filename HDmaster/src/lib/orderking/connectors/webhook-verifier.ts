import * as crypto from 'crypto';

function secureCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

export function verifyStripeSignature(payload: string | Buffer, sigHeader: string, secret: string): boolean {
  try {
    const parts = sigHeader.split(',').reduce((acc, part) => {
      const [key, value] = part.split('=');
      if (key && value) acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    const timestamp = parts['t'];
    const v1 = parts['v1'];

    if (!timestamp || !v1) return false;

    const signedPayload = `${timestamp}.${payload}`;
    const expectedSig = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');

    return secureCompare(expectedSig, v1);
  } catch (error) {
    return false;
  }
}

export function verifyRazorpaySignature(payload: string | Buffer, sig: string, secret: string): boolean {
  try {
    const expectedSig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    return secureCompare(expectedSig, sig);
  } catch (error) {
    return false;
  }
}
