
import { getSql } from "@/lib/db";
import { mergeConfig } from "@/lib/config/defaults";
import type { PublicAppConfig } from "@/lib/config/types";

const CONFIG_QUERY_TIMEOUT_MS = 2500;

export async function loadConfig(): Promise<PublicAppConfig> {
  try {
    const sql = await getSql();
    const rows = await Promise.race([
      sql<{ settings_json: string }>`select settings_json from platform_settings limit 1`,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("CONFIG_QUERY_TIMEOUT")), CONFIG_QUERY_TIMEOUT_MS),
      ),
    ]);
    if (rows.length > 0 && rows[0].settings_json) {
      const bag = JSON.parse(rows[0].settings_json);
      return mergeConfig(bag as Partial<PublicAppConfig>);
    }
  } catch (err) {
    console.error("loadConfig failed, using default config", err);
  }
  return mergeConfig(null);
}
