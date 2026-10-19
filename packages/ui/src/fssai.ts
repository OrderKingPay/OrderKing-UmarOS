/**
 * 🇮🇳 ORDERKING / UMAROS FSSAI COMPLIANCE ENGINE
 * packages/ui/src/fssai.ts
 *
 * Statutory Compliance Standards:
 * 1. Food Safety and Standards Act, 2006 (Act 34 of 2006):
 *    - Mandatory 14-digit license/registration validation and state routing.
 *    - License expiry tracking with FoSCoS renewal window (Section 31).
 *    - Automatic ordering block / de-listing upon license expiry.
 * 2. Food Safety and Standards (Labelling and Display) Regulations, 2020:
 *    - Mandatory Vegetarian logo: Green filled circle inside a square with green outline.
 *    - Mandatory Non-Vegetarian logo: Brown filled triangle inside a square with brown outline (or red dot).
 *    - Egg food declaration.
 * 3. Food safety shelf-life and prepared meal expiry tracking:
 *    - Prepared meals: Maximum 4-hour hot-holding / consumption window under FSSAI guidelines.
 */

export const FSSAI_STATE_CODES = new Set([
  "00", // Central / Head Office License
  "01", // Jammu & Kashmir
  "02", // Himachal Pradesh
  "03", // Punjab
  "04", // Chandigarh
  "05", // Uttarakhand
  "06", // Haryana
  "07", // Delhi
  "08", // Rajasthan
  "09", // Uttar Pradesh
  "10", // Bihar
  "11", // Sikkim
  "12", // Arunachal Pradesh
  "13", // Nagaland
  "14", // Manipur
  "15", // Mizoram
  "16", // Tripura
  "17", // Meghalaya
  "18", // Assam
  "19", // West Bengal
  "20", // Jharkhand
  "21", // Odisha
  "22", // Chhattisgarh
  "23", // Madhya Pradesh
  "24", // Gujarat
  "25", // Daman & Diu
  "26", // Dadra & Nagar Haveli
  "27", // Maharashtra
  "28", // Andhra Pradesh
  "29", // Karnataka
  "30", // Goa
  "31", // Lakshadweep
  "32", // Kerala
  "33", // Tamil Nadu
  "34", // Puducherry
  "35", // Andaman & Nicobar Islands
  "36", // Telangana
  "37", // Andhra Pradesh (New)
  "38", // Ladakh
]);

export interface FssaiParsedResult {
  isValid: boolean;
  registrationType?: 1 | 2 | 3;
  typeName?: string;
  stateCode?: string;
  year?: string;
  registrarCode?: string;
  serialNumber?: string;
  error?: string;
}

export type FssaiExpiryStatus = "VALID" | "EXPIRING_SOON" | "EXPIRED" | "INVALID_DATE" | "MISSING";

export interface FssaiExpiryResult {
  status: FssaiExpiryStatus;
  daysRemaining: number;
  isExpiringSoon: boolean; // 0 < days <= 30
  isExpired: boolean; // days <= 0
  canAcceptOrders: boolean; // true only if NOT expired
  expiryDateFormatted?: string;
  message: string;
}

export type DietaryType = "VEG" | "NON_VEG" | "EGG";

export interface StatutoryDietaryLabel {
  dietaryType: DietaryType;
  symbolName: "GREEN_DOT" | "BROWN_TRIANGLE" | "EGG_SYMBOL";
  symbolShape: "CIRCLE_IN_SQUARE" | "TRIANGLE_IN_SQUARE" | "OVAL_DECLARATION";
  primaryColor: string; // #008000 (Green) or #8B0000 / #964B00 (Brown)
  labelEnglish: string;
  fssaiMandateText: string;
  isVegetarian: boolean;
  isNonVegetarian: boolean;
  containsEgg: boolean;
}

export interface PreparedFoodShelfLifeResult {
  isSafeForConsumption: boolean;
  isExpired: boolean;
  preparedAtIso: string;
  maxExpiryIso: string;
  minutesRemaining: number;
  message: string;
}

/**
 * 14-digit FSSAI Registration & License Validator
 */
export function validateFssaiNumber(fssai: string | null | undefined): boolean {
  if (!fssai || typeof fssai !== "string") return false;
  const clean = fssai.trim();

  // Exactly 14 digits
  if (!/^[0-9]{14}$/.test(clean)) {
    return false;
  }

  // Digit 1: 1 = Registration, 2 = State License, 3 = Central License
  const regType = clean[0];
  if (!["1", "2", "3"].includes(regType)) {
    return false;
  }

  // Digits 2-3: Valid Indian State Code
  const stateCode = clean.slice(1, 3);
  if (!FSSAI_STATE_CODES.has(stateCode)) {
    return false;
  }

  // Central state code '00' is permissible only for Central license (type 3 or 1 central)
  if (stateCode === "00" && regType === "2") {
    return false;
  }

  // Digits 9-14: Running serial cannot be all zeros
  const serial = clean.slice(8, 14);
  if (serial === "000000") {
    return false;
  }

  return true;
}

/**
 * Decomposes 14-digit FSSAI into statutory metadata.
 */
export function parseFssaiNumber(fssai: string | null | undefined): FssaiParsedResult {
  if (!fssai || typeof fssai !== "string") {
    return { isValid: false, error: "FSSAI number is required" };
  }
  const clean = fssai.trim();

  if (!/^[0-9]{14}$/.test(clean)) {
    return { isValid: false, error: "FSSAI must be exactly 14 numeric digits" };
  }

  const typeDigit = parseInt(clean[0], 10) as 1 | 2 | 3;
  let typeName = "Unknown";
  if (typeDigit === 1) typeName = "Registration (Petty Food Business / < ₹12L Turnover)";
  else if (typeDigit === 2) typeName = "State License (Medium Business / ₹12L - ₹20Cr Turnover)";
  else if (typeDigit === 3) typeName = "Central License (Large Business / > ₹20Cr Turnover)";
  else {
    return { isValid: false, error: "Invalid registration type digit: must start with 1, 2, or 3" };
  }

  const stateCode = clean.slice(1, 3);
  if (!FSSAI_STATE_CODES.has(stateCode)) {
    return { isValid: false, error: `Invalid state code '${stateCode}' in FSSAI registration` };
  }

  if (stateCode === "00" && typeDigit === 2) {
    return { isValid: false, error: "State license cannot use central jurisdiction code '00'" };
  }

  const year = clean.slice(3, 5);
  const registrarCode = clean.slice(5, 8);
  const serialNumber = clean.slice(8, 14);

  if (serialNumber === "000000") {
    return { isValid: false, error: "Serial number cannot be all zeros" };
  }

  return {
    isValid: true,
    registrationType: typeDigit,
    typeName,
    stateCode,
    year,
    registrarCode,
    serialNumber,
  };
}

/**
 * Calculates FSSAI license expiry status and enforces ordering gate.
 */
export function calculateFssaiExpiryStatus(
  expiryDate: string | Date | null | undefined,
  referenceDate: Date = new Date()
): FssaiExpiryResult {
  if (!expiryDate) {
    return {
      status: "MISSING",
      daysRemaining: 0,
      isExpiringSoon: false,
      isExpired: true,
      canAcceptOrders: false,
      message: "FSSAI license expiry date is required under Food Safety and Standards Act, 2006.",
    };
  }

  const exp = typeof expiryDate === "string" ? new Date(expiryDate) : expiryDate;
  if (isNaN(exp.getTime())) {
    return {
      status: "INVALID_DATE",
      daysRemaining: 0,
      isExpiringSoon: false,
      isExpired: true,
      canAcceptOrders: false,
      message: "Invalid FSSAI expiry date format.",
    };
  }

  const refMidnight = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  ).getTime();
  const expMidnight = new Date(
    exp.getFullYear(),
    exp.getMonth(),
    exp.getDate()
  ).getTime();
  const diffMs = expMidnight - refMidnight;
  const daysRemaining = Math.round(diffMs / (1000 * 60 * 60 * 24));

  const yyyy = exp.getFullYear();
  const mm = String(exp.getMonth() + 1).padStart(2, "0");
  const dd = String(exp.getDate()).padStart(2, "0");
  const expiryDateFormatted = `${yyyy}-${mm}-${dd}`;

  if (daysRemaining <= 0) {
    return {
      status: "EXPIRED",
      daysRemaining,
      isExpiringSoon: false,
      isExpired: true,
      canAcceptOrders: false,
      expiryDateFormatted,
      message: `FSSAI license expired ${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) === 1 ? "" : "s"} ago. Platform ordering halted. FoSCoS renewal required.`,
    };
  }

  if (daysRemaining <= 30) {
    return {
      status: "EXPIRING_SOON",
      daysRemaining,
      isExpiringSoon: true,
      isExpired: false,
      canAcceptOrders: true,
      expiryDateFormatted,
      message: `FSSAI license renewal due in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}. Section 31 FoSCoS window active.`,
    };
  }

  return {
    status: "VALID",
    daysRemaining,
    isExpiringSoon: false,
    isExpired: false,
    canAcceptOrders: true,
    expiryDateFormatted,
    message: `FSSAI license active and valid for ${daysRemaining} days.`,
  };
}

/**
 * Returns official FSSAI dietary declaration pursuant to:
 * Food Safety and Standards (Labelling and Display) Regulations, 2020.
 */
export function getFssaiDietaryLabel(type: DietaryType): StatutoryDietaryLabel {
  switch (type) {
    case "VEG":
      return {
        dietaryType: "VEG",
        symbolName: "GREEN_DOT",
        symbolShape: "CIRCLE_IN_SQUARE",
        primaryColor: "#008000",
        labelEnglish: "100% Vegetarian",
        fssaiMandateText: "Filled green circle inside a square with green outline (FSS Labelling Regs 2020, Reg 5(4)(c))",
        isVegetarian: true,
        isNonVegetarian: false,
        containsEgg: false,
      };
    case "NON_VEG":
      return {
        dietaryType: "NON_VEG",
        symbolName: "BROWN_TRIANGLE",
        symbolShape: "TRIANGLE_IN_SQUARE",
        primaryColor: "#8B0000",
        labelEnglish: "Non-Vegetarian",
        fssaiMandateText: "Filled brown triangle inside a square with brown outline (FSS Labelling Regs 2020, Reg 5(4)(c))",
        isVegetarian: false,
        isNonVegetarian: true,
        containsEgg: false,
      };
    case "EGG":
      return {
        dietaryType: "EGG",
        symbolName: "EGG_SYMBOL",
        symbolShape: "OVAL_DECLARATION",
        primaryColor: "#D97706",
        labelEnglish: "Contains Egg",
        fssaiMandateText: "Mandatory egg allergen & non-vegetarian classification declaration",
        isVegetarian: false,
        isNonVegetarian: true,
        containsEgg: true,
      };
  }
}

/**
 * Validates prepared hot/cold meal shelf-life per FSSAI hygiene guidelines.
 * Hot food max shelf-life: 4 hours (240 minutes).
 */
export function validatePreparedFoodShelfLife(
  preparedAt: Date | string,
  maxShelfLifeHours: number = 4,
  currentTime: Date = new Date()
): PreparedFoodShelfLifeResult {
  const prep = typeof preparedAt === "string" ? new Date(preparedAt) : preparedAt;
  if (isNaN(prep.getTime())) {
    throw new Error("Invalid preparedAt timestamp");
  }

  const maxExpiry = new Date(prep.getTime() + maxShelfLifeHours * 60 * 60 * 1000);
  const diffMs = maxExpiry.getTime() - currentTime.getTime();
  const minutesRemaining = Math.round(diffMs / (1000 * 60));

  const isSafeForConsumption = minutesRemaining > 0;
  const isExpired = !isSafeForConsumption;

  return {
    isSafeForConsumption,
    isExpired,
    preparedAtIso: prep.toISOString(),
    maxExpiryIso: maxExpiry.toISOString(),
    minutesRemaining,
    message: isSafeForConsumption
      ? `Prepared food safe for consumption (${minutesRemaining} minutes remaining).`
      : `Prepared food expired ${Math.abs(minutesRemaining)} minutes ago. Unsafe for delivery under FSSAI food safety norms.`,
  };
}
