
import { getSql } from "@/lib/db";
import { mergeConfig } from "@/lib/config/defaults";
import type { PublicAppConfig } from "@/lib/config/types";

export async function loadConfig(): Promise<PublicAppConfig> {
  try {
    const sql = await getSql();
    const rows = await sql<{ settings_json: string }>`select settings_json from platform_settings limit 1`;
    if (rows.length > 0 && rows[0].settings_json) {
      const bag = JSON.parse(rows[0].settings_json);
      return mergeConfig(bag as Partial<PublicAppConfig>);
    }
  } catch (err) {
    console.error("loadConfig failed, using default config", err);
  }
  return mergeConfig(null);
}
