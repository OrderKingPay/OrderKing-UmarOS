import {
  CampaignCreative,
  CampaignBudget,
  CampaignProviderAccount,
  ChannelType,
  TargetGeography,
  CampaignRecord,
} from "./campaign-state-machine";

export interface IndianStateDefinition {
  stateName: string;
  gstStateCode: string;
  isUnionTerritory: boolean;
}

export const INDIAN_STATES_AND_UTS: Record<string, IndianStateDefinition> = {
  "JAMMU AND KASHMIR": { stateName: "JAMMU AND KASHMIR", gstStateCode: "01", isUnionTerritory: true },
  "HIMACHAL PRADESH": { stateName: "HIMACHAL PRADESH", gstStateCode: "02", isUnionTerritory: false },
  "PUNJAB": { stateName: "PUNJAB", gstStateCode: "03", isUnionTerritory: false },
  "CHANDIGARH": { stateName: "CHANDIGARH", gstStateCode: "04", isUnionTerritory: true },
  "UTTARAKHAND": { stateName: "UTTARAKHAND", gstStateCode: "05", isUnionTerritory: false },
  "HARYANA": { stateName: "HARYANA", gstStateCode: "06", isUnionTerritory: false },
  "DELHI": { stateName: "DELHI", gstStateCode: "07", isUnionTerritory: true },
  "RAJASTHAN": { stateName: "RAJASTHAN", gstStateCode: "08", isUnionTerritory: false },
  "UTTAR PRADESH": { stateName: "UTTAR PRADESH", gstStateCode: "09", isUnionTerritory: false },
  "BIHAR": { stateName: "BIHAR", gstStateCode: "10", isUnionTerritory: false },
  "SIKKIM": { stateName: "SIKKIM", gstStateCode: "11", isUnionTerritory: false },
  "ARUNACHAL PRADESH": { stateName: "ARUNACHAL PRADESH", gstStateCode: "12", isUnionTerritory: false },
  "NAGALAND": { stateName: "NAGALAND", gstStateCode: "13", isUnionTerritory: false },
  "MANIPUR": { stateName: "MANIPUR", gstStateCode: "14", isUnionTerritory: false },
  "MIZORAM": { stateName: "MIZORAM", gstStateCode: "15", isUnionTerritory: false },
  "TRIPURA": { stateName: "TRIPURA", gstStateCode: "16", isUnionTerritory: false },
  "MEGHALAYA": { stateName: "MEGHALAYA", gstStateCode: "17", isUnionTerritory: false },
  "ASSAM": { stateName: "ASSAM", gstStateCode: "18", isUnionTerritory: false },
  "WEST BENGAL": { stateName: "WEST BENGAL", gstStateCode: "19", isUnionTerritory: false },
  "JHARKHAND": { stateName: "JHARKHAND", gstStateCode: "20", isUnionTerritory: false },
  "ODISHA": { stateName: "ODISHA", gstStateCode: "21", isUnionTerritory: false },
  "CHHATTISGARH": { stateName: "CHHATTISGARH", gstStateCode: "22", isUnionTerritory: false },
  "MADHYA PRADESH": { stateName: "MADHYA PRADESH", gstStateCode: "23", isUnionTerritory: false },
  "GUJARAT": { stateName: "GUJARAT", gstStateCode: "24", isUnionTerritory: false },
  "DADRA AND NAGAR HAVELI AND DAMAN AND DIU": { stateName: "DADRA AND NAGAR HAVELI AND DAMAN AND DIU", gstStateCode: "26", isUnionTerritory: true },
  "MAHARASHTRA": { stateName: "MAHARASHTRA", gstStateCode: "27", isUnionTerritory: false },
  "ANDHRA PRADESH": { stateName: "ANDHRA PRADESH", gstStateCode: "28", isUnionTerritory: false },
  "KARNATAKA": { stateName: "KARNATAKA", gstStateCode: "29", isUnionTerritory: false },
  "GOA": { stateName: "GOA", gstStateCode: "30", isUnionTerritory: false },
  "LAKSHADWEEP": { stateName: "LAKSHADWEEP", gstStateCode: "31", isUnionTerritory: true },
  "KERALA": { stateName: "KERALA", gstStateCode: "32", isUnionTerritory: false },
  "TAMIL NADU": { stateName: "TAMIL NADU", gstStateCode: "33", isUnionTerritory: false },
  "PUDUCHERRY": { stateName: "PUDUCHERRY", gstStateCode: "34", isUnionTerritory: true },
  "ANDAMAN AND NICOBAR ISLANDS": { stateName: "ANDAMAN AND NICOBAR ISLANDS", gstStateCode: "35", isUnionTerritory: true },
  "TELANGANA": { stateName: "TELANGANA", gstStateCode: "36", isUnionTerritory: false },
  "LADAKH": { stateName: "LADAKH", gstStateCode: "38", isUnionTerritory: true },
};

export function validateTargetGeography(geo: {
  state: string;
  district: string;
  city: string;
  pincode: string;
  radiusKm: number;
}): TargetGeography {
  const normState = geo.state.trim().toUpperCase();
  const stateDef = INDIAN_STATES_AND_UTS[normState];
  if (!stateDef) {
    throw new Error(
      `Invalid Indian State / UT '${geo.state}'. Must be a recognized Indian State or Union Territory.`
    );
  }

  const pincodeClean = geo.pincode.trim();
  const pincodeRegex = /^[1-9][0-9]{5}$/;
  if (!pincodeRegex.test(pincodeClean)) {
    throw new Error(
      `Invalid Indian Postal PIN code '${geo.pincode}'. Must be exactly 6 numeric digits and cannot start with '0'.`
    );
  }

  const districtClean = geo.district.trim();
  if (districtClean.length < 2 || districtClean.length > 64) {
    throw new Error(`District name must be between 2 and 64 characters. Got: '${districtClean}'`);
  }

  const cityClean = geo.city.trim();
  if (cityClean.length < 2 || cityClean.length > 64) {
    throw new Error(`City name must be between 2 and 64 characters. Got: '${cityClean}'`);
  }

  if (typeof geo.radiusKm !== "number" || isNaN(geo.radiusKm) || geo.radiusKm < 0.1 || geo.radiusKm > 50.0) {
    throw new Error(
      `Invalid radiusKm: ${geo.radiusKm}. Must be between 0.1 km and 50.0 km for hyper-local food ad targeting.`
    );
  }

  return {
    state: stateDef.stateName,
    stateCodeGst: stateDef.gstStateCode,
    district: districtClean,
    city: cityClean,
    pincode: pincodeClean,
    radiusKm: Math.round(geo.radiusKm * 100) / 100,
  };
}

export type ChannelConfigStatus = "READY" | "CONFIGURATION_REQUIRED";

export interface ChannelStatusCheck {
  channel: ChannelType;
  status: ChannelConfigStatus;
  isConfigured: boolean;
  missingKeys: string[];
  configuredKeys: string[];
  message: string;
}

export const CHANNEL_ENV_REQUIREMENTS: Record<ChannelType, string[]> = {
  WHATSAPP_BUSINESS: [
    "WHATSAPP_BUSINESS_ACCOUNT_ID",
    "WHATSAPP_ACCESS_TOKEN",
    "WHATSAPP_PHONE_NUMBER_ID",
  ],
  META_ADS: [
    "META_ADS_ACCESS_TOKEN",
    "META_AD_ACCOUNT_ID",
    "META_APP_ID",
    "META_APP_SECRET",
  ],
  GOOGLE_LOCAL: [
    "GOOGLE_ADS_DEVELOPER_TOKEN",
    "GOOGLE_ADS_CUSTOMER_ID",
    "GOOGLE_ADS_CLIENT_ID",
    "GOOGLE_ADS_CLIENT_SECRET",
    "GOOGLE_ADS_REFRESH_TOKEN",
  ],
  DLT_SMS: [
    "SMS_SENDER_ID",
    "SMS_DLT_ENTITY_ID",
    "SMS_DLT_TEMPLATE_ID_MARKETING",
  ],
};

/**
 * Inspects process.env (or provided env map) to verify credential existence.
 * Returns CONFIGURATION_REQUIRED if any required credential is missing or empty.
 */
export function checkChannelConfiguration(
  channel: ChannelType,
  envOverride?: Record<string, string | undefined>
): ChannelStatusCheck {
  const env = envOverride ?? process.env;
  const requiredKeys = CHANNEL_ENV_REQUIREMENTS[channel];
  const missingKeys: string[] = [];
  const configuredKeys: string[] = [];

  // SMS requires SMS_API_KEY OR MSG91_AUTH_KEY OR FAST2SMS
  if (channel === "DLT_SMS") {
    const hasSmsGatewayKey = Boolean(
      (env["SMS_API_KEY"] && env["SMS_API_KEY"].trim()) ||
      (env["MSG91_AUTH_KEY"] && env["MSG91_AUTH_KEY"].trim()) ||
      (env["FAST2SMS"] && env["FAST2SMS"].trim())
    );
    if (!hasSmsGatewayKey) {
      missingKeys.push("SMS_API_KEY (or MSG91_AUTH_KEY / FAST2SMS)");
    } else {
      configuredKeys.push("SMS_GATEWAY_KEY");
    }
  }

  for (const key of requiredKeys) {
    const val = env[key];
    if (!val || val.trim() === "" || val === "xxx") {
      missingKeys.push(key);
    } else {
      configuredKeys.push(key);
    }
  }

  if (missingKeys.length > 0) {
    return {
      channel,
      status: "CONFIGURATION_REQUIRED",
      isConfigured: false,
      missingKeys,
      configuredKeys,
      message: `Channel '${channel}' is missing mandatory credentials: ${missingKeys.join(", ")}. Add them to .env to enable submission.`,
    };
  }

  return {
    channel,
    status: "READY",
    isConfigured: true,
    missingKeys: [],
    configuredKeys,
    message: `Channel '${channel}' is fully configured with production credentials.`,
  };
}

/**
 * Asserts channel readiness prior to state transition to QUEUED or SUBMITTED.
 */
export function assertChannelReady(channel: ChannelType, envOverride?: Record<string, string | undefined>): void {
  const check = checkChannelConfiguration(channel, envOverride);
  if (check.status === "CONFIGURATION_REQUIRED") {
    throw new Error(`Cannot proceed: ${check.message}`);
  }
}
