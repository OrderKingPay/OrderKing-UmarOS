import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // AES block size
const TAG_LENGTH = 16; // GCM auth tag length

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * @param text The plaintext to encrypt.
 * @param secretKey A 32-byte (256-bit) buffer or hex string representing the encryption key.
 * @returns A string containing the hex-encoded IV, encrypted data, and authentication tag, separated by colons.
 */
export function encrypt(text: string, secretKey: Buffer | string): string {
  const key = Buffer.isBuffer(secretKey) ? secretKey : Buffer.from(secretKey, 'hex');
  if (key.length !== 32) {
    throw new Error('Invalid key length. Must be 32 bytes for aes-256-gcm.');
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();

  // Return formatted string: iv:encrypted:tag
  return `${iv.toString('hex')}:${encrypted}:${tag.toString('hex')}`;
}

/**
 * Decrypts an AES-256-GCM encrypted string.
 * @param encryptedData A string containing the hex-encoded IV, encrypted data, and authentication tag, separated by colons.
 * @param secretKey A 32-byte (256-bit) buffer or hex string representing the encryption key.
 * @returns The decrypted plaintext string.
 */
export function decrypt(encryptedData: string, secretKey: Buffer | string): string {
  const key = Buffer.isBuffer(secretKey) ? secretKey : Buffer.from(secretKey, 'hex');
  if (key.length !== 32) {
    throw new Error('Invalid key length. Must be 32 bytes for aes-256-gcm.');
  }

  const parts = encryptedData.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format. Expected iv:encrypted:tag');
  }

  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = parts[1];
  const tag = Buffer.from(parts[2], 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
