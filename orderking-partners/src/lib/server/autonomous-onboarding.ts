/**
 * Order King - Autonomous Merchant Onboarding & Menu Digitizer
 * Domain: Zero-Human Partner Automation
 * 
 * Mandate:
 * 1. OCR / Text Menu Digitizer:
 *    - Takes image text / extracted OCR and parses dishes, descriptions,
 *      categories (Starters, Main, Breads, Desserts, Beverages),
 *      veg/non-veg tags (VEG, NONVEG, EGG, VEGAN), and integer paise prices.
 * 2. FSSAI & GST format checks:
 *    - Validate input syntax only. Official registration and expiry require
 *      a real authority response or authorized manual compliance review.
 */

import type { DietFlag } from "@/lib/contracts";

export interface FSSAIValidationResult {
  isValid: boolean;
  licenseNumber: string;
  status: "ACTIVE" | "EXPIRED" | "SUSPENDED" | "INVALID" | "PENDING_VERIFICATION";
  stateCode?: string;
  registrationType?: "CENTRAL_LICENSE" | "STATE_LICENSE" | "REGISTRATION";
  tradeName?: string;
  expiryDate?: string;
  failureReason?: string;
  verifiedAt: string;
}

export interface GSTINValidationResult {
  isValid: boolean;
  gstin: string;
  status: "ACTIVE" | "CANCELLED" | "INVALID" | "PENDING_VERIFICATION";
  stateCode?: string;
  stateName?: string;
  pan?: string;
  legalName?: string;
  tradeName?: string;
  taxpayerType?: string;
  failureReason?: string;
  verifiedAt: string;
}

export interface DigitizedMenuItem {
  id: string;
  name: string;
  description: string;
  category: string;
  diet: DietFlag;
  pricePaise: number;
  formattedPrice: string;
  prepMinutes: number;
  inStock: boolean;
}

export interface DigitizedCategory {
  id: string;
  name: "Starters" | "Main" | "Breads" | "Desserts" | "Beverages" | string;
  sortOrder: number;
  items: DigitizedMenuItem[];
}

export interface DigitizedMenuCatalog {
  categories: DigitizedCategory[];
  totalDishesCount: number;
  vegDishesCount: number;
  nonVegDishesCount: number;
  eggDishesCount: number;
  digitizedAt: string;
}

export interface MerchantOnboardingInput {
  merchantName: string;
  tradeName?: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  stateCode: string;
  fssaiNumber: string;
  gstin: string;
  rawMenuOcrText: string;
  kitchenCapacityTickets?: number;
}

export interface MerchantOnboardingResult {
  merchantId: string;
  status: "ONBOARDED_ACTIVE" | "REJECTED_COMPLIANCE" | "PENDING_VERIFICATION";
  compliancePassed: boolean;
  zeroHumanOnboarded: boolean;
  verification: {
    fssai: FSSAIValidationResult;
    gstin: GSTINValidationResult;
  };
  digitizedMenu?: DigitizedMenuCatalog;
  rejectionReasons?: string[];
  auditTrail: Array<{ step: string; timestamp: string; status: string; details?: Record<string, unknown> }>;
  onboardedAt: string;
}

// ============================================================================
// 1. STATE CODES MAP FOR GSTIN & FSSAI
// ============================================================================

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
  "27": "Maharashtra",
  "29": "Karnataka",
  "30": "Goa",
  "32": "Kerala",
  "33": "Tamil Nadu",
  "36": "Telangana",
  "37": "Andhra Pradesh",
};

// No local statutory registry: format validation cannot establish official compliance.

// ============================================================================
// 2. FSSAI & GST AUTOMATED VERIFICATION
// ============================================================================

/**
 * Checks FSSAI format only. Never assert active registration without official evidence.
 */
export async function verifyFSSAI(fssaiNumber: string): Promise<FSSAIValidationResult> {
  const verifiedAt = new Date().toISOString();
  const cleaned = (fssaiNumber || "").trim();

  // 1. Strict Format Validator: exactly 14 numeric digits
  if (!/^\d{14}$/.test(cleaned)) {
    return {
      isValid: false,
      licenseNumber: cleaned,
      status: "INVALID",
      failureReason: `Invalid FSSAI format: '${cleaned}' must be exactly 14 digits.`,
      verifiedAt,
    };
  }

  // 2. Extract components
  const regDigit = cleaned.charAt(0);
  const stateCode = cleaned.substring(1, 3);
  const registrationType: FSSAIValidationResult["registrationType"] =
    regDigit === "1" ? "STATE_LICENSE" : regDigit === "2" ? "REGISTRATION" : "CENTRAL_LICENSE";

  // Format is not proof of active licensing. Never claim registry verification
  // without an authorized FSSAI response or reviewed documentary evidence.
  return {
    isValid: false,
    licenseNumber: cleaned,
    status: "PENDING_VERIFICATION",
    stateCode,
    registrationType,
    failureReason: "FSSAI format accepted; official status has not been verified. Manual compliance review required.",
    verifiedAt,
  };
}

/**
 * Checks GSTIN format only. Never assert current tax registration without official evidence.
 */
export async function verifyGSTIN(gstin: string): Promise<GSTINValidationResult> {
  const verifiedAt = new Date().toISOString();
  const cleaned = (gstin || "").trim().toUpperCase();

  // 1. Strict Format Validator: 15 alphanumeric characters
  // Regex: 2 digits (state) + 5 letters + 4 digits + 1 letter (PAN) + 1 alphanumeric + 'Z' + 1 checksum
  const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

  if (!GSTIN_REGEX.test(cleaned)) {
    return {
      isValid: false,
      gstin: cleaned,
      status: "INVALID",
      failureReason: `Invalid GSTIN format: '${cleaned}' does not match standard 15-character GST pattern (e.g. 18AABCR1234F1Z5).`,
      verifiedAt,
    };
  }

  const stateCode = cleaned.substring(0, 2);
  const pan = cleaned.substring(2, 12);
  const stateName = INDIAN_STATE_CODES[stateCode] || "Other / Union Territory";

  // A valid GSTIN pattern does not establish registration or current status.
  // Only an authorized registry response or verified manual review can approve it.
  return {
    isValid: false,
    gstin: cleaned,
    status: "PENDING_VERIFICATION",
    stateCode,
    stateName,
    pan,
    failureReason: "GSTIN format accepted; official registration status has not been verified. Manual compliance review required.",
    verifiedAt,
  };
}

// ============================================================================
// 3. OCR / TEXT MENU DIGITIZER
// ============================================================================

/**
 * Parses raw text or OCR output into structured dishes, descriptions, categories,
 * veg/non-veg tags, and integer paise prices.
 */
export function digitizeMenuFromOcr(rawOcrText: string): DigitizedMenuCatalog {
  const lines = rawOcrText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const categoriesMap: Map<string, DigitizedMenuItem[]> = new Map();
  const validCategories: Array<"Starters" | "Main" | "Breads" | "Desserts" | "Beverages"> = [
    "Starters",
    "Main",
    "Breads",
    "Desserts",
    "Beverages",
  ];

  // Initialize standard buckets
  for (const cat of validCategories) {
    categoriesMap.set(cat, []);
  }

  let currentCategory: "Starters" | "Main" | "Breads" | "Desserts" | "Beverages" = "Main";

  for (const line of lines) {
    // Check if line represents a section header
    const detectedHeader = detectSectionHeader(line);
    if (detectedHeader) {
      currentCategory = detectedHeader;
      continue;
    }

    // Try parsing dish line
    const parsedItem = parseDishLine(line, currentCategory);
    if (parsedItem) {
      const targetCategory = parsedItem.category;
      if (!categoriesMap.has(targetCategory)) {
        categoriesMap.set(targetCategory, []);
      }
      categoriesMap.get(targetCategory)!.push(parsedItem);
    }
  }

  // Build category objects
  let totalDishesCount = 0;
  let vegDishesCount = 0;
  let nonVegDishesCount = 0;
  let eggDishesCount = 0;

  const categories: DigitizedCategory[] = [];
  let sortOrder = 1;

  for (const [catName, items] of categoriesMap.entries()) {
    if (items.length > 0) {
      categories.push({
        id: `cat_${catName.toLowerCase()}`,
        name: catName,
        sortOrder: sortOrder++,
        items,
      });

      for (const it of items) {
        totalDishesCount++;
        if (it.diet === "VEG" || it.diet === "VEGAN") vegDishesCount++;
        else if (it.diet === "NONVEG") nonVegDishesCount++;
        else if (it.diet === "EGG") eggDishesCount++;
      }
    }
  }

  return {
    categories,
    totalDishesCount,
    vegDishesCount,
    nonVegDishesCount,
    eggDishesCount,
    digitizedAt: new Date().toISOString(),
  };
}

function detectSectionHeader(
  line: string
): ("Starters" | "Main" | "Breads" | "Desserts" | "Beverages") | null {
  const trimmed = line.trim();

  // If the line contains a price, currency symbol, or ends with a price/number, it is a dish line, NOT a section header!
  if (/(?:₹|Rs\.?|\bINR\b|\/-|\b[0-9]{2,4}\b(?:\s*(?:\[|\()(?:NV|V|E|VEG|NON-?VEG|EGG)(?:\]|\)))?\s*$)/i.test(trimmed)) {
    return null;
  }

  const upper = trimmed.toUpperCase().replace(/[#=*_~-]/g, "").trim();
  if (upper.length === 0 || upper.length > 50) return null;

  if (
    upper.includes("STARTER") ||
    upper.includes("APPETIZER") ||
    upper === "SOUPS" ||
    upper.includes("SNACKS")
  ) {
    return "Starters";
  }

  if (
    upper.includes("MAIN COURSE") ||
    upper === "MAINS" ||
    upper === "MAIN" ||
    upper.includes("CURRIES") ||
    upper.includes("GRAVIES") ||
    upper.includes("BIRYANI & RICE") ||
    upper === "THALI"
  ) {
    return "Main";
  }

  if (
    upper.includes("BREAD") ||
    upper.includes("ROTI") ||
    upper.includes("NAAN") ||
    upper.includes("PARATHA")
  ) {
    return "Breads";
  }

  if (
    upper.includes("DESSERT") ||
    upper.includes("SWEET") ||
    upper.includes("MITHAI") ||
    upper.includes("ICE CREAM")
  ) {
    return "Desserts";
  }

  if (
    upper.includes("BEVERAGE") ||
    upper.includes("DRINK") ||
    upper.includes("SHAKE") ||
    upper.includes("JUICE") ||
    upper.includes("CHAI & COFFEE")
  ) {
    return "Beverages";
  }

  return null;
}

/**
 * Parses individual line into a menu item.
 * Supports patterns like:
 * - "Paneer Butter Masala - ₹240"
 * - "Butter Naan 40"
 * - "Chicken Biryani (Spicy, served with raita) 350 [NV]"
 * - "Gulab Jamun (2 pcs) 80 (V)"
 */
export function parseDishLine(
  line: string,
  fallbackCategory: "Starters" | "Main" | "Breads" | "Desserts" | "Beverages"
): DigitizedMenuItem | null {
  const trimmed = line.trim();
  if (trimmed.length < 3) return null;

  // 1. Detect diet flag from the full raw line first
  const diet = inferDiet(trimmed);

  // 2. Regex to extract price near the end of line, even if followed by tags like [NV], (V), (E)
  // Handles: "- ₹240", "40", "350 [NV]", "₹360 [NV]", "240 (E)", "80 (V)", "280/-"
  const priceRegex =
    /(?:[-–—:]\s*)?(?:₹|Rs\.?|INR)?\s*([0-9]{1,4}(?:\.[0-9]{1,2})?)\s*(?:\/-)?(?:\s*(?:\[|\()(?:NV|V|E|VEG|NON-?VEG|EGG)(?:\]|\)))*\s*$/i;
  const match = trimmed.match(priceRegex);

  let pricePaise = 0;
  let remainingText = trimmed;

  if (match && match.index !== undefined) {
    const rawNumber = parseFloat(match[1]);
    pricePaise = Math.round(rawNumber * 100);
    remainingText = trimmed.substring(0, match.index).trim();
  } else {
    // Attempt mid-line price extraction (e.g. "Paneer Tikka ₹220 (Spicy)")
    const midMatch = trimmed.match(/(?:₹|Rs\.?|INR)\s*([0-9]{1,4}(?:\.[0-9]{1,2})?)/i);
    if (midMatch && midMatch.index !== undefined) {
      pricePaise = Math.round(parseFloat(midMatch[1]) * 100);
      remainingText = (
        trimmed.substring(0, midMatch.index) +
        " " +
        trimmed.substring(midMatch.index + midMatch[0].length)
      ).trim();
    } else {
      return null; // No price detected, skip line
    }
  }

  // Clean trailing hyphens, colons, or separators
  remainingText = remainingText.replace(/[-–—:]\s*$/, "").trim();

  // Strip any inline dietary tags like [NV], [V], (E) from remaining text
  remainingText = remainingText
    .replace(/\[\s*(?:NV|V|E|VEG|NON-?VEG|EGG)\s*\]/gi, "")
    .replace(/\(\s*(?:NV|V|E|VEG|NON-?VEG|EGG)\s*\)/gi, "")
    .trim();

  // Extract description if in parentheses: e.g. "Chicken Biryani (Spicy, served with raita)"
  let description = "";
  const descMatch = remainingText.match(/\(([^)]+)\)/);
  if (descMatch) {
    const candidate = descMatch[1].trim();
    if (!/^(v|nv|veg|non-veg|egg)$/i.test(candidate)) {
      description = candidate;
    }
  }

  // Clean dish name
  let dishName = remainingText
    .replace(/\(([^)]+)\)/g, (_m, content) => {
      // If it was captured as description, remove it from dish name
      return content === description ? "" : _m;
    })
    .replace(/[-–—:]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (dishName.length === 0) return null;

  // Infer category if it fits specialized types
  let category = fallbackCategory;
  const lowerName = dishName.toLowerCase();

  if (
    lowerName.includes("naan") ||
    lowerName.includes("roti") ||
    lowerName.includes("paratha") ||
    lowerName.includes("kulcha")
  ) {
    category = "Breads";
  } else if (
    lowerName.includes("tikka") ||
    lowerName.includes("kebab") ||
    lowerName.includes("soup") ||
    lowerName.includes("roll") ||
    lowerName.includes("pakora") ||
    lowerName.includes("crispy") ||
    lowerName.includes("finger")
  ) {
    category = "Starters";
  } else if (
    lowerName.includes("jamun") ||
    lowerName.includes("rasmalai") ||
    lowerName.includes("halwa") ||
    lowerName.includes("kulfi") ||
    lowerName.includes("ice cream")
  ) {
    category = "Desserts";
  } else if (
    lowerName.includes("lassi") ||
    lowerName.includes("chai") ||
    lowerName.includes("coffee") ||
    lowerName.includes("shake") ||
    lowerName.includes("soda") ||
    lowerName.includes("water")
  ) {
    category = "Beverages";
  }

  const itemId = `itm_${Math.random().toString(36).substring(2, 9)}`;
  const formattedPrice = `₹${(pricePaise / 100).toFixed(2)}`;

  // Default prep minutes by category
  const prepMinutes =
    category === "Breads" ? 8 : category === "Starters" ? 12 : category === "Desserts" ? 5 : 15;

  return {
    id: itemId,
    name: dishName,
    description: description || `Delicious freshly prepared ${dishName}`,
    category,
    diet,
    pricePaise,
    formattedPrice,
    prepMinutes,
    inStock: true,
  };
}

/**
 * Infers DietFlag: VEG, NONVEG, EGG, or VEGAN based on markers and ingredients.
 */
export function inferDiet(text: string): DietFlag {
  const upper = text.toUpperCase();

  // Explicit marker tags
  if (/\[NV\]|\(NV\)|\bNON-?VEG\b/i.test(upper)) {
    return "NONVEG";
  }
  if (/\[E\]|\(E\)|\bEGG\b/i.test(upper) && !/VEG/i.test(upper)) {
    return "EGG";
  }
  if (/\[V\]|\(V\)|\bVEG\b|\bPURE VEG\b/i.test(upper) && !/NON/i.test(upper)) {
    return "VEG";
  }
  if (/\bVEGAN\b/i.test(upper)) {
    return "VEGAN";
  }

  // Non-veg keywords
  const nonVegKeywords = [
    "CHICKEN",
    "MUTTON",
    "GOSHT",
    "FISH",
    "PRAWN",
    "KEEMA",
    "MURGH",
    "LAMB",
    "PORK",
    "BEEF",
    "TANDOORI CHICKEN",
    "BUTTER CHICKEN",
    "SEEKH KEBAB",
  ];
  for (const kw of nonVegKeywords) {
    if (upper.includes(kw)) {
      return "NONVEG";
    }
  }

  // Egg keywords
  if (upper.includes("EGG") || upper.includes("OMELETTE") || upper.includes("ANDA")) {
    return "EGG";
  }

  // Default to VEG for standard items
  return "VEG";
}

// ============================================================================
// 4. AUTONOMOUS ONBOARDING PIPELINE
// ============================================================================

/**
 * Merchant onboarding validation:
 * 1. Checks FSSAI/GSTIN syntax without inventing registry status.
 * 2. Leaves unverified applications pending external/manual review.
 * 3. Processes menus only after actual compliance approval becomes available.
 */
export async function autonomousMerchantOnboard(
  input: MerchantOnboardingInput
): Promise<MerchantOnboardingResult> {
  const auditTrail: MerchantOnboardingResult["auditTrail"] = [];
  const startTime = new Date().toISOString();

  // Step 1: FSSAI syntax only; no unverified statutory approval
  const fssaiVerification = await verifyFSSAI(input.fssaiNumber);
  auditTrail.push({
    step: "FSSAI_COMPLIANCE_VERIFICATION",
    timestamp: new Date().toISOString(),
    status: fssaiVerification.isValid ? "PASSED" : fssaiVerification.status === "PENDING_VERIFICATION" ? "PENDING" : "FAILED",
    details: { fssai: input.fssaiNumber, status: fssaiVerification.status },
  });

  // Step 2: GSTIN syntax only; no unverified tax-registry approval
  const gstinVerification = await verifyGSTIN(input.gstin);
  auditTrail.push({
    step: "GSTIN_COMPLIANCE_VERIFICATION",
    timestamp: new Date().toISOString(),
    status: gstinVerification.isValid ? "PASSED" : gstinVerification.status === "PENDING_VERIFICATION" ? "PENDING" : "FAILED",
    details: { gstin: input.gstin, status: gstinVerification.status },
  });

  const rejectionReasons: string[] = [];
  if (!fssaiVerification.isValid) {
    rejectionReasons.push(`FSSAI ${fssaiVerification.status === "PENDING_VERIFICATION" ? "Pending" : "Failed"}: ${fssaiVerification.failureReason}`);
  }
  if (!gstinVerification.isValid) {
    rejectionReasons.push(`GSTIN ${gstinVerification.status === "PENDING_VERIFICATION" ? "Pending" : "Failed"}: ${gstinVerification.failureReason}`);
  }

  // A format-valid document awaits real verification; malformed documents are rejected.
  if (rejectionReasons.length > 0) {
    const hasInvalidDocument = [fssaiVerification, gstinVerification].some(
      (result) => !result.isValid && result.status !== "PENDING_VERIFICATION"
    );
    const pending = !hasInvalidDocument;
    return {
      merchantId: pending ? `rst_pending_${Date.now()}` : `rst_rejected_${Date.now()}`,
      status: pending ? "PENDING_VERIFICATION" : "REJECTED_COMPLIANCE",
      compliancePassed: false,
      zeroHumanOnboarded: false,
      verification: {
        fssai: fssaiVerification,
        gstin: gstinVerification,
      },
      rejectionReasons,
      auditTrail,
      onboardedAt: startTime,
    };
  }

  // Step 3: OCR / Text Menu Digitizer
  const digitizedMenu = digitizeMenuFromOcr(input.rawMenuOcrText);
  auditTrail.push({
    step: "OCR_MENU_DIGITIZATION",
    timestamp: new Date().toISOString(),
    status: "COMPLETED",
    details: {
      dishesCount: digitizedMenu.totalDishesCount,
      categoriesCount: digitizedMenu.categories.length,
      vegCount: digitizedMenu.vegDishesCount,
      nonVegCount: digitizedMenu.nonVegDishesCount,
    },
  });

  const merchantId = `rst_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  auditTrail.push({
    step: "AUTONOMOUS_MERCHANT_ACTIVATED",
    timestamp: new Date().toISOString(),
    status: "ACTIVE",
    details: { merchantId, tradeName: input.tradeName || input.merchantName },
  });

  return {
    merchantId,
    status: "ONBOARDED_ACTIVE",
    compliancePassed: true,
    zeroHumanOnboarded: true,
    verification: {
      fssai: fssaiVerification,
      gstin: gstinVerification,
    },
    digitizedMenu,
    auditTrail,
    onboardedAt: startTime,
  };
}
