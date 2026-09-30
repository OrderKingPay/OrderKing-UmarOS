import { createServerFn } from "@tanstack/react-start";

export const getLiveBusinessSnapshotRpc = createServerFn({ method: "GET" })
  .handler(async () => {
    const { getLiveBusinessSnapshot } = await import("./server/business-os-live.server");
    return await getLiveBusinessSnapshot();
  });
