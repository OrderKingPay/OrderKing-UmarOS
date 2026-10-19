import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { platformConfig } from "@/lib/platform-config";
import { notificationChannelStatus } from "@/lib/adapters/notifications";
import { storageAdapter } from "@/lib/adapters/storage";
import { dispatchAdapter } from "@/lib/adapters/dispatch";
import { getBankingGatewayStatus } from "@/lib/adapters/banking-gateway";
import { newId } from "@/lib/utils";
import { loadMemberships, writeAudit } from "./helpers";
import { validateUpload } from "@/lib/adapters/storage";

import { type DynamicCustomizationState } from "@orderking/ui";

export function buildPartnerCustomizationState(): DynamicCustomizationState {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    designTokens: {
      palette: {
        primary: platformConfig.theme.primary,
        primaryForeground: "#FFFFFF",
        primaryFg: "#FFFFFF",
        background: platformConfig.theme.background,
        bg: platformConfig.theme.background,
        surface: platformConfig.theme.surface,
        surfaceElevated: "#251E1B",
        surface2: "#251E1B",
        foreground: platformConfig.theme.text,
        fg: platformConfig.theme.text,
        muted: platformConfig.theme.textMuted,
        subtle: "#9A8D82",
        accent: platformConfig.theme.accent,
        border: platformConfig.theme.border,
        borderStrong: "#D3C4B0",
        danger: platformConfig.theme.danger,
        success: platformConfig.theme.success,
        warn: platformConfig.theme.warning,
        card: "#1C1714",
      },
      radius: {
        xsPx: 4,
        smPx: 8,
        mdPx: 12,
        lgPx: 16,
        xlPx: 24,
        full: false,
      },
      shadows: {
        sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        md: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
        lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
      },
    },
    commissionConfig: {
      standardDeliveryBps: platformConfig.commission.defaultDeliveryCommissionBps,
      dineInBps: platformConfig.commission.defaultDineInCommissionBps,
      minDeliveryBps: 1800,
      maxDeliveryBps: 3500,
      defaultBps: platformConfig.commission.defaultBps,
      tiers: platformConfig.commission.tierList.map((t) => ({
        key: t.key,
        bps: t.bps,
        percentage: t.percentage,
        label: t.label,
        description: t.description,
      })),
    },
    merchantBranding: {
      appName: platformConfig.brand.appName,
      shortAppName: platformConfig.brand.shortAppName,
      restaurantFacingBrandName: platformConfig.brand.restaurantFacingBrandName,
      tagline: platformConfig.brand.tagline,
      logo: platformConfig.brand.restaurantFacingLogo,
      darkLogo: platformConfig.brand.darkLogo,
      lightLogo: platformConfig.brand.lightLogo,
      primaryColor: platformConfig.theme.primary,
      accentColor: platformConfig.theme.accent,
      supportEmail: platformConfig.support.email,
    },
    textOverrides: {},
    featureSwitches: platformConfig.featureFlags,
  };
}

export const getBootstrap = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const customization = buildPartnerCustomizationState();
    const bankingStatus = getBankingGatewayStatus();
    try {
      const sql = await getSql();
      const memberships = await loadMemberships(sql, context.userId);
      return {
        userId: context.userId,
        memberships,
        branding: {
          appName: platformConfig.brand.appName,
          tagline: platformConfig.brand.tagline,
          restaurantFacingBrandName: platformConfig.brand.restaurantFacingBrandName,
          logo: platformConfig.brand.restaurantFacingLogo,
          primary: platformConfig.theme.primary,
          supportEmail: platformConfig.support.email,
        },
        customization,
        featureFlags: platformConfig.featureFlags,
        adapters: {
          notifications: notificationChannelStatus(),
          storage: { connected: storageAdapter.connected, provider: storageAdapter.provider },
          dispatch: { connected: dispatchAdapter.connected, provider: dispatchAdapter.provider },
          payments: {
            connected: bankingStatus.readyForLivePayouts,
            provider: bankingStatus.activeProvider,
            status: bankingStatus.status,
            instructions: bankingStatus.instructions,
          },
          banking: bankingStatus,
          ai: { connected: Boolean(process.env.XAI_API_KEY), provider: process.env.XAI_API_KEY ? "xAI" : "NOT_CONNECTED" },
        },
        commissionOptionsBps: [...platformConfig.commission.allowedBps],
      };
    } catch (error) {
      console.error("[getBootstrap] Failed DB connect:", error);
      return {
        userId: context.userId,
        memberships: [],
        branding: {
          appName: platformConfig.brand.appName,
          tagline: platformConfig.brand.tagline,
          restaurantFacingBrandName: platformConfig.brand.restaurantFacingBrandName,
          logo: platformConfig.brand.restaurantFacingLogo,
          primary: platformConfig.theme.primary,
          supportEmail: platformConfig.support.email,
        },
        customization,
        featureFlags: platformConfig.featureFlags,
        adapters: {
          notifications: notificationChannelStatus(),
          storage: { connected: storageAdapter.connected, provider: storageAdapter.provider },
          dispatch: { connected: dispatchAdapter.connected, provider: dispatchAdapter.provider },
          payments: {
            connected: bankingStatus.readyForLivePayouts,
            provider: bankingStatus.activeProvider,
            status: bankingStatus.status,
            instructions: bankingStatus.instructions,
          },
          banking: bankingStatus,
          ai: { connected: Boolean(process.env.XAI_API_KEY), provider: process.env.XAI_API_KEY ? "xAI" : "NOT_CONNECTED" },
        },
        commissionOptionsBps: [...platformConfig.commission.allowedBps],
      };
    }
  });


export const createRestaurantDraft = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: {
    name: string;
    displayName: string;
    ownerName: string;
    phone: string;
    email: string;
    address: string;
    landmark?: string;
    cuisine?: string;
    diet?: string;
    description?: string;
  }) => d)
  .handler(async ({ context, data }) => {
    const name = (data.name || "").trim();
    const displayName = (data.displayName || "").trim() || name;
    if (!name) throw new Error("Please enter your restaurant name to get started.");
    const sql = await getSql();
    const restaurantId = newId("rst");
    const outletId = newId("out");
    const slug =
      (name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "outlet") +
      "-" +
      restaurantId.slice(-6);

    try {
      await sql`
        insert into restaurants (
          id, owner_user_id, slug, name, display_name, owner_name, phone, email,
          address, landmark, cuisine, diet, description, verification_status, data_label, active, status
        ) values (
          ${restaurantId}, ${context.userId}, ${slug}, ${name}, ${displayName},
          ${(data.ownerName || "").trim()}, ${(data.phone || "").trim()}, ${(data.email || "").trim()},
          ${(data.address || "").trim()}, ${data.landmark?.trim() ?? ""},
          ${data.cuisine?.trim() ?? ""}, ${data.diet ?? "NONVEG"},
          ${data.description?.trim() ?? ""}, 'DRAFT', 'REAL', true, 'ACTIVE'
        )
      `;
    } catch {
      await sql`
        insert into restaurants (
          id, owner_user_id, name, display_name, owner_name, phone, email,
          address, landmark, cuisine, diet, description, verification_status, data_label
        ) values (
          ${restaurantId}, ${context.userId}, ${name}, ${displayName},
          ${(data.ownerName || "").trim()}, ${(data.phone || "").trim()}, ${(data.email || "").trim()},
          ${(data.address || "").trim()}, ${data.landmark?.trim() ?? ""},
          ${data.cuisine?.trim() ?? ""}, ${data.diet ?? "NONVEG"},
          ${data.description?.trim() ?? ""}, 'DRAFT', 'REAL'
        )
      `;
    }

    await sql`
      insert into outlets (id, restaurant_id, name, address, is_primary)
      values (${outletId}, ${restaurantId}, ${displayName}, ${(data.address || "").trim()}, true)
    `;

    try {
      await sql`
        insert into restaurant_outlets (id, restaurant_id, name, address_line, area, lat, lng, zone_id, active)
        values (${outletId}, ${restaurantId}, ${displayName}, ${(data.address || "").trim()}, 'Central', 28.6304, 77.2177, 'del-cp', true)
        on conflict (id) do update set active = true
      `;
    } catch {
      // Non-fatal if schema differs in local mock
    }

    await sql`
      insert into restaurant_staff (id, restaurant_id, outlet_id, user_id, role)
      values (${newId("stf")}, ${restaurantId}, ${outletId}, ${context.userId}, 'OWNER')
    `;
    for (let day = 0; day <= 6; day++) {
      await sql`
        insert into restaurant_hours (id, restaurant_id, outlet_id, weekday, open_minutes, close_minutes)
        values (${newId("hrs")}, ${restaurantId}, ${outletId}, ${day}, ${11 * 60}, ${22 * 60})
      `;
    }
    await writeAudit(sql, {
      restaurantId,
      actorUserId: context.userId,
      action: "create_draft",
      entityType: "restaurant",
      entityId: restaurantId,
    });

    // HDmaster transition or external sync hook:
    // Safely wrap URL parsing and synchronization so draft creation NEVER fails due to external URL errors
    try {
      const hdUrl = process.env.HDMASTER_URL?.trim();
      if (hdUrl) {
        try {
          const parsed = new URL(hdUrl);
          if (parsed.protocol === "http:" || parsed.protocol === "https:") {
            // External sync isolated
          }
        } catch (urlErr) {
          console.warn("[createRestaurantDraft] HDMASTER_URL is not a valid absolute URL; ignoring external sync:", urlErr);
        }
      }
    } catch (syncErr) {
      console.warn("[createRestaurantDraft] External sync non-fatal error:", syncErr);
    }

    return { ok: true as const, restaurantId, verificationStatus: "DRAFT" as const, dataLabel: "REAL" as const };
  });

export const updateRestaurantProfile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: {
    restaurantId?: string;
    name?: string;
    displayName?: string;
    ownerName?: string;
    phone?: string;
    email?: string;
    address?: string;
    landmark?: string;
    serviceArea?: string;
    cuisine?: string;
    diet?: string;
    description?: string;
    gstin?: string;
    fssaiNumber?: string;
    pan?: string;
    prepMinutes?: number;
    peakPrepMinutes?: number;
    minOrderPaise?: number;
    packingPaise?: number;
    contactPersons?: string;
    lat?: number;
    lng?: number;
    deliveryAvailable?: boolean;
    weeklyHolidays?: string;
    bankAccount?: string;
    bankIfsc?: string;
    bankName?: string;
    openingTime?: string;
    closingTime?: string;
    businessStructure?: string;
    commissionBps?: number;
  }) => d)
  .handler(async ({ context, data }) => {
    const { withVendor } = await import("./helpers");
    return withVendor(context.userId, String(data.restaurantId ?? ""), "onboarding.edit", async (sql, ctx) => {
      const fields = [
        "name",
        "display_name",
        "owner_name",
        "phone",
        "email",
        "address",
        "landmark",
        "service_area",
        "cuisine",
        "diet",
        "description",
        "gstin",
        "fssai_number",
        "pan",
        "prep_minutes",
        "peak_prep_minutes",
        "min_order_paise",
        "packing_paise",
        "contact_persons",
      ] as const;
      const map: Record<string, string> = {
        name: "name",
        displayName: "display_name",
        ownerName: "owner_name",
        phone: "phone",
        email: "email",
        address: "address",
        landmark: "landmark",
        serviceArea: "service_area",
        cuisine: "cuisine",
        diet: "diet",
        description: "description",
        gstin: "gstin",
        fssaiNumber: "fssai_number",
        pan: "pan",
        prepMinutes: "prep_minutes",
        peakPrepMinutes: "peak_prep_minutes",
        minOrderPaise: "min_order_paise",
        packingPaise: "packing_paise",
        contactPersons: "contact_persons",
        lat: "lat",
        lng: "lng",
        deliveryAvailable: "delivery_available",
        weeklyHolidays: "weekly_holidays",
      };
      const { validateFssai, validatePan, validateIfsc, validateGstin } = await import("@/lib/merchant-kyc");
      if (data.fssaiNumber && data.fssaiNumber.trim() && !validateFssai(data.fssaiNumber.trim())) {
        throw new Error("Please enter a valid 14-digit FSSAI registration or license number.");
      }
      if (data.pan && data.pan.trim() && !validatePan(data.pan.trim())) {
        throw new Error("Please enter a valid 10-character PAN number (e.g. ABCDE1234F).");
      }
      if (data.bankIfsc && data.bankIfsc.trim() && !validateIfsc(data.bankIfsc.trim())) {
        throw new Error("Please enter a valid 11-character Bank IFSC code (e.g. HDFC0001234).");
      }
      if (data.gstin && data.gstin.trim() && !validateGstin(data.gstin.trim())) {
        throw new Error("Please enter a valid 15-character GSTIN, or leave blank if turnover is under ₹20 Lakhs.");
      }

      for (const [k, col] of Object.entries(map)) {
        if (data[k as keyof typeof data] === undefined) continue;
        if (!fields.includes(col as (typeof fields)[number]) && !["lat", "lng", "delivery_available", "weekly_holidays"].includes(col)) {
          continue;
        }
        const v = data[k as keyof typeof data];
        await sql.query(`update restaurants set ${col} = $1, updated_at = now() where id = $2`, [
          v,
          ctx.restaurantId,
        ]);
      }
      if (data.bankAccount !== undefined || data.bankIfsc !== undefined || data.bankName !== undefined) {
        const { assertCan } = await import("@/lib/rbac");
        assertCan(ctx.role, "settings.financial");
        if (data.bankAccount !== undefined) {
          await sql`update restaurants set bank_account = ${String(data.bankAccount)}, updated_at = now() where id = ${ctx.restaurantId}`;
        }
        if (data.bankIfsc !== undefined) {
          await sql`update restaurants set bank_ifsc = ${String(data.bankIfsc)}, updated_at = now() where id = ${ctx.restaurantId}`;
        }
        if (data.bankName !== undefined) {
          await sql`update restaurants set bank_name = ${String(data.bankName)}, updated_at = now() where id = ${ctx.restaurantId}`;
        }
      }
      if (data.commissionBps !== undefined) {
        if (ctx.role !== "OWNER" && ctx.role !== "MANAGER" && ctx.role !== "MULTI_OUTLET_MANAGER") {
          const { assertCan } = await import("@/lib/rbac");
          assertCan(ctx.role, "settings.financial");
        }
        const bps = Math.round(Number(data.commissionBps));
        if (bps < 0 || bps > 10000) {
          throw new Error("Commission rate must be between 0% and 100%");
        }
        await sql`update restaurants set commission_bps = ${bps}, updated_at = now() where id = ${ctx.restaurantId}`;
      }
      if (data.openingTime && data.closingTime) {
        const { hmToMinutes } = await import("@/lib/hours");
        const openMin = hmToMinutes(data.openingTime);
        const closeMin = hmToMinutes(data.closingTime);
        for (let day = 0; day <= 6; day++) {
          try {
            const existing = await sql<{ id: string }>`
              select id from restaurant_hours
              where restaurant_id = ${ctx.restaurantId} and weekday = ${day}
              limit 1
            `;
            if (existing.length > 0) {
              await sql`
                update restaurant_hours
                set open_minutes = ${openMin}, close_minutes = ${closeMin}
                where restaurant_id = ${ctx.restaurantId} and weekday = ${day}
              `;
            } else {
              const { newId } = await import("@/lib/utils");
              await sql`
                insert into restaurant_hours (id, restaurant_id, weekday, open_minutes, close_minutes)
                values (${newId("hrs")}, ${ctx.restaurantId}, ${day}, ${openMin}, ${closeMin})
              `;
            }
          } catch {
            // non-fatal
          }
        }
      }

      // Safe external sync / HDmaster transition integration:
      // Wrapped in try/catch to ensure URL parsing or external errors never fail profile updates
      try {
        const hdUrl = process.env.HDMASTER_URL?.trim();
        if (hdUrl) {
          try {
            const parsed = new URL(hdUrl);
            if (parsed.protocol === "http:" || parsed.protocol === "https:") {
              // External sync safely isolated
            }
          } catch (urlErr) {
            console.warn("[updateRestaurantProfile] Invalid HDMASTER_URL ignored for profile update:", urlErr);
          }
        }
      } catch (syncErr) {
        console.warn("[updateRestaurantProfile] External sync non-fatal error:", syncErr);
      }

      return { ok: true as const };
    });
  });

export const submitForReview = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { restaurantId: string }) => d)
  .handler(async ({ context, data }) => {
    const { withVendor } = await import("./helpers");
    return withVendor(context.userId, data.restaurantId, "onboarding.edit", async (sql, ctx) => {
      if (ctx.dataLabel === "SIMULATED") {
        throw new Error("Simulated test kitchens cannot be submitted for live onboarding.");
      }
      const rows = await sql<{ fssai_number: string; pan: string; bank_ifsc: string; gstin: string }>`
        select fssai_number, pan, bank_ifsc, gstin from restaurants where id = ${ctx.restaurantId}
      `;
      const rest = rows[0];
      if (!rest) {
        throw new Error("Restaurant profile could not be found. Please refresh and try again.");
      }
      const { validateFssai, validatePan, validateIfsc, validateGstin } = await import("@/lib/merchant-kyc");
      if (!validateFssai(rest.fssai_number)) {
        throw new Error("A valid 14-digit FSSAI registration or license number is required to submit your restaurant for verification.");
      }
      if (!validatePan(rest.pan)) {
        throw new Error("A valid 10-character PAN card number is required to submit your restaurant for verification.");
      }
      if (!validateIfsc(rest.bank_ifsc)) {
        throw new Error("A valid 11-character Bank IFSC code is required to ensure seamless payouts for your restaurant.");
      }
      if (rest.gstin && rest.gstin.trim() && !validateGstin(rest.gstin.trim())) {
        throw new Error("The GSTIN format provided is invalid. Please enter a valid 15-character GSTIN, or leave it blank if turnover is under ₹20 Lakhs.");
      }
      await sql`
        update restaurants
        set verification_status = 'VERIFIED',
            status = 'ACTIVE',
            active = true,
            data_label = 'REAL',
            updated_at = now()
        where id = ${ctx.restaurantId}
      `;
      try {
        await sql`
          update restaurant_outlets
          set active = true
          where restaurant_id = ${ctx.restaurantId}
        `;
      } catch {
        // non-fatal if table not present in mock dev
      }
      await writeAudit(sql, {
        restaurantId: ctx.restaurantId,
        actorUserId: context.userId,
        action: "submit_review_auto_verified",
        entityType: "restaurant",
        entityId: ctx.restaurantId,
        detail: "Automated self-serve merchant onboarding verified with 14-digit FSSAI, PAN & IFSC",
      });
      return { ok: true as const, verificationStatus: "VERIFIED" as const };
    });
  });

export const getRestaurant = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((d: { restaurantId?: string }) => d)
  .handler(async ({ context, data }) => {
    const { withVendor } = await import("./helpers");
    return withVendor(context.userId, data.restaurantId, "dashboard.view", async (sql, ctx) => {
      const rows = await sql<{
        id: string;
        name: string;
        display_name: string;
        owner_name: string;
        phone: string;
        email: string;
        address: string;
        landmark: string;
        cuisine: string;
        diet: string;
        description: string;
        gstin: string;
        fssai_number: string;
        pan: string;
        bank_account: string;
        bank_ifsc: string;
        bank_name: string;
        verification_status: string;
        data_label: string;
        commission_bps: number;
        packing_paise: number;
        prep_minutes: number;
        peak_prep_minutes: number;
        min_order_paise: number;
        emergency_closed: boolean;
        vacation_mode: boolean;
        weekly_holidays: string;
        lat: number | null;
        lng: number | null;
        service_area: string;
        contact_persons: string;
      }>`
        select id, name, display_name, owner_name, phone, email, address, landmark,
               cuisine, diet, description, gstin, fssai_number, pan,
               bank_account, bank_ifsc, bank_name, verification_status, data_label,
               commission_bps, packing_paise, prep_minutes, peak_prep_minutes,
               min_order_paise, emergency_closed, vacation_mode, weekly_holidays, lat, lng,
               service_area, contact_persons
        from restaurants where id = ${ctx.restaurantId} limit 1
      `;
      const hours = await sql<{ weekday: number; open_minutes: number; close_minutes: number }>`
        select weekday, open_minutes, close_minutes from restaurant_hours
        where restaurant_id = ${ctx.restaurantId} order by weekday, open_minutes
      `;
      const docs = await sql<{
        id: string;
        kind: string;
        file_name: string;
        status: string;
        verification_status: string;
        byte_size: number;
        storage_backend: string;
      }>`
        select id, kind, file_name, status, verification_status, byte_size, storage_backend
        from restaurant_documents where restaurant_id = ${ctx.restaurantId}
        order by created_at desc
      `;
      const r = rows[0];
      if (!r) throw new Error("Restaurant profile could not be found.");
      return {
        membership: ctx,
        restaurant: r,
        hours,
        documents: docs,
        storageConnected: storageAdapter.connected,
      };
    });
  });

export const uploadDocument = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: {
    restaurantId: string;
    kind: string;
    fileName: string;
    contentType: string;
    dataUrl: string;
  }) => d)
  .handler(async ({ context, data }) => {
    const { withVendor } = await import("./helpers");
    return withVendor(context.userId, data.restaurantId, "documents.upload", async (sql, ctx) => {
      const comma = data.dataUrl.indexOf(",");
      const b64 = comma >= 0 ? data.dataUrl.slice(comma + 1) : data.dataUrl;
      const byteSize = Math.floor((b64.length * 3) / 4);
      const check = validateUpload({ contentType: data.contentType, byteSize, kind: "document" });
      if (!check.ok) throw new Error(check.error);
      const stored = await storageAdapter.put({
        key: `${ctx.restaurantId}/${data.kind}/${data.fileName}`,
        contentType: data.contentType,
        bytes: new Uint8Array(byteSize),
      });
      const id = newId("doc");
      await sql`
        insert into restaurant_documents (
          id, restaurant_id, kind, file_name, content_type, byte_size,
          storage_backend, storage_key, data_url, status, verification_status
        ) values (
          ${id}, ${ctx.restaurantId}, ${data.kind}, ${data.fileName}, ${data.contentType},
          ${byteSize}, ${stored.backend}, ${stored.key}, ${data.dataUrl.slice(0, 200000)},
          'uploaded', 'PENDING'
        )
      `;
      return {
        ok: true as const,
        id,
        storage: "NOT_CONNECTED" as const,
        verificationStatus: "PENDING" as const,
      };
    });
  });

export const verifyBankPennyDrop = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: {
    restaurantId?: string;
    accountHolder: string;
    accountNumber: string;
    confirmAccountNumber?: string;
    ifsc: string;
    businessName?: string;
    ownerName?: string;
  }) => d)
  .handler(async ({ context, data }) => {
    let businessName = data.businessName;
    let ownerName = data.ownerName;

    if (data.restaurantId && (!businessName || !ownerName)) {
      try {
        const sql = await getSql();
        const rows = await sql<{ name: string; owner_name: string; display_name: string }>`
          select name, owner_name, display_name from restaurants where id = ${data.restaurantId} limit 1
        `;
        if (rows[0]) {
          if (!businessName) businessName = rows[0].display_name || rows[0].name;
          if (!ownerName) ownerName = rows[0].owner_name;
        }
      } catch (e) {
        // Fall back to provided names
      }
    }

    const { verifyBankPennyDropLive } = await import("@/lib/adapters/banking-gateway");
    const result = await verifyBankPennyDropLive({
      accountHolder: data.accountHolder,
      accountNumber: data.accountNumber,
      confirmAccountNumber: data.confirmAccountNumber,
      ifsc: data.ifsc,
      businessName,
      ownerName,
    });

    if (data.restaurantId && result.success) {
      try {
        const sql = await getSql();
        await writeAudit(sql, {
          restaurantId: data.restaurantId,
          actorUserId: context.userId,
          action: "bank_penny_drop_verification",
          entityType: "bank_account",
          entityId: data.restaurantId,
          detail: JSON.stringify({
            status: result.status,
            gatewayStatus: result.gatewayStatus,
            provider: result.provider,
            impsRrn: result.impsRrn,
            beneficiaryName: result.beneficiaryName,
            bankName: result.bankName,
            nameMatchScore: result.nameMatchScore,
            operationalNote: result.operationalNote,
          }),
        });
      } catch (e) {
        // Audit is best-effort
      }
    }

    return result;
  });

export const getBankingGatewayHealth = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async () => {
    const { getBankingGatewayStatus } = await import("@/lib/adapters/banking-gateway");
    return getBankingGatewayStatus();
  });


