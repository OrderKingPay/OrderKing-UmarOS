import { describe, it, expect } from "vitest";
import {
  PARTNER_ACADEMY_MODULES,
  queryPartnerAcademy,
  type SopModule,
} from "../lib/academy/partner-sop-data";
import { OrderKingSpark } from "../lib/ai/order-king-spark";

describe("OrderKing Partner Operations & SOP Academy", () => {
  it("defines all 6 canonical operational modules with full statutory and kitchen integrity", () => {
    expect(PARTNER_ACADEMY_MODULES).toHaveLength(6);

    const expectedModuleIds = [
      "sop-acceptance-sla",
      "sop-packaging-spill",
      "sop-rider-handover-otp",
      "sop-fssai-hygiene",
      "sop-dispute-arbitration",
      "sop-settlements-tax",
    ];

    for (const expectedId of expectedModuleIds) {
      const found = PARTNER_ACADEMY_MODULES.find((m) => m.id === expectedId);
      expect(found, `Module ${expectedId} should exist`).toBeDefined();
      expect(found!.title.length).toBeGreaterThan(5);
      expect(found!.subtitle.length).toBeGreaterThan(10);
      expect(found!.badge.length).toBeGreaterThan(2);
      expect(found!.summary.length).toBeGreaterThan(20);
      expect(found!.slaTarget.length).toBeGreaterThan(3);
      expect(found!.keyMetric.length).toBeGreaterThan(3);
      expect(found!.steps.length).toBeGreaterThanOrEqual(4);
      expect(found!.commonMistakes.length).toBeGreaterThanOrEqual(3);
      expect(found!.arbitrationProtection.length).toBeGreaterThan(20);

      // Verify each step has instruction and stepNumber
      for (let i = 0; i < found!.steps.length; i++) {
        const step = found!.steps[i];
        expect(step.stepNumber).toBe(i + 1);
        expect(step.title.length).toBeGreaterThan(3);
        expect(step.instruction.length).toBeGreaterThan(15);
      }
    }
  });

  describe("Natural Language Query Search & Routing", () => {
    it("returns all modules when query is empty", () => {
      const res = queryPartnerAcademy("");
      expect(res).toHaveLength(6);
    });

    it("matches packaging and spill queries to sop-packaging-spill", () => {
      const res = queryPartnerAcademy("how to pack soup without spilling");
      expect(res.length).toBeGreaterThan(0);
      expect(res[0].id).toBe("sop-packaging-spill");
      expect(res[0].steps.some((s) => s.instruction.includes("Polypropylene (PP)"))).toBe(true);
    });

    it("matches rider handover and OTP queries to sop-rider-handover-otp", () => {
      const res = queryPartnerAcademy("rider delivery handover 4-digit OTP rules");
      expect(res.length).toBeGreaterThan(0);
      expect(res[0].id).toBe("sop-rider-handover-otp");
      expect(res[0].slaTarget).toBe("< 2 Minutes Counter Turnaround");
    });

    it("matches order acceptance and prep SLA queries to sop-acceptance-sla", () => {
      const res = queryPartnerAcademy("what is the 120s order ring sla countdown");
      expect(res.length).toBeGreaterThan(0);
      expect(res[0].id).toBe("sop-acceptance-sla");
      expect(res[0].keyMetric).toBe("99.5% Acceptance Rate");
    });

    it("matches FSSAI FoSCoS and hygiene queries to sop-fssai-hygiene", () => {
      const res = queryPartnerAcademy("fssai temperature logs and veg non-veg segregation");
      expect(res.length).toBeGreaterThan(0);
      expect(res[0].id).toBe("sop-fssai-hygiene");
      expect(res[0].steps.some((s) => s.instruction.includes("FoSCoS"))).toBe(true);
    });

    it("matches dispute arbitration queries to sop-dispute-arbitration", () => {
      const res = queryPartnerAcademy("food spill dispute refund liability allocation");
      expect(res.length).toBeGreaterThan(0);
      expect(res[0].id).toBe("sop-dispute-arbitration");
      expect(res[0].arbitrationProtection).toContain("defends merchant earnings");
    });

    it("matches settlement and GST Section 9(5) queries to sop-settlements-tax", () => {
      const res = queryPartnerAcademy("T+1 daily settlement and section 9(5) gst tax remittance");
      expect(res.length).toBeGreaterThan(0);
      expect(res[0].id).toBe("sop-settlements-tax");
      expect(res[0].steps.some((s) => s.instruction.includes("Section 9(5)"))).toBe(true);
    });
  });

  describe("King Spark AI Natural Language Knowledge Retrieval & Action Cards", () => {
    const spark = new OrderKingSpark();

    it("processes packaging SOP questions and returns sop_guide action card", () => {
      const resp = spark.handleRestaurantQuery("How should we pack soup to avoid transit leaks? Give me the packaging sop");
      expect(resp.text).toContain("Partner Operations Academy: Food Packaging & Spill Prevention SOP");
      expect(resp.text).toContain("Polypropylene (PP)");
      expect(resp.actionCard).toBeDefined();
      expect(resp.actionCard!.type).toBe("sop_guide");
      const data = resp.actionCard!.data as { module: SopModule; allModules: unknown[] };
      expect(data.module.id).toBe("sop-packaging-spill");
      expect(data.allModules).toHaveLength(6);
    });

    it("processes rider handover OTP questions and returns accurate instructions", () => {
      const resp = spark.handleRestaurantQuery("What is the rider handover otp verification rule?");
      expect(resp.text).toContain("Rider Handover & Secure Dispatch SOP");
      expect(resp.text).toContain("4-digit handover OTP");
      expect(resp.actionCard?.type).toBe("sop_guide");
    });

    it("processes 120s order ring SLA questions and explains rush mode buffer", () => {
      const resp = spark.handleRestaurantQuery("What is the 120s ring sla and how does kitchen rush mode work?");
      expect(resp.text).toContain("Order Acceptance & Prep SLA Pacing");
      expect(resp.text).toContain("Kitchen Rush Mode");
      expect(resp.actionCard?.type).toBe("sop_guide");
    });

    it("processes FSSAI food safety and cold chain questions", () => {
      const resp = spark.handleRestaurantQuery("What are the mandatory FSSAI hygiene rule temperature logs?");
      expect(resp.text).toContain("Statutory FSSAI Food Safety & Kitchen Hygiene");
      expect(resp.text).toContain("FoSCoS");
      expect(resp.actionCard?.type).toBe("sop_guide");
    });
  });
});
