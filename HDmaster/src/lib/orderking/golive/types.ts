export type DatabaseProvider = 
  | "SUPABASE" 
  | "NEON" 
  | "AWS_RDS" 
  | "SELF_HOSTED_POSTGRES" 
  | "LOCAL_PGLITE_DEV";

export type HostingProvider = 
  | "VERCEL" 
  | "RAILWAY" 
  | "AWS_ECS" 
  | "CLOUD_RUN" 
  | "VPS_DOCKER";

export type PaymentGatewayProvider = 
  | "CASHFREE" 
  | "RAZORPAY" 
  | "PHONEPE_PG" 
  | "PAYTM_PG" 
  | "ICICI_EAZYPAY" 
  | "SIMULATION";

export type SmsGatewayProvider = 
  | "FAST2SMS" 
  | "MSG91" 
  | "TWILIO" 
  | "GUPSHUP" 
  | "EXOTEL" 
  | "SIMULATION";

export type MapsProvider = 
  | "GOOGLE_MAPS" 
  | "MAPBOX" 
  | "OPEN_STREET_MAP_OSRM" 
  | "RADAR" 
  | "OFFLINE_HAVERSINE";

export type CapacityMode = 
  | "PILOT_DISTRICT" 
  | "PAN_INDIA_SYNTHETIC" 
  | "PAN_INDIA_PRODUCTION";

export type EntityType = 
  | "PRIVATE_LIMITED" 
  | "LLP" 
  | "SOLE_PROPRIETORSHIP" 
  | "PARTNERSHIP";

export type ConnectionStatus = 
  | "CONNECTED" 
  | "MOCK_ACTIVE" 
  | "CONFIG_REQUIRED" 
  | "ERROR";

export type CloudDatabaseConfig = {
  provider: DatabaseProvider;
  connectionString: string;
  poolMin: number;
  poolMax: number;
  sslMode: "require" | "prefer" | "disable";
  usePgBouncer: boolean;
  autoMigrateSchema: boolean;
  offlineFallbackEnabled: boolean;
  status: ConnectionStatus;
  lastTestedAt: string | null;
  errorMessage?: string;
};

export type AppEndpointsConfig = {
  hostingProvider: HostingProvider;
  customerAppUrl: string;
  partnerAppUrl: string;
  riderAppUrl: string;
  adminAppUrl: string;
  apiGatewayUrl: string;
  sslEnforced: boolean;
  customDomainVerified: boolean;
  dnsCnameTarget: string;
};

export type PaymentGatewayConfig = {
  provider: PaymentGatewayProvider;
  mode: "SANDBOX" | "PRODUCTION";
  apiKey: string;
  secretKey: string;
  merchantId: string;
  webhookSecret: string;
  saltKey?: string;
  saltIndex?: number;
  autoSettlementTPlus1: boolean;
  instantSplitPayouts: boolean;
  status: ConnectionStatus;
  lastTestedAt: string | null;
  errorMessage?: string;
};

export type SmsGatewayConfig = {
  provider: SmsGatewayProvider;
  apiKey: string;
  senderId: string;
  dltEntityId: string;
  dltTemplateIdOtp: string;
  dltTemplateIdOrder: string;
  otpLength: 4 | 6;
  otpValiditySeconds: number;
  maxOtpRequestsPerHour: number;
  autoFallbackToSimulation: boolean;
  status: ConnectionStatus;
  lastTestedAt: string | null;
  errorMessage?: string;
};

export type MapsConfig = {
  provider: MapsProvider;
  apiKey: string;
  clientKey?: string;
  geocodingEnabled: boolean;
  directionsEnabled: boolean;
  placesAutocompleteEnabled: boolean;
  roadWindingFactor: number; // default 1.35x for realistic road distance from haversine
  status: ConnectionStatus;
  lastTestedAt: string | null;
  errorMessage?: string;
};

export type LegalComplianceConfig = {
  legalEntityName: string;
  entityType: EntityType;
  registrationNumberCin: string;
  panNumber: string;
  tanNumber: string;
  registeredOfficeAddress: string;
  stateJurisdiction: string;
  bankAccountHolderName: string;
  bankName: string;
  bankAccountNumber: string;
  bankIfscCode: string;
  nodalEscrowId: string;
  upiVpaHandle: string;
  gstinNumber: string;
  foodGstPercentage: number; // default 5%
  platformFeeGstPercentage: number; // default 18%
  tcsSection52Enabled: boolean; // 1% (0.5% CGST + 0.5% SGST)
  fssaiLicenseNumber: string; // 14-digit
  fssaiExpiryDate: string;
  enforceRestaurantFssaiGate: boolean;
};

export type CapacityControlConfig = {
  mode: CapacityMode;
  pilotCityName: string;
  pilotCitySlug: string;
  pilotMaxDeliveryRadiusKm: number;
  pilotMaxActiveRestaurants: number;
  pilotMaxActiveRiders: number;
  pilotMaxDailyOrders: number;
  syntheticLoadGeneratorEnabled: boolean;
  syntheticRestaurantCount: number;
  emergencyThrottleEnabled: boolean;
};

export type MasterGoLiveConfig = {
  version: string;
  lastUpdatedAt: string;
  database: CloudDatabaseConfig;
  endpoints: AppEndpointsConfig;
  paymentGateway: PaymentGatewayConfig;
  smsGateway: SmsGatewayConfig;
  maps: MapsConfig;
  legal: LegalComplianceConfig;
  capacity: CapacityControlConfig;
};

export type GoLivePillarScore = {
  pillarName: string;
  maxScore: number;
  earnedScore: number;
  percentage: number;
  status: "READY" | "ATTENTION" | "BLOCKED";
  blockers: string[];
  warnings: string[];
};

export type GoLiveReadinessReport = {
  overallScore: number; // 0 - 100
  status: "PRODUCTION_READY" | "PILOT_READY" | "NOT_READY";
  evaluatedAt: string;
  pillars: {
    infrastructure: GoLivePillarScore;
    paymentGateway: GoLivePillarScore;
    communicationAndMaps: GoLivePillarScore;
    legalAndCompliance: GoLivePillarScore;
  };
  criticalBlockers: string[];
  recommendedActions: string[];
};
