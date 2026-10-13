import { describe, it, expect } from "vitest";
import {
  getAllTechnologies,
  getTechById,
  getTechnologiesByCategory,
  getFounderCommandActions,
  getFounderActionById,
  executeFounderAction,
  getTechRegistrySummary,
  verifyTechRegistryIntegrity,
  CLOUD_INFRASTRUCTURE,
  PAYMENTS_BANKING,
  COMMUNICATION,
  MAPS_LOGISTICS,
  AI_FOUNDATION_MODELS,
  FOUNDER_COMMAND_ACTIONS,
  type TechCategory
} from "./catalog.ts";

describe("UMAR OS World Technology Registry & AI Command Hub", () => {
  describe("Catalog Integrity & Mandatory Coverage", () => {
    it("should pass comprehensive integrity verification with zero missing requirements", () => {
      const report = verifyTechRegistryIntegrity();
      expect(report.isValid).toBe(true);
      expect(report.missingRequirements).toHaveLength(0);
      expect(report.issues).toHaveLength(0);
      expect(report.checkedCount).toBe(20);
      expect(report.founderActionCount).toBe(4);
    });

    it("should define exactly 20 foundational technologies and 4 founder actions", () => {
      const allTech = getAllTechnologies();
      expect(allTech).toHaveLength(20);

      const allActions = getFounderCommandActions();
      expect(allActions).toHaveLength(4);
    });

    it("should generate a valid executive tech summary", () => {
      const summary = getTechRegistrySummary();
      expect(summary.totalTechnologies).toBe(20);
      expect(summary.totalCategories).toBe(6);
      expect(summary.totalFounderActions).toBe(4);
      expect(summary.healthyCount).toBe(20);
      expect(summary.productionReadyCount).toBe(20);
      expect(summary.averageLatencyMs).toBeGreaterThan(0);
      expect(summary.averageLatencyMs).toBeLessThan(500);

      expect(summary.categoryCounts.cloud_infrastructure).toBe(3);
      expect(summary.categoryCounts.payments_banking).toBe(5);
      expect(summary.categoryCounts.communication).toBe(3);
      expect(summary.categoryCounts.maps_logistics).toBe(4);
      expect(summary.categoryCounts.ai_foundation_models).toBe(5);
      expect(summary.categoryCounts.founder_command_actions).toBe(4);
    });
  });

  describe("1. Cloud Infrastructure Integration", () => {
    it("should contain Cloudflare Workers & Pages, Supabase PostgreSQL, and Upstash Redis", () => {
      const cloudTech = getTechnologiesByCategory("cloud_infrastructure");
      expect(cloudTech).toHaveLength(3);

      const cf = getTechById("cloudflare_workers_pages");
      expect(cf).toBeDefined();
      expect(cf?.name).toContain("Cloudflare Workers & Pages");
      expect(cf?.features.length).toBeGreaterThanOrEqual(4);
      expect(cf?.isProductionReady).toBe(true);

      const supabase = getTechById("supabase_postgresql");
      expect(supabase).toBeDefined();
      expect(supabase?.name).toContain("Supabase PostgreSQL");
      expect(supabase?.features.some((f) => f.includes("ACID"))).toBe(true);

      const upstash = getTechById("upstash_redis");
      expect(upstash).toBeDefined();
      expect(upstash?.name).toContain("Upstash Redis");
      expect(upstash?.features.some((f) => f.includes("rate limiting"))).toBe(true);
    });
  });

  describe("2. Payments & Banking Integration", () => {
    it("should contain Razorpay Gateway, RazorpayX Payouts, Decentro BaaS, Setu UPI QR, and UPI Soundbox Engine", () => {
      const payments = getTechnologiesByCategory("payments_banking");
      expect(payments).toHaveLength(5);

      const expectedPaymentsIds = [
        "razorpay_gateway",
        "razorpayx_payouts",
        "decentro_baas",
        "setu_upi_qr",
        "upi_soundbox_engine"
      ];

      for (const id of expectedPaymentsIds) {
        const item = getTechById(id);
        expect(item).toBeDefined();
        expect(item?.category).toBe("payments_banking");
        expect(item?.isProductionReady).toBe(true);
        expect(item?.endpoints.length).toBeGreaterThan(0);
      }

      // Check UPI Soundbox regional audio features
      const soundbox = getTechById("upi_soundbox_engine");
      expect(soundbox?.features.some((f) => f.toLowerCase().includes("assamese"))).toBe(true);

      // Check Setu UPI 0% MDR rails
      const setu = getTechById("setu_upi_qr");
      expect(setu?.features.some((f) => f.toLowerCase().includes("bharatqr"))).toBe(true);
    });
  });

  describe("3. Communication Integration", () => {
    it("should contain Twilio SMS, Gupshup WhatsApp, and Web Push Notifications", () => {
      const comms = getTechnologiesByCategory("communication");
      expect(comms).toHaveLength(3);

      const twilio = getTechById("twilio_sms");
      expect(twilio).toBeDefined();
      expect(twilio?.features.some((f) => f.toLowerCase().includes("dlt"))).toBe(true);

      const gupshup = getTechById("gupshup_whatsapp");
      expect(gupshup).toBeDefined();
      expect(gupshup?.features.some((f) => f.toLowerCase().includes("whatsapp"))).toBe(true);

      const webPush = getTechById("web_push_notifications");
      expect(webPush).toBeDefined();
      expect(webPush?.features.some((f) => f.toLowerCase().includes("vapid") || f.toLowerCase().includes("zero-cost"))).toBe(true);
    });
  });

  describe("4. Maps & Logistics Integration", () => {
    it("should contain Google Maps Platform, OpenStreetMap, OSRM Routing, and Algorithmic Surge Dispatch", () => {
      const maps = getTechnologiesByCategory("maps_logistics");
      expect(maps).toHaveLength(4);

      const gmaps = getTechById("google_maps_platform");
      expect(gmaps).toBeDefined();
      expect(gmaps?.features.some((f) => f.includes("Places Autocomplete"))).toBe(true);

      const osm = getTechById("openstreetmap");
      expect(osm).toBeDefined();
      expect(osm?.features.some((f) => f.includes("tiles"))).toBe(true);

      const osrm = getTechById("osrm_routing");
      expect(osrm).toBeDefined();
      expect(osrm?.latencyMs).toBeLessThanOrEqual(50);

      const dispatch = getTechById("algorithmic_surge_dispatch");
      expect(dispatch).toBeDefined();
      expect(dispatch?.features.some((f) => f.includes("Haversine"))).toBe(true);
    });
  });

  describe("5. AI & Foundation Models Integration", () => {
    it("should contain Google Gemini 1.5/2.0, DeepSeek V3/R1, OpenAI, Anthropic Claude, and Local Whisper Voice DSP", () => {
      const aiTech = getTechnologiesByCategory("ai_foundation_models");
      expect(aiTech).toHaveLength(5);

      const gemini = getTechById("google_gemini");
      expect(gemini).toBeDefined();
      expect(gemini?.features.some((f) => f.toLowerCase().includes("multimodal"))).toBe(true);

      const deepseek = getTechById("deepseek_r1_v3");
      expect(deepseek).toBeDefined();
      expect(deepseek?.features.some((f) => f.includes("chain-of-thought") || f.includes("mathematical"))).toBe(true);

      const openai = getTechById("openai_gpt4o");
      expect(openai).toBeDefined();
      expect(openai?.features.some((f) => f.includes("Consensus") || f.includes("function calling"))).toBe(true);

      const claude = getTechById("anthropic_claude");
      expect(claude).toBeDefined();
      expect(claude?.features.some((f) => f.includes("Constitutional"))).toBe(true);

      const whisper = getTechById("local_whisper_dsp");
      expect(whisper).toBeDefined();
      expect(whisper?.features.some((f) => f.includes("offline") || f.includes("WASM"))).toBe(true);
    });
  });

  describe("6. Founder Command Actions Execution", () => {
    it("should register all 4 critical Founder Command Actions with appropriate risk profiles", () => {
      const actions = getFounderCommandActions();
      expect(actions).toHaveLength(4);

      const freeze = getFounderActionById("founder_action_emergency_freeze");
      expect(freeze).toBeDefined();
      expect(freeze?.riskLevel).toBe("P0_CRITICAL");
      expect(freeze?.requiresConfirmation).toBe(true);
      expect(freeze?.actionType).toBe("EMERGENCY");

      const rebalance = getFounderActionById("founder_action_double_entry_rebalance");
      expect(rebalance).toBeDefined();
      expect(rebalance?.riskLevel).toBe("HIGH_RISK");
      expect(rebalance?.requiresConfirmation).toBe(true);
      expect(rebalance?.actionType).toBe("FINANCIAL");

      const fleetPing = getFounderActionById("founder_action_realtime_fleet_ping");
      expect(fleetPing).toBeDefined();
      expect(fleetPing?.riskLevel).toBe("CONTROLLED");
      expect(fleetPing?.actionType).toBe("OPERATIONAL");

      const gstFssaiAudit = getFounderActionById("founder_action_statutory_gst_fssai_audit");
      expect(gstFssaiAudit).toBeDefined();
      expect(gstFssaiAudit?.riskLevel).toBe("CONTROLLED");
      expect(gstFssaiAudit?.actionType).toBe("COMPLIANCE");
    });

    it("should execute Emergency Freeze and produce signed audit receipt", async () => {
      const result = await executeFounderAction("founder_action_emergency_freeze", {
        operatorId: "FOUNDER_UMAR",
        reason: "Vitest Integrity Test Audit"
      });

      expect(result.success).toBe(true);
      expect(result.actionId).toBe("founder_action_emergency_freeze");
      expect(result.summary).toContain("Platform Emergency Freeze ENGAGED");
      expect(result.signature).toContain("SIG_ED25519");
      expect(result.details.newState).toBe("EMERGENCY_FROZEN");
    });

    it("should execute Double-Entry Rebalance and verify zero ledger delta", async () => {
      const result = await executeFounderAction("founder_action_double_entry_rebalance");

      expect(result.success).toBe(true);
      expect(result.actionId).toBe("founder_action_double_entry_rebalance");
      expect(result.details.discrepanciesDetected).toBe(0);
      expect(result.details.debitCreditDeltaPaise).toBe(0);
      expect(result.details.status).toBe("BALANCED");
    });

    it("should execute Real-time Fleet Ping and report active delivery couriers", async () => {
      const result = await executeFounderAction("founder_action_realtime_fleet_ping");

      expect(result.success).toBe(true);
      expect(result.actionId).toBe("founder_action_realtime_fleet_ping");
      expect(result.details.totalCouriersPolled).toBe(24);
      expect(result.details.fleetReadinessRate).toBe("100%");
    });

    it("should execute Statutory GST/FSSAI Audit and verify 100% merchant compliance", async () => {
      const result = await executeFounderAction("founder_action_statutory_gst_fssai_audit");

      expect(result.success).toBe(true);
      expect(result.actionId).toBe("founder_action_statutory_gst_fssai_audit");
      expect(result.details.statutoryVerdict).toBe("FULLY_COMPLIANT_ZERO_LIABILITY");
      const fssai = result.details.fssaiAudit as { complianceRate: string };
      expect(fssai.complianceRate).toBe("100%");
    });

    it("should throw error when requesting execution of non-existent action", async () => {
      await expect(executeFounderAction("non_existent_action")).rejects.toThrow(
        /is not registered/
      );
    });
  });
});
