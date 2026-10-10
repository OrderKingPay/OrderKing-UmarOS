import { createServerFn } from "@tanstack/react-start";
import type {
  UmarOsTelemetryData,
  UmarOsEngineSettings,
  FounderCommandResponse,
  AutonomousRefundResult
} from "./umaros-supreme.server";
import type { RefundClaimPayload } from "../security/military-anti-fraud-shield.ts";

export type { UmarOsTelemetryData, UmarOsEngineSettings, FounderCommandResponse, AutonomousRefundResult };

export const getUmarOsTelemetry = createServerFn({ method: "GET" }).handler(
  async (): Promise<UmarOsTelemetryData> => {
    const { fetchUmarOsTelemetry } = await import("./umaros-supreme.server");
    return fetchUmarOsTelemetry();
  }
);

export const updateUmarOsSettings = createServerFn({ method: "POST" })
  .validator((newSettings: Partial<UmarOsEngineSettings>) => newSettings)
  .handler(async ({ data }): Promise<{ ok: boolean; settings: UmarOsEngineSettings }> => {
    const { applyUmarOsSettings } = await import("./umaros-supreme.server");
    return applyUmarOsSettings(data);
  });

export const triggerAutoDispatchNow = createServerFn({ method: "POST" }).handler(
  async () => {
    const { executeAutoDispatchCore } = await import("./umaros-supreme.server");
    return executeAutoDispatchCore();
  }
);

export const triggerAutonomousAuditNow = createServerFn({ method: "POST" }).handler(
  async () => {
    const { executeAutonomousAuditCore } = await import("./umaros-supreme.server");
    return executeAutonomousAuditCore();
  }
);

export const executeFounderConsoleCommand = createServerFn({ method: "POST" })
  .validator((payload: { command: string; model?: string }) => payload)
  .handler(async ({ data }): Promise<FounderCommandResponse> => {
    const { runFounderConsoleCommandCore } = await import("./umaros-supreme.server");
    return runFounderConsoleCommandCore(data);
  });

export const executeAutonomousRefund = createServerFn({ method: "POST" })
  .validator((params: { claim: RefundClaimPayload; signature: string; clientIp?: string; merchantIp?: string }) => params)
  .handler(async ({ data }): Promise<AutonomousRefundResult> => {
    const { executeAutonomousRefundCore } = await import("./umaros-supreme.server");
    return executeAutonomousRefundCore(data);
  });

