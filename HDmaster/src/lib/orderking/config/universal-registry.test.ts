import { describe, expect, it } from "vitest";
import {
  ConfigurationRollbackError,
  ConfigurationValidationError,
  DEFAULT_UNIVERSAL_CONFIG,
  UniversalConfigRegistry,
  type AuditActor,
} from "./universal-registry";

describe("UniversalConfigRegistry", () => {
  const adminActor: AuditActor = {
    userId: "usr_admin_001",
    employeeId: "EMP-001",
    roleKey: "FOUNDER_ADMIN",
  };

  const financeActor: AuditActor = {
    userId: "usr_fin_002",
    employeeId: "EMP-042",
    roleKey: "FINANCE_DIRECTOR",
  };

  describe("Initialization & Retrieval", () => {
    it("initializes with default operational settings at version 1", () => {
      const registry = new UniversalConfigRegistry();
      expect(registry.getCurrentVersion()).toBe(1);
      expect(registry.isSystemFrozen()).toBe(false);

      const config = registry.getConfig();
      expect(config.brandThemes.appName).toBe("Order King");
      expect(config.merchantPolicies.defaultCommissionBps).toBe(2200);
      expect(config.deliveryAndRiderIncentives.deliveryFees.customerBaseFeePaise).toBe(2500);
      expect(config.geoAndSchedules.zones.length).toBeGreaterThan(0);
      expect(config.surgeAndThrottle.surgePricing.multiplier).toBe(1.0);
      expect(config.cancellationAndRefund.cancellation.cancellationWindowMinutes).toBe(8);
      expect(config.aiRoutingAndPlugins.modelRouting.masterExecutiveModel).toBe("gemini-2.5-pro");
      expect(config.killSwitchesAndFreeze.killSwitches.disableCustomerCheckout).toBe(false);
    });

    it("retrieves specific sections accurately and immutably", () => {
      const registry = new UniversalConfigRegistry();
      const brand = registry.getSection("brandThemes");
      expect(brand.appName).toBe("Order King");
      expect(brand.typography.fontDisplay).toBe("Newsreader");

      const delivery = registry.getSection("deliveryAndRiderIncentives");
      expect(delivery.riderIncentives.riderBasePaise).toBe(2500);
    });

    it("prevents initialization with invalid schema config", () => {
      expect(() => {
        new UniversalConfigRegistry({
          brandThemes: {
            supportEmail: "not-an-email",
          } as any,
        });
      }).toThrow(ConfigurationValidationError);
    });
  });

  describe("Setting Updates & Schema Validation", () => {
    it("updates brand themes & typography with version increment", () => {
      const registry = new UniversalConfigRegistry();
      const updated = registry.updateSection(
        "brandThemes",
        {
          appName: "Order King Karimganj Royal",
          typography: {
            fontDisplay: "Cinzel Decorative",
            fontBody: "Inter",
            fontMono: "Fira Code",
            baseFontSizePx: 18,
            headingFontWeight: 800,
            bodyFontWeight: 500,
          },
        },
        adminActor,
        "Rebranding typography for luxury Karimganj market",
      );

      expect(registry.getCurrentVersion()).toBe(2);
      expect(updated.brandThemes.appName).toBe("Order King Karimganj Royal");
      expect(updated.brandThemes.typography.fontDisplay).toBe("Cinzel Decorative");
      expect(updated.brandThemes.typography.baseFontSizePx).toBe(18);
    });

    it("manages individual restaurant commission overrides & merchant policies", () => {
      const registry = new UniversalConfigRegistry();

      registry.setRestaurantPolicyOverride(
        {
          restaurantId: "rest_royal_bengal",
          customCommissionBps: 1800, // 18% special merchant rate
          allowSelfDelivery: true,
          instantPayoutEnabled: true,
          packagingFeeMaxPaise: 3000,
        },
        financeActor,
        "Key anchor merchant contract renewal rate",
      );

      expect(registry.getCurrentVersion()).toBe(2);
      const merchantPolicies = registry.getSection("merchantPolicies");
      expect(merchantPolicies.restaurantOverrides["rest_royal_bengal"]).toBeDefined();
      expect(merchantPolicies.restaurantOverrides["rest_royal_bengal"].customCommissionBps).toBe(1800);
      expect(merchantPolicies.restaurantOverrides["rest_royal_bengal"].allowSelfDelivery).toBe(true);

      // Remove override
      registry.removeRestaurantPolicyOverride(
        "rest_royal_bengal",
        financeActor,
        "Anchor contract expired, reverting to standard rate",
      );
      expect(registry.getCurrentVersion()).toBe(3);
      expect(registry.getSection("merchantPolicies").restaurantOverrides["rest_royal_bengal"]).toBeUndefined();
    });

    it("updates dynamic delivery fee and rider incentives", () => {
      const registry = new UniversalConfigRegistry();

      registry.updateSection(
        "deliveryAndRiderIncentives",
        {
          deliveryFees: {
            customerBaseFeePaise: 3000,
            freeDeliveryThresholdPaise: 59900,
          },
          riderIncentives: {
            riderBasePaise: 3500,
            rainBonusPaise: 4000,
          },
        },
        adminActor,
        "Monsoon season delivery & rider incentive surge adjustment",
      );

      expect(registry.getCurrentVersion()).toBe(2);
      const section = registry.getSection("deliveryAndRiderIncentives");
      expect(section.deliveryFees.customerBaseFeePaise).toBe(3000);
      expect(section.deliveryFees.freeDeliveryThresholdPaise).toBe(59900);
      expect(section.riderIncentives.riderBasePaise).toBe(3500);
      expect(section.riderIncentives.rainBonusPaise).toBe(4000);
    });

    it("validates and configures geographic polygons and service schedules", () => {
      const registry = new UniversalConfigRegistry();

      registry.updateSection(
        "geoAndSchedules",
        {
          zones: [
            {
              zoneId: "zone_nilambazar",
              zoneName: "Nilambazar South Outpost",
              cityId: "city_karimganj",
              coordinates: [
                { lat: 24.81, lng: 92.32 },
                { lat: 24.83, lng: 92.35 },
                { lat: 24.8, lng: 92.36 },
              ],
              serviceType: "SUBURBAN",
              maxDeliveryRadiusKm: 14.0,
              active: true,
              movPaise: 29900,
            },
          ],
        },
        adminActor,
        "Expansion polygon into Nilambazar",
      );

      expect(registry.getCurrentVersion()).toBe(2);
      const geo = registry.getSection("geoAndSchedules");
      expect(geo.zones.length).toBe(1);
      expect(geo.zones[0].zoneId).toBe("zone_nilambazar");
    });

    it("rejects geographic polygon with less than 3 coordinates", () => {
      const registry = new UniversalConfigRegistry();

      expect(() => {
        registry.updateSection(
          "geoAndSchedules",
          {
            zones: [
              {
                zoneId: "invalid_zone",
                zoneName: "Degenerate Line",
                cityId: "city_karimganj",
                coordinates: [
                  { lat: 24.81, lng: 92.32 },
                  { lat: 24.83, lng: 92.35 },
                ],
                serviceType: "STANDARD",
                maxDeliveryRadiusKm: 5.0,
                active: true,
                movPaise: 1000,
              },
            ],
          },
          adminActor,
          "Attempt to add degenerate polygon",
        );
      }).toThrow(ConfigurationValidationError);
    });

    it("updates surge pricing and throttle limits via setSetting", () => {
      const registry = new UniversalConfigRegistry();

      registry.setSetting(
        "surgeAndThrottle",
        "surgePricing.multiplier",
        2.5,
        adminActor,
        "Heavy monsoon evening rush surge trigger",
      );

      expect(registry.getCurrentVersion()).toBe(2);
      expect(registry.getSection("surgeAndThrottle").surgePricing.multiplier).toBe(2.5);

      // Rejects surge multiplier above maximum schema limit (5.0)
      expect(() => {
        registry.setSetting(
          "surgeAndThrottle",
          "surgePricing.multiplier",
          9.9,
          adminActor,
          "Illegal surge multiplier",
        );
      }).toThrow(ConfigurationValidationError);
    });

    it("updates cancellation and refund parameters", () => {
      const registry = new UniversalConfigRegistry();

      registry.updateSection(
        "cancellationAndRefund",
        {
          cancellation: {
            cancellationWindowMinutes: 5,
            customerCancelPenaltyPaise: 1000,
          },
          refund: {
            autoRefundApprovalLimitPaise: 25000, // ₹250
            slaResolutionMinutes: 15,
          },
        },
        financeActor,
        "Tightening cancellation window to reduce merchant food waste",
      );

      expect(registry.getCurrentVersion()).toBe(2);
      const cr = registry.getSection("cancellationAndRefund");
      expect(cr.cancellation.cancellationWindowMinutes).toBe(5);
      expect(cr.cancellation.customerCancelPenaltyPaise).toBe(1000);
      expect(cr.refund.autoRefundApprovalLimitPaise).toBe(25000);
      expect(cr.refund.slaResolutionMinutes).toBe(15);
    });

    it("updates AI model routing and activates plugin connectors", () => {
      const registry = new UniversalConfigRegistry();

      registry.updateSection(
        "aiRoutingAndPlugins",
        {
          modelRouting: {
            masterExecutiveModel: "claude-3-7-sonnet",
            fastDispatchModel: "gemini-2.5-flash",
          },
          pluginConnectors: [
            ...registry.getSection("aiRoutingAndPlugins").pluginConnectors,
            {
              id: "conn_whatsapp",
              name: "WhatsApp Gupshup Gateway",
              type: "WHATSAPP_BOT",
              enabled: true,
              endpoint: "https://api.gupshup.io/sm/api/v1/msg",
              config: { channel: "whatsapp" },
              timeoutMs: 4000,
            },
          ],
        },
        adminActor,
        "Swapping master model and attaching WhatsApp messaging plugin",
      );

      expect(registry.getCurrentVersion()).toBe(2);
      const ai = registry.getSection("aiRoutingAndPlugins");
      expect(ai.modelRouting.masterExecutiveModel).toBe("claude-3-7-sonnet");
      expect(ai.pluginConnectors.some((c) => c.id === "conn_whatsapp")).toBe(true);
    });

    it("controls emergency system freeze and kill-switches", () => {
      const registry = new UniversalConfigRegistry();

      // Trigger Freeze
      registry.triggerSystemFreeze(adminActor, "Suspected DDOS and anomalous order spike detected");
      expect(registry.getCurrentVersion()).toBe(2);
      expect(registry.isSystemFrozen()).toBe(true);
      const freezeState = registry.getSection("killSwitchesAndFreeze").systemFreeze;
      expect(freezeState.frozen).toBe(true);
      expect(freezeState.frozenBy).toBe(adminActor.userId);

      // Toggle individual kill-switch
      registry.toggleKillSwitch("disableCustomerCheckout", true, adminActor, "Cut checkout flow");
      expect(registry.getCurrentVersion()).toBe(3);
      expect(
        registry.getSection("killSwitchesAndFreeze").killSwitches.disableCustomerCheckout,
      ).toBe(true);

      // Lift Freeze
      registry.liftSystemFreeze(adminActor, "Threat neutralized, resuming operations");
      expect(registry.getCurrentVersion()).toBe(4);
      expect(registry.isSystemFrozen()).toBe(false);
    });
  });

  describe("Versioning & Audit Log Tracking", () => {
    it("maintains an immutable audit log across all state changes", () => {
      const registry = new UniversalConfigRegistry();

      registry.updateSection(
        "brandThemes",
        { tagline: "Fresh local flavors delivered instantly." },
        adminActor,
        "Marketing tagline refresh",
      );

      registry.setSetting(
        "deliveryAndRiderIncentives",
        "riderIncentives.nightBonusPaise",
        2500,
        financeActor,
        "Increase night rider incentive",
      );

      expect(registry.getCurrentVersion()).toBe(3);

      const logs = registry.getAuditLog();
      expect(logs.length).toBe(3); // 1 bootstrap + 2 changes

      // Verify log entry structure
      const taglineLog = logs[1];
      expect(taglineLog.version).toBe(2);
      expect(taglineLog.section).toBe("brandThemes");
      expect(taglineLog.actor.userId).toBe(adminActor.userId);
      expect(taglineLog.reason).toBe("Marketing tagline refresh");
      expect(taglineLog.timestamp).toBeDefined();

      const riderLog = logs[2];
      expect(riderLog.version).toBe(3);
      expect(riderLog.section).toBe("deliveryAndRiderIncentives");
      expect(riderLog.actor.userId).toBe(financeActor.userId);

      // Filtering audit logs
      const financeLogs = registry.getAuditLog({ actorUserId: financeActor.userId });
      expect(financeLogs.length).toBe(1);
      expect(financeLogs[0].version).toBe(3);

      const brandLogs = registry.getAuditLog({ section: "brandThemes" });
      expect(brandLogs.length).toBe(1);
    });

    it("records complete version snapshots with SHA-256 hashes", () => {
      const registry = new UniversalConfigRegistry();

      registry.setSetting(
        "surgeAndThrottle",
        "surgePricing.multiplier",
        1.5,
        adminActor,
        "Minor surge",
      );

      const history = registry.getVersionHistory();
      expect(history.length).toBe(2);
      expect(history[0].version).toBe(1);
      expect(history[0].snapshotHash).toMatch(/^[a-f0-9]{64}$/);
      expect(history[1].version).toBe(2);
      expect(history[1].snapshotHash).toMatch(/^[a-f0-9]{64}$/);
      expect(history[0].snapshotHash).not.toBe(history[1].snapshotHash);
    });
  });

  describe("Rollback Capability", () => {
    it("restores exact previous configuration state and increments version", () => {
      const registry = new UniversalConfigRegistry();

      // v1 baseline: commission is 2200
      expect(registry.getSection("merchantPolicies").defaultCommissionBps).toBe(2200);

      // v2: change commission to 2500
      registry.updateSection(
        "merchantPolicies",
        { defaultCommissionBps: 2500 },
        financeActor,
        "Rate increase trial",
      );
      expect(registry.getCurrentVersion()).toBe(2);
      expect(registry.getSection("merchantPolicies").defaultCommissionBps).toBe(2500);

      // v3: change app name
      registry.updateSection(
        "brandThemes",
        { appName: "New Brand Test" },
        adminActor,
        "Brand test",
      );
      expect(registry.getCurrentVersion()).toBe(3);
      expect(registry.getSection("brandThemes").appName).toBe("New Brand Test");

      // Rollback to v1 (clean baseline)
      const rolledBack = registry.rollbackToVersion(
        1,
        adminActor,
        "Reverting test changes back to initial launch state",
      );

      expect(registry.getCurrentVersion()).toBe(4);
      expect(rolledBack.merchantPolicies.defaultCommissionBps).toBe(2200);
      expect(rolledBack.brandThemes.appName).toBe("Order King");

      // Verify audit trail recorded the rollback
      const auditLog = registry.getAuditLog();
      const rollbackEntry = auditLog[auditLog.length - 1];
      expect(rollbackEntry.section).toBe("ROLLBACK");
      expect(rollbackEntry.version).toBe(4);
      expect(rollbackEntry.reason).toContain("Rollback from v3 to v1");
    });

    it("rejects rollback to non-existent version or current version", () => {
      const registry = new UniversalConfigRegistry();

      expect(() => {
        registry.rollbackToVersion(999, adminActor, "Invalid target");
      }).toThrow(ConfigurationRollbackError);

      expect(() => {
        registry.rollbackToVersion(1, adminActor, "Already at v1");
      }).toThrow(ConfigurationRollbackError);
    });
  });

  describe("Cross-App Propagation Payloads & Integrity", () => {
    it("exports sanitized customer payload with correct schema & integrity hash", () => {
      const registry = new UniversalConfigRegistry();
      const payload = registry.exportPropagationPayload("customer");

      expect(payload.target).toBe("customer");
      expect(payload.configVersion).toBe(1);
      expect(payload.systemFreeze).toBe(false);
      expect(payload.payloadHash).toMatch(/^[a-f0-9]{64}$/);

      // Check customer payload content
      const data = payload.data as any;
      expect(data.appName).toBe("Order King");
      expect(data.branding.colors.primary).toBeDefined();
      expect(data.deliveryPricing.customerBaseFeePaise).toBe(2500);
      expect(data.cancellation.cancellationWindowMinutes).toBe(8);
      expect(data.killSwitches.checkoutDisabled).toBe(false);

      // Cryptographic integrity verification
      expect(UniversalConfigRegistry.validatePayloadIntegrity(payload)).toBe(true);

      // Tampering detection
      const tampered = { ...payload, data: { ...data, appName: "Hacked App Name" } };
      expect(UniversalConfigRegistry.validatePayloadIntegrity(tampered)).toBe(false);
    });

    it("exports partner payload honoring merchant overrides", () => {
      const registry = new UniversalConfigRegistry();

      registry.setRestaurantPolicyOverride(
        {
          restaurantId: "rest_cafe_delight",
          customCommissionBps: 1500, // 15% override
          maxInflightOrders: 40,
        },
        financeActor,
        "Special commission override",
      );

      // Target payload for rest_cafe_delight
      const partnerPayload = registry.exportPropagationPayload("partner", {
        restaurantId: "rest_cafe_delight",
      });

      expect(partnerPayload.target).toBe("partner");
      const partnerData = partnerPayload.data as any;
      expect(partnerData.merchantPolicy.commissionBps).toBe(1500);
      expect(partnerData.merchantPolicy.maxInflightOrders).toBe(40);
      expect(partnerData.killSwitches.orderAcceptanceDisabled).toBe(false);
      expect(UniversalConfigRegistry.validatePayloadIntegrity(partnerPayload)).toBe(true);

      // Target payload for another standard merchant (falls back to 2200 bps)
      const genericPayload = registry.exportPropagationPayload("partner", {
        restaurantId: "rest_standard",
      });
      const genericData = genericPayload.data as any;
      expect(genericData.merchantPolicy.commissionBps).toBe(2200);
      expect(UniversalConfigRegistry.validatePayloadIntegrity(genericPayload)).toBe(true);
    });

    it("exports rider payload with dynamic incentives and geofenced zones", () => {
      const registry = new UniversalConfigRegistry();
      const riderPayload = registry.exportPropagationPayload("rider");

      expect(riderPayload.target).toBe("rider");
      const riderData = riderPayload.data as any;
      expect(riderData.incentives.riderBasePaise).toBe(2500);
      expect(riderData.incentives.riderDistancePaisePerKm).toBe(800);
      expect(riderData.incentives.riderLongDistanceBonusPaise).toBe(6000);
      expect(riderData.schedules.nightModeStartHour).toBe(23);
      expect(riderData.killSwitches.riderDispatchDisabled).toBe(false);
      expect(UniversalConfigRegistry.validatePayloadIntegrity(riderPayload)).toBe(true);
    });

    it("propagates system freeze state across all downstream app payloads", () => {
      const registry = new UniversalConfigRegistry();
      registry.triggerSystemFreeze(adminActor, "Platform maintenance");

      const custPayload = registry.exportPropagationPayload("customer");
      const partPayload = registry.exportPropagationPayload("partner");
      const ridePayload = registry.exportPropagationPayload("rider");

      expect(custPayload.systemFreeze).toBe(true);
      expect((custPayload.data as any).killSwitches.isSystemFrozen).toBe(true);

      expect(partPayload.systemFreeze).toBe(true);
      expect((partPayload.data as any).killSwitches.isSystemFrozen).toBe(true);

      expect(ridePayload.systemFreeze).toBe(true);
      expect((ridePayload.data as any).killSwitches.isSystemFrozen).toBe(true);
    });
  });
});
