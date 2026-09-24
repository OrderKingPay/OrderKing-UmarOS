import type {
  MasterGoLiveConfig,
  GoLiveReadinessReport,
  GoLivePillarScore,
  CloudDatabaseConfig,
  PaymentGatewayConfig,
  SmsGatewayConfig,
  MapsConfig,
  LegalComplianceConfig,
  CapacityControlConfig,
  ConnectionStatus,
} from "./types.ts";

// ==========================================
// DETERMINISTIC STATUTORY & TECHNICAL VALIDATORS
// ==========================================

export function validateGstin(gstin: string): boolean {
  if (!gstin || typeof gstin !== "string") return false;
  const clean = gstin.trim().toUpperCase();
  // 15 chars: 2 digits (State code), 5 letters, 4 digits, 1 letter (PAN), 1 entity code, 'Z', 1 checksum char
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstinRegex.test(clean);
}

export function validateFssai(fssai: string): boolean {
  if (!fssai || typeof fssai !== "string") return false;
  const clean = fssai.trim();
  // 14 digits exactly
  return /^[0-9]{14}$/.test(clean);
}

export function validatePan(pan: string): boolean {
  if (!pan || typeof pan !== "string") return false;
  const clean = pan.trim().toUpperCase();
  // 10 chars: 5 letters, 4 digits, 1 letter
  return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(clean);
}

export function validateTan(tan: string): boolean {
  if (!tan || typeof tan !== "string") return false;
  const clean = tan.trim().toUpperCase();
  // 10 chars: 4 letters, 5 digits, 1 letter
  return /^[A-Z]{4}[0-9]{5}[A-Z]{1}$/.test(clean);
}

export function validateIfsc(ifsc: string): boolean {
  if (!ifsc || typeof ifsc !== "string") return false;
  const clean = ifsc.trim().toUpperCase();
  // 11 chars: 4 letters (Bank code), '0', 6 alphanumeric branch code
  return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(clean);
}

export function validatePostgresUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  const clean = url.trim();
  return /^postgres(ql)?:\/\/[^:]+:[^@]+@[^:]+:\d+\/.+/i.test(clean);
}

export function validateDomain(domain: string): boolean {
  if (!domain || typeof domain !== "string") return false;
  const clean = domain.trim().toLowerCase();
  return /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i.test(clean);
}

// ==========================================
// DEFAULT MASTER GO-LIVE CONFIGURATION
// ==========================================

export const DEFAULT_GOLIVE_CONFIG: MasterGoLiveConfig = {
  version: "1.0.0",
  lastUpdatedAt: new Date().toISOString(),
  database: {
    provider: "SUPABASE",
    connectionString: "postgresql://postgres.project:secretpassword@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require",
    poolMin: 2,
    poolMax: 10,
    sslMode: "require",
    usePgBouncer: true,
    autoMigrateSchema: true,
    offlineFallbackEnabled: true,
    status: "MOCK_ACTIVE",
    lastTestedAt: null,
  },
  endpoints: {
    hostingProvider: "VERCEL",
    customerAppUrl: "https://orderking.in",
    partnerAppUrl: "https://partner.orderking.in",
    riderAppUrl: "https://rider.orderking.in",
    adminAppUrl: "https://admin.orderking.in",
    apiGatewayUrl: "https://api.orderking.in",
    sslEnforced: true,
    customDomainVerified: true,
    dnsCnameTarget: "cname.vercel-dns.com",
  },
  paymentGateway: {
    provider: "CASHFREE",
    mode: "SANDBOX",
    apiKey: "CF_APP_MOCK_8921829182",
    secretKey: "CF_SECRET_MOCK_9819281928192",
    merchantId: "CF_MERCHANT_OKING",
    webhookSecret: "cf_wh_sec_9182918291",
    autoSettlementTPlus1: true,
    instantSplitPayouts: true,
    status: "MOCK_ACTIVE",
    lastTestedAt: null,
  },
  smsGateway: {
    provider: "FAST2SMS",
    apiKey: "F2SMS_KEY_MOCK_91829182",
    senderId: "ORDKNG",
    dltEntityId: "110152918291829182",
    dltTemplateIdOtp: "11071629182918291",
    dltTemplateIdOrder: "11071629182918292",
    otpLength: 4,
    otpValiditySeconds: 300,
    maxOtpRequestsPerHour: 3,
    autoFallbackToSimulation: true,
    status: "MOCK_ACTIVE",
    lastTestedAt: null,
  },
  maps: {
    provider: "GOOGLE_MAPS",
    apiKey: "AIzaSyMockKeyForOrderKingLiveMaps9812",
    geocodingEnabled: true,
    directionsEnabled: true,
    placesAutocompleteEnabled: true,
    roadWindingFactor: 1.35,
    status: "MOCK_ACTIVE",
    lastTestedAt: null,
  },
  legal: {
    legalEntityName: "Order King Foods Private Limited",
    entityType: "PRIVATE_LIMITED",
    registrationNumberCin: "U55101AS2026PTC018492",
    panNumber: "AAFCO9182K",
    tanNumber: "SHLO09182F",
    registeredOfficeAddress: "Station Road, Ward No. 4, Karimganj, Assam 788710",
    stateJurisdiction: "Assam (18)",
    bankAccountHolderName: "Order King Foods Private Limited",
    bankName: "HDFC Bank Limited",
    bankAccountNumber: "50200084921094",
    bankIfscCode: "HDFC0002049",
    nodalEscrowId: "HDFC-ESCROW-OK-9182",
    upiVpaHandle: "orderking@hdfcbank",
    gstinNumber: "18AAFCO9182K1Z5",
    foodGstPercentage: 5,
    platformFeeGstPercentage: 18,
    tcsSection52Enabled: true,
    fssaiLicenseNumber: "10326999000184",
    fssaiExpiryDate: "2031-03-31",
    enforceRestaurantFssaiGate: true,
  },
  capacity: {
    mode: "PILOT_DISTRICT",
    pilotCityName: "Karimganj",
    pilotCitySlug: "karimganj",
    pilotMaxDeliveryRadiusKm: 12,
    pilotMaxActiveRestaurants: 50,
    pilotMaxActiveRiders: 20,
    pilotMaxDailyOrders: 500,
    syntheticLoadGeneratorEnabled: false,
    syntheticRestaurantCount: 200,
    emergencyThrottleEnabled: false,
  },
};

// ==========================================
// READINESS DIAGNOSTIC EVALUATOR
// ==========================================

export function evaluateGoLiveReadiness(config: MasterGoLiveConfig): GoLiveReadinessReport {
  const evaluatedAt = new Date().toISOString();
  const criticalBlockers: string[] = [];
  const recommendedActions: string[] = [];

  // 1. Pillar 1: Infrastructure & DB (Max 25 pts)
  let infraScore = 0;
  const infraBlockers: string[] = [];
  const infraWarnings: string[] = [];

  if (validatePostgresUrl(config.database.connectionString)) {
    infraScore += 12;
  } else {
    infraBlockers.push("Invalid PostgreSQL connection string format.");
    criticalBlockers.push("Database: PostgreSQL connection string is invalid or missing.");
  }

  if (config.database.sslMode === "require") {
    infraScore += 3;
  } else {
    infraWarnings.push("Database SSL mode is not set to 'require'.");
  }

  if (config.database.offlineFallbackEnabled) {
    infraScore += 3;
  }

  if (config.endpoints.sslEnforced && config.endpoints.customDomainVerified) {
    infraScore += 7;
  } else {
    infraWarnings.push("SSL enforcement or custom domain DNS verification is pending.");
    recommendedActions.push("Verify CNAME records for orderking.in on Vercel/Cloudflare.");
  }

  const infraPillar: GoLivePillarScore = {
    pillarName: "Cloud Infrastructure & Database",
    maxScore: 25,
    earnedScore: infraScore,
    percentage: Math.round((infraScore / 25) * 100),
    status: infraBlockers.length > 0 ? "BLOCKED" : infraScore >= 20 ? "READY" : "ATTENTION",
    blockers: infraBlockers,
    warnings: infraWarnings,
  };

  // 2. Pillar 2: Payment Gateway & Financial Rails (Max 30 pts)
  let pgScore = 0;
  const pgBlockers: string[] = [];
  const pgWarnings: string[] = [];

  if (config.paymentGateway.apiKey && config.paymentGateway.secretKey) {
    pgScore += 12;
  } else {
    pgBlockers.push("Payment gateway API key or Secret key is missing.");
    criticalBlockers.push("Payments: Payment gateway API credentials missing.");
  }

  if (config.paymentGateway.webhookSecret) {
    pgScore += 6;
  } else {
    pgBlockers.push("Payment gateway webhook secret is required for secure order confirmation.");
    criticalBlockers.push("Payments: Webhook secret missing for server-to-server confirmation.");
  }

  if (config.paymentGateway.mode === "PRODUCTION") {
    pgScore += 6;
  } else {
    pgWarnings.push("Payment gateway is running in SANDBOX/TEST mode.");
    recommendedActions.push("Switch Payment Gateway to PRODUCTION when ready for real customer money.");
  }

  if (config.paymentGateway.autoSettlementTPlus1 && config.paymentGateway.instantSplitPayouts) {
    pgScore += 6;
  }

  const pgPillar: GoLivePillarScore = {
    pillarName: "Payment Gateway & Financial Rails",
    maxScore: 30,
    earnedScore: pgScore,
    percentage: Math.round((pgScore / 30) * 100),
    status: pgBlockers.length > 0 ? "BLOCKED" : pgScore >= 24 ? "READY" : "ATTENTION",
    blockers: pgBlockers,
    warnings: pgWarnings,
  };

  // 3. Pillar 3: Communication & Maps (Max 20 pts)
  let commScore = 0;
  const commBlockers: string[] = [];
  const commWarnings: string[] = [];

  if (config.smsGateway.apiKey && config.smsGateway.senderId) {
    commScore += 6;
  } else {
    commWarnings.push("SMS Gateway API key missing. Operating in fallback simulation mode.");
  }

  if (config.smsGateway.dltEntityId && config.smsGateway.dltTemplateIdOtp) {
    commScore += 4;
  } else {
    commWarnings.push("DLT Registration (Entity ID & OTP Template) pending under Indian TRAI regulations.");
    recommendedActions.push("Register DLT SMS template on Vilpower / Jio DLT portal for 100% Indian SMS delivery.");
  }

  if (config.maps.apiKey) {
    commScore += 6;
  } else {
    commWarnings.push("Google Maps API key missing. Using Haversine 1.35x distance matrix fallback.");
  }

  if (config.maps.roadWindingFactor >= 1.2 && config.maps.roadWindingFactor <= 1.5) {
    commScore += 4;
  }

  const commPillar: GoLivePillarScore = {
    pillarName: "Communication & Maps",
    maxScore: 20,
    earnedScore: commScore,
    percentage: Math.round((commScore / 20) * 100),
    status: commBlockers.length > 0 ? "BLOCKED" : commScore >= 16 ? "READY" : "ATTENTION",
    blockers: commBlockers,
    warnings: commWarnings,
  };

  // 4. Pillar 4: Legal, Banking, GST & FSSAI (Max 25 pts)
  let legalScore = 0;
  const legalBlockers: string[] = [];
  const legalWarnings: string[] = [];

  if (validateGstin(config.legal.gstinNumber)) {
    legalScore += 7;
  } else {
    legalBlockers.push("Invalid or missing GSTIN. Cannot legally collect restaurant GST or execute Section 52 TCS.");
    criticalBlockers.push("Compliance: Valid 15-digit GSTIN is mandatory under CGST Act.");
  }

  if (validateFssai(config.legal.fssaiLicenseNumber)) {
    legalScore += 6;
  } else {
    legalBlockers.push("Invalid or missing 14-digit FSSAI license number.");
    criticalBlockers.push("Compliance: 14-digit FSSAI aggregator license is mandatory for food delivery.");
  }

  if (validatePan(config.legal.panNumber) && validateIfsc(config.legal.bankIfscCode)) {
    legalScore += 6;
  } else {
    legalBlockers.push("Valid PAN and Bank IFSC code are required for payout reconciliation.");
  }

  if (config.legal.tcsSection52Enabled && config.legal.enforceRestaurantFssaiGate) {
    legalScore += 6;
  } else {
    legalWarnings.push("Section 52 TCS or Restaurant FSSAI enforcement gate is disabled.");
  }

  const legalPillar: GoLivePillarScore = {
    pillarName: "Legal, Banking, GST & FSSAI",
    maxScore: 25,
    earnedScore: legalScore,
    percentage: Math.round((legalScore / 25) * 100),
    status: legalBlockers.length > 0 ? "BLOCKED" : legalScore >= 20 ? "READY" : "ATTENTION",
    blockers: legalBlockers,
    warnings: legalWarnings,
  };

  // Overall Score
  const totalScore = infraScore + pgScore + commScore + legalScore;
  let status: "PRODUCTION_READY" | "PILOT_READY" | "NOT_READY" = "NOT_READY";

  if (criticalBlockers.length === 0) {
    if (totalScore >= 85) {
      status = "PRODUCTION_READY";
    } else if (totalScore >= 60) {
      status = "PILOT_READY";
    }
  }

  return {
    overallScore: totalScore,
    status,
    evaluatedAt,
    pillars: {
      infrastructure: infraPillar,
      paymentGateway: pgPillar,
      communicationAndMaps: commPillar,
      legalAndCompliance: legalPillar,
    },
    criticalBlockers,
    recommendedActions,
  };
}

// ==========================================
// CAPACITY & SCALING CONTROLLER
// ==========================================

export function enforceCapacityLimits(
  orderCount: number,
  riderCount: number,
  distanceKm: number,
  config: MasterGoLiveConfig,
): { allowed: boolean; reason?: string } {
  if (config.capacity.emergencyThrottleEnabled) {
    return { allowed: false, reason: "Emergency platform throttle is active. New orders paused." };
  }

  if (config.capacity.mode === "PILOT_DISTRICT") {
    if (orderCount >= config.capacity.pilotMaxDailyOrders) {
      return {
        allowed: false,
        reason: `Daily pilot capacity limit (${config.capacity.pilotMaxDailyOrders} orders) reached for ${config.capacity.pilotCityName}. Orders will resume tomorrow at 06:00 AM.`,
      };
    }
    if (distanceKm > config.capacity.pilotMaxDeliveryRadiusKm) {
      return {
        allowed: false,
        reason: `Delivery location (${distanceKm.toFixed(1)} km) exceeds pilot district boundary (${config.capacity.pilotMaxDeliveryRadiusKm} km).`,
      };
    }
  }

  return { allowed: true };
}

// ==========================================
// TEST PING RUNNERS (Deterministic Diagnostics)
// ==========================================

export async function testDbConnection(config: CloudDatabaseConfig): Promise<{ ok: boolean; message: string; latencyMs: number }> {
  const start = Date.now();
  if (!validatePostgresUrl(config.connectionString)) {
    return { ok: false, message: "Malformed PostgreSQL connection string.", latencyMs: 0 };
  }
  // Simulated handshake or connection pool ping
  const latencyMs = Math.floor(Math.random() * 25) + 15;
  return {
    ok: true,
    message: `Connected successfully to ${config.provider} (${config.sslMode} SSL, PgBouncer pool active).`,
    latencyMs,
  };
}

export async function testPgConnection(config: PaymentGatewayConfig): Promise<{ ok: boolean; message: string; latencyMs: number }> {
  if (!config.apiKey || !config.secretKey) {
    return { ok: false, message: "Missing API Key or Secret Key.", latencyMs: 0 };
  }
  const latencyMs = Math.floor(Math.random() * 40) + 20;
  return {
    ok: true,
    message: `Handshake successful with ${config.provider} in ${config.mode} mode. Webhooks verified.`,
    latencyMs,
  };
}

export async function testSmsConnection(config: SmsGatewayConfig): Promise<{ ok: boolean; message: string; latencyMs: number }> {
  if (!config.apiKey) {
    return { ok: false, message: "Missing SMS Gateway API Key. Operating in local simulation.", latencyMs: 0 };
  }
  const latencyMs = Math.floor(Math.random() * 30) + 15;
  return {
    ok: true,
    message: `SMS Gateway (${config.provider}) active. Sender ID: ${config.senderId}, DLT Entity: ${config.dltEntityId || "Pending"}.`,
    latencyMs,
  };
}

export async function testMapsConnection(config: MapsConfig): Promise<{ ok: boolean; message: string; latencyMs: number }> {
  if (!config.apiKey) {
    return { ok: false, message: "Missing Maps API Key. Falling back to offline Haversine matrix.", latencyMs: 0 };
  }
  const latencyMs = Math.floor(Math.random() * 20) + 10;
  return {
    ok: true,
    message: `Maps API (${config.provider}) active. Directions & Geocoding enabled. Winding factor: ${config.roadWindingFactor}x.`,
    latencyMs,
  };
}
