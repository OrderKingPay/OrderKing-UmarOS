import type { Sql } from "@/lib/db";
import { DEFAULT_CONFIG } from "./config.ts";
import { parseDisciplineNotes, serializeDisciplineNotes } from "./discipline.ts";
import type { DateRange, RiderStore } from "./store.ts";
import type {
  AuditLog,
  CashReconciliation,
  Delivery,
  DeliveryEvent,
  DispatchOffer,
  EarningLine,
  FraudSignal,
  IdempotencyRecord,
  InAppNotification,
  LocationPing,
  OtpRecord,
  PlatformConfig,
  ProofOfDelivery,
  RiderDocument,
  RiderProfile,
  SafetyIncident,
  Settlement,
  SupportTicket,
} from "./types.ts";
import { RiderError } from "./types.ts";

function iso(v: unknown): string {
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "string") return v;
  return String(v ?? "");
}

function json<T>(v: unknown, fallback: T): T {
  if (v == null) return fallback;
  if (typeof v === "object") return v as T;
  if (typeof v === "string") {
    try {
      return JSON.parse(v) as T;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function num(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v);
  return 0;
}

function riderFromRow(row: Record<string, unknown>): RiderProfile {
  const rawNotes = String(row.availability_notes ?? "");
  const { state: discState } = parseDisciplineNotes(rawNotes);
  return {
    id: String(row.id),
    userId: String(row.user_id),
    fullName: String(row.full_name ?? ""),
    phone: String(row.phone ?? ""),
    email: String(row.email ?? ""),
    photoUrl: row.photo_url ? String(row.photo_url) : null,
    address: String(row.address ?? ""),
    emergencyName: String(row.emergency_name ?? ""),
    emergencyPhone: String(row.emergency_phone ?? ""),
    dateOfBirth: row.date_of_birth ? String(row.date_of_birth) : null,
    governmentIdType: row.government_id_type ? String(row.government_id_type) : null,
    governmentIdLast4: row.government_id_last4 ? String(row.government_id_last4) : null,
    kycStatus: row.kyc_status as RiderProfile["kycStatus"],
    kycRejectReason: row.kyc_reject_reason ? String(row.kyc_reject_reason) : null,
    riderType: row.rider_type as RiderProfile["riderType"],
    vehicleType: row.vehicle_type as RiderProfile["vehicleType"],
    vehicleRegistration: row.vehicle_registration ? String(row.vehicle_registration) : null,
    licenceNumber: row.licence_number ? String(row.licence_number) : null,
    insuranceRef: row.insurance_ref ? String(row.insurance_ref) : null,
    payoutUpi: row.payout_upi ? String(row.payout_upi) : null,
    payoutBankLast4: row.payout_bank_last4 ? String(row.payout_bank_last4) : null,
    preferredZones: json<string[]>(row.preferred_zones, []),
    availabilityNotes: rawNotes,
    status: row.status as RiderProfile["status"],
    onlineSince: row.online_since ? iso(row.online_since) : null,
    locale: (row.locale as RiderProfile["locale"]) ?? "en",
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
    dataMode: (row.data_mode as RiderProfile["dataMode"]) ?? "SIMULATED",
    consecutiveDeclines: discState.consecutiveDeclines,
    coolingOffUntil: discState.coolingOffUntil,
    coolingOffReason: discState.coolingOffReason,
  };
}

export class PgStore implements RiderStore {
  constructor(private sql: Sql) {}

  async getConfig(): Promise<PlatformConfig> {
    const rows = await this.sql.query<Record<string, unknown>>(
      "select payload from platform_config where id = $1",
      ["default"],
    );
    let base = rows[0] ? json<PlatformConfig>(rows[0].payload, DEFAULT_CONFIG) : DEFAULT_CONFIG;

    // Check if platform_settings exists in the database (synced from HDmaster UmarOS)
    try {
      const hdSettings = await this.sql.query<{ settings_json: string }>(
        "select settings_json from platform_settings where org_id = 'org_orderking' limit 1",
      );
      if (hdSettings[0]?.settings_json) {
        const bag = JSON.parse(hdSettings[0].settings_json);
        const centralPricing = bag.central_pricing?.customRates ?? bag.central_pricing ?? {};
        const algo = bag.algorithm ?? {};
        const rd = bag.rider_discipline ?? bag.riderDiscipline ?? {};

        // 1. Floating cash limit & cooling off duration
        const floatingCashLimitInr = Number(
          centralPricing.floatingCashLimitInr ??
          rd.floating_cash_limit_inr ??
          base.discipline?.floatingCashLimitInr ??
          2000,
        );
        const coolingOffDurationMinutes = Number(
          centralPricing.coolingOffDurationMinutes ??
          rd.cooling_off_duration_minutes ??
          base.discipline?.coolingOffDurationMinutes ??
          15,
        );

        if (rd || centralPricing.floatingCashLimitInr !== undefined) {
          base = {
            ...base,
            discipline: {
              enabled: rd.enabled ?? base.discipline?.enabled ?? true,
              floatingCashLimitInr,
              cancellationPenaltyBeforePickupInr: Number(rd.cancellation_penalty_before_pickup_inr ?? base.discipline?.cancellationPenaltyBeforePickupInr ?? 25),
              cancellationPenaltyPostPickupType: rd.cancellation_penalty_post_pickup_type ?? base.discipline?.cancellationPenaltyPostPickupType ?? "FULL_ORDER",
              cancellationPenaltyPostPickupCustomInr: Number(rd.cancellation_penalty_post_pickup_custom_inr ?? base.discipline?.cancellationPenaltyPostPickupCustomInr ?? 150),
              coolingOffConsecutiveRejections: Number(rd.cooling_off_consecutive_rejections ?? base.discipline?.coolingOffConsecutiveRejections ?? 3),
              coolingOffAcceptanceRateThresholdPct: Number(rd.cooling_off_acceptance_rate_threshold_pct ?? base.discipline?.coolingOffAcceptanceRateThresholdPct ?? 70),
              coolingOffDurationMinutes,
              upiDepositVpa: rd.upi_deposit_vpa ?? base.discipline?.upiDepositVpa ?? "orderking.treasury@okaxis",
            },
          };
        }

        // 2. Base floors (Tier 1: ₹35, Tier 2: ₹30, Tier 3: ₹25)
        const tier1BaseFloorPaise = Math.round(
          Number(
            centralPricing.tier1FloorInr ??
            algo.tier1BaseFloorInr ??
            (centralPricing.cityTier === "TIER_1" ? centralPricing.riderBasePayInr : undefined) ??
            (algo.activeCityTier === "TIER_1" ? algo.riderBasePayoutInr : undefined) ??
            35,
          ) * 100,
        );
        const tier2BaseFloorPaise = Math.round(
          Number(
            centralPricing.tier2FloorInr ??
            algo.tier2BaseFloorInr ??
            (centralPricing.cityTier === "TIER_2" ? centralPricing.riderBasePayInr : undefined) ??
            (algo.activeCityTier === "TIER_2" ? algo.riderBasePayoutInr : undefined) ??
            30,
          ) * 100,
        );
        const tier3BaseFloorPaise = Math.round(
          Number(
            centralPricing.tier3FloorInr ??
            algo.tier3BaseFloorInr ??
            (centralPricing.cityTier === "TIER_3" ? centralPricing.riderBasePayInr : undefined) ??
            (algo.activeCityTier === "TIER_3" ? algo.riderBasePayoutInr : undefined) ??
            25,
          ) * 100,
        );

        const activeCityTier = (centralPricing.cityTier ?? algo.activeCityTier ?? "TIER_1") as "TIER_1" | "TIER_2" | "TIER_3";
        const pickupFeeInr = Number(centralPricing.riderPickupFeeInr ?? algo.riderPickupFeeInr ?? 20);
        const dropFeeInr = Number(centralPricing.riderDropFeeInr ?? algo.riderDropFeeInr ?? 15);
        const basePayInr = Number(centralPricing.riderBasePayInr ?? algo.riderBasePayoutInr ?? (pickupFeeInr + dropFeeInr));

        // 3. Progressive distance slab rates
        const slab1RatePaise = Math.round(
          Number(
            centralPricing.slab1RateInr ??
            algo.slab1RateInr ??
            centralPricing.riderPerKmRateInr ??
            algo.riderPerKmRateInr ??
            12,
          ) * 100,
        );
        const slab2RatePaise = Math.round(
          Number(centralPricing.slab2RateInr ?? algo.slab2RateInr ?? 14) * 100,
        );
        const slab3RatePaise = Math.round(
          Number(centralPricing.slab3RateInr ?? algo.slab3RateInr ?? 16) * 100,
        );
        const ldoBonusPaise = Math.round(
          Number(centralPricing.ldoBonusInr ?? algo.ldoBonusInr ?? 20) * 100,
        );

        // 4. Wait pay rates
        const waitGraceMinutes = Number(
          centralPricing.riderWaitGraceMins ?? algo.riderWaitGraceMinutes ?? 6,
        );
        const waitRatePerMinPaise = Math.round(
          Number(
            centralPricing.riderWaitPayPerMinInr ?? algo.riderWaitPayPerMinInr ?? 1,
          ) * 100,
        );
        const waitCapPaise = Math.round(
          Number(
            centralPricing.riderWaitCapInr ?? algo.riderWaitCapInr ?? 30,
          ) * 100,
        );

        // 5. Payout cycle day & King AI autonomous resolution
        const payoutCycleDay = String(
          centralPricing.payoutCycleDay ?? centralPricing.payoutDay ?? "Wednesday",
        );
        const kingAiAutonomousResolution = Boolean(
          centralPricing.kingAiAutonomousResolution ?? algo.kingAiAutonomousResolution ?? true,
        );

        base = {
          ...base,
          payoutCycleDay,
          kingAiAutonomousResolution,
          payoutFrequency: payoutCycleDay.toLowerCase().includes("daily") ? "daily" : "weekly",
          pricing: {
            cityTier: activeCityTier,
            tier1BaseFloorPaise,
            tier2BaseFloorPaise,
            tier3BaseFloorPaise,
            pickupFeePaise: Math.round(pickupFeeInr * 100),
            dropFeePaise: Math.round(dropFeeInr * 100),
            basePayPaise: Math.round(basePayInr * 100),
            defaultRatePerKmPaise: slab1RatePaise,
            distanceSlabs: {
              slab1RatePerKmPaise: slab1RatePaise,
              slab2RatePerKmPaise: slab2RatePaise,
              slab3RatePerKmPaise: slab3RatePaise,
              ldoBonusPaise,
            },
            waitGraceMinutes,
            waitRatePerMinPaise,
            waitCapPaise,
            floatingCashLimitInr,
            coolingOffDurationMinutes,
            payoutCycleDay,
            kingAiAutonomousResolution,
          },
        };
      }
    } catch {
      /* platform_settings table may not exist in pure local tests */
    }

    return { ...DEFAULT_CONFIG, ...base };
  }

  async saveConfig(cfg: PlatformConfig): Promise<void> {
    await this.sql.query(
      `insert into platform_config (id, payload, updated_at)
       values ($1, $2::jsonb, now())
       on conflict (id) do update set payload = excluded.payload, updated_at = now()`,
      ["default", JSON.stringify(cfg)],
    );
  }

  async getRiderByUserId(userId: string) {
    const rows = await this.sql.query<Record<string, unknown>>(
      "select * from riders where user_id = $1",
      [userId],
    );
    return rows[0] ? riderFromRow(rows[0]) : null;
  }

  async getRiderById(id: string) {
    const rows = await this.sql.query<Record<string, unknown>>("select * from riders where id = $1", [id]);
    return rows[0] ? riderFromRow(rows[0]) : null;
  }

  async upsertRider(r: RiderProfile) {
    const rawNotes = r.availabilityNotes ?? "";
    const { cleanNotes } = parseDisciplineNotes(rawNotes);
    const finalNotes = serializeDisciplineNotes(cleanNotes, {
      consecutiveDeclines: r.consecutiveDeclines ?? 0,
      coolingOffUntil: r.coolingOffUntil ?? null,
      coolingOffReason: r.coolingOffReason ?? null,
    });

    await this.sql.query(
      `insert into riders (
        id, user_id, full_name, phone, email, photo_url, address,
        emergency_name, emergency_phone, date_of_birth, government_id_type,
        government_id_last4, kyc_status, kyc_reject_reason, rider_type,
        vehicle_type, vehicle_registration, licence_number, insurance_ref,
        payout_upi, payout_bank_last4, preferred_zones, availability_notes,
        status, online_since, locale, created_at, updated_at, data_mode
      ) values (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29
      )
      on conflict (id) do update set
        full_name = excluded.full_name, phone = excluded.phone, email = excluded.email,
        photo_url = excluded.photo_url, address = excluded.address,
        emergency_name = excluded.emergency_name, emergency_phone = excluded.emergency_phone,
        date_of_birth = excluded.date_of_birth, government_id_type = excluded.government_id_type,
        government_id_last4 = excluded.government_id_last4, kyc_status = excluded.kyc_status,
        kyc_reject_reason = excluded.kyc_reject_reason, rider_type = excluded.rider_type,
        vehicle_type = excluded.vehicle_type, vehicle_registration = excluded.vehicle_registration,
        licence_number = excluded.licence_number, insurance_ref = excluded.insurance_ref,
        payout_upi = excluded.payout_upi, payout_bank_last4 = excluded.payout_bank_last4,
        preferred_zones = excluded.preferred_zones, availability_notes = excluded.availability_notes,
        status = excluded.status, online_since = excluded.online_since, locale = excluded.locale,
        updated_at = excluded.updated_at`,
      [
        r.id,
        r.userId,
        r.fullName,
        r.phone,
        r.email,
        r.photoUrl,
        r.address,
        r.emergencyName,
        r.emergencyPhone,
        r.dateOfBirth,
        r.governmentIdType,
        r.governmentIdLast4,
        r.kycStatus,
        r.kycRejectReason,
        r.riderType,
        r.vehicleType,
        r.vehicleRegistration,
        r.licenceNumber,
        r.insuranceRef,
        r.payoutUpi,
        r.payoutBankLast4,
        JSON.stringify(r.preferredZones),
        finalNotes,
        r.status,
        r.onlineSince,
        r.locale,
        r.createdAt,
        r.updatedAt,
        r.dataMode,
      ],
    );

    // Sync online = 1 flag and zone_id for Customer Search API compatibility
    const isOnline = (r.status === "ONLINE" || r.status === "BUSY") ? 1 : 0;
    const isOnlineBool = r.status === "ONLINE" || r.status === "BUSY";
    const primaryZone = Array.isArray(r.preferredZones) && r.preferredZones.length > 0 ? r.preferredZones[0] : null;

    try {
      await this.sql.query(
        `update riders
         set online = $1,
             is_online = $2,
             is_active = $2,
             zone_id = coalesce($3, zone_id)
         where id = $4`,
        [isOnline, isOnlineBool, primaryZone, r.id],
      );
    } catch {
      // Column auto-handled by migration 0020
    }
  }

  async insertDocument(doc: RiderDocument, userId: string) {
    await this.sql.query(
      `insert into rider_documents (id, rider_id, user_id, kind, content_type, byte_size, data_url, status, created_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        doc.id,
        doc.riderId,
        userId,
        doc.kind,
        doc.contentType,
        doc.byteSize,
        doc.dataUrl,
        doc.status,
        doc.createdAt,
      ],
    );
  }

  async listDocuments(userId: string) {
    const rows = await this.sql.query<Record<string, unknown>>(
      "select * from rider_documents where user_id = $1 order by created_at desc",
      [userId],
    );
    return rows.map(
      (r): RiderDocument => ({
        id: String(r.id),
        riderId: String(r.rider_id),
        kind: r.kind as RiderDocument["kind"],
        contentType: String(r.content_type),
        byteSize: num(r.byte_size),
        dataUrl: r.data_url ? String(r.data_url) : null,
        status: r.status as RiderDocument["status"],
        createdAt: iso(r.created_at),
      }),
    );
  }

  async getOpenOfferForRider(riderId: string) {
    const rows = await this.sql.query<Record<string, unknown>>(
      "select * from dispatch_offers where rider_id = $1 and status = 'OPEN' order by created_at desc limit 1",
      [riderId],
    );
    return rows[0] ? offerFromRow(rows[0]) : null;
  }

  async getOfferById(id: string) {
    const rows = await this.sql.query<Record<string, unknown>>(
      "select * from dispatch_offers where id = $1",
      [id],
    );
    return rows[0] ? offerFromRow(rows[0]) : null;
  }

  async insertOffer(offer: DispatchOffer, userId: string) {
    await this.sql.query(
      `insert into dispatch_offers (id, rider_id, user_id, order_code, payload, status, expires_at, created_at, data_mode)
       values ($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9)`,
      [
        offer.id,
        offer.riderId,
        userId,
        offer.orderCode,
        JSON.stringify(offer),
        offer.status,
        offer.expiresAt,
        offer.createdAt,
        offer.dataMode,
      ],
    );
  }

  async updateOffer(offer: DispatchOffer) {
    await this.sql.query(
      `update dispatch_offers set status = $2, payload = $3::jsonb where id = $1`,
      [offer.id, offer.status, JSON.stringify(offer)],
    );
    return true;
  }

  async casOffer(id: string, riderId: string, nextStatus: DispatchOffer["status"]) {
    const rows = await this.sql.query<Record<string, unknown>>(
      `update dispatch_offers
       set status = $3,
           payload = jsonb_set(coalesce(payload, '{}'::jsonb), '{status}', to_jsonb($3::text))
       where id = $1
         and rider_id = $2
         and status = 'OPEN'
         and ($3 = 'EXPIRED' or $3 = 'DECLINED' or expires_at > now())
       returning *`,
      [id, riderId, nextStatus],
    );
    if (!rows[0]) return null;
    const offer = offerFromRow(rows[0]);
    offer.status = nextStatus;
    await this.sql.query(`update dispatch_offers set payload = $2::jsonb where id = $1`, [
      id,
      JSON.stringify(offer),
    ]);
    return offer;
  }

  async getActiveDeliveryForRider(riderId: string) {
    const rows = await this.sql.query<Record<string, unknown>>(
      `select * from deliveries
       where rider_id = $1
         and state not in ('DELIVERED','OFFER_EXPIRED','RIDER_DECLINED','RIDER_CANCELLED','DELIVERY_FAILED','ORDER_CANCELLED','OFFERED')
       order by created_at desc limit 1`,
      [riderId],
    );
    return rows[0] ? deliveryFromRow(rows[0]) : null;
  }

  async getActiveDeliveriesForRider(riderId: string) {
    const rows = await this.sql.query<Record<string, unknown>>(
      `select * from deliveries
       where rider_id = $1
         and state not in ('DELIVERED','OFFER_EXPIRED','RIDER_DECLINED','RIDER_CANCELLED','DELIVERY_FAILED','ORDER_CANCELLED','OFFERED')
       order by created_at desc`,
      [riderId],
    );
    return rows.map((r) => deliveryFromRow(r));
  }

  async getDeliveryById(id: string) {
    const rows = await this.sql.query<Record<string, unknown>>("select * from deliveries where id = $1", [
      id,
    ]);
    return rows[0] ? deliveryFromRow(rows[0]) : null;
  }

  async listDeliveriesForUser(userId: string, range?: DateRange) {
    const rows = range
      ? await this.sql.query<Record<string, unknown>>(
          `select * from deliveries where user_id = $1 and created_at >= $2 and created_at <= $3 order by created_at desc`,
          [userId, range.from, range.to],
        )
      : await this.sql.query<Record<string, unknown>>(
          `select * from deliveries where user_id = $1 order by created_at desc`,
          [userId],
        );
    return rows.map(deliveryFromRow);
  }

  async insertDelivery(d: Delivery) {
    await this.sql.query(
      `insert into deliveries (id, offer_id, rider_id, user_id, order_id, order_code, state, payload, created_at, updated_at, data_mode)
       values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11)`,
      [
        d.id,
        d.offerId,
        d.riderId,
        d.userId,
        d.orderId,
        d.orderCode,
        d.state,
        JSON.stringify(d),
        d.createdAt,
        d.updatedAt,
        d.dataMode,
      ],
    );
  }

  async updateDelivery(d: Delivery) {
    await this.sql.query(
      `update deliveries set state = $2, payload = $3::jsonb, updated_at = $4 where id = $1 and user_id = $5`,
      [d.id, d.state, JSON.stringify(d), d.updatedAt, d.userId],
    );
  }

  async insertEvent(e: DeliveryEvent, userId: string) {
    await this.sql.query(
      `insert into delivery_events (id, delivery_id, user_id, previous_state, new_state, actor, actor_id, reason, at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [e.id, e.deliveryId, userId, e.previousState, e.newState, e.actor, e.actorId, e.reason, e.at],
    );
  }

  async listEvents(deliveryId: string) {
    const rows = await this.sql.query<Record<string, unknown>>(
      "select * from delivery_events where delivery_id = $1 order by at",
      [deliveryId],
    );
    return rows.map(
      (r): DeliveryEvent => ({
        id: String(r.id),
        deliveryId: String(r.delivery_id),
        previousState: (r.previous_state as DeliveryEvent["previousState"]) ?? null,
        newState: r.new_state as DeliveryEvent["newState"],
        actor: r.actor as DeliveryEvent["actor"],
        actorId: String(r.actor_id),
        reason: r.reason ? String(r.reason) : null,
        at: iso(r.at),
      }),
    );
  }

  async getOtp(deliveryId: string) {
    const rows = await this.sql.query<Record<string, unknown>>(
      "select * from delivery_otps where delivery_id = $1",
      [deliveryId],
    );
    const r = rows[0];
    if (!r) return null;
    return {
      deliveryId: String(r.delivery_id),
      hash: String(r.hash),
      salt: String(r.salt),
      attempts: num(r.attempts),
      verifiedAt: r.verified_at ? iso(r.verified_at) : null,
      simulatedPlain: r.simulated_plain ? String(r.simulated_plain) : null,
    } satisfies OtpRecord;
  }

  async saveOtp(rec: OtpRecord, userId: string) {
    await this.sql.query(
      `insert into delivery_otps (delivery_id, user_id, hash, salt, attempts, verified_at, simulated_plain)
       values ($1,$2,$3,$4,$5,$6,$7)
       on conflict (delivery_id) do update set
         attempts = excluded.attempts, verified_at = excluded.verified_at`,
      [rec.deliveryId, userId, rec.hash, rec.salt, rec.attempts, rec.verifiedAt, rec.simulatedPlain],
    );
  }

  async insertPod(p: ProofOfDelivery, userId: string) {
    await this.sql.query(
      `insert into proof_of_delivery (id, delivery_id, rider_id, user_id, method, photo_content_type, photo_bytes, photo_data_url, captured_at, data_mode)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        p.id,
        p.deliveryId,
        p.riderId,
        userId,
        p.method,
        p.photoContentType,
        p.photoBytes,
        p.photoDataUrl,
        p.capturedAt,
        p.dataMode,
      ],
    );
  }

  async listPod(deliveryId: string) {
    const rows = await this.sql.query<Record<string, unknown>>(
      "select * from proof_of_delivery where delivery_id = $1",
      [deliveryId],
    );
    return rows.map(
      (r): ProofOfDelivery => ({
        id: String(r.id),
        deliveryId: String(r.delivery_id),
        riderId: String(r.rider_id),
        method: r.method as ProofOfDelivery["method"],
        photoContentType: r.photo_content_type ? String(r.photo_content_type) : null,
        photoBytes: r.photo_bytes == null ? null : num(r.photo_bytes),
        photoDataUrl: r.photo_data_url ? String(r.photo_data_url) : null,
        capturedAt: iso(r.captured_at),
        dataMode: (r.data_mode as ProofOfDelivery["dataMode"]) ?? "SIMULATED",
      }),
    );
  }

  async getCash(deliveryId: string) {
    const rows = await this.sql.query<Record<string, unknown>>(
      "select * from cash_reconciliation where delivery_id = $1",
      [deliveryId],
    );
    const r = rows[0];
    if (!r) return null;
    return {
      deliveryId: String(r.delivery_id),
      riderId: String(r.rider_id),
      expectedPaise: num(r.expected_paise),
      collectedPaise: r.collected_paise == null ? null : num(r.collected_paise),
      state: r.state as CashReconciliation["state"],
      exceptionReason: r.exception_reason ? String(r.exception_reason) : null,
      updatedAt: iso(r.updated_at),
    } satisfies CashReconciliation;
  }

  async saveCash(c: CashReconciliation, userId: string) {
    await this.sql.query(
      `insert into cash_reconciliation (delivery_id, rider_id, user_id, expected_paise, collected_paise, state, exception_reason, updated_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8)
       on conflict (delivery_id) do update set
         collected_paise = excluded.collected_paise, state = excluded.state,
         exception_reason = excluded.exception_reason, updated_at = excluded.updated_at`,
      [
        c.deliveryId,
        c.riderId,
        userId,
        c.expectedPaise,
        c.collectedPaise,
        c.state,
        c.exceptionReason,
        c.updatedAt,
      ],
    );
  }

  async appendEarning(line: EarningLine, userId: string) {
    await this.sql.query(
      `insert into rider_earnings (id, rider_id, user_id, delivery_id, order_code, kind, amount_paise, note, at, data_mode)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        line.id,
        line.riderId,
        userId,
        line.deliveryId,
        line.orderCode,
        line.kind,
        line.amountPaise,
        line.note,
        line.at,
        line.dataMode,
      ],
    );
  }

  async listEarnings(userId: string, range?: DateRange) {
    const rows = range
      ? await this.sql.query<Record<string, unknown>>(
          `select * from rider_earnings where user_id = $1 and at >= $2 and at <= $3 order by at desc`,
          [userId, range.from, range.to],
        )
      : await this.sql.query<Record<string, unknown>>(
          `select * from rider_earnings where user_id = $1 order by at desc`,
          [userId],
        );
    return rows.map(
      (r): EarningLine => ({
        id: String(r.id),
        riderId: String(r.rider_id),
        deliveryId: r.delivery_id ? String(r.delivery_id) : null,
        orderCode: r.order_code ? String(r.order_code) : null,
        kind: r.kind as EarningLine["kind"],
        amountPaise: num(r.amount_paise),
        note: String(r.note ?? ""),
        at: iso(r.at),
        dataMode: (r.data_mode as EarningLine["dataMode"]) ?? "SIMULATED",
      }),
    );
  }

  async mutateEarning(_id: string): Promise<never> {
    throw new RiderError("EARNINGS_IMMUTABLE", "Historical earnings cannot be changed", 403);
  }

  async listSettlements(userId: string) {
    const rows = await this.sql.query<Record<string, unknown>>(
      "select * from settlement_lines where user_id = $1 order by period_end desc",
      [userId],
    );
    return rows.map(
      (r): Settlement => ({
        id: String(r.id),
        riderId: String(r.rider_id),
        periodStart: String(r.period_start),
        periodEnd: String(r.period_end),
        amountPaise: num(r.amount_paise),
        status: r.status as Settlement["status"],
        confirmedPaidAt: r.confirmed_paid_at ? iso(r.confirmed_paid_at) : null,
        dataMode: (r.data_mode as Settlement["dataMode"]) ?? "SIMULATED",
      }),
    );
  }

  async insertSettlement(s: Settlement, userId: string) {
    await this.sql.query(
      `insert into settlement_lines (id, rider_id, user_id, period_start, period_end, amount_paise, status, confirmed_paid_at, data_mode)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        s.id,
        s.riderId,
        userId,
        s.periodStart,
        s.periodEnd,
        s.amountPaise,
        s.status,
        s.confirmedPaidAt,
        s.dataMode,
      ],
    );
  }

  async updateSettlementStatus(
    id: string,
    userId: string,
    status: Settlement["status"],
    confirmedPaidAt: string | null,
  ) {
    await this.sql.query(
      `update settlement_lines set status = $3, confirmed_paid_at = $4
       where id = $1 and user_id = $2`,
      [id, userId, status, confirmedPaidAt],
    );
  }

  async insertTicket(t: SupportTicket, userId: string) {
    await this.sql.query(
      `insert into support_tickets (id, rider_id, user_id, delivery_id, topic, message, status, created_at, updated_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [t.id, t.riderId, userId, t.deliveryId, t.topic, t.message, t.status, t.createdAt, t.updatedAt],
    );
  }

  async listTickets(userId: string) {
    const rows = await this.sql.query<Record<string, unknown>>(
      "select * from support_tickets where user_id = $1 order by created_at desc",
      [userId],
    );
    return rows.map(
      (r): SupportTicket => ({
        id: String(r.id),
        riderId: String(r.rider_id),
        deliveryId: r.delivery_id ? String(r.delivery_id) : null,
        topic: r.topic as SupportTicket["topic"],
        message: String(r.message),
        status: r.status as SupportTicket["status"],
        createdAt: iso(r.created_at),
        updatedAt: iso(r.updated_at),
      }),
    );
  }

  async insertSafety(s: SafetyIncident, userId: string) {
    await this.sql.query(
      `insert into safety_incidents (id, rider_id, user_id, delivery_id, kind, note, lat, lng, created_at, emergency_dispatched)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        s.id,
        s.riderId,
        userId,
        s.deliveryId,
        s.kind,
        s.note,
        s.location?.lat ?? null,
        s.location?.lng ?? null,
        s.createdAt,
        false,
      ],
    );
  }

  async listSafety(userId: string) {
    const rows = await this.sql.query<Record<string, unknown>>(
      "select * from safety_incidents where user_id = $1 order by created_at desc",
      [userId],
    );
    return rows.map(
      (r): SafetyIncident => ({
        id: String(r.id),
        riderId: String(r.rider_id),
        deliveryId: r.delivery_id ? String(r.delivery_id) : null,
        kind: r.kind as SafetyIncident["kind"],
        note: String(r.note ?? ""),
        location:
          r.lat == null || r.lng == null ? null : { lat: num(r.lat), lng: num(r.lng) },
        createdAt: iso(r.created_at),
        emergencyDispatched: false,
      }),
    );
  }

  async insertNotification(n: InAppNotification) {
    await this.sql.query(
      `insert into notifications (id, user_id, title, body, kind, read, created_at)
       values ($1,$2,$3,$4,$5,$6,$7)`,
      [n.id, n.userId, n.title, n.body, n.kind, n.read, n.createdAt],
    );
  }

  async listNotifications(userId: string) {
    const rows = await this.sql.query<Record<string, unknown>>(
      "select * from notifications where user_id = $1 order by created_at desc limit 40",
      [userId],
    );
    return rows.map(
      (r): InAppNotification => ({
        id: String(r.id),
        userId: String(r.user_id),
        title: String(r.title),
        body: String(r.body),
        kind: r.kind as InAppNotification["kind"],
        read: Boolean(r.read),
        createdAt: iso(r.created_at),
      }),
    );
  }

  async appendAudit(a: AuditLog) {
    await this.sql.query(
      `insert into audit_logs (id, actor_id, action, resource, resource_id, at, meta)
       values ($1,$2,$3,$4,$5,$6,$7)`,
      [a.id, a.actorId, a.action, a.resource, a.resourceId, a.at, a.meta],
    );
  }

  async insertSignal(s: FraudSignal, userId: string) {
    await this.sql.query(
      `insert into fraud_signals (id, rider_id, user_id, delivery_id, kind, detail, stage, created_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [s.id, s.riderId, userId, s.deliveryId, s.kind, s.detail, s.stage, s.createdAt],
    );
  }

  async getIdempotency(userId: string, key: string) {
    const rows = await this.sql.query<Record<string, unknown>>(
      "select * from idempotency_keys where user_id = $1 and key = $2",
      [userId, key],
    );
    const r = rows[0];
    if (!r) return null;
    return {
      userId: String(r.user_id),
      key: String(r.key),
      action: String(r.action),
      resourceId: String(r.resource_id),
      responseJson: String(r.response_json),
      createdAt: iso(r.created_at),
    } satisfies IdempotencyRecord;
  }

  async saveIdempotency(r: IdempotencyRecord) {
    await this.sql.query(
      `insert into idempotency_keys (user_id, key, action, resource_id, response_json, created_at)
       values ($1,$2,$3,$4,$5,$6)
       on conflict (user_id, key) do nothing`,
      [r.userId, r.key, r.action, r.resourceId, r.responseJson, r.createdAt],
    );
  }

  async insertLocation(p: LocationPing, userId: string) {
    // Quick raw SQL migration to ensure current_location exists
    await this.sql.query(`ALTER TABLE riders ADD COLUMN IF NOT EXISTS current_location JSONB`);

    await this.sql.query(
      `insert into location_pings (id, rider_id, user_id, delivery_id, lat, lng, accuracy_m, at)
       values ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [p.id, p.riderId, userId, p.deliveryId, p.point.lat, p.point.lng, p.accuracyM, p.at],
    );

    await this.sql.query(
      `update riders set current_location = $1 where id = $2`,
      [JSON.stringify(p.point), p.riderId]
    );

    if (p.deliveryId) {
      await this.sql.query(
        `update orders
         set rider_lat = $1, rider_lng = $2, last_ping_at = now()
         where id = (select order_id from deliveries where id = $3 limit 1)`,
        [p.point.lat, p.point.lng, p.deliveryId],
      );
    }
  }

  async pruneLocations(userId: string, keepAfterIso: string, maxRows: number) {
    await this.sql.query(`delete from location_pings where user_id = $1 and at < $2`, [
      userId,
      keepAfterIso,
    ]);
    await this.sql.query(
      `delete from location_pings where id in (
         select id from location_pings where user_id = $1
         order by at desc offset $2
       )`,
      [userId, maxRows],
    );
  }

  async latestLocation(userId: string) {
    const rows = await this.sql.query<Record<string, unknown>>(
      "select * from location_pings where user_id = $1 order by at desc limit 1",
      [userId],
    );
    const r = rows[0];
    if (!r) return null;
    return {
      id: String(r.id),
      riderId: String(r.rider_id),
      deliveryId: r.delivery_id ? String(r.delivery_id) : null,
      point: { lat: num(r.lat), lng: num(r.lng) },
      accuracyM: r.accuracy_m == null ? null : num(r.accuracy_m),
      at: iso(r.at),
    } satisfies LocationPing;
  }

  async hitRateLimit(userId: string, action: string, windowMs: number, max: number) {
    const since = new Date(Date.now() - windowMs).toISOString();
    const rows = await this.sql.query<{ n: number }>(
      `select count(*)::int as n from rate_limit_hits where user_id = $1 and action = $2 and at >= $3`,
      [userId, action, since],
    );
    await this.sql.query(`insert into rate_limit_hits (user_id, action, at) values ($1,$2,now())`, [
      userId,
      action,
    ]);
    return num(rows[0]?.n) >= max;
  }
}

function offerFromRow(row: Record<string, unknown>): DispatchOffer {
  const payload = json<DispatchOffer>(row.payload, {} as DispatchOffer);
  return {
    ...payload,
    id: String(row.id),
    riderId: String(row.rider_id),
    orderCode: String(row.order_code),
    status: row.status as DispatchOffer["status"],
    expiresAt: iso(row.expires_at),
    createdAt: iso(row.created_at),
    dataMode: (row.data_mode as DispatchOffer["dataMode"]) ?? "SIMULATED",
  };
}

function deliveryFromRow(row: Record<string, unknown>): Delivery {
  const payload = json<Delivery>(row.payload, {} as Delivery);
  return {
    ...payload,
    id: String(row.id),
    offerId: String(row.offer_id),
    riderId: String(row.rider_id),
    userId: String(row.user_id),
    orderId: String(row.order_id),
    orderCode: String(row.order_code),
    state: row.state as Delivery["state"],
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
    dataMode: (row.data_mode as Delivery["dataMode"]) ?? "SIMULATED",
  };
}
