import { getSql } from '@/lib/db';

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  description: string | null;
  updated_at: Date;
}

export async function isFeatureEnabled(key: string): Promise<boolean> {
  const sql = await getSql();
  const rows = await sql`
    SELECT enabled FROM feature_flags WHERE key = ${key} LIMIT 1
  `;
  if (rows && rows.length > 0) {
    return !!rows[0].enabled;
  }
  return false;
}

export async function setFeatureFlag(key: string, enabled: boolean): Promise<void> {
  const sql = await getSql();
  await sql`
    INSERT INTO feature_flags (key, enabled, updated_at)
    VALUES (${key}, ${enabled}, now())
    ON CONFLICT (key) DO UPDATE SET
      enabled = EXCLUDED.enabled,
      updated_at = now()
  `;
}

export async function listAllFlags(): Promise<FeatureFlag[]> {
  const sql = await getSql();
  const rows = await sql`
    SELECT key, enabled, description, updated_at
    FROM feature_flags
    ORDER BY key ASC
  `;
  return rows as unknown as FeatureFlag[];
}
