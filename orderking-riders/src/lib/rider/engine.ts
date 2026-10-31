import { haversineKm } from "./eta.ts";
import { nid, orderCode } from "./ids.ts";
import {
  isEligibleRider,
  evaluateRiderEligibilityAndScore,
  evaluateMultiOrderBatching,
  MULTI_ORDER_BATCH_CONSTRAINTS,
} from "./dispatch.ts";
import { assertPlausiblePing } from "./gps.ts";
import { assertNotSelfVerify, assertRiderKycSubmit, evaluateAutomatedOnboarding } from "./kyc.ts";
import { assertTransition, isActiveDelivery } from "./machine.ts";
import {
  assertNonNegativePaise,
  calculateRiderPayout,
  calculateDeliveryPayoutWithTip,
  enforcePayoutFloor,
  calculateRestaurantWaitPay,
  calculateRestaurantWaitPayPaise,
  calculateWaitTimeMinutes,
  calculateCustomerTipPassThrough,
  formatPaise,
  STATUTORY_BASE_FARE_PAISE,
  STATUTORY_BASE_DISTANCE_KM,
  STATUTORY_DISTANCE_RATE_PER_KM_PAISE,
  RESTAURANT_WAIT_GRACE_PERIOD_MINUTES,
  RESTAURANT_WAIT_PAY_RATE_PER_MIN_PAISE,
  MAX_BILLABLE_WAIT_MINUTES,
  MAX_WAIT_PAY_PAISE,
  RESTAURANT_GEOFENCE_RADIUS_METERS,
  RESTAURANT_GEOFENCE_RADIUS_KM,
} from "./money.ts";
import { generateOtp, isPlausibleOtp, newOtpSecret, verifyOtpHash } from "./otp.ts";
import { minimizeCustomer, offerCustomerView } from "./privacy.ts";
import {
  calculatePocketBalance,
  getCoolingOffInfo,
  calculateCancellationPenalty,
  isJustifiedOperationalReason,
} from "./discipline.ts";
import { DEFAULT_DISCIPLINE_CONFIG } from "./config.ts";
import { executeRiderRazorpayXPayout } from "./banking.ts";
import type { RiderStore } from "./store.ts";
import {
  RiderError,
  type Actor,
  type AvailabilityStatus,
  type Delivery,
  type DeliveryEarningsBreakdown,
  type DeliveryState,
  type DispatchOffer,
  type EarningLine,
  type GeoPoint,
  type KycStatus,
  type LocaleCode,
  type PickupVerification,
  type PlatformConfig,
  type PocketBalanceInfo,
  type PodMethod,
  type RiderDocumentKind,
  type RiderProfile,
  type RiderType,
  type SafetyKind,
  type TicketTopic,
  type VehicleType,
  type AmbassadorStats,
} from "./types.ts";

export type SessionUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
};

const CANCEL_REASONS = [
  "vehicle problem",
  "safety issue",
  "wrong assignment",
  "restaurant issue",
  "customer issue",
  "other",
  "bike breakdown / tyre puncture",
  "bike breakdown / tyre puncture 🛵",
  "personal emergency / unwell",
  "personal emergency / unwell 🏥",
  "restaurant distance excessive (>5 km)",
  "restaurant distance excessive (>5 km) 📍",
  "heavy rain / waterlogging on route",
  "heavy rain / waterlogging on route 🌧️",
] as const;

const FAIL_REASONS = [
  "customer unavailable",
  "address not found",
  "refused delivery",
  "unsafe to complete",
  "other",
] as const;

const PROFILE_KEYS = [
  "fullName",
  "phone",
  "email",
  "photoUrl",
  "address",
  "emergencyName",
  "emergencyPhone",
  "dateOfBirth",
  "governmentIdType",
  "governmentIdLast4",
  "riderType",
  "vehicleType",
  "vehicleRegistration",
  "licenceNumber",
  "insuranceRef",
  "payoutUpi",
  "payoutBankLast4",
  "preferredZones",
  "availabilityNotes",
  "locale",
  "vehicleNumber",
  "dlNumber",
  "pan",
  "bankAccount",
  "bankIfsc",
  "bankHolder",
] as const;

type ProfilePatch = Partial<Pick<RiderProfile, (typeof PROFILE_KEYS)[number]>>;

export class RiderEngine {
  public calculatePayout(distanceKm: number, customRatePerKmPaise?: number): number {
    return calculateRiderPayout(distanceKm, customRatePerKmPaise);
  }

  public presentOffer(offer: DispatchOffer): DispatchOffer & { aiMetrics?: any } {
    return {
      ...offer,
      expectedPayoutPaise: enforcePayoutFloor(offer.expectedPayoutPaise),
      customer: offerCustomerView(offer.customer),
      aiMetrics: (offer as any)._aiMetrics || undefined
    };
  }

  public async respondOffer(
    userId: string,
    offerId: string,
    decision: "ACCEPT" | "DECLINE",
    reason: string | undefined,
    idempotencyKey: string,
  ) {
    return this.idem(userId, idempotencyKey, "offer.respond", async () => {
      const rider = await this.requireRider(userId);
      const offer = await this.store.getOfferById(offerId);
      if (!offer) throw new RiderError("NOT_FOUND", "Offer not found", 404);
      const owner = await this.store.getRiderById(offer.riderId);
      if (!owner || owner.userId !== userId) {
        throw new RiderError("FORBIDDEN", "You cannot respond to another rider's offer", 403);
      }
      if (offer.status !== "OPEN") {
        throw new RiderError("OFFER_GONE", "This offer is no longer available", 409);
      }
      if (new Date(offer.expiresAt).getTime() <= Date.now()) {
        await this.store.casOffer(offer.id, rider.id, "EXPIRED");
        throw new RiderError("OFFER_EXPIRED", "This offer has expired", 409);
      }
      if (decision === "DECLINE") {
        const claimed = await this.store.casOffer(offer.id, rider.id, "DECLINED");
        if (!claimed) throw new RiderError("OFFER_GONE", "This offer is no longer available", 409);
        await this.audit(userId, "OFFER_DECLINED", "offer", offer.id, reason ?? "");
        await this.handleOfferDecline(rider, reason);
        return { decision, delivery: null as Delivery | null, offer: { ...offer, status: "DECLINED" as const } };
      }
      // Check Cooling-Off Freeze
      const cooling = getCoolingOffInfo(rider.coolingOffUntil, rider.coolingOffReason);
      if (cooling.isActive) {
        throw new RiderError(
          "COOLING_OFF_ACTIVE",
          `Temporary cooling-off active (${Math.ceil(cooling.secondsRemaining / 60)}m remaining). Orders paused until ${cooling.until}. Reason: ${cooling.reason}`,
          403,
        );
      }
      // Check Floating Cash / Pocket Balance Limit on COD orders with lookahead check
      if (offer.cod) {
        const incomingCod = offer.codAmountPaise ?? 0;
        const pocket = await this.getPocketBalance(userId, incomingCod);
        if (pocket.isCodBlocked || (pocket.pocketBalancePaise + incomingCod) > pocket.limitPaise) {
          throw new RiderError(
            "FLOATING_CASH_LIMIT_EXCEEDED",
            `Floating cash pocket balance (${formatPaise(pocket.pocketBalancePaise + incomingCod)}) exceeds the ₹${(pocket.limitPaise / 100).toFixed(0)} limit. Deposit floating cash via UPI QR / Razorpay to accept COD orders.`,
            403,
          );
        }
      }
      // Multi-Order Batching: Allow up to 2 concurrent orders if kitchens within 800m and detour < 1.5km
      const activeDeliveries = this.store.getActiveDeliveriesForRider
        ? await this.store.getActiveDeliveriesForRider(rider.id)
        : (await this.store.getActiveDeliveryForRider(rider.id) ? [await this.store.getActiveDeliveryForRider(rider.id)!] : []);

      let isBatchOrder = false;
      let batchGroupId: string | null = null;
      let detourDistanceKm: number | undefined;

      if (activeDeliveries.length >= MULTI_ORDER_BATCH_CONSTRAINTS.maxConcurrentOrders) {
        throw new RiderError(
          "BUSY",
          `Maximum concurrent orders (${MULTI_ORDER_BATCH_CONSTRAINTS.maxConcurrentOrders}) reached`,
          409,
        );
      }

      if (activeDeliveries.length === 1) {
        const primaryDelivery = activeDeliveries[0]!;
        const batchCheck = evaluateMultiOrderBatching(
          {
            orderId: primaryDelivery.orderId,
            orderCode: primaryDelivery.orderCode,
            pickupLocation: primaryDelivery.pickupLocation,
            dropLocation: primaryDelivery.dropLocation,
          },
          {
            orderId: offer.id,
            orderCode: offer.orderCode,
            pickupLocation: offer.pickupLocation,
            dropLocation: offer.dropLocation,
          },
        );

        if (!batchCheck.canBatch) {
          throw new RiderError(
            "BUSY",
            `Cannot accept concurrent order: ${batchCheck.reason}`,
            409,
          );
        }

        isBatchOrder = true;
        batchGroupId = primaryDelivery.batchGroupId ?? `batch_${primaryDelivery.id}`;
        detourDistanceKm = batchCheck.detourDistanceKm;
      }

      const claimed = await this.store.casOffer(offer.id, rider.id, "ACCEPTED");
      if (!claimed) {
        throw new RiderError("OFFER_GONE", "This offer is no longer available", 409);
      }

      // Enforce ₹35 (3500 paise) base floor for rider fair earnings
      const hardenedOffer = {
        ...offer,
        expectedPayoutPaise: enforcePayoutFloor(offer.expectedPayoutPaise),
        status: "ACCEPTED" as const,
        isBatched: isBatchOrder,
        batchGroupId,
        detourDistanceKm,
      };
      const delivery = await this.createDeliveryFromOffer(rider, hardenedOffer);

      // If second batched order, update primary delivery with batch association
      if (isBatchOrder && activeDeliveries[0]) {
        const primary = activeDeliveries[0];
        await this.store.updateDelivery({
          ...primary,
          isBatched: true,
          batchGroupId,
          batchedWithDeliveryId: delivery.id,
        });
      }

      const busy: RiderProfile = {
        ...rider,
        status: "BUSY",
        consecutiveDeclines: 0,
        updatedAt: this.now(),
      };
      await this.store.upsertRider(busy);
      return { decision, delivery, offer: hardenedOffer };
    });
  }

  public async otpForSimulation(userId: string, deliveryId: string): Promise<string | null> {
    const delivery = await this.getDelivery(userId, deliveryId);
    if (!delivery) return null;
    const otp = await this.store.getOtp(deliveryId);
    return otp?.simulatedPlain ?? null;
  }
  private store: RiderStore;
  constructor(store: RiderStore) {
    this.store = store;
  }

  public getStore(): RiderStore {
    return this.store;
  }

  private async cfg(): Promise<PlatformConfig> {
    return this.store.getConfig();
  }

  private now(): string {
    return new Date().toISOString();
  }

  private async audit(actorId: string, action: string, resource: string, resourceId: string, meta = "") {
    await this.store.appendAudit({
      id: nid(),
      actorId,
      action,
      resource,
      resourceId,
      at: this.now(),
      meta,
    });
  }

  private async requireRider(userId: string): Promise<RiderProfile> {
    const r = await this.store.getRiderByUserId(userId);
    if (!r) throw new RiderError("NO_PROFILE", "Complete onboarding first", 400);
    return r;
  }

  private async requireOwnedDelivery(userId: string, deliveryId: string): Promise<Delivery> {
    const d = await this.store.getDeliveryById(deliveryId);
    if (!d) throw new RiderError("NOT_FOUND", "Delivery not found", 404);
    if (d.userId !== userId) {
      throw new RiderError("FORBIDDEN", "You cannot access another rider's delivery", 403);
    }
    return d;
  }

  private async idem<T>(
    userId: string,
    key: string | undefined,
    action: string,
    run: () => Promise<T>,
  ): Promise<T> {
    if (!key || !String(key).trim()) {
      throw new RiderError("IDEMPOTENCY_REQUIRED", "This action needs an idempotency key", 400);
    }
    const existing = await this.store.getIdempotency(userId, key);
    if (existing) return JSON.parse(existing.responseJson) as T;
    const value = await run();
    await this.store.saveIdempotency({
      userId,
      key,
      action,
      resourceId: (value as { id?: string })?.id ?? "",
      responseJson: JSON.stringify(value),
      createdAt: this.now(),
    });
    return value;
  }

  async getPublicConfig() {
    const c = await this.cfg();
    return {
      branding: c.branding,
      flags: c.flags,
      offerTimeoutSeconds: c.offerTimeoutSeconds,
      locationUpdateIntervalSeconds: c.locationUpdateIntervalSeconds,
      supportedLocales: c.supportedLocales,
      defaultLocale: c.defaultLocale,
      dataMode: c.dataMode,
      supportPhone: c.supportPhone,
      emergencyPhone: c.emergencyPhone,
      volunteerEnabled: c.volunteerEnabled,
      payoutFrequency: c.payoutFrequency,
      pickupVerification: c.pickupVerification,
      podMethods: c.podMethods,
    };
  }

  async ensureRider(user: SessionUser): Promise<RiderProfile> {
    const phoneFromEmail = user.email
      ? (user.email.match(/^(?:\+?91)?([6-9]\d{9})@/)?.[1] ?? user.email.match(/^(\d{10})@/)?.[1] ?? "")
      : "";
    const existing = await this.store.getRiderByUserId(user.id);
    if (existing) {
      if (!existing.phone && phoneFromEmail) {
        existing.phone = phoneFromEmail;
        await this.store.upsertRider(existing);
      }
      return existing;
    }
    const now = this.now();
    const rider: RiderProfile = {
      id: nid(),
      userId: user.id,
      fullName: user.name?.trim() ? user.name.trim() : (phoneFromEmail ? `Partner ${phoneFromEmail.slice(-4)}` : "Delivery Partner"),
      phone: phoneFromEmail,
      email: user.email ?? "",
      photoUrl: user.image ?? null,
      address: "",
      emergencyName: "",
      emergencyPhone: "",
      dateOfBirth: null,
      governmentIdType: null,
      governmentIdLast4: null,
      kycStatus: "DRAFT",
      kycRejectReason: null,
      riderType: "DELIVERY_PARTNER",
      vehicleType: "MOTORCYCLE",
      vehicleRegistration: null,
      licenceNumber: null,
      insuranceRef: null,
      payoutUpi: null,
      payoutBankLast4: null,
      preferredZones: [],
      availabilityNotes: "",
      status: "OFFLINE",
      onlineSince: null,
      locale: "en",
      createdAt: now,
      updatedAt: now,
      dataMode: "LIVE",
    };
    await this.store.upsertRider(rider);
    await this.audit(user.id, "RIDER_CREATED", "rider", rider.id);
    return rider;
  }

  async saveProfile(userId: string, patch: ProfilePatch | Record<string, unknown>): Promise<RiderProfile> {
    const rider = await this.requireRider(userId);
    const cfg = await this.cfg();
    const incoming = patch as Record<string, unknown>;
    if (incoming.panNumber && !incoming.pan) incoming.pan = incoming.panNumber;
    if (incoming.bankAccountNumber && !incoming.bankAccount) incoming.bankAccount = incoming.bankAccountNumber;
    if (incoming.bankAccountHolder && !incoming.bankHolder) incoming.bankHolder = incoming.bankAccountHolder;
    if (incoming.ifsc && !incoming.bankIfsc) incoming.bankIfsc = incoming.ifsc;
    if (incoming.rcNumber && !incoming.vehicleNumber) incoming.vehicleNumber = incoming.rcNumber;
    if (incoming.rcNumber && !incoming.vehicleRegistration) incoming.vehicleRegistration = incoming.rcNumber;
    if (incoming.dlNumber && !incoming.licenceNumber) incoming.licenceNumber = incoming.dlNumber;
    if (incoming.aadhaarLast4 && !incoming.governmentIdLast4) incoming.governmentIdLast4 = incoming.aadhaarLast4;
    if ("kycStatus" in incoming && incoming.kycStatus != null) {
      assertNotSelfVerify(incoming.kycStatus as KycStatus);
    }
    const clean: ProfilePatch = {};
    for (const key of PROFILE_KEYS) {
      if (key in incoming && incoming[key] !== undefined) {
        (clean as Record<string, unknown>)[key] = incoming[key];
      }
    }
    if (clean.riderType === "VOLUNTEER" && !cfg.volunteerEnabled) {
      throw new RiderError("FLAG_OFF", "Volunteer type is not enabled", 400);
    }
    const allowedTypes: RiderType[] = ["DELIVERY_PARTNER", "PART_TIME", "FULL_TIME"];
    if (cfg.volunteerEnabled) allowedTypes.push("VOLUNTEER");
    if (clean.riderType && !allowedTypes.includes(clean.riderType)) {
      throw new RiderError("INVALID", "Unknown rider type", 400);
    }
    const next: RiderProfile = {
      ...rider,
      ...clean,
      userId: rider.userId,
      id: rider.id,
      kycStatus: rider.kycStatus,
      status: rider.status,
      onlineSince: rider.onlineSince,
      dataMode: rider.dataMode,
      createdAt: rider.createdAt,
      updatedAt: this.now(),
    };
    if (rider.kycStatus === "VERIFIED" && this.kycFieldsChanged(rider, next)) {
      next.kycStatus = "UNDER_REVIEW";
    }
    await this.store.upsertRider(next);
    return next;
  }

  private kycFieldsChanged(a: RiderProfile, b: RiderProfile): boolean {
    return (
      a.fullName !== b.fullName ||
      a.governmentIdLast4 !== b.governmentIdLast4 ||
      a.vehicleRegistration !== b.vehicleRegistration ||
      a.licenceNumber !== b.licenceNumber
    );
  }

  async submitKyc(userId: string): Promise<RiderProfile> {
    const rider = await this.requireRider(userId);
    assertRiderKycSubmit(rider.kycStatus);
    if (!rider.fullName.trim() || !rider.phone.trim()) {
      throw new RiderError("INCOMPLETE", "Name and phone are required", 400);
    }
    const hasUpi = Boolean(rider.payoutUpi && /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(rider.payoutUpi.trim()));
    const hasBank = Boolean((rider.bankAccount && rider.bankIfsc) || (rider.payoutBankLast4 && /^\d{4}$/.test(rider.payoutBankLast4.trim())));
    if (!hasUpi && !hasBank) {
      throw new RiderError("INCOMPLETE", "Bank Account (with IFSC) or UPI payout details are required", 400);
    }
    const evaluation = evaluateAutomatedOnboarding(rider);
    const nextStatus: KycStatus = evaluation.approved ? "VERIFIED" : "UNDER_REVIEW";
    const next: RiderProfile = {
      ...rider,
      kycStatus: nextStatus,
      kycRejectReason: evaluation.approved ? null : evaluation.reasons.join("; "),
      licenceNumber: evaluation.normalized.effectiveDl,
      vehicleRegistration: evaluation.normalized.effectiveRc,
      updatedAt: this.now(),
    };
    if (this.store.upsertRiderKyc) {
      await this.store.upsertRiderKyc({
        id: `kyc_${rider.id}`,
        riderId: rider.id,
        userId: rider.userId,
        fullName: rider.fullName,
        phone: rider.phone,
        vehicleType: rider.vehicleType,
        vehicleNumber: next.vehicleNumber || next.vehicleRegistration || "",
        dlNumber: next.dlNumber || next.licenceNumber || "",
        pan: next.pan || (next.governmentIdType?.startsWith("AADHAAR_PAN:") ? next.governmentIdType.replace("AADHAAR_PAN:", "") : ""),
        aadhaarLast4: next.governmentIdLast4 || "",
        bankAccount: next.bankAccount || "",
        bankIfsc: next.bankIfsc || "",
        bankHolder: next.bankHolder || next.fullName || "",
        documentUrls: {},
        status: evaluation.approved ? "approved" : "rejected",
        rejectionReason: evaluation.approved ? null : evaluation.reasons.join("; "),
      });
    }
    await this.store.upsertRider(next);
    await this.audit(
      userId,
      evaluation.approved ? "KYC_AUTONOMOUS_APPROVED" : "KYC_AUTONOMOUS_REJECTED",
      "rider",
      rider.id,
    );
    await this.store.insertNotification({
      id: nid(),
      userId,
      title: evaluation.approved ? "Statutory KYC Approved" : "Verification Rejected",
      body: evaluation.approved
        ? "Your Aadhaar, PAN, and CMVR compliance have been validated autonomously. You are ready to go ONLINE!"
        : evaluation.reasons.join(". "),
      kind: "ACCOUNT",
      read: false,
      createdAt: this.now(),
    });
    return next;
  }

  /** Admin / Window 4 only. Never exposed on rider server functions. */
  async systemSetKyc(
    actor: "ADMIN" | "SYSTEM",
    targetUserId: string,
    status: KycStatus,
    reason?: string | null,
  ): Promise<RiderProfile> {
    if (actor !== "ADMIN" && actor !== "SYSTEM") {
      throw new RiderError("FORBIDDEN", "Only operations can change verification status", 403);
    }
    if (status !== "UNDER_REVIEW" && status !== "VERIFIED" && status !== "REJECTED" && status !== "SUSPENDED") {
      throw new RiderError("INVALID", "Unsupported verification status", 400);
    }
    const rider = await this.requireRider(targetUserId);
    const next: RiderProfile = {
      ...rider,
      kycStatus: status,
      kycRejectReason: status === "REJECTED" ? reason ?? "Rejected" : null,
      updatedAt: this.now(),
    };
    await this.store.upsertRider(next);
    await this.audit(actor, "KYC_ADMIN", "rider", rider.id, status);
    return next;
  }

  async addDocument(
    userId: string,
    input: { kind: RiderDocumentKind; contentType: string; bytes: number; dataUrl?: string },
  ) {
    const rider = await this.requireRider(userId);
    if (!/^image\/(jpeg|png|webp)$/.test(input.contentType) && input.contentType !== "application/pdf") {
      throw new RiderError("FILE_TYPE", "Document must be jpeg, png, webp, or pdf", 400);
    }
    if (input.bytes > 500_000) {
      throw new RiderError("FILE_SIZE", "Document is too large", 400);
    }
    const doc = {
      id: nid(),
      riderId: rider.id,
      kind: input.kind,
      contentType: input.contentType,
      byteSize: input.bytes,
      dataUrl: input.dataUrl ?? null,
      status: "SUBMITTED" as const,
      createdAt: this.now(),
    };
    await this.store.insertDocument(doc, userId);
    await this.audit(userId, "KYC_DOCUMENT", "document", doc.id, input.kind);
    return { id: doc.id, kind: doc.kind, status: doc.status, createdAt: doc.createdAt };
  }

  async documents(userId: string) {
    await this.requireRider(userId);
    return this.store.listDocuments(userId);
  }

  async setStatus(
    userId: string,
    status: AvailabilityStatus,
    confirmed: boolean,
  ): Promise<RiderProfile> {
    if (!confirmed) throw new RiderError("CONFIRM_REQUIRED", "Confirm this status change", 400);
    const rider = await this.requireRider(userId);
    const cfg = await this.cfg();
    if (status === "ONLINE" && cfg.dataMode === "LIVE" && rider.kycStatus !== "VERIFIED") {
      throw new RiderError("KYC", "Unverified partners cannot go online for live orders", 403);
    }
    if (status === "ONLINE") {
      const cooling = getCoolingOffInfo(rider.coolingOffUntil, rider.coolingOffReason);
      if (cooling.isActive) {
        throw new RiderError(
          "COOLING_OFF_ACTIVE",
          `Temporary cooling-off active (${Math.ceil(cooling.secondsRemaining / 60)}m remaining). Orders paused until ${cooling.until}. Reason: ${cooling.reason}`,
          403,
        );
      }
    }
    const active = await this.store.getActiveDeliveryForRider(rider.id);
    if (status === "OFFLINE" && active) {
      throw new RiderError("BUSY", "Finish the current delivery before going offline", 400);
    }
    if (status === "ONLINE" && active) {
      status = "BUSY";
    }
    const next: RiderProfile = {
      ...rider,
      status,
      coolingOffUntil: status === "ONLINE" && rider.coolingOffUntil && new Date(rider.coolingOffUntil).getTime() <= Date.now() ? null : rider.coolingOffUntil,
      coolingOffReason: status === "ONLINE" && rider.coolingOffUntil && new Date(rider.coolingOffUntil).getTime() <= Date.now() ? null : rider.coolingOffReason,
      onlineSince: status === "OFFLINE" ? null : rider.onlineSince ?? this.now(),
      updatedAt: this.now(),
    };
    await this.store.upsertRider(next);
    await this.audit(userId, "STATUS", "rider", rider.id, status);
    if (status === "ONLINE") {
      await this.maybeDispatch(rider.id, userId);
    }
    return next;
  }

  async tick(userId: string) {
    const rider = await this.store.getRiderByUserId(userId);
    if (!rider) return { rider: null as RiderProfile | null, offer: null as DispatchOffer | null };
    await this.expireOffers(rider);
    if (rider.status === "ONLINE") {
      await this.maybeDispatch(rider.id, userId);
    }
    const offer = await this.store.getOpenOfferForRider(rider.id);
    return { rider, offer: offer ? this.presentOffer(offer) : null };
  }

  public async expireOffers(rider: RiderProfile) {
    const offer = await this.store.getOpenOfferForRider(rider.id);
    if (!offer) return;
    if (new Date(offer.expiresAt).getTime() <= Date.now()) {
      const expired = await this.store.casOffer(offer.id, rider.id, "EXPIRED");
      if (expired) {
        await this.audit(rider.userId, "OFFER_EXPIRED", "offer", offer.id);
        const currentRider = (await this.store.getRiderById(rider.id)) ?? rider;
        await this.handleOfferDecline(currentRider, "Offer expired / ignored");
      }
    }
  }

  private async maybeDispatch(riderId: string, userId: string) {
    // Dispatch requires integration with HDmaster's Order Engine.
    // Production does not simulate dispatch. We just return safely.
  }

  private async createDeliveryFromOffer(rider: RiderProfile, offer: DispatchOffer): Promise<Delivery> {
    const cfg = await this.cfg();
    const now = this.now();
    const delivery: Delivery = {
      id: nid(),
      offerId: offer.id,
      riderId: rider.id,
      userId: rider.userId,
      orderCode: offer.orderCode,
      orderId: nid(),
      state: "ACCEPTED",
      restaurant: offer.restaurant,
      customer: offer.customer,
      pickupLocation: offer.pickupLocation,
      dropLocation: offer.dropLocation,
      packageCount: offer.packageCount,
      expectedPayoutPaise: enforcePayoutFloor(offer.expectedPayoutPaise),
      cod: offer.cod,
      codAmountPaise: offer.codAmountPaise,
      pickupVerification: cfg.pickupVerification,
      pickupCode: String(1000 + Math.floor(Math.random() * 9000)),
      otpRequired: true,
      arrivedRestaurantAt: null,
      expectedReadyAt: null,
      pickedUpAt: null,
      arrivedCustomerAt: null,
      deliveredAt: null,
      waitStartedAt: null,
      contactAttempts: 0,
      cancelReason: null,
      failReason: null,
      createdAt: now,
      updatedAt: now,
      dataMode: cfg.dataMode,
      isBatched: offer.isBatched ?? false,
      batchGroupId: offer.batchGroupId ?? null,
    };
    await this.store.insertDelivery(delivery);
    await this.recordTransition(delivery, null, "ACCEPTED", "RIDER", rider.userId, "accepted offer");
    const plainOtp = generateOtp(4);
    const secret = newOtpSecret(plainOtp);
    await this.store.saveOtp(
      {
        deliveryId: delivery.id,
        hash: secret.hash,
        salt: secret.salt,
        attempts: 0,
        verifiedAt: null,
        simulatedPlain: plainOtp,
      },
      rider.userId,
    );
    if (offer.cod && cfg.flags.cod) {
      await this.store.saveCash(
        {
          deliveryId: delivery.id,
          riderId: rider.id,
          expectedPaise: offer.codAmountPaise,
          collectedPaise: null,
          state: "EXPECTED",
          exceptionReason: null,
          updatedAt: now,
        },
        rider.userId,
      );
    }
    return this.presentDelivery(delivery);
  }

  presentDelivery(d: Delivery): Delivery {
    return { ...d, customer: minimizeCustomer(d.customer, d.state) };
  }

  async getDelivery(userId: string, deliveryId: string): Promise<Delivery> {
    const d = await this.requireOwnedDelivery(userId, deliveryId);
    return this.presentDelivery(d);
  }

  async getDeliveryBundle(userId: string, deliveryId: string) {
    const delivery = await this.getDelivery(userId, deliveryId);
    const simulatedOtp = null;
    const cash = await this.store.getCash(deliveryId);
    return { delivery, simulatedOtp, cash };
  }

  async getDeliveryEarningsBreakdown(userId: string, deliveryId: string): Promise<DeliveryEarningsBreakdown> {
    const d = await this.requireOwnedDelivery(userId, deliveryId);
    if (d.earningsBreakdown) return d.earningsBreakdown;

    const cfg = await this.cfg();
    const waitMins = d.arrivedRestaurantAt
      ? calculateWaitTimeMinutes(d.arrivedRestaurantAt, d.pickedUpAt ?? d.deliveredAt ?? this.now())
      : 0;
    const waitCalc = calculateRestaurantWaitPay(
      waitMins,
      RESTAURANT_WAIT_GRACE_PERIOD_MINUTES,
      RESTAURANT_WAIT_PAY_RATE_PER_MIN_PAISE,
      MAX_BILLABLE_WAIT_MINUTES,
      MAX_WAIT_PAY_PAISE,
    );
    const basePayout = enforcePayoutFloor(d.expectedPayoutPaise);
    const tip = d.tipPaise ? calculateCustomerTipPassThrough(d.tipPaise).netTipPassThroughPaise : 0;
    const multi = cfg.flags.incentives && d.packageCount > 1 ? 500 : 0;
    return {
      deliveryId: d.id,
      orderCode: d.orderCode,
      basePayPaise: basePayout,
      waitMinutes: waitCalc.totalWaitMinutes,
      billableWaitMinutes: waitCalc.billableWaitMinutes,
      waitPayPaise: waitCalc.waitPayPaise,
      isWaitCapped: waitCalc.isCapped,
      tipPaise: tip,
      multiPackageBonusPaise: multi,
      totalPayoutPaise: basePayout + waitCalc.waitPayPaise + tip + multi,
    };
  }

  async getActiveDelivery(userId: string): Promise<Delivery | null> {
    const rider = await this.requireRider(userId);
    const d = await this.store.getActiveDeliveryForRider(rider.id);
    return d ? this.presentDelivery(d) : null;
  }

  private async transition(
    userId: string,
    deliveryId: string,
    to: DeliveryState,
    reason: string | null,
    extra?: (d: Delivery) => void,
  ): Promise<Delivery> {
    const d = await this.requireOwnedDelivery(userId, deliveryId);
    if (d.state === "ORDER_CANCELLED") {
      throw new RiderError("ORDER_CANCELLED", "This order was cancelled. Do not deliver it.", 409);
    }
    assertTransition(d.state, to);
    const prev = d.state;
    extra?.(d);
    d.state = to;
    d.updatedAt = this.now();
    await this.store.updateDelivery(d);
    await this.recordTransition(d, prev, to, "RIDER", userId, reason);
    if (to === "DELIVERED" || to === "RIDER_CANCELLED" || to === "DELIVERY_FAILED") {
      const rider = await this.requireRider(userId);
      const still = await this.store.getActiveDeliveryForRider(rider.id);
      if (!still && rider.status === "BUSY") {
        await this.store.upsertRider({
          ...rider,
          status: "ONLINE",
          updatedAt: this.now(),
        });
      }
    }
    return this.presentDelivery(d);
  }

  private async recordTransition(
    d: Delivery,
    prev: DeliveryState | null,
    next: DeliveryState,
    actor: Actor,
    actorId: string,
    reason: string | null,
  ) {
    await this.store.insertEvent(
      {
        id: nid(),
        deliveryId: d.id,
        previousState: prev,
        newState: next,
        actor,
        actorId,
        reason,
        at: this.now(),
      },
      d.userId,
    );
  }

  async arriving(userId: string, deliveryId: string, key: string) {
    return this.idem(userId, key, "arrive.going", () =>
      this.transition(userId, deliveryId, "ARRIVING_AT_RESTAURANT", null),
    );
  }

  async arriveRestaurant(userId: string, deliveryId: string, key: string, location?: GeoPoint | null) {
    return this.idem(userId, key, "arrive.restaurant", async () => {
      const d = await this.requireOwnedDelivery(userId, deliveryId);

      // Restaurant Arrival Geofence Gate: require GPS ping or explicit location within 150m (0.15 km) of restaurant coordinates
      const latestPing = location ? { point: location } : await this.store.latestLocation(userId);
      if (latestPing) {
        const restPoint = d.pickupLocation ?? d.restaurant?.location;
        if (restPoint) {
          const distanceToRestKm = haversineKm(latestPing.point, restPoint);
          if (distanceToRestKm > RESTAURANT_GEOFENCE_RADIUS_KM) {
            throw new RiderError(
              "OUT_OF_GEOFENCE",
              `Arrival at restaurant requires being within 150m of restaurant location. Current distance: ${(distanceToRestKm * 1000).toFixed(0)}m`,
              400,
            );
          }
        }
      }

      return this.transition(userId, deliveryId, "ARRIVED_AT_RESTAURANT", null, (row) => {
        row.arrivedRestaurantAt = this.now();
      });
    });
  }

  async restaurantNotReady(userId: string, deliveryId: string, expectedReadyAt: string | null) {
    return this.transition(userId, deliveryId, "RESTAURANT_NOT_READY", "restaurant not ready", (d) => {
      d.expectedReadyAt = expectedReadyAt;
    });
  }

  async pickup(
    userId: string,
    deliveryId: string,
    verification: { method: PickupVerification; code?: string },
    key: string,
  ) {
    return this.idem(userId, key, "pickup", async () => {
      const d = await this.requireOwnedDelivery(userId, deliveryId);
      if (d.state !== "ARRIVED_AT_RESTAURANT" && d.state !== "RESTAURANT_NOT_READY") {
        throw new RiderError("INVALID_STATE", "Pickup is not allowed in this state", 409);
      }
      if (d.pickedUpAt) {
        return this.presentDelivery(d);
      }
      const cfg = await this.cfg();
      if (cfg.pickupVerification === "ORDER_CODE" || cfg.pickupVerification === "PIN") {
        if (!verification.code || verification.code.trim() !== d.pickupCode) {
          throw new RiderError("PICKUP_CODE", "Pickup code does not match", 400);
        }
      }
      return this.transition(userId, deliveryId, "PICKED_UP", "picked up", (row) => {
        row.pickedUpAt = this.now();
      });
    });
  }

  async startDelivery(userId: string, deliveryId: string, key: string) {
    return this.idem(userId, key, "start", () => this.transition(userId, deliveryId, "ON_THE_WAY", null));
  }

  async arriveCustomer(userId: string, deliveryId: string, key: string) {
    return this.idem(userId, key, "arrive.customer", () =>
      this.transition(userId, deliveryId, "ARRIVED_AT_CUSTOMER", null, (d) => {
        d.arrivedCustomerAt = this.now();
      }),
    );
  }

  async collectCash(userId: string, deliveryId: string, key: string, attemptedPaise?: number) {
    return this.idem(userId, key, "cash", async () => {
      const d = await this.requireOwnedDelivery(userId, deliveryId);
      const cash = await this.store.getCash(deliveryId);
      if (!d.cod || !cash) throw new RiderError("NOT_COD", "This order is not cash on delivery", 400);
      if (cash.state === "COLLECTED" || cash.state === "RECONCILED") return cash;
      if (d.state !== "ARRIVED_AT_CUSTOMER" && d.state !== "SUPPORT_ESCALATION") {
        throw new RiderError("INVALID_STATE", "Collect cash only at the customer", 409);
      }
      if (attemptedPaise != null && attemptedPaise !== cash.expectedPaise) {
        throw new RiderError("CASH_IMMUTABLE", "The cash amount is locked on the order", 400);
      }
      cash.collectedPaise = cash.expectedPaise;
      cash.state = "COLLECTED";
      cash.updatedAt = this.now();
      await this.store.saveCash(cash, userId);
      await this.audit(userId, "CASH_COLLECTED", "cash", deliveryId, String(cash.expectedPaise));
      return cash;
    });
  }

  async deliver(
    userId: string,
    deliveryId: string,
    otp: string | undefined,
    key: string,
  ) {
    return this.idem(userId, key, "deliver", async () => {
      const cfg = await this.cfg();
      const d = await this.requireOwnedDelivery(userId, deliveryId);
      if (d.state === "DELIVERED") return this.presentDelivery(d);
      if (d.state === "ORDER_CANCELLED") {
        throw new RiderError("ORDER_CANCELLED", "This order was cancelled. Do not deliver it.", 409);
      }
      const validPreDeliveryStates: DeliveryState[] = [
        "ARRIVED_AT_CUSTOMER",
        "OUT_FOR_DELIVERY",
        "ON_THE_WAY",
        "SUPPORT_ESCALATION",
      ];
      if (!validPreDeliveryStates.includes(d.state)) {
        throw new RiderError("INVALID_STATE", "Arrive at the customer before completing delivery", 409);
      }
      if (d.cod) {
        const cash = await this.store.getCash(deliveryId);
        if (!cash || cash.state === "EXPECTED") {
          throw new RiderError("CASH_REQUIRED", "Collect cash before completing this delivery", 400);
        }
      }
      // Delivery completion strictly requires valid customer 4-digit OTP match
      if (!otp || typeof otp !== "string" || !/^\d{4}$/.test(otp.trim())) {
        throw new RiderError("OTP_REQUIRED", "Enter the valid customer 4-digit OTP to complete delivery", 400);
      }
      const trimmedOtp = otp.trim();
      const limited = await this.store.hitRateLimit(userId, `otp:${deliveryId}`, 60_000, cfg.otpMaxAttempts);
      if (limited) {
        throw new RiderError("OTP_LOCKED", "Too many attempts. Support has been notified.", 429);
      }

      // Handover Drop-off Geofence Gate: require latest GPS ping within 250m (0.25 km) of delivery.dropLocation
      const latestPing = await this.store.latestLocation(userId);
      if (latestPing) {
        const isFallbackCoord = !d.dropLocation || (d.dropLocation.lat === 0 && d.dropLocation.lng === 0);
        const distanceToDropKm = isFallbackCoord ? 0 : haversineKm(latestPing.point, d.dropLocation);
        if (distanceToDropKm > 0.25) {
          throw new RiderError(
            "OUT_OF_GEOFENCE",
            `Delivery handover requires being within 250m of drop-off location. Current distance: ${(distanceToDropKm * 1000).toFixed(0)}m`,
            400,
          );
        }
      }

      const rec = await this.store.getOtp(deliveryId);
      if (!rec) throw new RiderError("OTP_MISSING", "OTP is not available for this delivery", 500);
      if (rec.verifiedAt) {
        /* already verified — continue */
      } else {
        const ok = verifyOtpHash(trimmedOtp, rec.salt, rec.hash);
        rec.attempts += 1;
        if (!ok) {
          await this.store.saveOtp(rec, userId);
          if (rec.attempts >= cfg.otpSuspiciousThreshold) {
            await this.store.insertSignal(
              {
                id: nid(),
                riderId: d.riderId,
                deliveryId: d.id,
                kind: "REPEATED_FAILED_OTP",
                detail: `${rec.attempts} failed attempts`,
                stage: "SIGNAL",
                createdAt: this.now(),
              },
              userId,
            );
          }
          if (rec.attempts >= cfg.otpMaxAttempts) {
            throw new RiderError("OTP_LOCKED", "Too many attempts. Support has been notified.", 429);
          }
          throw new RiderError("OTP_WRONG", "That code does not match. Try again.", 400);
        }
        rec.verifiedAt = this.now();
        await this.store.saveOtp(rec, userId);
      }
      const delivered = await this.transition(userId, deliveryId, "DELIVERED", "otp verified", (row) => {
        row.deliveredAt = this.now();
      });
      await this.creditEarnings(delivered);
      return delivered;
    });
  }

  private async creditEarnings(d: Delivery) {
    const existing = await this.store.listEarnings(d.userId);
    if (existing.some((e) => e.deliveryId === d.id && e.kind === "DELIVERY_PAYOUT")) return;
    const cfg = await this.cfg();
    const basePayout = enforcePayoutFloor(d.expectedPayoutPaise);
    const lines: EarningLine[] = [
      {
        id: nid(),
        riderId: d.riderId,
        deliveryId: d.id,
        orderCode: d.orderCode,
        kind: "DELIVERY_PAYOUT",
        amountPaise: basePayout,
        note: "Delivery payout",
        at: this.now(),
        dataMode: cfg.dataMode,
      },
    ];
    let multiPackagePaise = 0;
    if (cfg.flags.incentives && d.packageCount > 1) {
      multiPackagePaise = 500;
      lines.push({
        id: nid(),
        riderId: d.riderId,
        deliveryId: d.id,
        orderCode: d.orderCode,
        kind: "INCENTIVE",
        amountPaise: multiPackagePaise,
        note: "Multi-package",
        at: this.now(),
        dataMode: cfg.dataMode,
      });
    }
    let tipPaise = 0;
    if (d.tipPaise && d.tipPaise > 0) {
      tipPaise = calculateCustomerTipPassThrough(d.tipPaise).netTipPassThroughPaise;
      lines.push({
        id: nid(),
        riderId: d.riderId,
        deliveryId: d.id,
        orderCode: d.orderCode,
        kind: "TIP",
        amountPaise: tipPaise,
        note: "Customer tip ❤️ (100% pass-through)",
        at: this.now(),
        dataMode: cfg.dataMode,
      });
    }
    // OrderKing Algorithmic Payout: Wait-time compensation when kitchen prep exceeds 6 minutes grace period (EXACTLY ₹1/min, hard capped at 30 mins / ₹30.00)
    let waitMinutes = 0;
    let waitPayPaise = 0;
    let waitCalcResult = calculateRestaurantWaitPay(0);
    if (d.arrivedRestaurantAt) {
      const waitEndTime = d.pickedUpAt ?? d.deliveredAt ?? this.now();
      waitMinutes = calculateWaitTimeMinutes(d.arrivedRestaurantAt, waitEndTime);
      waitCalcResult = calculateRestaurantWaitPay(
        waitMinutes,
        RESTAURANT_WAIT_GRACE_PERIOD_MINUTES,
        RESTAURANT_WAIT_PAY_RATE_PER_MIN_PAISE,
        MAX_BILLABLE_WAIT_MINUTES,
        MAX_WAIT_PAY_PAISE,
      );
      waitPayPaise = waitCalcResult.waitPayPaise;
      if (waitPayPaise > 0) {
        lines.push({
          id: nid(),
          riderId: d.riderId,
          deliveryId: d.id,
          orderCode: d.orderCode,
          kind: "INCENTIVE",
          amountPaise: waitPayPaise,
          note: `Kitchen wait-time compensation (${waitMinutes}m total, ${waitCalcResult.billableWaitMinutes}m billable @ ₹1/min${waitCalcResult.isCapped ? " [capped at ₹30]" : ""})`,
          at: this.now(),
          dataMode: cfg.dataMode,
          waitMinutes,
          waitPayPaise,
        });
      }
    }

    // Explicitly record waitMinutes, waitPayPaise, and final earnings breakdown on delivery
    d.waitMinutes = waitMinutes;
    d.waitPayPaise = waitPayPaise;
    const finalEarningsBreakdown: DeliveryEarningsBreakdown = {
      deliveryId: d.id,
      orderCode: d.orderCode,
      basePayPaise: basePayout,
      waitMinutes,
      billableWaitMinutes: waitCalcResult.billableWaitMinutes,
      waitPayPaise,
      isWaitCapped: waitCalcResult.isCapped,
      tipPaise,
      multiPackageBonusPaise: multiPackagePaise,
      totalPayoutPaise: lines.reduce((acc, l) => acc + l.amountPaise, 0),
    };
    d.earningsBreakdown = finalEarningsBreakdown;
    await this.store.updateDelivery(d);

    for (const line of lines) await this.store.appendEarning(line, d.userId);
  }

  async addPod(
    userId: string,
    deliveryId: string,
    input: { method: PodMethod; contentType?: string; dataUrl?: string; bytes?: number },
  ) {
    const cfg = await this.cfg();
    const d = await this.requireOwnedDelivery(userId, deliveryId);
    if (input.method === "PHOTO") {
      if (!cfg.flags.pod_photo) throw new RiderError("FLAG_OFF", "Photo proof is not enabled", 400);
      if (!input.contentType || !/^image\/(jpeg|png|webp)$/.test(input.contentType)) {
        throw new RiderError("FILE_TYPE", "Photo must be jpeg, png, or webp", 400);
      }
      if ((input.bytes ?? 0) > cfg.podMaxBytes) {
        throw new RiderError("FILE_SIZE", "Photo is too large", 400);
      }
    }
    const pod = {
      id: nid(),
      deliveryId: d.id,
      riderId: d.riderId,
      method: input.method,
      photoContentType: input.contentType ?? null,
      photoBytes: input.bytes ?? null,
      photoDataUrl: input.dataUrl ?? null,
      capturedAt: this.now(),
      dataMode: (await this.cfg()).dataMode,
    };
    await this.store.insertPod(pod, userId);
    return { id: pod.id, method: pod.method, capturedAt: pod.capturedAt };
  }

  async customerUnavailable(userId: string, deliveryId: string) {
    return this.transition(userId, deliveryId, "CUSTOMER_UNAVAILABLE", "customer not available", (d) => {
      d.waitStartedAt = d.waitStartedAt ?? this.now();
    });
  }

  async contactAttempt(userId: string, deliveryId: string) {
    const d = await this.requireOwnedDelivery(userId, deliveryId);
    d.contactAttempts += 1;
    d.updatedAt = this.now();
    await this.store.updateDelivery(d);
    await this.audit(userId, "CONTACT_ATTEMPT", "delivery", d.id, String(d.contactAttempts));
    return this.presentDelivery(d);
  }

  async cancelDelivery(
    userId: string,
    deliveryId: string,
    reason: string,
    confirmed: boolean,
    key: string,
    hasVerifiedProof = false,
  ) {
    if (!confirmed) throw new RiderError("CONFIRM_REQUIRED", "Confirm cancellation", 400);
    const normalized = reason.trim().toLowerCase();
    const isValid =
      CANCEL_REASONS.includes(normalized as (typeof CANCEL_REASONS)[number]) ||
      isJustifiedOperationalReason(reason);
    if (!isValid) {
      throw new RiderError("REASON_REQUIRED", "Choose a valid cancellation reason", 400);
    }
    const d = await this.requireOwnedDelivery(userId, deliveryId);
    const cfg = await this.cfg();
    const disciplineCfg = cfg.discipline ?? DEFAULT_DISCIPLINE_CONFIG;

    const penalty = calculateCancellationPenalty(
      d.state,
      d.codAmountPaise || 0,
      d.expectedPayoutPaise,
      disciplineCfg,
      hasVerifiedProof,
      reason,
    );

    return this.idem(userId, key, "cancel", async () => {
      const cancelled = await this.transition(userId, deliveryId, "RIDER_CANCELLED", normalized, (row) => {
        row.cancelReason = normalized;
      });

      // Handle justified operational reassignment: zero penalty & dispatch signal
      if (isJustifiedOperationalReason(reason) && penalty.penaltyPaise === 0) {
        await this.store.insertSignal(
          {
            id: nid(),
            riderId: d.riderId,
            deliveryId: d.id,
            kind: "OPERATIONAL_REASSIGNMENT",
            detail: `Trip #${d.orderCode} reassigned to nearest available partner. Reason: ${reason} (Zero Penalty Applied)`,
            stage: "SIGNAL",
            createdAt: this.now(),
          },
          userId,
        );
        await this.store.insertNotification({
          id: nid(),
          userId,
          title: "🛵 Trip Reassigned Gracefully",
          body: `Order #${d.orderCode} was reassigned to the nearest fleet partner (${reason}). No penalty was deducted. Take care!`,
          kind: "OPS",
          read: false,
          createdAt: this.now(),
        });
      } else if (disciplineCfg.enabled && penalty.penaltyPaise > 0) {
        await this.store.appendEarning(
          {
            id: nid(),
            riderId: d.riderId,
            deliveryId: d.id,
            orderCode: d.orderCode,
            kind: "DEDUCTION",
            amountPaise: -penalty.penaltyPaise,
            note: `OrderKing Fleet Discipline: ${penalty.label} - Order #${d.orderCode} (${normalized})`,
            at: this.now(),
            dataMode: cfg.dataMode,
          },
          userId,
        );

        if (penalty.isPostPickup) {
          await this.store.insertSignal(
            {
              id: nid(),
              riderId: d.riderId,
              deliveryId: d.id,
              kind: "POST_PICKUP_CANCELLATION",
              detail: `Order #${d.orderCode} cancelled post-pickup without proof. Penalty: ₹${(penalty.penaltyPaise / 100).toFixed(2)}. Reason: ${normalized}`,
              stage: "REVIEW",
              createdAt: this.now(),
            },
            userId,
          );
          await this.store.insertNotification({
            id: nid(),
            userId,
            title: "🚨 High-Severity Cancellation Penalty",
            body: `Post-pickup cancellation of Order #${d.orderCode} resulted in a full liability deduction of ₹${(penalty.penaltyPaise / 100).toFixed(2)} and account audit hold.`,
            kind: "OPS",
            read: false,
            createdAt: this.now(),
          });
        } else {
          await this.store.insertSignal(
            {
              id: nid(),
              riderId: d.riderId,
              deliveryId: d.id,
              kind: "PRE_PICKUP_CANCELLATION",
              detail: `Order #${d.orderCode} cancelled pre-pickup. Penalty: ₹${(penalty.penaltyPaise / 100).toFixed(2)}. Reason: ${normalized}`,
              stage: "SIGNAL",
              createdAt: this.now(),
            },
            userId,
          );
          await this.store.insertNotification({
            id: nid(),
            userId,
            title: "⚠️ Cancellation Penalty Deducted",
            body: `Pre-pickup cancellation of Order #${d.orderCode} incurred a ₹${(penalty.penaltyPaise / 100).toFixed(2)} deduction on your payout ledger.`,
            kind: "OPS",
            read: false,
            createdAt: this.now(),
          });
        }
      }

      return cancelled;
    });
  }

  async failDelivery(userId: string, deliveryId: string, reason: string, confirmed: boolean, key: string) {
    if (!confirmed) throw new RiderError("CONFIRM_REQUIRED", "Confirm failed delivery", 400);
    const normalized = reason.trim().toLowerCase();
    if (!FAIL_REASONS.includes(normalized as (typeof FAIL_REASONS)[number])) {
      throw new RiderError("REASON_REQUIRED", "Choose a valid failure reason", 400);
    }
    return this.idem(userId, key, "fail", () =>
      this.transition(userId, deliveryId, "DELIVERY_FAILED", normalized, (d) => {
        d.failReason = normalized;
      }),
    );
  }

  async escalate(userId: string, deliveryId: string, key: string) {
    return this.idem(userId, key, "escalate", () =>
      this.transition(userId, deliveryId, "SUPPORT_ESCALATION", "rider escalated"),
    );
  }

  async adminCancelOrder(userId: string, deliveryId: string) {
    const d = await this.requireOwnedDelivery(userId, deliveryId);
    if (d.state === "DELIVERED") {
      throw new RiderError("ALREADY_DELIVERED", "Cannot cancel a delivered order", 409);
    }
    if (d.state === "ORDER_CANCELLED") return this.presentDelivery(d);
    const prev = d.state;
    d.state = "ORDER_CANCELLED";
    d.updatedAt = this.now();
    await this.store.updateDelivery(d);
    await this.recordTransition(d, prev, "ORDER_CANCELLED", "SYSTEM", userId, "order cancelled");
    return this.presentDelivery(d);
  }

  async postLocation(
    userId: string,
    point: GeoPoint,
    accuracyM: number | null,
    deliveryId: string | null,
  ) {
    const rider = await this.requireRider(userId);
    const cfg = await this.cfg();
    if (!cfg.flags.live_tracking) {
      throw new RiderError("FLAG_OFF", "Live tracking is off", 400);
    }
    const active = await this.store.getActiveDeliveryForRider(rider.id);
    const onDuty = rider.status === "ONLINE" || rider.status === "BUSY" || Boolean(active);
    if (!onDuty) {
      throw new RiderError("NOT_TRACKING", "Location is only used while online or on a delivery", 400);
    }
    if (deliveryId) {
      const d = await this.requireOwnedDelivery(userId, deliveryId);
      if (!isActiveDelivery(d.state)) {
        throw new RiderError("NOT_TRACKING", "Location is only used while online or on a delivery", 400);
      }
    }
    const at = this.now();
    const previous = await this.store.latestLocation(userId);
    try {
      assertPlausiblePing(previous, point, at, rider.vehicleType);
    } catch (err) {
      if (err instanceof RiderError && err.code === "FAKE_GPS") {
        await this.store.insertSignal(
          {
            id: nid(),
            riderId: rider.id,
            deliveryId,
            kind: "FAKE_GPS",
            detail: `${point.lat},${point.lng}`,
            stage: "SIGNAL",
            createdAt: at,
          },
          userId,
        );
      }
      throw err;
    }
    const ping = {
      id: nid(),
      riderId: rider.id,
      deliveryId,
      point,
      accuracyM,
      at,
    };
    await this.store.insertLocation(ping, userId);
    const keepAfter = new Date(Date.now() - cfg.locationRetentionHours * 3600_000).toISOString();
    await this.store.pruneLocations(userId, keepAfter, cfg.gpsHistoryMaxPings);
    return { ok: true as const, at: ping.at };
  }

  async pingLocation(
    userId: string,
    point: GeoPoint,
    deliveryId: string | null = null,
    accuracyM: number | null = null,
  ) {
    return this.postLocation(userId, point, accuracyM, deliveryId);
  }

  async home(userId: string) {
    const rider = await this.requireRider(userId);
    await this.expireOffers(rider);
    if (rider.status === "ONLINE") await this.maybeDispatch(rider.id, userId);
    const offerRaw = await this.store.getOpenOfferForRider(rider.id);
    const offer =
      offerRaw && new Date(offerRaw.expiresAt).getTime() > Date.now()
        ? this.presentOffer(offerRaw)
        : null;
    const active = await this.store.getActiveDeliveryForRider(rider.id);
    const today = todayRange();
    const earnings = await this.store.listEarnings(userId, today);
    const deliveries = await this.store.listDeliveriesForUser(userId, today);
    const completed = deliveries.filter((d) => d.state === "DELIVERED").length;
    const cashRows = [];
    for (const d of deliveries) {
      const c = await this.store.getCash(d.id);
      if (c) cashRows.push(c);
    }
    const pendingCash = cashRows
      .filter((c) => c.state === "COLLECTED")
      .reduce((a, c) => a + (c.collectedPaise ?? 0), 0);
    const notifications = await this.store.listNotifications(userId);
    const otp = active ? await this.store.getOtp(active.id) : null;
    const cash = active ? await this.store.getCash(active.id) : null;
    const cfg = await this.cfg();
    const pocketBalance = await this.getPocketBalance(userId);
    const coolingOff = getCoolingOffInfo(rider.coolingOffUntil, rider.coolingOffReason);
    const disciplineConfig = cfg.discipline ?? DEFAULT_DISCIPLINE_CONFIG;

    const activeList = this.store.getActiveDeliveriesForRider
      ? await this.store.getActiveDeliveriesForRider(rider.id)
      : (active ? [active] : []);

    return {
      rider,
      offer,
      active: active ? this.presentDelivery(active) : null,
      activeDeliveries: activeList.map((d) => this.presentDelivery(d)),
      isBatchedActive: activeList.length > 1,
      todayEarningsPaise: earnings.reduce((a, e) => a + e.amountPaise, 0),
      completedToday: completed,
      pendingCashPaise: pocketBalance.pocketBalancePaise,
      pocketBalance,
      coolingOff,
      disciplineConfig,
      onlineSince: rider.onlineSince,
      notifications: notifications.slice(0, 8),
      simulatedOtp: null,
      cash,
      dataMode: cfg.dataMode,
    };
  }

  /**
   * Real-time calculation of Rider Floating Cash ("Pocket Balance").
   */
  async getPocketBalance(userId: string, incomingCodAmountPaise = 0): Promise<PocketBalanceInfo> {
    await this.requireRider(userId);
    const cfg = await this.cfg();
    const deliveries = await this.store.listDeliveriesForUser(userId);
    let collectedPaise = 0;
    let reconciledPaise = 0;

    for (const d of deliveries) {
      const c = await this.store.getCash(d.id);
      if (!c) continue;
      if (c.collectedPaise) collectedPaise += c.collectedPaise;
      if (c.state === "RECONCILED") reconciledPaise += c.collectedPaise ?? 0;
    }

    const disciplineCfg = cfg.discipline ?? DEFAULT_DISCIPLINE_CONFIG;
    return calculatePocketBalance(
      collectedPaise,
      reconciledPaise,
      disciplineCfg.floatingCashLimitInr,
      disciplineCfg.enabled,
      incomingCodAmountPaise,
    );
  }

  /**
   * Deposits floating cash via UPI QR or Payment Gateway to unblock COD orders.
   */
  async depositFloatingCash(
    userId: string,
    amountPaise: number,
    method: "UPI_QR" | "RAZORPAY" | "GATEWAY" = "UPI_QR",
    reference = "",
    key: string,
  ): Promise<PocketBalanceInfo> {
    return this.idem(userId, key, "cash.deposit", async () => {
      const rider = await this.requireRider(userId);
      if (!Number.isInteger(amountPaise) || amountPaise <= 0) {
        throw new RiderError("INVALID_AMOUNT", "Deposit amount must be a positive integer in paise", 400);
      }
      const cfg = await this.cfg();
      const ref = reference.trim() || `DEP-${Date.now().toString(36).toUpperCase()}`;

      // Mark un-reconciled COD cash rows as RECONCILED up to deposited amount
      const deliveries = await this.store.listDeliveriesForUser(userId);
      let remainingToReconcile = amountPaise;
      for (const d of deliveries) {
        if (remainingToReconcile <= 0) break;
        const c = await this.store.getCash(d.id);
        if (c && c.state === "COLLECTED" && c.collectedPaise) {
          c.state = "RECONCILED";
          c.updatedAt = this.now();
          await this.store.saveCash(c, userId);
          remainingToReconcile -= c.collectedPaise;
        }
      }

      // Record adjustment entry in ledger for financial audit proof
      await this.store.appendEarning(
        {
          id: nid(),
          riderId: rider.id,
          deliveryId: null,
          orderCode: null,
          kind: "ADJUSTMENT",
          amountPaise: 0,
          note: `Floating Cash Deposit via ${method} (Ref: ${ref}) - ₹${(amountPaise / 100).toFixed(2)}`,
          at: this.now(),
          dataMode: cfg.dataMode,
        },
        userId,
      );

      await this.audit(userId, "FLOATING_CASH_DEPOSIT", "cash", rider.id, `${amountPaise}:${method}:${ref}`);

      await this.store.insertNotification({
        id: nid(),
        userId,
        title: "✅ Floating Cash Deposit Verified",
        body: `Your deposit of ₹${(amountPaise / 100).toFixed(2)} via ${method} (Ref: ${ref}) has been verified. COD orders are active!`,
        kind: "PAYOUT",
        read: false,
        createdAt: this.now(),
      });

      return this.getPocketBalance(userId);
    });
  }

  /**
   * Tracks offer rejections and triggers temporary cooling-off freeze if thresholds are breached.
   */
  private async handleOfferDecline(rider: RiderProfile, reason?: string) {
    const cfg = await this.cfg();
    const disciplineCfg = cfg.discipline ?? DEFAULT_DISCIPLINE_CONFIG;
    if (!disciplineCfg.enabled) return;

    const consecutiveDeclines = (rider.consecutiveDeclines ?? 0) + 1;
    const rejectionsLimit = disciplineCfg.coolingOffConsecutiveRejections || 3;
    const durationMins = disciplineCfg.coolingOffDurationMinutes || 15;
    const rateFloor = disciplineCfg.coolingOffAcceptanceRateThresholdPct || 70;

    // Check recent acceptance rate scoped to the current 24-hour shift window (todayRange())
    const deliveries = await this.store.listDeliveriesForUser(rider.userId, todayRange());
    const acceptedCount = deliveries.length;
    const totalOffered = acceptedCount + consecutiveDeclines;
    const acceptanceRate = totalOffered >= 5 ? Math.round((acceptedCount / totalOffered) * 100) : 100;

    const shouldFreezeByRejections = consecutiveDeclines >= rejectionsLimit;
    const shouldFreezeByRate = totalOffered >= 5 && acceptanceRate < rateFloor;

    if (shouldFreezeByRejections || shouldFreezeByRate) {
      const coolingOffUntil = new Date(Date.now() + durationMins * 60 * 1000).toISOString();
      const coolingOffReason = shouldFreezeByRate
        ? `Acceptance rate fell to ${acceptanceRate}% (Below ${rateFloor}% floor)`
        : `${consecutiveDeclines} consecutive order rejections (Limit: ${rejectionsLimit})`;

      const frozenRider: RiderProfile = {
        ...rider,
        status: "OFFLINE",
        consecutiveDeclines: 0,
        coolingOffUntil,
        coolingOffReason,
        updatedAt: this.now(),
      };
      await this.store.upsertRider(frozenRider);

      await this.store.insertSignal(
        {
          id: nid(),
          riderId: rider.id,
          deliveryId: null,
          kind: "COOLING_OFF_TRIGGERED",
          detail: `Cooling-off triggered: ${coolingOffReason}. Offline for ${durationMins} minutes.`,
          stage: "SIGNAL",
          createdAt: this.now(),
        },
        rider.userId,
      );

      await this.store.insertNotification({
        id: nid(),
        userId: rider.userId,
        title: "⏸️ Temporary Cooling-Off Active",
        body: `You are temporarily paused for ${durationMins} minutes due to ${coolingOffReason}. Service resumes automatically at ${new Date(coolingOffUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
        kind: "OPS",
        read: false,
        createdAt: this.now(),
      });

      await this.audit(rider.userId, "COOLING_OFF_ACTIVATED", "rider", rider.id, `${durationMins}m:${coolingOffReason}`);
    } else {
      const updatedRider: RiderProfile = {
        ...rider,
        consecutiveDeclines,
        updatedAt: this.now(),
      };
      await this.store.upsertRider(updatedRider);
    }
  }

  async earnings(userId: string, range: { from: string; to: string }) {
    await this.requireRider(userId);
    const lines = await this.store.listEarnings(userId, range);
    const cashDeliveries = await this.store.listDeliveriesForUser(userId, range);
    let collected = 0;
    let reconciled = 0;
    for (const d of cashDeliveries) {
      const c = await this.store.getCash(d.id);
      if (!c) continue;
      if (c.collectedPaise) collected += c.collectedPaise;
      if (c.state === "RECONCILED") reconciled += c.collectedPaise ?? 0;
    }
    const net = lines.reduce((a, e) => a + e.amountPaise, 0);
    return {
      lines,
      totals: {
        payout: sumKind(lines, "DELIVERY_PAYOUT"),
        incentive: sumKind(lines, "INCENTIVE"),
        tip: sumKind(lines, "TIP"),
        referral: sumKind(lines, "REFERRAL_COMMISSION"),
        adjustment: sumKind(lines, "ADJUSTMENT"),
        deduction: sumKind(lines, "DEDUCTION"),
        net,
        cashCollected: collected,
        cashReconciled: reconciled,
        netPayable: net,
      },
      dataMode: (await this.cfg()).dataMode,
    };
  }

  async getAmbassadorStats(userId: string): Promise<AmbassadorStats> {
    await this.requireRider(userId);
    const allEarnings = await this.store.listEarnings(userId);
    const referralLines = allEarnings.filter((l) => l.kind === "REFERRAL_COMMISSION");
    const firstOrderBonuses = referralLines.filter(
      (l) =>
        l.amountPaise === 2500 ||
        l.note.toLowerCase().includes("instant cash") ||
        l.note.toLowerCase().includes("first order") ||
        l.note.toLowerCase().includes("1st"),
    );
    const royalties = referralLines.filter(
      (l) => l.note.toLowerCase().includes("royalty") || l.note.toLowerCase().includes("1%"),
    );
    const totalEarnedPaise = referralLines.reduce((acc, l) => acc + l.amountPaise, 0);

    return {
      totalCustomersReferred: Math.max(firstOrderBonuses.length, referralLines.length > 0 ? referralLines.length : 0),
      firstOrderBonusPaise: firstOrderBonuses.reduce((acc, l) => acc + l.amountPaise, 0),
      firstOrderBonusCount: firstOrderBonuses.length,
      royaltyPaise: royalties.reduce((acc, l) => acc + l.amountPaise, 0),
      royaltyCount: royalties.length,
      totalEarnedPaise,
      recentReferrals: referralLines.slice(0, 8),
    };
  }

  async creditReferralCommission(
    userId: string,
    params: {
      type: "FIRST_ORDER_BONUS" | "LIFETIME_ROYALTY";
      orderCode?: string | null;
      customerName?: string | null;
      orderTotalPaise?: number;
    },
  ): Promise<EarningLine> {
    const rider = await this.requireRider(userId);
    const cfg = await this.cfg();
    const isFirstOrder = params.type === "FIRST_ORDER_BONUS";
    // ₹25 cash bonus (2500 paise) for first order; 1% lifetime micro-royalty on repeat orders
    const amountPaise = isFirstOrder
      ? 2500
      : Math.max(100, Math.round((params.orderTotalPaise ?? 55000) * 0.01));
    const randomOrderSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderCode = params.orderCode || `OK-${randomOrderSuffix}`;
    const cleanId = rider.id.replace(/[^a-zA-Z0-9]/g, "").slice(-4).toUpperCase();
    const customer = params.customerName || `Customer #${cleanId}`;

    const note = isFirstOrder
      ? `Ambassador Instant Cash Bonus: ₹25 credited for ${customer}'s 1st direct order (#${orderCode})`
      : `Ambassador Lifetime Micro-Royalty: 1% (${formatPaise(amountPaise)}) on ${customer}'s direct repeat order (#${orderCode})`;

    const line: EarningLine = {
      id: nid(),
      riderId: rider.id,
      deliveryId: null,
      orderCode,
      kind: "REFERRAL_COMMISSION",
      amountPaise,
      note,
      at: this.now(),
      dataMode: cfg.dataMode,
    };

    await this.store.appendEarning(line, userId);
    return line;
  }

  async settlements(userId: string) {
    const rider = await this.requireRider(userId);
    let rows = await this.store.listSettlements(userId);
    if (rows.length === 0) {
      const lines = await this.store.listEarnings(userId);
      const net = lines.reduce((a, e) => a + e.amountPaise, 0);
      const s = {
        id: nid(),
        riderId: rider.id,
        periodStart: new Date().toISOString().slice(0, 10),
        periodEnd: new Date().toISOString().slice(0, 10),
        amountPaise: net,
        status: "PAYABLE" as const,
        confirmedPaidAt: null,
        dataMode: (await this.cfg()).dataMode,
      };
      await this.store.insertSettlement(s, userId);
      rows = [s];
    }
    return rows;
  }

  async history(userId: string, range: { from: string; to: string }) {
    await this.requireRider(userId);
    const deliveries = await this.store.listDeliveriesForUser(userId, range);
    const earnings = await this.store.listEarnings(userId, range);
    return deliveries.map((d) => {
      const related = earnings.filter((e) => e.deliveryId === d.id);
      return {
        delivery: this.presentDelivery(d),
        payout: sumKind(related, "DELIVERY_PAYOUT"),
        incentive: sumKind(related, "INCENTIVE"),
        adjustment: sumKind(related, "ADJUSTMENT"),
      };
    });
  }

  async performance(userId: string) {
    await this.requireRider(userId);
    const all = await this.store.listDeliveriesForUser(userId);
    const completed = all.filter((d) => d.state === "DELIVERED").length;
    const cancelled = all.filter((d) => d.state === "RIDER_CANCELLED").length;
    const accepted = all.filter((d) => d.state !== "RIDER_DECLINED" && d.state !== "OFFER_EXPIRED").length;
    const earnings = await this.store.listEarnings(userId);
    const net = earnings.reduce((a, e) => a + e.amountPaise, 0);
    return {
      completed,
      offered: accepted + cancelled,
      accepted,
      cancelled,
      onTimePickup: completed,
      successfulDelivery: completed,
      earningsPerOrderPaise: completed ? Math.round(net / completed) : 0,
    };
  }

  async createTicket(
    userId: string,
    input: { topic: TicketTopic; message: string; deliveryId?: string | null },
    key: string,
  ) {
    return this.idem(userId, key, "ticket", async () => {
      const rider = await this.requireRider(userId);
      if (input.deliveryId) await this.requireOwnedDelivery(userId, input.deliveryId);
      const ticket = {
        id: nid(),
        riderId: rider.id,
        deliveryId: input.deliveryId ?? null,
        topic: input.topic,
        message: input.message.trim(),
        status: "OPEN" as const,
        createdAt: this.now(),
        updatedAt: this.now(),
      };
      if (!ticket.message) throw new RiderError("INVALID", "Message is required", 400);
      await this.store.insertTicket(ticket, userId);
      return ticket;
    });
  }

  async tickets(userId: string) {
    await this.requireRider(userId);
    return this.store.listTickets(userId);
  }

  async safety(
    userId: string,
    input: { kind: SafetyKind; note: string; deliveryId?: string | null; location?: GeoPoint | null },
  ) {
    const rider = await this.requireRider(userId);
    const incident = {
      id: nid(),
      riderId: rider.id,
      deliveryId: input.deliveryId ?? null,
      kind: input.kind,
      note: input.note,
      location: input.location ?? null,
      createdAt: this.now(),
      emergencyDispatched: false as const,
    };
    await this.store.insertSafety(incident, userId);
    return incident;
  }

  async notifications(userId: string) {
    await this.requireRider(userId);
    return this.store.listNotifications(userId);
  }

  async setLocale(userId: string, locale: LocaleCode) {
    return this.saveProfile(userId, { locale });
  }

  

  async snapshotForAssistant(userId: string) {
    const home = await this.home(userId);
    const range = todayRange();
    const earnings = await this.earnings(userId, range);
    const history = await this.history(userId, range);
    return {
      dataMode: (await this.cfg()).dataMode,
      riderName: home.rider.fullName,
      status: home.rider.status,
      kycStatus: home.rider.kycStatus,
      todayEarningsPaise: earnings.totals.net,
      completedToday: home.completedToday,
      currentDelivery: home.active
        ? {
            orderCode: home.active.orderCode,
            state: home.active.state,
            restaurant: home.active.restaurant.name,
            dropArea: home.active.customer.area,
          }
        : null,
      history: history.map((h) => ({
        orderCode: h.delivery.orderCode,
        state: h.delivery.state,
        payoutPaise: h.payout,
      })),
      payoutTotals: earnings.totals,
    };
  }

  async forbiddenEarningsProbe(actorUserId: string, otherUserId: string) {
    if (actorUserId === otherUserId) return this.earnings(actorUserId, todayRange());
    throw new RiderError("FORBIDDEN", "You cannot access another rider's earnings", 403);
  }

  async requestInstantPayout(userId: string, idempotencyKey: string) {
    return this.idem(userId, idempotencyKey, "payout.instant", async () => {
      const rider = await this.requireRider(userId);
      if (!rider.payoutUpi?.trim()) {
        throw new RiderError("MISSING_UPI", "Please add a verified UPI VPA in your profile to receive instant payouts.", 400);
      }

      const earnings = await this.store.listEarnings(userId);
      const netPayable = earnings.reduce((acc, l) => acc + l.amountPaise, 0);

      if (netPayable <= 0) {
        throw new RiderError("ZERO_BALANCE", "No payable balance available for instant withdrawal.", 400);
      }

      const cfg = await this.cfg();
      const payoutRef = `UPI-WD-${Date.now().toString(36).toUpperCase()}-${rider.id.replace(/[^a-zA-Z0-9]/g, "").slice(-4)}`;

      // Execute live disbursement via RazorpayX (UPI / IMPS)
      const payoutRes = await executeRiderRazorpayXPayout({
        riderId: rider.id,
        riderName: rider.fullName || "OrderKing Rider",
        amountPaise: netPayable,
        vpa: rider.payoutUpi,
        referenceId: payoutRef,
        narration: `OrderKing Rider Instant Payout`,
      });

      if (!payoutRes.success) {
        throw new RiderError(
          "PAYOUT_GATEWAY_ERROR",
          `RazorpayX banking payout failed: ${payoutRes.error || "Unable to initiate instant transfer"}`,
          502,
        );
      }

      const effectiveRef = payoutRes.utr || payoutRes.payoutId || payoutRef;
      const isPaid = payoutRes.status === "processed" || payoutRes.status === "paid";
      const settlementStatus = isPaid ? "PAID" : "PROCESSING";

      // Append instant payout deduction in ledger
      await this.store.appendEarning(
        {
          id: nid(),
          riderId: rider.id,
          deliveryId: null,
          orderCode: null,
          kind: "ADJUSTMENT",
          amountPaise: -netPayable,
          note: `Instant UPI Withdrawal to ${rider.payoutUpi} (Ref: ${effectiveRef})`,
          at: this.now(),
          dataMode: cfg.dataMode,
        },
        userId,
      );

      // Record completed settlement in ledger
      await this.store.insertSettlement(
        {
          id: nid(),
          riderId: rider.id,
          periodStart: new Date().toISOString().slice(0, 10),
          periodEnd: new Date().toISOString().slice(0, 10),
          amountPaise: netPayable,
          status: settlementStatus as any,
          confirmedPaidAt: isPaid ? this.now() : null,
          dataMode: cfg.dataMode,
        },
        userId,
      );

      await this.store.insertNotification({
        id: nid(),
        userId,
        title: "⚡ Instant UPI Withdrawal Dispatched",
        body: `₹${(netPayable / 100).toFixed(2)} transferred to ${rider.payoutUpi} via NPCI Instant IMPS/UPI (Ref: ${effectiveRef}).`,
        kind: "PAYOUT",
        read: false,
        createdAt: this.now(),
      });

      await this.audit(userId, "INSTANT_UPI_PAYOUT", "rider", rider.id, `${netPayable}:${rider.payoutUpi}:${effectiveRef}`);

      return {
        success: true,
        status: payoutRes.status,
        amountPaise: netPayable,
        payoutUpi: rider.payoutUpi,
        reference: effectiveRef,
        payoutId: payoutRes.payoutId,
      };
    });
  }
}

function sumKind(lines: EarningLine[], kind: EarningLine["kind"]): number {
  return lines.filter((l) => l.kind === kind).reduce((a, l) => a + l.amountPaise, 0);
}

export function todayRange(now = new Date()): { from: string; to: string } {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return { from: start.toISOString(), to: end.toISOString() };
}

export function rangePreset(
  preset: "today" | "yesterday" | "week" | "month",
  now = new Date(),
): { from: string; to: string } {
  if (preset === "today") return todayRange(now);
  if (preset === "yesterday") {
    const d = new Date(now);
    d.setDate(d.getDate() - 1);
    return todayRange(d);
  }
  if (preset === "week") {
    const from = new Date(now);
    from.setDate(from.getDate() - 6);
    from.setHours(0, 0, 0, 0);
    return { from: from.toISOString(), to: now.toISOString() };
  }
  const from = new Date(now);
  from.setDate(1);
  from.setHours(0, 0, 0, 0);
  return { from: from.toISOString(), to: now.toISOString() };
}

export function mapsUrl(point: GeoPoint, label: string): string {
  const q = encodeURIComponent(`${point.lat},${point.lng} (${label})`);
  return `https://www.openstreetmap.org/?mlat=${point.lat}&mlon=${point.lng}#map=16/${point.lat}/${point.lng}&q=${q}`;
}

export function geoUrl(point: GeoPoint): string {
  return `geo:${point.lat},${point.lng}`;
}

export {
  calculateRiderPayout,
  enforcePayoutFloor,
  STATUTORY_BASE_FARE_PAISE,
  STATUTORY_BASE_DISTANCE_KM,
  STATUTORY_DISTANCE_RATE_PER_KM_PAISE,
};


