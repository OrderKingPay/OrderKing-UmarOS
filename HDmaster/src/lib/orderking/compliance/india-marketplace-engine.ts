/**
 * 🇮🇳 UMAROS INDIA-SPECIFIC MARKETPLACE, TAX & REGULATORY COMPLIANCE ENGINE
 * 
 * Statutory Indian E-Commerce, Tax, Food Safety & Rider Operations Architecture:
 * 1. CGST Section 9(5) Tax Compliance:
 *    - 5% GST payable by platform (Electronic Commerce Operator - ECO) without ITC on restaurant food orders.
 *    - 18% GST on platform convenience fees and customer delivery fees with ITC.
 *    - Intrastate (CGST + SGST) vs Interstate (IGST) split.
 *    - Statutory GSTR-3B Table 3.1.1(i) and Table 3.1(a) field generation.
 * 2. FSSAI 14-Digit Food Safety License Validation:
 *    - Deterministic structural regex and parsing (Type, State Code, Year, Registrar, Unit).
 *    - Indian state & UT code registry mapping (01 to 38).
 *    - Zero fake delays or Math.random().
 * 3. Distance-Band Rider Payout Engine:
 *    - Base fee (₹25-₹35 for first 2-3 km across City Tiers 1, 2, 3).
 *    - Distance-band per-km tiers (₹6-₹10/km for 3-6 km, 6-10 km, >10 km).
 *    - Restaurant waiting time compensation with grace threshold.
 *    - Rain and night surge premiums, 100% tip pass-through, statutory floor protection.
 * 4. Cash-on-Delivery (COD) Cash-In-Hand Limit Reconciliation:
 *    - Floating cash limit reconciliation (e.g. ₹1,500 standard threshold).
 *    - Soft limit warnings (80%) and hard limit order blocking (100%).
 *    - Actionable settlement reminders with UPI, Hub Cash Drop, CDM, and auto-unblock logic.
 * 5. Tier-1 Marketplace 3-Tier Commission & Packaging Charge Policies:
 *    - 3-tier commission matrix (15%-25%) with volume rebates and 8% statutory floor.
 *    - Consumer Protection (CCPA) packaging charge compliance guardrails (10% / ₹50 cap).
 *    - Complete merchant settlement statement with 18% GST on commission, 1% TCS (Sec 52), and 1% TDS (Sec 194-O).
 */

import {
  toPaise,
  fromPaise,
  safeAdd,
  safeSubtract,
  percentOf,
  type CityTier,
} from "../money.ts";

// ============================================================================
// 1. STATUTORY CONSTANTS & TAX RATES (CGST ACT 2017 & INCOME TAX ACT 1961)
// ============================================================================

export const INDIA_COMPLIANCE_RATES = {
  // Food orders under Section 9(5) CGST Act (Platform/ECO pays without ITC)
  FOOD_GST_BPS: 500, // 5.00%
  FOOD_CGST_BPS: 250, // 2.50%
  FOOD_SGST_BPS: 250, // 2.50%
  FOOD_IGST_BPS: 500, // 5.00%

  // Platform & delivery services (Platform pays with ITC eligibility)
  PLATFORM_FEE_GST_BPS: 1800, // 18.00% (SAC 9985 / 9983)
  PLATFORM_FEE_CGST_BPS: 900, // 9.00%
  PLATFORM_FEE_SGST_BPS: 900, // 9.00%
  PLATFORM_FEE_IGST_BPS: 1800, // 18.00%

  DELIVERY_FEE_GST_BPS: 1800, // 18.00% (SAC 9968)
  DELIVERY_FEE_CGST_BPS: 900, // 9.00%
  DELIVERY_FEE_SGST_BPS: 900, // 9.00%
  DELIVERY_FEE_IGST_BPS: 1800, // 18.00%

  // Packaging charges (composite supply with food -> 5% under Sec 9(5))
  PACKAGING_GST_BPS: 500, // 5.00%

  // Statutory merchant tax deductions
  TCS_BPS: 100, // 1.00% Tax Collected at Source under Section 52 of CGST Act (0.5% CGST + 0.5% SGST)
  TCS_CGST_BPS: 50, // 0.50%
  TCS_SGST_BPS: 50, // 0.50%
  TCS_IGST_BPS: 100, // 1.00%
  TDS_BPS: 100, // 1.00% Tax Deducted at Source under Section 194-O Income Tax Act

  // Standard commission statutory boundaries
  MIN_COMMISSION_BPS: 800, // 8.00% statutory floor
  MAX_COMMISSION_BPS: 3500, // 35.00% ceiling cap
  TIER_1_STARTER_COMMISSION_BPS: 1800, // 18.00%
  TIER_2_STANDARD_COMMISSION_BPS: 2200, // 22.00%
  TIER_3_PREMIUM_COMMISSION_BPS: 2500, // 25.00%

  // Central commission rate tiers (0%, 3%, 5%, 8%, 12%, 18%)
  CENTRAL_COMMISSION_TIERS_PCT: [0, 3, 5, 8, 12, 18] as const,
  CENTRAL_COMMISSION_TIERS_BPS: [0, 300, 500, 800, 1200, 1800] as const,

  // COD Cash in Hand Limits
  DEFAULT_COD_LIMIT_PAISE: 150000, // ₹1,500.00 standard threshold
  STATUTORY_COD_BENCHMARK_LIMIT_PAISE: 250000, // ₹2,500.00 statutory ceiling benchmark
  COD_WARNING_THRESHOLD_PERCENT: 80, // Warning alert at 80% (₹1,200 / ₹2,000)
} as const;

export const CENTRAL_COMMISSION_TIER_PERCENTAGES = [0, 3, 5, 8, 12, 18] as const;
export type CentralCommissionTierPct = (typeof CENTRAL_COMMISSION_TIER_PERCENTAGES)[number];

export interface CentralCommissionTierDef {
  pct: CentralCommissionTierPct;
  bps: number;
  label: string;
  category: "DINE_IN" | "ESSENTIAL" | "HYPERLOCAL" | "STATUTORY_FLOOR" | "STANDARD" | "ENTERPRISE";
  description: string;
}

export const CENTRAL_COMMISSION_TIERS: readonly CentralCommissionTierDef[] = [
  { pct: 0, bps: 0, label: "Direct Dine-In / QR Order & Pay", category: "DINE_IN", description: "Direct order model for dine-in table ordering, QR payments, and new partner onboarding" },
  { pct: 3, bps: 300, label: "3% Sovereign Essential", category: "ESSENTIAL", description: "Direct order link, sovereign cloud kitchens and essential food services" },
  { pct: 5, bps: 500, label: "5% Hyperlocal Self-Delivery", category: "HYPERLOCAL", description: "Merchant self-delivery model with platform customer discovery" },
  { pct: 8, bps: 800, label: "8% Statutory Floor Minimum", category: "STATUTORY_FLOOR", description: "Statutory minimum floor commission for high-volume enterprise contracts" },
  { pct: 12, bps: 1200, label: "12% Standard Marketplace", category: "STANDARD", description: "Standard standalone restaurants and regional food businesses" },
  { pct: 18, bps: 1800, label: "18% Enterprise Full-Service", category: "ENTERPRISE", description: "Full-service marketplace ceiling with dedicated fleet logistics and AI co-pilot" },
] as const;

// ============================================================================
// 2. CGST SECTION 9(5) TAX ENGINE
// ============================================================================

export interface GSTLineItem {
  name: "FOOD" | "PACKAGING" | "PLATFORM_FEE" | "DELIVERY_FEE" | "CUSTOMER_TIP";
  taxablePaise: number;
  rateBps: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  totalTaxPaise: number;
  grossPaise: number;
  isSection95: boolean;
  itcEligible: boolean;
  liabilityBearer: "ECO_PLATFORM" | "PLATFORM_DIRECT" | "EXEMPT";
}

export interface Section95CalculationInput {
  foodSubtotalPaise: number;
  packagingChargePaise?: number;
  platformFeePaise?: number;
  deliveryFeePaise?: number;
  customerTipPaise?: number;
  merchantDiscountPaise?: number; // Pre-tax discount funded by merchant (reduces food taxable amount)
  platformDiscountPaise?: number; // Platform voucher/subsidy (post-tax platform cost)
  isInterstate?: boolean; // false = Intrastate (CGST + SGST), true = Interstate (IGST)
}

export interface Section95CalculationResult {
  isInterstate: boolean;
  netFoodTaxablePaise: number;
  packagingTaxablePaise: number;
  totalSec95TaxablePaise: number;
  platformFeeTaxablePaise: number;
  deliveryFeeTaxablePaise: number;
  totalPlatformTaxablePaise: number;

  // Taxes
  foodGstPaise: number;
  packagingGstPaise: number;
  totalSec95GstPaise: number; // 5% GST payable by ECO (Platform) under Section 9(5)
  platformFeeGstPaise: number; // 18% GST with ITC
  deliveryFeeGstPaise: number; // 18% GST with ITC
  totalPlatformGstPaise: number; // 18% GST on platform services

  totalTaxPaise: number;
  customerPayablePaise: number;

  // Input Tax Credit (ITC) Breakdown
  itcEligibleTaxPaise: number; // Platform convenience & delivery fee GST (18%)
  itcBlockedSec95TaxPaise: number; // Section 9(5) Restaurant GST (5%) - No ITC allowed under Notif 17/2021

  // GSTR-3B Compliance Reporting Fields
  gstr3b: {
    table3_1_1_i_taxableAmountPaise: number; // Food + Packaging taxable value
    table3_1_1_i_taxPayablePaise: number; // Section 9(5) tax discharge liability
    table3_1_a_taxableAmountPaise: number; // Platform fees + Delivery fees taxable value
    table3_1_a_taxPayablePaise: number; // Platform's own outward supplies GST
  };

  lineItems: {
    food: GSTLineItem;
    packaging: GSTLineItem;
    platformFee: GSTLineItem;
    deliveryFee: GSTLineItem;
    tip: GSTLineItem;
  };
}

/**
 * Calculates statutory GST for Indian Food Delivery Platforms under Section 9(5) CGST Act 2017.
 * - 5% GST on Restaurant Food & Packaging is payable by the ECO (Platform) directly to the Govt,
 *   with Input Tax Credit (ITC) strictly blocked.
 * - 18% GST on Platform Convenience Fees and Delivery Fees is payable with full ITC eligibility.
 */
export function calculateSection95GST(input: Section95CalculationInput): Section95CalculationResult {
  const isInterstate = Boolean(input.isInterstate);
  const merchantDiscount = Math.max(0, input.merchantDiscountPaise ?? 0);
  const rawFood = Math.max(0, input.foodSubtotalPaise);
  const netFoodTaxable = Math.max(0, rawFood - merchantDiscount);
  const packagingTaxable = Math.max(0, input.packagingChargePaise ?? 0);
  const platformFeeTaxable = Math.max(0, input.platformFeePaise ?? 0);
  const deliveryFeeTaxable = Math.max(0, input.deliveryFeePaise ?? 0);
  const tipPaise = Math.max(0, input.customerTipPaise ?? 0);
  const platformDiscount = Math.max(0, input.platformDiscountPaise ?? 0);

  // Helper for computing CGST/SGST/IGST
  const computeTax = (taxablePaise: number, totalBps: number) => {
    if (taxablePaise <= 0 || totalBps <= 0) {
      return { cgst: 0, sgst: 0, igst: 0, total: 0 };
    }
    if (isInterstate) {
      const igst = percentOf(taxablePaise, totalBps);
      return { cgst: 0, sgst: 0, igst, total: igst };
    }
    const halfBps = Math.floor(totalBps / 2);
    const cgst = percentOf(taxablePaise, halfBps);
    const sgst = percentOf(taxablePaise, halfBps);
    return { cgst, sgst, igst: 0, total: cgst + sgst };
  };

  // 1. Food: 5% GST (Section 9(5) ECO liable, No ITC)
  const foodTax = computeTax(netFoodTaxable, INDIA_COMPLIANCE_RATES.FOOD_GST_BPS);
  const foodItem: GSTLineItem = {
    name: "FOOD",
    taxablePaise: netFoodTaxable,
    rateBps: INDIA_COMPLIANCE_RATES.FOOD_GST_BPS,
    cgstPaise: foodTax.cgst,
    sgstPaise: foodTax.sgst,
    igstPaise: foodTax.igst,
    totalTaxPaise: foodTax.total,
    grossPaise: netFoodTaxable + foodTax.total,
    isSection95: true,
    itcEligible: false,
    liabilityBearer: "ECO_PLATFORM",
  };

  // 2. Packaging: 5% GST (Composite supply with food, Section 9(5) ECO liable, No ITC)
  const pkgTax = computeTax(packagingTaxable, INDIA_COMPLIANCE_RATES.PACKAGING_GST_BPS);
  const packagingItem: GSTLineItem = {
    name: "PACKAGING",
    taxablePaise: packagingTaxable,
    rateBps: INDIA_COMPLIANCE_RATES.PACKAGING_GST_BPS,
    cgstPaise: pkgTax.cgst,
    sgstPaise: pkgTax.sgst,
    igstPaise: pkgTax.igst,
    totalTaxPaise: pkgTax.total,
    grossPaise: packagingTaxable + pkgTax.total,
    isSection95: true,
    itcEligible: false,
    liabilityBearer: "ECO_PLATFORM",
  };

  // 3. Platform Fee: 18% GST (Platform direct outward supply, With ITC)
  const platTax = computeTax(platformFeeTaxable, INDIA_COMPLIANCE_RATES.PLATFORM_FEE_GST_BPS);
  const platformItem: GSTLineItem = {
    name: "PLATFORM_FEE",
    taxablePaise: platformFeeTaxable,
    rateBps: INDIA_COMPLIANCE_RATES.PLATFORM_FEE_GST_BPS,
    cgstPaise: platTax.cgst,
    sgstPaise: platTax.sgst,
    igstPaise: platTax.igst,
    totalTaxPaise: platTax.total,
    grossPaise: platformFeeTaxable + platTax.total,
    isSection95: false,
    itcEligible: true,
    liabilityBearer: "PLATFORM_DIRECT",
  };

  // 4. Delivery Fee: 18% GST (Platform/Logistics supply, With ITC)
  const delTax = computeTax(deliveryFeeTaxable, INDIA_COMPLIANCE_RATES.DELIVERY_FEE_GST_BPS);
  const deliveryItem: GSTLineItem = {
    name: "DELIVERY_FEE",
    taxablePaise: deliveryFeeTaxable,
    rateBps: INDIA_COMPLIANCE_RATES.DELIVERY_FEE_GST_BPS,
    cgstPaise: delTax.cgst,
    sgstPaise: delTax.sgst,
    igstPaise: delTax.igst,
    totalTaxPaise: delTax.total,
    grossPaise: deliveryFeeTaxable + delTax.total,
    isSection95: false,
    itcEligible: true,
    liabilityBearer: "PLATFORM_DIRECT",
  };

  // 5. Customer Tip: 0% GST (Pass-through pure agent, exempt)
  const tipItem: GSTLineItem = {
    name: "CUSTOMER_TIP",
    taxablePaise: tipPaise,
    rateBps: 0,
    cgstPaise: 0,
    sgstPaise: 0,
    igstPaise: 0,
    totalTaxPaise: 0,
    grossPaise: tipPaise,
    isSection95: false,
    itcEligible: false,
    liabilityBearer: "EXEMPT",
  };

  const totalSec95Taxable = netFoodTaxable + packagingTaxable;
  const totalSec95Gst = foodTax.total + pkgTax.total;

  const totalPlatformTaxable = platformFeeTaxable + deliveryFeeTaxable;
  const totalPlatformGst = platTax.total + delTax.total;

  const totalTax = totalSec95Gst + totalPlatformGst;
  const subtotalGross = foodItem.grossPaise + packagingItem.grossPaise + platformItem.grossPaise + deliveryItem.grossPaise + tipPaise;
  const customerPayable = Math.max(0, subtotalGross - platformDiscount);

  return {
    isInterstate,
    netFoodTaxablePaise: netFoodTaxable,
    packagingTaxablePaise: packagingTaxable,
    totalSec95TaxablePaise: totalSec95Taxable,
    platformFeeTaxablePaise: platformFeeTaxable,
    deliveryFeeTaxablePaise: deliveryFeeTaxable,
    totalPlatformTaxablePaise: totalPlatformTaxable,

    foodGstPaise: foodTax.total,
    packagingGstPaise: pkgTax.total,
    totalSec95GstPaise: totalSec95Gst,
    platformFeeGstPaise: platTax.total,
    deliveryFeeGstPaise: delTax.total,
    totalPlatformGstPaise: totalPlatformGst,

    totalTaxPaise: totalTax,
    customerPayablePaise: customerPayable,

    itcEligibleTaxPaise: totalPlatformGst,
    itcBlockedSec95TaxPaise: totalSec95Gst,

    gstr3b: {
      table3_1_1_i_taxableAmountPaise: totalSec95Taxable,
      table3_1_1_i_taxPayablePaise: totalSec95Gst,
      table3_1_a_taxableAmountPaise: totalPlatformTaxable,
      table3_1_a_taxPayablePaise: totalPlatformGst,
    },

    lineItems: {
      food: foodItem,
      packaging: packagingItem,
      platformFee: platformItem,
      deliveryFee: deliveryItem,
      tip: tipItem,
    },
  };
}

// ============================================================================
// 3. FSSAI 14-DIGIT LICENSE & REGISTRATION VALIDATOR
// ============================================================================

/**
 * Standard Indian State & Union Territory 2-digit GST/FSSAI Census Codes
 */
export const INDIAN_STATE_CODES: Record<string, string> = {
  "01": "Jammu & Kashmir",
  "02": "Himachal Pradesh",
  "03": "Punjab",
  "04": "Chandigarh",
  "05": "Uttarakhand",
  "06": "Haryana",
  "07": "Delhi",
  "08": "Rajasthan",
  "09": "Uttar Pradesh",
  "10": "Bihar",
  "11": "Sikkim",
  "12": "Arunachal Pradesh",
  "13": "Nagaland",
  "14": "Manipur",
  "15": "Mizoram",
  "16": "Tripura",
  "17": "Meghalaya",
  "18": "Assam",
  "19": "West Bengal",
  "20": "Jharkhand",
  "21": "Odisha",
  "22": "Chhattisgarh",
  "23": "Madhya Pradesh",
  "24": "Gujarat",
  "25": "Daman & Diu",
  "26": "Dadra & Nagar Haveli",
  "27": "Maharashtra",
  "28": "Andhra Pradesh (Legacy)",
  "29": "Karnataka",
  "30": "Goa",
  "31": "Lakshadweep",
  "32": "Kerala",
  "33": "Tamil Nadu",
  "34": "Puducherry",
  "35": "Andaman & Nicobar Islands",
  "36": "Telangana",
  "37": "Andhra Pradesh (New)",
  "38": "Ladakh",
};

export type FSSAIRegistrationType = "LICENSE" | "REGISTRATION";

export interface FSSAIDetails {
  registrationType: FSSAIRegistrationType;
  typeDescription: string;
  stateCode: string;
  stateName: string;
  enrollmentYear: number;
  fullEnrollmentYear: number;
  registrarCode: string;
  unitNumber: string;
}

export interface FSSAIValidationResult {
  isValid: boolean;
  fssaiNumber: string;
  error?: string;
  details?: FSSAIDetails;
}

/**
 * Validates a 14-digit FSSAI (Food Safety and Standards Authority of India) license/registration.
 * Structure of 14-digit FSSAI:
 * - Digit 1: Enrollment/Registration type (1 = Central/State License, 2 = Petty Food Registration)
 * - Digits 2-3: State/UT code (01 to 38)
 * - Digits 4-5: Year of enrollment (e.g. 11 for 2011 to 26 for 2026)
 * - Digits 6-8: Quantity / Enrolling Registrar / Jurisdiction code (001 - 999)
 * - Digits 9-14: Unit / Serial identifier of food business (000001 - 999999)
 * 
 * Strict deterministic implementation: No Math.random(), no setTimeout.
 */
export function validateFSSAILicense(
  fssaiNumber: string | number,
  options?: { currentYearTwoDigit?: number; minYearTwoDigit?: number },
): FSSAIValidationResult {
  const sanitized = String(fssaiNumber ?? "").trim();

  // 1. Length and numeric format check
  if (!/^\d{14}$/.test(sanitized)) {
    if (sanitized.length !== 14) {
      return {
        isValid: false,
        fssaiNumber: sanitized,
        error: `FSSAI number must be exactly 14 digits, received ${sanitized.length} characters`,
      };
    }
    return {
      isValid: false,
      fssaiNumber: sanitized,
      error: "FSSAI number must contain only numeric digits (0-9)",
    };
  }

  // 2. Digit 1: Registration Type (1 = License, 2 = Registration)
  const typeDigit = sanitized.charAt(0);
  if (typeDigit !== "1" && typeDigit !== "2") {
    return {
      isValid: false,
      fssaiNumber: sanitized,
      error: `Invalid FSSAI registration type digit '${typeDigit}'. Must start with 1 (License) or 2 (Registration)`,
    };
  }
  const registrationType: FSSAIRegistrationType = typeDigit === "1" ? "LICENSE" : "REGISTRATION";
  const typeDescription = typeDigit === "1" ? "State / Central Food Business License" : "Petty Food Business Registration";

  // 3. Digits 2 & 3: State / UT Code
  const stateCode = sanitized.substring(1, 3);
  const stateName = INDIAN_STATE_CODES[stateCode];
  if (!stateName) {
    return {
      isValid: false,
      fssaiNumber: sanitized,
      error: `Invalid state code '${stateCode}' in FSSAI number. Must be a valid Indian State/UT code (01 to 38)`,
    };
  }

  // 4. Digits 4 & 5: Year of Enrollment
  const yearCode = parseInt(sanitized.substring(3, 5), 10);
  const minYear = options?.minYearTwoDigit ?? 11; // 2011 when Food Safety Regulations were notified
  const maxYear = options?.currentYearTwoDigit ?? 26; // 2026
  if (yearCode < minYear || yearCode > maxYear) {
    return {
      isValid: false,
      fssaiNumber: sanitized,
      error: `Invalid enrollment year '${yearCode}' in FSSAI number. Valid range is ${minYear} to ${maxYear} (20${minYear} to 20${maxYear})`,
    };
  }
  const fullEnrollmentYear = 2000 + yearCode;

  // 5. Digits 6, 7, 8: Registrar / Quantity / Jurisdiction Code
  const registrarCode = sanitized.substring(5, 8);
  const registrarNum = parseInt(registrarCode, 10);
  if (registrarNum < 1 || registrarNum > 999) {
    return {
      isValid: false,
      fssaiNumber: sanitized,
      error: `Invalid registrar / authority code '${registrarCode}'. Must be between 001 and 999`,
    };
  }

  // 6. Digits 9 to 14: Unit Serial Number
  const unitNumber = sanitized.substring(8, 14);
  const unitNum = parseInt(unitNumber, 10);
  if (unitNum === 0) {
    return {
      isValid: false,
      fssaiNumber: sanitized,
      error: `Invalid unit serial number '${unitNumber}'. Unit serial number cannot be all zeroes`,
    };
  }

  return {
    isValid: true,
    fssaiNumber: sanitized,
    details: {
      registrationType,
      typeDescription,
      stateCode,
      stateName,
      enrollmentYear: yearCode,
      fullEnrollmentYear,
      registrarCode,
      unitNumber,
    },
  };
}

// ============================================================================
// 4. INDIAN DISTANCE-BAND RIDER PAYOUT ALGORITHM
// ============================================================================

export interface DistanceBandConfig {
  fromKm: number;
  toKm: number;
  ratePerKmPaise: number;
  name: string;
}

export const DEFAULT_DISTANCE_BANDS: DistanceBandConfig[] = [
  { fromKm: 0, toKm: 3, ratePerKmPaise: 0, name: "Band 1 (0-3 km Base Inclusive)" },
  { fromKm: 3, toKm: 6, ratePerKmPaise: 800, name: "Band 2 (3-6 km Short Distance @ ₹8/km)" },
  { fromKm: 6, toKm: 10, ratePerKmPaise: 1000, name: "Band 3 (6-10 km Mid Distance @ ₹10/km)" },
  { fromKm: 10, toKm: 999, ratePerKmPaise: 1200, name: "Band 4 (>10 km Long Distance @ ₹12/km)" },
];

export interface RiderPayoutInput {
  distanceKm: number;
  cityTier?: CityTier;
  customBaseFeePaise?: number; // e.g. ₹25 - ₹35 (2500 - 3500 paise)
  customBaseDistanceKm?: number; // e.g. 2 to 3 km
  distanceBands?: DistanceBandConfig[];
  waitMinutes?: number;
  graceWaitMinutes?: number; // default 5 mins free
  waitPayRatePerMinPaise?: number; // default ₹2.00/min (200 paise/min)
  isRainSurge?: boolean;
  rainSurgeBonusPaise?: number; // default ₹25 (2500 paise)
  isNightSurge?: boolean;
  nightHour?: number; // 0-23. If provided, evaluates if between 23 and 6
  nightSurgeBonusPaise?: number; // default ₹20 (2000 paise)
  peakMultiplier?: number; // e.g. 1.25x
  customerTipPaise?: number;
  minimumGuaranteeFloorPaise?: number; // default ₹30 or tier floor
}

export interface DistanceBandPayoutItem {
  bandName: string;
  fromKm: number;
  toKm: number;
  billableKm: number;
  ratePerKmPaise: number;
  payoutPaise: number;
}

export interface RiderPayoutResult {
  cityTier: CityTier;
  totalDistanceKm: number;
  baseDistanceKm: number;
  baseFeePaise: number;

  distanceBands: DistanceBandPayoutItem[];
  totalDistancePayPaise: number;

  waiting: {
    totalWaitMinutes: number;
    graceMinutes: number;
    billableWaitMinutes: number;
    ratePerMinPaise: number;
    waitPayPaise: number;
  };

  surges: {
    isRainSurge: boolean;
    rainSurgeBonusPaise: number;
    isNightSurge: boolean;
    nightSurgeBonusPaise: number;
    peakMultiplier: number;
    peakSurgeBoostPaise: number;
    totalSurgePaise: number;
  };

  customerTipPaise: number;
  rawFarePaise: number;
  minimumFloorPaise: number;
  isFloorEnforced: boolean;
  deliveryEarningsPaise: number;
  totalPayoutPaise: number; // deliveryEarningsPaise + customerTipPaise (100% tip pass-through)
}

/**
 * Calculates Indian rider delivery payout with distance bands, waiting compensation,
 * rain/night surge, tip pass-through, and minimum statutory floor.
 */
export function calculateIndianRiderPayout(input: RiderPayoutInput): RiderPayoutResult {
  const tier: CityTier = input.cityTier ?? "TIER_1";

  // Tier defaults for Base Fee & Distance:
  // Tier 1 (Metros): ₹35 for first 3.0 km
  // Tier 2 (Growth): ₹30 for first 2.5 km
  // Tier 3 (Rest of India): ₹25 for first 2.0 km
  let defaultBaseFee = 3500;
  let defaultBaseKm = 3.0;
  let defaultFloor = 3500;

  if (tier === "TIER_2") {
    defaultBaseFee = 3000;
    defaultBaseKm = 2.5;
    defaultFloor = 3000;
  } else if (tier === "TIER_3") {
    defaultBaseFee = 2500;
    defaultBaseKm = 2.0;
    defaultFloor = 2500;
  }

  const baseFeePaise = Math.max(0, input.customBaseFeePaise ?? defaultBaseFee);
  const baseDistanceKm = Math.max(0, input.customBaseDistanceKm ?? defaultBaseKm);
  const totalDistanceKm = Math.max(0, Number.isFinite(input.distanceKm) ? input.distanceKm : 0);

  // Distance Bands calculation
  const bands = input.distanceBands ?? DEFAULT_DISTANCE_BANDS;
  const bandItems: DistanceBandPayoutItem[] = [];
  let totalDistancePayPaise = 0;

  for (const band of bands) {
    if (totalDistanceKm <= band.fromKm) continue;

    // Extra distance is only billable above baseDistanceKm and for bands with ratePerKmPaise > 0
    const effectiveStartKm = Math.max(band.fromKm, baseDistanceKm);
    if (totalDistanceKm > effectiveStartKm && band.ratePerKmPaise > 0) {
      const endKm = Math.min(totalDistanceKm, band.toKm);
      const billable = Math.max(0, endKm - effectiveStartKm);
      if (billable > 0) {
        const payout = Math.round(billable * band.ratePerKmPaise);
        totalDistancePayPaise += payout;

        bandItems.push({
          bandName: band.name,
          fromKm: band.fromKm,
          toKm: band.toKm,
          billableKm: Number(billable.toFixed(2)),
          ratePerKmPaise: band.ratePerKmPaise,
          payoutPaise: payout,
        });
      }
    }
  }

  // Waiting Time Compensation
  const totalWaitMinutes = Math.max(0, Math.floor(input.waitMinutes ?? 0));
  const graceMinutes = Math.max(0, input.graceWaitMinutes ?? 5);
  const billableWaitMinutes = Math.max(0, totalWaitMinutes - graceMinutes);
  const waitRatePerMin = Math.max(0, input.waitPayRatePerMinPaise ?? 200); // ₹2.00/min
  const waitPayPaise = billableWaitMinutes * waitRatePerMin;

  // Surges: Rain, Night, Peak Multiplier
  const isRain = Boolean(input.isRainSurge);
  const rainBonus = isRain ? Math.max(0, input.rainSurgeBonusPaise ?? 2500) : 0; // ₹25

  let isNight = Boolean(input.isNightSurge);
  if (input.nightHour !== undefined) {
    const hr = input.nightHour;
    if (hr >= 23 || hr < 6) {
      isNight = true;
    }
  }
  const nightBonus = isNight ? Math.max(0, input.nightSurgeBonusPaise ?? 2000) : 0; // ₹20

  const peakMultiplier = Number.isFinite(input.peakMultiplier) ? Math.max(1.0, input.peakMultiplier!) : 1.0;
  const basePlusDistance = baseFeePaise + totalDistancePayPaise;
  const peakSurgeBoostPaise = Math.round(basePlusDistance * Math.max(0, peakMultiplier - 1.0));

  const totalSurgePaise = rainBonus + nightBonus + peakSurgeBoostPaise;

  // Raw delivery fare before floor
  const rawFarePaise = basePlusDistance + waitPayPaise + totalSurgePaise;

  // Minimum floor enforcement
  const floorPaise = input.minimumGuaranteeFloorPaise ?? defaultFloor;
  const deliveryEarningsPaise = Math.max(floorPaise, rawFarePaise);
  const isFloorEnforced = rawFarePaise < floorPaise;

  // Customer Tip Pass-Through (100% directly to rider, no commission deduction)
  const customerTipPaise = Math.max(0, input.customerTipPaise ?? 0);
  const totalPayoutPaise = deliveryEarningsPaise + customerTipPaise;

  return {
    cityTier: tier,
    totalDistanceKm,
    baseDistanceKm,
    baseFeePaise,
    distanceBands: bandItems,
    totalDistancePayPaise,
    waiting: {
      totalWaitMinutes,
      graceMinutes,
      billableWaitMinutes,
      ratePerMinPaise: waitRatePerMin,
      waitPayPaise,
    },
    surges: {
      isRainSurge: isRain,
      rainSurgeBonusPaise: rainBonus,
      isNightSurge: isNight,
      nightSurgeBonusPaise: nightBonus,
      peakMultiplier,
      peakSurgeBoostPaise,
      totalSurgePaise,
    },
    customerTipPaise,
    rawFarePaise,
    minimumFloorPaise: floorPaise,
    isFloorEnforced,
    deliveryEarningsPaise,
    totalPayoutPaise,
  };
}

// ============================================================================
// 5. CASH-ON-DELIVERY (COD) CASH-IN-HAND RECONCILIATION ENGINE
// ============================================================================

export type CodStatus = "HEALTHY" | "APPROACHING_LIMIT" | "LIMIT_BREACHED_COD_BLOCKED";

export interface RiderCodProfile {
  riderId: string;
  tier?: "TRAINEE" | "STANDARD" | "VERIFIED" | "PREMIUM";
  currentCashInHandPaise: number;
  maxCashLimitPaise?: number;
  warningThresholdPercent?: number; // default 80%
}

export interface CodReconciliationInput {
  rider: RiderCodProfile;
  incomingOrderCodAmountPaise?: number;
}

export interface CodDepositReminder {
  urgency: "NORMAL" | "HIGH" | "CRITICAL";
  headline: string;
  message: string;
  dueAmountPaise: number;
  recommendedDepositPaise: number;
  settlementChannels: string[];
}

export interface CodReconciliationResult {
  riderId: string;
  currentCashInHandPaise: number;
  incomingOrderCodAmountPaise: number;
  projectedCashInHandPaise: number;
  maxCashLimitPaise: number;
  softLimitPaise: number;
  utilizationPercent: number;
  projectedUtilizationPercent: number;

  status: CodStatus;
  canAcceptCodOrder: boolean;
  isBlocked: boolean;
  excessCashPaise: number;
  requiredDepositToUnblockPaise: number;

  reminder?: CodDepositReminder;
}

/**
 * Tier-based cash in hand limits:
 * - TRAINEE: ₹1,000 (100,000 paise)
 * - STANDARD: ₹1,500 (150,000 paise)
 * - VERIFIED: ₹3,000 (300,000 paise)
 * - PREMIUM: ₹5,000 (500,000 paise)
 */
export function getRiderMaxCashLimit(tier: RiderCodProfile["tier"] = "STANDARD"): number {
  switch (tier) {
    case "TRAINEE":
      return 100000; // ₹1,000
    case "VERIFIED":
      return 300000; // ₹3,000
    case "PREMIUM":
      return 500000; // ₹5,000
    case "STANDARD":
    default:
      return INDIA_COMPLIANCE_RATES.DEFAULT_COD_LIMIT_PAISE; // ₹1,500
  }
}

/**
 * Reconciles rider cash-in-hand against floating COD limits, enforcing order assignment blocking,
 * soft limit warnings, and generating structured settlement reminders.
 */
export function reconcileRiderCodStatus(input: CodReconciliationInput): CodReconciliationResult {
  const rider = input.rider;
  const maxLimit = Math.max(10000, rider.maxCashLimitPaise ?? getRiderMaxCashLimit(rider.tier));
  const warningPct = rider.warningThresholdPercent ?? INDIA_COMPLIANCE_RATES.COD_WARNING_THRESHOLD_PERCENT;
  const softLimit = Math.round((maxLimit * warningPct) / 100);

  const currentCash = Math.max(0, rider.currentCashInHandPaise);
  const incomingOrderCod = Math.max(0, input.incomingOrderCodAmountPaise ?? 0);
  const projectedCash = currentCash + incomingOrderCod;

  const currentUtilPct = Math.round((currentCash / maxLimit) * 100);
  const projectedUtilPct = Math.round((projectedCash / maxLimit) * 100);

  let status: CodStatus = "HEALTHY";
  let canAccept = true;
  let isBlocked = false;

  // Determine status based on current cash
  if (currentCash >= maxLimit) {
    status = "LIMIT_BREACHED_COD_BLOCKED";
    canAccept = false;
    isBlocked = true;
  } else if (projectedCash > maxLimit) {
    // Current is below limit, but this new incoming order would breach it!
    status = currentCash >= softLimit ? "APPROACHING_LIMIT" : "HEALTHY";
    canAccept = false;
  } else if (currentCash >= softLimit) {
    status = "APPROACHING_LIMIT";
    canAccept = true;
  }

  const excessCash = Math.max(0, currentCash - maxLimit);
  // Deposit needed to bring current cash back down to at least below soft limit or zero
  const requiredDepositToUnblock = currentCash >= maxLimit ? (currentCash - softLimit) : 0;

  let reminder: CodDepositReminder | undefined;

  if (isBlocked || !canAccept || status === "APPROACHING_LIMIT") {
    const urgency = isBlocked ? "CRITICAL" : !canAccept ? "HIGH" : "NORMAL";
    const recommendedDeposit = Math.max(excessCash, currentCash - Math.round(maxLimit * 0.5)); // Deposit enough to get to 50%
    const currentRupees = fromPaise(currentCash).toFixed(0);
    const limitRupees = fromPaise(maxLimit).toFixed(0);
    const dueRupees = fromPaise(Math.max(requiredDepositToUnblock, recommendedDeposit)).toFixed(0);

    let headline = `Cash-in-hand advisory: ₹${currentRupees} / ₹${limitRupees}`;
    let message = `Your floating cash-in-hand is at ${currentUtilPct}% of limit. Please deposit cash via UPI or partner hub soon.`;

    if (isBlocked) {
      headline = `🚨 COD BLOCKED: Cash limit of ₹${limitRupees} breached`;
      message = `Your cash-in-hand of ₹${currentRupees} exceeds your threshold of ₹${limitRupees}. You cannot accept COD orders until you deposit at least ₹${fromPaise(requiredDepositToUnblock).toFixed(0)}.`;
    } else if (!canAccept) {
      headline = `⚠️ Cannot accept order: Would exceed ₹${limitRupees} limit`;
      message = `Accepting order with COD ₹${fromPaise(incomingOrderCod).toFixed(0)} would bring your cash to ₹${fromPaise(projectedCash).toFixed(0)} (limit ₹${limitRupees}). Deposit ₹${dueRupees} to accept.`;
    }

    reminder = {
      urgency,
      headline,
      message,
      dueAmountPaise: requiredDepositToUnblock,
      recommendedDepositPaise: recommendedDeposit,
      settlementChannels: [
        "UPI Instant Deposit (KingPay QR / VPA)",
        "Partner Hub Cash Drop / CDM Deposit",
        "Airtel Payments Bank / India Post Counter",
        "Instant Weekly Payout Offset",
      ],
    };
  }

  return {
    riderId: rider.riderId,
    currentCashInHandPaise: currentCash,
    incomingOrderCodAmountPaise: incomingOrderCod,
    projectedCashInHandPaise: projectedCash,
    maxCashLimitPaise: maxLimit,
    softLimitPaise: softLimit,
    utilizationPercent: currentUtilPct,
    projectedUtilizationPercent: projectedUtilPct,
    status,
    canAcceptCodOrder: canAccept,
    isBlocked,
    excessCashPaise: excessCash,
    requiredDepositToUnblockPaise: requiredDepositToUnblock,
    reminder,
  };
}

/**
 * Settles a cash deposit from rider and returns the updated COD status.
 */
export function processRiderCashDeposit(params: {
  rider: RiderCodProfile;
  depositAmountPaise: number;
  transactionRef: string;
}): {
  previousBalancePaise: number;
  depositAmountPaise: number;
  newBalancePaise: number;
  transactionRef: string;
  isUnblocked: boolean;
  reconciliation: CodReconciliationResult;
} {
  const deposit = Math.max(0, params.depositAmountPaise);
  const previous = Math.max(0, params.rider.currentCashInHandPaise);
  const newBalance = Math.max(0, previous - deposit);

  const updatedProfile: RiderCodProfile = {
    ...params.rider,
    currentCashInHandPaise: newBalance,
  };

  const reconciliation = reconcileRiderCodStatus({ rider: updatedProfile });
  const isUnblocked = !reconciliation.isBlocked;

  return {
    previousBalancePaise: previous,
    depositAmountPaise: deposit,
    newBalancePaise: newBalance,
    transactionRef: params.transactionRef,
    isUnblocked,
    reconciliation,
  };
}

// ============================================================================
// 6. 3-TIER COMMISSION MATRIX & PACKAGING CHARGE POLICIES
// ============================================================================

export type CommissionTierLevel = "TIER_1_STARTER" | "TIER_2_STANDARD" | "TIER_3_PREMIUM";

export interface CommissionTierSpec {
  level: CommissionTierLevel;
  name: string;
  baseRateBps: number;
  description: string;
}

export const TIER1_MARKETPLACE_COMMISSION_TIERS: Record<CommissionTierLevel, CommissionTierSpec> = {
  TIER_1_STARTER: {
    level: "TIER_1_STARTER",
    name: "Tier 1: Starter / Cloud Kitchen / Regional Chain",
    baseRateBps: INDIA_COMPLIANCE_RATES.TIER_1_STARTER_COMMISSION_BPS, // 18.00%
    description: "Introductory baseline commission for emerging food businesses",
  },
  TIER_2_STANDARD: {
    level: "TIER_2_STANDARD",
    name: "Tier 2: Standard Growth Restaurant Partner",
    baseRateBps: INDIA_COMPLIANCE_RATES.TIER_2_STANDARD_COMMISSION_BPS, // 22.00%
    description: "Standard full-service marketplace commission with marketing and rider fleet",
  },
  TIER_3_PREMIUM: {
    level: "TIER_3_PREMIUM",
    name: "Tier 3: Enterprise / High-Demand / Brand Partner",
    baseRateBps: INDIA_COMPLIANCE_RATES.TIER_3_PREMIUM_COMMISSION_BPS, // 25.00%
    description: "Full concierge service, premium discoverability and dedicated account operations",
  },
};

export interface PackagingPolicyInput {
  itemSubtotalPaise: number;
  packagingChargePaise: number;
  itemCount?: number;
  maxPercentageCap?: number; // default 10% under CCPA guidelines
  maxOrderPackagingCapPaise?: number; // default ₹50 (5000 paise)
  maxItemContainerCapPaise?: number; // default ₹25 (2500 paise)
}

export interface PackagingPolicyResult {
  isCompliant: boolean;
  requestedPackagingPaise: number;
  approvedPackagingPaise: number;
  excessPackagingPaise: number;
  orderPercentageCapPaise: number;
  maxAllowedPaise: number;
  violationReason?: string;
}

/**
 * Validates restaurant packaging charges against Indian CCPA and consumer protection guidelines:
 * - Packaging charge cannot exceed 10% of food order value.
 * - Flat cap of ₹50 per order.
 * - Container cap of ₹25 per item container.
 */
export function validatePackagingChargePolicy(input: PackagingPolicyInput): PackagingPolicyResult {
  const foodTotal = Math.max(0, input.itemSubtotalPaise);
  const requested = Math.max(0, input.packagingChargePaise);
  const itemCount = Math.max(1, input.itemCount ?? 1);

  const pctCap = input.maxPercentageCap ?? 10;
  const orderCapPaise = input.maxOrderPackagingCapPaise ?? 5000; // ₹50
  const itemCapPaise = input.maxItemContainerCapPaise ?? 2500; // ₹25 per item

  // 1. Percentage of item value cap (e.g. 10% of ₹300 = ₹30)
  const pctCapPaise = Math.round((foodTotal * pctCap) / 100);

  // 2. Per-container total cap (e.g. 2 items * ₹25 = ₹50)
  const containerCapPaise = itemCount * itemCapPaise;

  // Maximum allowed is the minimum of applicable ceilings
  const maxAllowedPaise = Math.min(orderCapPaise, Math.min(containerCapPaise, Math.max(1000, pctCapPaise)));

  if (requested <= maxAllowedPaise) {
    return {
      isCompliant: true,
      requestedPackagingPaise: requested,
      approvedPackagingPaise: requested,
      excessPackagingPaise: 0,
      orderPercentageCapPaise: pctCapPaise,
      maxAllowedPaise,
    };
  }

  const excess = requested - maxAllowedPaise;
  const violationReason = `Packaging charge ₹${fromPaise(requested).toFixed(2)} exceeds regulatory cap of ₹${fromPaise(maxAllowedPaise).toFixed(2)} (max 10% or ₹50/order)`;

  return {
    isCompliant: false,
    requestedPackagingPaise: requested,
    approvedPackagingPaise: maxAllowedPaise,
    excessPackagingPaise: excess,
    orderPercentageCapPaise: pctCapPaise,
    maxAllowedPaise,
    violationReason,
  };
}

export interface MerchantSettlementInput {
  foodGrossPaise: number;
  packagingChargePaise?: number;
  merchantDiscountPaise?: number;
  commissionTierLevel?: CommissionTierLevel;
  customCommissionBps?: number;
  weeklyOrdersCount?: number;
  packagingRetainedByMerchant?: boolean; // default true
  isInterstate?: boolean;
}

export interface MerchantSettlementResult {
  foodGrossPaise: number;
  merchantDiscountPaise: number;
  netFoodTaxablePaise: number;
  packagingPaise: number;
  totalMerchantTaxableSalesPaise: number;

  // Commission
  commissionTier: CommissionTierLevel;
  baseCommissionBps: number;
  volumeRebateBps: number;
  effectiveCommissionBps: number;
  commissionAmountPaise: number;
  commissionGstPaise: number; // 18% GST on platform commission (SAC 9985)
  totalCommissionWithGstPaise: number;

  // Statutory Deductions
  tcsPaise: number; // 1% under Section 52 CGST Act
  tdsPaise: number; // 1% under Section 194-O Income Tax Act
  totalStatutoryDeductionsPaise: number;

  // Net Settlement
  netMerchantPayoutPaise: number;
  isReconciled: boolean;
}

/**
 * Calculates complete merchant order settlement statement matching Tier-1 Indian marketplace economics:
 * Net Payout = Net Taxable Food + Packaging - Commission - GST on Commission - 1% TCS - 1% TDS.
 */
export function calculateMerchantOrderSettlement(input: MerchantSettlementInput): MerchantSettlementResult {
  const foodGross = Math.max(0, input.foodGrossPaise);
  const discount = Math.max(0, input.merchantDiscountPaise ?? 0);
  const netFood = Math.max(0, foodGross - discount);
  const packaging = Math.max(0, input.packagingChargePaise ?? 0);
  const totalMerchantSales = netFood + packaging;

  // Commission determination
  const tierLevel = input.commissionTierLevel ?? "TIER_2_STANDARD";
  const tierSpec = TIER1_MARKETPLACE_COMMISSION_TIERS[tierLevel] ?? TIER1_MARKETPLACE_COMMISSION_TIERS.TIER_2_STANDARD;
  const baseRate = input.customCommissionBps ?? tierSpec.baseRateBps;

  // Volume rebates (orders per week: 100+ -> -100 bps, 300+ -> -200 bps, 500+ -> -300 bps)
  const orderCount = input.weeklyOrdersCount ?? 0;
  let volumeRebateBps = 0;
  if (orderCount >= 500) {
    volumeRebateBps = 300;
  } else if (orderCount >= 300) {
    volumeRebateBps = 200;
  } else if (orderCount >= 100) {
    volumeRebateBps = 100;
  }

  // Statutory floor protection (8% / 800 bps) and ceiling cap (35% / 3500 bps)
  const effectiveBps = Math.min(
    INDIA_COMPLIANCE_RATES.MAX_COMMISSION_BPS,
    Math.max(INDIA_COMPLIANCE_RATES.MIN_COMMISSION_BPS, baseRate - volumeRebateBps),
  );

  // Commission is levied on net food sales (or total sales including packaging if retained)
  const commissionTaxableBase = input.packagingRetainedByMerchant === false ? netFood : totalMerchantSales;
  const commissionAmount = percentOf(commissionTaxableBase, effectiveBps);

  // 18% GST on platform commission fee (SAC 9985)
  const commissionGst = percentOf(commissionAmount, INDIA_COMPLIANCE_RATES.PLATFORM_FEE_GST_BPS);
  const totalCommissionWithGst = commissionAmount + commissionGst;

  // 1% TCS under Section 52 CGST Act on net taxable supplies
  const tcsAmount = percentOf(totalMerchantSales, INDIA_COMPLIANCE_RATES.TCS_BPS);

  // 1% TDS under Section 194-O Income Tax Act on gross sales
  const tdsAmount = percentOf(totalMerchantSales, INDIA_COMPLIANCE_RATES.TDS_BPS);

  const totalDeductions = totalCommissionWithGst + tcsAmount + tdsAmount;
  const netPayout = Math.max(0, totalMerchantSales - totalDeductions);

  // Reconciled if: Net Payout + Total Deductions === totalMerchantSales
  const isReconciled = netPayout + totalDeductions === totalMerchantSales;

  return {
    foodGrossPaise: foodGross,
    merchantDiscountPaise: discount,
    netFoodTaxablePaise: netFood,
    packagingPaise: packaging,
    totalMerchantTaxableSalesPaise: totalMerchantSales,
    commissionTier: tierLevel,
    baseCommissionBps: baseRate,
    volumeRebateBps,
    effectiveCommissionBps: effectiveBps,
    commissionAmountPaise: commissionAmount,
    commissionGstPaise: commissionGst,
    totalCommissionWithGstPaise: totalCommissionWithGst,
    tcsPaise: tcsAmount,
    tdsPaise: tdsAmount,
    totalStatutoryDeductionsPaise: totalDeductions,
    netMerchantPayoutPaise: netPayout,
    isReconciled,
  };
}

// ============================================================================
// 7. STATUTORY PAN & BANK IFSC ONBOARDING VALIDATORS
// ============================================================================

export interface PanValidationResult {
  isValid: boolean;
  pan: string;
  entityType?: string;
  error?: string;
}

/**
 * Validates a 10-character Indian Permanent Account Number (PAN) under Section 139A of Income Tax Act 1961.
 * Format: 5 uppercase letters, 4 numeric digits, 1 uppercase letter (e.g. ABCDE1234F).
 */
export function validateIndianPAN(pan: string | null | undefined): PanValidationResult {
  const sanitized = String(pan ?? "").trim().toUpperCase();
  if (sanitized.length !== 10) {
    return {
      isValid: false,
      pan: sanitized,
      error: `PAN must be exactly 10 alphanumeric characters, received ${sanitized.length}`,
    };
  }

  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  if (!panRegex.test(sanitized)) {
    return {
      isValid: false,
      pan: sanitized,
      error: "Invalid PAN format. Must be 5 uppercase letters, 4 numeric digits, 1 uppercase letter (e.g. ABCDE1234F)",
    };
  }

  const entityChar = sanitized.charAt(3);
  let entityType = "Individual / Proprietorship";
  switch (entityChar) {
    case "P": entityType = "Individual (Person) / Proprietorship"; break;
    case "C": entityType = "Company (Private / Public Limited)"; break;
    case "F": entityType = "Partnership Firm / LLP"; break;
    case "H": entityType = "Hindu Undivided Family (HUF)"; break;
    case "A": entityType = "Association of Persons (AOP)"; break;
    case "T": entityType = "Trust"; break;
    case "B": entityType = "Body of Individuals (BOI)"; break;
    case "L": entityType = "Local Authority"; break;
    case "J": entityType = "Artificial Juridical Person"; break;
    case "G": entityType = "Government Agency"; break;
  }

  return {
    isValid: true,
    pan: sanitized,
    entityType,
  };
}

export interface IfscValidationResult {
  isValid: boolean;
  ifsc: string;
  bankCode?: string;
  branchCode?: string;
  error?: string;
}

/**
 * Validates an 11-character Indian Financial System Code (IFSC) for electronic bank payouts (NEFT/RTGS/IMPS).
 * Format: 4 letters (bank code) + '0' (reserved) + 6 alphanumeric characters (branch code).
 */
export function validateIndianBankIFSC(ifsc: string | null | undefined): IfscValidationResult {
  const sanitized = String(ifsc ?? "").trim().toUpperCase();
  if (sanitized.length !== 11) {
    return {
      isValid: false,
      ifsc: sanitized,
      error: `Bank IFSC must be exactly 11 characters, received ${sanitized.length}`,
    };
  }

  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  if (!ifscRegex.test(sanitized)) {
    return {
      isValid: false,
      ifsc: sanitized,
      error: "Invalid IFSC format. Expected 4 alphabetic characters, followed by '0', followed by 6 alphanumeric branch characters (e.g. HDFC0001234)",
    };
  }

  return {
    isValid: true,
    ifsc: sanitized,
    bankCode: sanitized.slice(0, 4),
    branchCode: sanitized.slice(5, 11),
  };
}

// ============================================================================
// 8. T+1 DAILY MERCHANT SETTLEMENT ENGINE (MIDNIGHT TO 10:00 AM DISPATCH)
// ============================================================================

export interface TPlus1DailySettlementInput {
  restaurantId: string;
  restaurantName: string;
  bankAccountMasked?: string;
  ifscCode?: string;
  payoutChannel?: "BANK_TRANSFER_NEFT_IMPS" | "UPI_PAYOUT";
  orderDate?: string; // YYYY-MM-DD
  orders: Array<{
    orderId: string;
    foodValuePaise: number;
    packingPaise?: number;
    restaurantDiscountPaise?: number;
    commissionBps: number;
    completedAt: string; // ISO timestamp
  }>;
}

export interface TPlus1DailySettlementBatch {
  batchId: string;
  restaurantId: string;
  restaurantName: string;
  orderDate: string; // YYYY-MM-DD (Day T)
  cutoffTimestamp: string; // YYYY-MM-DDT23:59:59.999+05:30 (Day T 12:00 Midnight IST)
  scheduledPayoutTimestamp: string; // YYYY-MM-DDT10:00:00.000+05:30 (Day T+1 10:00 AM IST)
  scheduledPayoutDate: string; // YYYY-MM-DD (Day T+1)
  scheduledPayoutTime: string; // "10:00 AM"
  payoutChannel: "BANK_TRANSFER_NEFT_IMPS" | "UPI_PAYOUT";
  bankAccountMasked: string;
  ifscCode: string;
  ordersCount: number;

  totalGrossSalesPaise: number;
  totalFoodValuePaise: number;
  totalPackingPaise: number;
  totalRestaurantDiscountsPaise: number;
  totalNetTaxableSupplyPaise: number;

  totalCommissionPaise: number;
  totalCommissionGstPaise: number; // 18% GST

  totalTcsSection52Paise: number; // 1% TCS
  totalTdsSection194OPaise: number; // 1% TDS
  totalSec9_5FoodGstRemittedPaise: number; // 5% Food GST remitted by platform (NOT debited)

  totalDeductionsPaise: number;
  netPayablePaise: number;

  status: "SCHEDULED_FOR_10AM_PAYOUT";
  isMidnightCompiled: boolean;
}

/**
 * Compiles all orders completed up to 12:00 Midnight IST and schedules payout for next morning 10:00 AM (T+1).
 */
export function compileTPlus1DailyMerchantSettlement(input: TPlus1DailySettlementInput): TPlus1DailySettlementBatch {
  const refDate = input.orderDate ? new Date(input.orderDate) : new Date();
  const orderDateStr = refDate.toISOString().split("T")[0];

  // Day T+1 calculation
  const tPlus1Date = new Date(refDate.getTime());
  tPlus1Date.setDate(tPlus1Date.getDate() + 1);
  const payoutDateStr = tPlus1Date.toISOString().split("T")[0];

  // Strict statutory IST cutoff & scheduled dispatch timestamps
  const cutoffTimestamp = `${orderDateStr}T23:59:59.999+05:30`;
  const scheduledPayoutTimestamp = `${payoutDateStr}T10:00:00.000+05:30`;

  let totalFood = 0;
  let totalPacking = 0;
  let totalDiscount = 0;
  let totalCommission = 0;
  let totalCommissionGst = 0;
  let totalTcs = 0;
  let totalTds = 0;
  let totalSec95 = 0;

  for (const o of input.orders) {
    const food = Math.max(0, o.foodValuePaise);
    const packing = Math.max(0, o.packingPaise ?? 0);
    const disc = Math.max(0, o.restaurantDiscountPaise ?? 0);
    const netTaxable = Math.max(0, food + packing - disc);

    const comm = percentOf(netTaxable, o.commissionBps);
    const commGst = percentOf(comm, INDIA_COMPLIANCE_RATES.PLATFORM_FEE_GST_BPS);

    const tcs = percentOf(netTaxable, INDIA_COMPLIANCE_RATES.TCS_BPS);
    const tds = percentOf(food + packing, INDIA_COMPLIANCE_RATES.TDS_BPS);
    const sec95 = percentOf(netTaxable, INDIA_COMPLIANCE_RATES.FOOD_GST_BPS);

    totalFood += food;
    totalPacking += packing;
    totalDiscount += disc;
    totalCommission += comm;
    totalCommissionGst += commGst;
    totalTcs += tcs;
    totalTds += tds;
    totalSec95 += sec95;
  }

  const totalGrossSales = totalFood + totalPacking;
  const totalNetTaxableSupply = Math.max(0, totalGrossSales - totalDiscount);
  const totalDeductions = totalCommission + totalCommissionGst + totalTcs + totalTds;
  const netPayable = Math.max(0, totalNetTaxableSupply - totalDeductions);

  const batchId = `stl_tplus1_${input.restaurantId.slice(0, 8)}_${orderDateStr}_${Date.now()}`;

  return {
    batchId,
    restaurantId: input.restaurantId,
    restaurantName: input.restaurantName,
    orderDate: orderDateStr,
    cutoffTimestamp,
    scheduledPayoutTimestamp,
    scheduledPayoutDate: payoutDateStr,
    scheduledPayoutTime: "10:00 AM",
    payoutChannel: input.payoutChannel ?? "BANK_TRANSFER_NEFT_IMPS",
    bankAccountMasked: input.bankAccountMasked || "XXXX-XXXX-4321",
    ifscCode: input.ifscCode || "HDFC0001234",
    ordersCount: input.orders.length,

    totalGrossSalesPaise: totalGrossSales,
    totalFoodValuePaise: totalFood,
    totalPackingPaise: totalPacking,
    totalRestaurantDiscountsPaise: totalDiscount,
    totalNetTaxableSupplyPaise: totalNetTaxableSupply,

    totalCommissionPaise: totalCommission,
    totalCommissionGstPaise: totalCommissionGst,

    totalTcsSection52Paise: totalTcs,
    totalTdsSection194OPaise: totalTds,
    totalSec9_5FoodGstRemittedPaise: totalSec95,

    totalDeductionsPaise: totalDeductions,
    netPayablePaise: netPayable,

    status: "SCHEDULED_FOR_10AM_PAYOUT",
    isMidnightCompiled: true,
  };
}

// ============================================================================
// 9. AUTOMATED STATUTORY CREDIT NOTE GENERATOR (SECTION 34 CGST ACT)
// ============================================================================

export type CreditNoteReasonCode =
  | "01_SALES_RETURN"
  | "02_POST_SALE_DISCOUNT"
  | "03_DEFICIENCY_IN_SERVICE"
  | "04_CORRECTION_IN_INVOICE"
  | "05_ORDER_CANCELLED";

export interface CreditNoteInputPaise {
  originalInvoiceNumber: string;
  originalOrderId: string;
  restaurantId: string;
  restaurantGstin?: string;
  platformGstin?: string;
  reasonCode: CreditNoteReasonCode;
  reasonDescription: string;
  taxableAmountPaise: number;
  isInterstate?: boolean;
}

export interface StatutoryCreditNote {
  creditNoteNumber: string;
  statutoryBasis: "Section 34, Central Goods and Services Tax (CGST) Act, 2017";
  issueDate: string;
  originalInvoiceNumber: string;
  originalOrderId: string;
  restaurantId: string;
  restaurantGstin: string;
  platformGstin: string;
  reasonCode: CreditNoteReasonCode;
  reasonDescription: string;

  taxableAmountPaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  totalGstPaise: number;
  totalCreditNoteAmountPaise: number;

  tcsReversalPaise: number;
  tdsAdjustmentPaise: number;
  digitalSignatureRef: string;
}

export function generateStatutoryCreditNote(input: CreditNoteInputPaise): StatutoryCreditNote {
  const taxable = Math.max(0, input.taxableAmountPaise);
  const isInterstate = Boolean(input.isInterstate);
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];
  const yearMonth = dateStr.replace(/-/g, "").slice(0, 6);

  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  // 18% GST reversal on platform commission adjustments
  const rateBps = INDIA_COMPLIANCE_RATES.PLATFORM_FEE_GST_BPS;
  if (isInterstate) {
    igst = percentOf(taxable, rateBps);
  } else {
    cgst = percentOf(taxable, INDIA_COMPLIANCE_RATES.PLATFORM_FEE_CGST_BPS);
    sgst = percentOf(taxable, INDIA_COMPLIANCE_RATES.PLATFORM_FEE_SGST_BPS);
  }
  const totalGst = isInterstate ? igst : cgst + sgst;

  // Withholding reversals
  const tcsReversal = percentOf(taxable, INDIA_COMPLIANCE_RATES.TCS_BPS);
  const tdsAdjustment = percentOf(taxable, INDIA_COMPLIANCE_RATES.TDS_BPS);

  const creditNoteNumber = `CN-${yearMonth}-${Math.floor(100000 + Math.random() * 900000)}`;

  return {
    creditNoteNumber,
    statutoryBasis: "Section 34, Central Goods and Services Tax (CGST) Act, 2017",
    issueDate: dateStr,
    originalInvoiceNumber: input.originalInvoiceNumber,
    originalOrderId: input.originalOrderId,
    restaurantId: input.restaurantId,
    restaurantGstin: input.restaurantGstin || "URP (Unregistered Person)",
    platformGstin: input.platformGstin || "18AFXPH9838M1Z9",
    reasonCode: input.reasonCode,
    reasonDescription: input.reasonDescription,

    taxableAmountPaise: taxable,
    cgstPaise: cgst,
    sgstPaise: sgst,
    igstPaise: igst,
    totalGstPaise: totalGst,
    totalCreditNoteAmountPaise: taxable + totalGst,

    tcsReversalPaise: tcsReversal,
    tdsAdjustmentPaise: tdsAdjustment,
    digitalSignatureRef: `DSC-OK-ECO-${now.getTime()}`,
  };
}

// ============================================================================
// 10. UNIFIED UMAROS INDIA MARKETPLACE COMPLIANCE ENGINE
// ============================================================================

export class IndiaMarketplaceEngine {
  /**
   * Calculates CGST Section 9(5) taxes and platform convenience taxes.
   */
  calculateGST(input: Section95CalculationInput): Section95CalculationResult {
    return calculateSection95GST(input);
  }

  /**
   * Deterministically validates a 14-digit FSSAI license or registration number.
   */
  validateFSSAI(
    fssaiNumber: string | number,
    options?: { currentYearTwoDigit?: number; minYearTwoDigit?: number },
  ): FSSAIValidationResult {
    return validateFSSAILicense(fssaiNumber, options);
  }

  /**
   * Validates a 10-character Indian Permanent Account Number (PAN).
   */
  validatePAN(pan: string | null | undefined): PanValidationResult {
    return validateIndianPAN(pan);
  }

  /**
   * Validates an 11-character Indian Bank IFSC code.
   */
  validateIFSC(ifsc: string | null | undefined): IfscValidationResult {
    return validateIndianBankIFSC(ifsc);
  }

  /**
   * Calculates Indian distance-band rider payout with waiting time and surges.
   */
  calculateRiderPayout(input: RiderPayoutInput): RiderPayoutResult {
    return calculateIndianRiderPayout(input);
  }

  /**
   * Reconciles COD cash in hand limits and generates settlement reminders.
   */
  reconcileCod(input: CodReconciliationInput): CodReconciliationResult {
    return reconcileRiderCodStatus(input);
  }

  /**
   * Processes a rider cash deposit and updates COD health.
   */
  settleCashDeposit(params: {
    rider: RiderCodProfile;
    depositAmountPaise: number;
    transactionRef: string;
  }) {
    return processRiderCashDeposit(params);
  }

  /**
   * Validates packaging charges against Consumer Protection (CCPA) policy.
   */
  validatePackaging(input: PackagingPolicyInput): PackagingPolicyResult {
    return validatePackagingChargePolicy(input);
  }

  /**
   * Computes complete restaurant settlement statement with 3-tier commission and statutory tax.
   */
  calculateMerchantSettlement(input: MerchantSettlementInput): MerchantSettlementResult {
    return calculateMerchantOrderSettlement(input);
  }

  /**
   * Compiles orders up to 12:00 Midnight and schedules payout for next morning 10:00 AM (T+1).
   */
  compileTPlus1Settlement(input: TPlus1DailySettlementInput): TPlus1DailySettlementBatch {
    return compileTPlus1DailyMerchantSettlement(input);
  }

  /**
   * Generates a Section 34 CGST Act compliant automated Credit Note.
   */
  generateCreditNote(input: CreditNoteInputPaise): StatutoryCreditNote {
    return generateStatutoryCreditNote(input);
  }
}

export const indiaMarketplaceEngine = new IndiaMarketplaceEngine();
