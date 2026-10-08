import { getSql } from '../../db';
import { encrypt, decrypt } from '../security/crypto-vault';

/**
 * Retrieves the encryption key from the environment.
 * Expects a 32-byte key encoded as a 64-character hex string.
 */
function getEncryptionKey(): string {
  const envKey = process.env.PLUGIN_ENCRYPTION_KEY;
  if (envKey) {
    if (envKey.length === 64) {
      return envKey;
    }
    // If it's a 32 character string, we could hash it or buffer it, but hex is expected.
    if (envKey.length === 32) {
      return Buffer.from(envKey, 'utf-8').toString('hex');
    }
  }
  
  // Fallback for demonstration/development if not provided.
  // In production, an environment variable MUST be set.
  return '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
}

/**
 * Inline migration to ensure the plugin_credentials table exists.
 */
async function ensureTableExists() {
  const sql = await getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS plugin_credentials (
      plugin_id VARCHAR(255) PRIMARY KEY,
      client_id VARCHAR(255) NOT NULL,
      encrypted_secret TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
}

/**
 * Registers or updates a plugin credential.
 * The clientSecret is securely AES-encrypted before being stored in the database.
 * 
 * @param pluginId Unique identifier for the plugin (e.g., 'shopify', 'stripe')
 * @param clientId The client ID for the connector
 * @param clientSecret The plaintext client secret, which will be encrypted
 */
export async function registerPluginCredential(pluginId: string, clientId: string, clientSecret: string) {
  await ensureTableExists();
  
  const key = getEncryptionKey();
  const encryptedSecret = encrypt(clientSecret, key);
  
  const sql = await getSql();
  await sql`
    INSERT INTO plugin_credentials (plugin_id, client_id, encrypted_secret)
    VALUES (${pluginId}, ${clientId}, ${encryptedSecret})
    ON CONFLICT (plugin_id) 
    DO UPDATE SET 
      client_id = EXCLUDED.client_id,
      encrypted_secret = EXCLUDED.encrypted_secret,
      updated_at = CURRENT_TIMESTAMP;
  `;
}

/**
 * Retrieves and decrypts a plugin credential from the registry.
 * 
 * @param pluginId Unique identifier for the plugin
 * @returns The client ID and plaintext client secret, or null if not found
 */
export async function getPluginCredential(pluginId: string): Promise<{ clientId: string; clientSecret: string } | null> {
  await ensureTableExists();
  
  const sql = await getSql();
  const rows = await sql`SELECT client_id, encrypted_secret FROM plugin_credentials WHERE plugin_id = ${pluginId}`;
  
  if (rows.length === 0) {
    return null;
  }
  
  const key = getEncryptionKey();
  const row = rows[0];
  const clientSecret = decrypt(row.encrypted_secret as string, key);
  
  return {
    clientId: row.client_id as string,
    clientSecret
  };
}
