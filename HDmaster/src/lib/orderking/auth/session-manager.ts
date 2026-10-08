import * as crypto from 'crypto';
import { getSql } from '../../db';

const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function createSession(userId: string): Promise<string> {
  const sql = await getSql();
  const sessionToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = hashToken(sessionToken);
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_MS);
  
  await sql`
    INSERT INTO sessions (user_id, session_token_hash, expires_at)
    VALUES (${userId}, ${hashedToken}, ${expiresAt})
  `;
  
  return sessionToken;
}

export async function validateSession(token: string): Promise<string | null> {
  const sql = await getSql();
  const hashedTokenInput = hashToken(token);
  
  const sessions = await sql`
    SELECT user_id, session_token_hash, expires_at
    FROM sessions
    WHERE session_token_hash = ${hashedTokenInput} AND expires_at > NOW()
    LIMIT 1
  `;
  
  if (!sessions || sessions.length === 0) {
    return null;
  }
  
  const session = sessions[0] as any;
  const sessionHashBuffer = Buffer.from(session.session_token_hash as string, 'utf8');
  const inputBuffer = Buffer.from(hashedTokenInput, 'utf8');
  
  if (inputBuffer.length !== sessionHashBuffer.length || !crypto.timingSafeEqual(inputBuffer, sessionHashBuffer)) {
    return null;
  }
  
  return session.user_id as string;
}
