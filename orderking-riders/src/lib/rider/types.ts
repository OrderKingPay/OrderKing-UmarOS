/** Window 3 — Rider domain types. Integers for money are always paise. */

export type DataMode = "SIMULATED" | "LIVE";

export type RiderType =
  | "DELIVERY_PARTNER"
  | "PART_TIME"
  | "FULL_TIME"
  | "VOLUNTEER";

export type KycStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "VERIFIED"
  | "REJECTED"
  | "SUSPENDED";

export type AvailabilityStatus = "OFFLINE" | "ONLINE" | "BUSY";

export type VehicleType = "BICYCLE" | "MOTORCYCLE" | "SCOOTER" | "WALKING";

export type DeliveryState =
  | "OFFERED"
  | "OFFER_PRESENTED"
  | "ACCEPTED"
  | "ARRIVING_AT_RESTAURANT"
  | "ARRIVED_AT_RESTAURANT"
  | "ARRIVED_AT_STORE"
  | "PICKED_UP"
  | "ON_THE_WAY"
  | "OUT_FOR_DELIVERY"
  | "ARRIVED_AT_CUSTOMER"
  | "DELIVERED"
  | "OFFER_EXPIRED"
  | "RIDER_DECLINED"
  | "RIDER_CANCELLED"
  | "RESTAURANT_NOT_READY"
  | "CUSTOMER_UNAVAILABLE"
  | "DELIVERY_FAILED"
  | "ORDER_CANCELLED"
  | "SUPPORT_ESCALATION";

export const TERMINAL_DELIVERY_STATES: ReadonlySet<DeliveryState> = new Set([
  "DELIVERED",
  "OFFER_EXPIRED",
  "RIDER_DECLINED",
  "RIDER_CANCELLED",
  "DELIVERY_FAILED",
  "ORDER_CANCELLED",
]);

export type OfferStatus = "OPEN" | "ACCEPTED" | "DECLINED" | "EXPIRED";

export type CashState =
  | "EXPECTED"
  | "COLLECTED"
  | "RECONCILED"
  | "SHORT"
  | "OVER"
  | "DISPUTED";

export type SettlementStatus =
  | "PAYABLE"
  | "PROCESSING"
  | "PAID"
  | "FAILED"
  | "ON_HOLD"
  | "DISPUTED";

export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export type TicketTopic =
  | "ORDER_ISSUE"
  | "RESTAURANT_ISSUE"
  | "CUSTOMER_UNAVAILABLE"
  | "CASH_DISPUTE"
  | "PAYMENT_ISSUE"
  | "APP_ISSUE"
  | "VEHICLE_PROBLEM"
  | "SAFETY_ISSUE"
  | "OTHER";

export type SafetyKind =
  | "EMERGENCY_CALL"
  | "SHARE_LOCATION"
  | "UNSAFE_SITUATION"
  | "ROAD_BLOCKAGE"
  | "ACCIDENT"
  | "CUSTOMER_ISSUE"
  | "RESTAURANT_ISSUE"
  | "PLATFORM_SUPPORT";

export type PickupVerification =
  | "ORDER_CODE"
  | "QR"
  | "RESTAURANT_CONFIRM"
  | "PIN"
  | "SCAN";

export type PodMethod = "OTP" | "PHOTO" | "RECIPIENT_CONFIRM" | "SIGNATURE";

export type Actor = "RIDER" | "SYSTEM" | "DISPATCH" | "RESTAURANT" | "CUSTOMER" | "ADMIN" | "SUPPORT";

export type GeoPoint = { lat: number; lng: number };

export type LocaleCode =
  | "en"
  | "hi"
  | "bn"
  | "te"
  | "mr"
  | "ta"
  | "ur"
  | "gu"
  | "kn"
  | "ml"
  | "or"
  | "pa"
  | "as"
  | "mai"
  | "sat"
  | "ks"
  | "ne"
  | "sd"
  | "kok"
  | "doi"
  | "mni"
  | "brx"
  | "sa";

export type FeatureFlags = {
  rider_ai: boolean;
  live_tracking: boolean;
  cod: boolean;
  delivery_otp: boolean;
  pod_photo: boolean;
  qr_pickup: boolean;
  multi_order: boolean;
  incentives: boolean;
  safety_tools: boolean;
  whatsapp: boolean;
  sms: boolean;
  push_notifications: boolean;
  offline_mode: boolean;
  advanced_dispatch: boolean;
};

export type Branding = {
  appName: string;
  riderFacingBrand: string;
  tagline: string;
  logoUrl: string;
  faviconUrl: string;
  colors: {
    primary: string;
    background: string;
    foreground: string;
  };
  domain: string;
  notificationSender: string;
  legalCompanyName: string;
  appStoreName: string;
  invoiceBrand: string;
};

export type ProgressiveDistanceSlabs = {
  slab1RatePerKmPaise: number; // default ₹12/km = 1200 paise (2km - 5km)
  slab2RatePerKmPaise: number; // default ₹14/km = 1400 paise (5km - 8km)
  slab3RatePerKmPaise: number; // default ₹16/km = 1600 paise (>8km)
  ldoBonusPaise: number; // default ₹20 = 2000 paise (LDO bonus for trips >= 6km)
};

export type DynamicPricingConfig = {
  cityTier: "TIER_1" | "TIER_2" | "TIER_3";
  tier1BaseFloorPaise: number; // 3500 (₹35)
  tier2BaseFloorPaise: number; // 3000 (₹30)
  tier3BaseFloorPaise: number; // 2500 (₹25)
  pickupFeePaise?: number;
  dropFeePaise?: number;
  basePayPaise?: number;
  defaultRatePerKmPaise: number; // 1200 (₹12/km)
  distanceSlabs: ProgressiveDistanceSlabs;
  waitGraceMinutes: number; // 6 mins
  waitRatePerMinPaise: number; // 100 paise (₹1/min)
  waitCapPaise: number; // 3000 paise (₹30)
  floatingCashLimitInr: number; // 2000
  coolingOffDurationMinutes: number; // 15
  payoutCycleDay: string; // "Wednesday"
  kingAiAutonomousResolution: boolean; // true
};

export type PlatformConfig = {
  branding: Branding;
  flags: FeatureFlags;
  offerTimeoutSeconds: number;
  locationUpdateIntervalSeconds: number;
  maxDeliveryRadiusKm: number;
  travelFactor: number;
  etaBufferMinutes: number;
  otpMaxAttempts: number;
  otpSuspiciousThreshold: number;
  podMaxBytes: number;
  payoutFrequency: "daily" | "twice_weekly" | "weekly";
  supportedLocales: LocaleCode[];
  defaultLocale: LocaleCode;
  pickupVerification: PickupVerification;
  podMethods: PodMethod[];
  dataMode: DataMode;
  supportPhone: string;
  emergencyPhone: string;
  locationRetentionHours: number;
  gpsHistoryMaxPings: number;
  volunteerEnabled: boolean;
  discipline?: RiderDisciplineConfig;
  pricing?: DynamicPricingConfig;
  payoutCycleDay?: string;
  kingAiAutonomousResolution?: boolean;
};

export type RiderDisciplineConfig = {
  enabled: boolean;
  floatingCashLimitInr: number;
  cancellationPenaltyBeforePickupInr: number;
  cancellationPenaltyPostPickupType: "FULL_ORDER" | "CUSTOM_INR";
  cancellationPenaltyPostPickupCustomInr: number;
  coolingOffConsecutiveRejections: number;
  coolingOffAcceptanceRateThresholdPct: number;
  coolingOffDurationMinutes: number;
  upiDepositVpa: string;
};

export type PocketBalanceInfo = {
  collectedPaise: number;
  reconciledPaise: number;
  pocketBalancePaise: number;
  limitPaise: number;
  isCodBlocked: boolean;
  canAcceptCod: boolean;
  utilizationPct: number;
};

export type CoolingOffInfo = {
  isActive: boolean;
  until: string | null;
  reason: string | null;
  secondsRemaining: number;
};

export type RiderProfile = {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  email: string;
  photoUrl: string | null;
  address: string;
  emergencyName: string;
  emergencyPhone: string;
  dateOfBirth: string | null;
  governmentIdType: string | null;
  governmentIdLast4: string | null;
  kycStatus: KycStatus;
  kycRejectReason: string | null;
  riderType: RiderType;
  vehicleType: VehicleType;
  vehicleRegistration: string | null;
  licenceNumber: string | null;
  insuranceRef: string | null;
  payoutUpi: string | null;
  payoutBankLast4: string | null;
  preferredZones: string[];
  availabilityNotes: string;
  status: AvailabilityStatus;
  onlineSince: string | null;
  locale: LocaleCode;
  createdAt: string;
  updatedAt: string;
  dataMode: DataMode;
  consecutiveDeclines?: number;
  coolingOffUntil?: string | null;
  coolingOffReason?: string | null;
};

export type RestaurantSlice = {
  id: string;
  name: string;
  area: string;
  address: string;
  location: GeoPoint;
  phoneMasked: string;
  specialPickupInstructions: string | null;
  preparationStatus: "PREPARING" | "READY" | "DELAYED";
};

export type CustomerSlice = {
  displayName: string;
  area: string;
  address: string | null;
  contactMasked: string | null;
  contactAllowed: boolean;
  instructions: string | null;
};

export type DispatchOffer = {
  id: string;
  riderId: string;
  orderCode: string;
  restaurant: RestaurantSlice;
  customer: CustomerSlice;
  pickupLocation: GeoPoint;
  dropArea: string;
  dropLocation: GeoPoint;
  approxDistanceKm: number;
  estimatedTravelKm: number;
  estimatedTotalRouteKm: number;
  expectedPayoutPaise: number;
  cod: boolean;
  codAmountPaise: number;
  packageCount: number;
  expiresAt: string;
  status: OfferStatus;
  createdAt: string;
  dataMode: DataMode;
};

export type Delivery = {
  id: string;
  offerId: string;
  riderId: string;
  userId: string;
  orderCode: string;
  orderId: string;
  state: DeliveryState;
  restaurant: RestaurantSlice;
  customer: CustomerSlice;
  pickupLocation: GeoPoint;
  dropLocation: GeoPoint;
  packageCount: number;
  expectedPayoutPaise: number;
  tipPaise?: number;
  cod: boolean;
  codAmountPaise: number;
  pickupVerification: PickupVerification;
  pickupCode: string;
  otpRequired: boolean;
  arrivedRestaurantAt: string | null;
  expectedReadyAt: string | null;
  pickedUpAt: string | null;
  arrivedCustomerAt: string | null;
  deliveredAt: string | null;
  waitStartedAt: string | null;
  contactAttempts: number;
  cancelReason: string | null;
  failReason: string | null;
  createdAt: string;
  updatedAt: string;
  dataMode: DataMode;
  waitMinutes?: number;
  waitPayPaise?: number;
  earningsBreakdown?: DeliveryEarningsBreakdown;
};

export type DeliveryEarningsBreakdown = {
  deliveryId: string;
  orderCode: string;
  basePayPaise: number;
  distancePayPaise?: number;
  waitMinutes: number;
  billableWaitMinutes: number;
  waitPayPaise: number;
  isWaitCapped: boolean;
  tipPaise: number;
  multiPackageBonusPaise: number;
  totalPayoutPaise: number;
};

export type DeliveryEvent = {
  id: string;
  deliveryId: string;
  previousState: DeliveryState | null;
  newState: DeliveryState;
  actor: Actor;
  actorId: string;
  reason: string | null;
  at: string;
};

export type OtpRecord = {
  deliveryId: string;
  hash: string;
  salt: string;
  attempts: number;
  verifiedAt: string | null;
  simulatedPlain: string | null;
};

export type ProofOfDelivery = {
  id: string;
  deliveryId: string;
  riderId: string;
  method: PodMethod;
  photoContentType: string | null;
  photoBytes: number | null;
  photoDataUrl: string | null;
  capturedAt: string;
  dataMode: DataMode;
};

export type CashReconciliation = {
  deliveryId: string;
  riderId: string;
  expectedPaise: number;
  collectedPaise: number | null;
  state: CashState;
  exceptionReason: string | null;
  updatedAt: string;
};

export type EarningLine = {
  id: string;
  riderId: string;
  deliveryId: string | null;
  orderCode: string | null;
  kind: "DELIVERY_PAYOUT" | "INCENTIVE" | "ADJUSTMENT" | "DEDUCTION" | "TIP" | "REFERRAL_COMMISSION";
  amountPaise: number;
  note: string;
  at: string;
  dataMode: DataMode;
  waitMinutes?: number;
  waitPayPaise?: number;
};

export type AmbassadorStats = {
  totalCustomersReferred: number;
  firstOrderBonusPaise: number;
  firstOrderBonusCount: number;
  royaltyPaise: number;
  royaltyCount: number;
  totalEarnedPaise: number;
  recentReferrals: EarningLine[];
};

export type Settlement = {
  id: string;
  riderId: string;
  periodStart: string;
  periodEnd: string;
  amountPaise: number;
  status: SettlementStatus;
  confirmedPaidAt: string | null;
  dataMode: DataMode;
};

export type SupportTicket = {
  id: string;
  riderId: string;
  deliveryId: string | null;
  topic: TicketTopic;
  message: string;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
};

export type SafetyIncident = {
  id: string;
  riderId: string;
  deliveryId: string | null;
  kind: SafetyKind;
  note: string;
  location: GeoPoint | null;
  createdAt: string;
  emergencyDispatched: false;
};

export type InAppNotification = {
  id: string;
  userId: string;
  title: string;
  body: string;
  kind:
    | "OFFER"
    | "OFFER_EXPIRING"
    | "RESTAURANT"
    | "CUSTOMER"
    | "DELIVERY"
    | "PAYOUT"
    | "SUPPORT"
    | "ACCOUNT"
    | "OPS";
  read: boolean;
  createdAt: string;
};

export type FraudSignal = {
  id: string;
  riderId: string;
  deliveryId: string | null;
  kind: string;
  detail: string;
  stage: "SIGNAL" | "REVIEW" | "ACTION";
  createdAt: string;
};

export type AuditLog = {
  id: string;
  actorId: string;
  action: string;
  resource: string;
  resourceId: string;
  at: string;
  meta: string;
};

export type LocationPing = {
  id: string;
  riderId: string;
  deliveryId: string | null;
  point: GeoPoint;
  accuracyM: number | null;
  at: string;
};

export type IdempotencyRecord = {
  userId: string;
  key: string;
  action: string;
  resourceId: string;
  responseJson: string;
  createdAt: string;
};

export type RiderDocumentKind =
  | "PHOTO"
  | "GOV_ID"
  | "VEHICLE_RC"
  | "LICENCE"
  | "INSURANCE";

export type RiderDocument = {
  id: string;
  riderId: string;
  kind: RiderDocumentKind;
  contentType: string;
  byteSize: number;
  dataUrl: string | null;
  status: "SUBMITTED" | "ACCEPTED" | "REJECTED";
  createdAt: string;
};

export type RiderPerformance = {
  completed: number;
  offered: number;
  accepted: number;
  cancelled: number;
  onTimePickup: number;
  successfulDelivery: number;
  earningsPerOrderPaise: number;
};

export class RiderError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(code: string, message: string, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
    this.name = "RiderError";
  }
}

export type EngineResult<T> = { ok: true; value: T } | { ok: false; error: RiderError };
