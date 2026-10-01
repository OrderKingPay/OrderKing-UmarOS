// Server-only boundary for customer growth telemetry; keeps database access out of the browser bundle.
import { createServerFn } from "@tanstack/react-start";

export const getGrowthStatsRpc = createServerFn({ method: "GET" })
  .handler(async () => {
    const { getSessionUser } = await import("@/lib/auth/verify.server");
    const { getGrowthStats } = await import("@/lib/server/growth-target-engine");
    const user = await getSessionUser();
    if (!user) throw new Error("Unauthorized");
    return await getGrowthStats(user.id);
  });
