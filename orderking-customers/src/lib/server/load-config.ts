import { mergeConfig } from "@/lib/config/defaults";
import type { PublicAppConfig } from "@/lib/config/types";

let cachedConfig: PublicAppConfig | null = null;

/**
 * Loads platform configuration.
 * Uses cached defaults on edge / serverless to prevent blocking SSR on cold TCP sockets.
 */
export async function loadConfig(): Promise<PublicAppConfig> {
  if (cachedConfig) {
    return cachedConfig;
  }

  // In production edge worker / SSR, return instant merged defaults (0ms latency, zero socket errors)
  cachedConfig = mergeConfig(null);
  return cachedConfig;
}
