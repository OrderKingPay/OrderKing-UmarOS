/**
 * Indian Statutory Regulatory Verification Engine for OrderKing Merchants
 * 
 * Implements strict compliance verification for Indian statutory authorities:
 * - FSSAI (Food Safety and Standards Authority of India) - 14-digit license/registration
 * - GSTIN (Goods and Services Tax Identification Number) - 15-character statutory format
 * - Bank IFSC (Indian Financial System Code) - 11-character bank routing format
 * - PAN (Permanent Account Number) - 10-character Indian Income Tax alphanumeric format
 * 
 * Also enforces the statutory invariant:
 * - Unverified restaurants have their menus locked in 'PENDING_VERIFICATION' state
 *   until statutory KYC is approved.
 */

// Official 2-digit Indian State / UT codes (Census / GST / FSSAI)
export const INDIAN_STATE_CODES = new Set([
  "00", // Central / Head Office License (FSSAI)
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
  "26", // Dadra & Nagar Haveli and Daman & Diu
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
  "37", // Andhra Pradesh (New) / Ladakh
  "38", // Ladakh
]);

export interface FssaiParsedResult {
  isValid: boolean;
  registrationType?: number;
  typeName?: string;
  stateCode?: string;
  year?: string;
  registrarCode?: string;
  serialNumber?: string;
  error?: string;
}

/**
 * 14-digit FSSAI Registration & License Validator
 * 
 * Format breakdown:
 * - Digit 1: License / Registration Type:
 *     1 = Registration (Petty Food Business / < ₹12 Lakhs annual turnover)
 *     2 = State License (Medium Business / ₹12 Lakhs - ₹20 Crores)
 *     3 = Central License (Large Business / > ₹20 Crores or Central operations)
 * - Digits 2-3: State / UT Code (00 for Central, 01-38 for Indian States and UTs)
 * - Digits 4-5: Year of enrollment / issuance (e.g. 06 to 99)
 * - Digits 6-8: Quantity / Registrar / Directorate Code (3 digits)
 * - Digits 9-14: 6-digit running serial license number
 */
export function validateFssai(fssai: string | null | undefined): boolean {
  if (!fssai || typeof fssai !== "string") return false;
  const clean = fssai.trim();

  // Exactly 14 digits
  if (!/^[0-9]{14}$/.test(clean)) {
    return false;
  }

  // Digit 1: Must be valid registration type (1, 2, or 3)
  const regType = clean[0];
  if (!["1", "2", "3"].includes(regType)) {
    return false;
  }

  // Digits 2-3: Valid Indian State Code (00 for Central, 01-38 for States)
  const stateCode = clean.slice(1, 3);
  if (!INDIAN_STATE_CODES.has(stateCode)) {
    return false;
  }

  // Central state code '00' is only permissible for Central license (type 3 or 1 central)
  if (stateCode === "00" && regType === "2") {
    return false;
  }

  // Digits 9-14: Serial number cannot be all zeros
  const serial = clean.slice(8, 14);
  if (serial === "000000") {
    return false;
  }

  return true;
}

/**
 * Decomposes and parses a 14-digit FSSAI number into its statutory components.
 */
export function parseFssai(fssai: string | null | undefined): FssaiParsedResult {
  if (!fssai || typeof fssai !== "string") {
    return { isValid: false, error: "FSSAI number is required" };
  }
  const clean = fssai.trim();

  if (!/^[0-9]{14}$/.test(clean)) {
    return { isValid: false, error: "FSSAI must be exactly 14 numeric digits" };
  }

  const typeDigit = parseInt(clean[0], 10);
  let typeName = "Unknown";
  if (typeDigit === 1) typeName = "Registration (Petty Food Business)";
  else if (typeDigit === 2) typeName = "State License";
  else if (typeDigit === 3) typeName = "Central License";
  else {
    return { isValid: false, error: "Invalid registration type digit: must start with 1, 2, or 3" };
  }

  const stateCode = clean.slice(1, 3);
  if (!INDIAN_STATE_CODES.has(stateCode)) {
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
 * Algorithmic checksum calculation for FSSAI / 14-digit numeric identifiers (Luhn mod-10).
 */
export function calculateFssaiChecksum(digits13: string): number {
  let sum = 0;
  for (let i = 0; i < digits13.length; i++) {
    let digit = parseInt(digits13[i], 10);
    // Double every second digit from right
    if ((digits13.length - i) % 2 === 0) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return (10 - (sum % 10)) % 10;
}

/**
 * 15-character Indian Statutory GSTIN (Goods & Services Tax) Validator
 * 
 * Format breakdown:
 * - Digits 1-2: 2-digit Indian State code (01-38, '00' is invalid for GSTIN)
 * - Characters 3-7: 5 uppercase letters (PAN card first 5 chars)
 * - Characters 8-11: 4 digits (PAN card sequential numbers)
 * - Character 12: 1 uppercase letter (PAN card check character)
 * - Character 13: 1 alphanumeric entity code (1-9 or A-Z)
 * - Character 14: Default statutory constant 'Z'
 * - Character 15: 1 alphanumeric checksum character (0-9 or A-Z)
 */
export function validateGstin(gstin: string | null | undefined): boolean {
  if (!gstin || typeof gstin !== "string") return false;
  const clean = gstin.trim().toUpperCase();

  // Statutory 15-character pattern
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!gstinRegex.test(clean)) {
    return false;
  }

  // Validate state code (01 to 38, '00' is not a valid GST state code)
  const stateCode = clean.slice(0, 2);
  if (stateCode === "00" || !INDIAN_STATE_CODES.has(stateCode)) {
    return false;
  }

  return true;
}

/**
 * Calculates statutory GSTIN Mod-36 checksum character for first 14 characters.
 */
export function calculateGstinChecksum(gstin14: string): string {
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const clean = gstin14.slice(0, 14).toUpperCase();
  let sum = 0;

  for (let i = 0; i < clean.length; i++) {
    const val = chars.indexOf(clean[i]);
    if (val === -1) return "";
    const weight = (i % 2 === 0) ? 1 : 2;
    const factor = val * weight;
    const quotient = Math.floor(factor / 36);
    const remainder = factor % 36;
    sum += quotient + remainder;
  }

  const checkVal = (36 - (sum % 36)) % 36;
  return chars[checkVal];
}

/**
 * Verifies statutory GSTIN checksum using official Mod-36 algorithm.
 */
export function validateGstinChecksum(gstin: string | null | undefined): boolean {
  if (!validateGstin(gstin)) return false;
  const clean = gstin!.trim().toUpperCase();
  const expectedCheck = calculateGstinChecksum(clean.slice(0, 14));
  return clean[14] === expectedCheck;
}

/**
 * 11-character Indian Bank IFSC Code Validator
 * 
 * Format breakdown:
 * - Characters 1-4: 4 uppercase alphabetic bank code (e.g. HDFC, SBIN, ICIC, UTIB)
 * - Character 5: Always '0' (reserved for future use)
 * - Characters 6-11: 6 alphanumeric branch code (e.g. 002049, 001234, ABC123)
 */
export function validateIfsc(ifsc: string | null | undefined): boolean {
  if (!ifsc || typeof ifsc !== "string") return false;
  const clean = ifsc.trim().toUpperCase();

  // Exactly 11 characters: 4 alpha + '0' + 6 alphanumeric
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  return ifscRegex.test(clean);
}

/**
 * 10-character Indian Income Tax PAN (Permanent Account Number) Validator
 * 
 * Format breakdown:
 * - Characters 1-3: 3 uppercase letters (alphabetic series)
 * - Character 4: 1 uppercase letter representing entity type:
 *     P = Person/Individual, C = Company, H = HUF, F = Firm/LLP,
 *     A = AOP, T = Trust, B = BOI, L = Local Authority, J = Artificial Juridical, G = Govt
 * - Character 5: 1 uppercase letter (holder's surname initial or entity initial)
 * - Characters 6-9: 4 digits (0001 - 9999)
 * - Character 10: 1 uppercase letter (alphabetic check character)
 */
export function validatePan(pan: string | null | undefined): boolean {
  if (!pan || typeof pan !== "string") return false;
  const clean = pan.trim().toUpperCase();

  // Exactly 10 characters: 5 letters, 4 digits, 1 letter
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(clean);
}

/**
 * Bank Account Number Validator
 * Indian bank account numbers are typically 9 to 18 numeric digits.
 */
export function validateBankAccount(account: string | null | undefined): boolean {
  if (!account || typeof account !== "string") return false;
  const clean = account.trim();
  return /^[0-9]{9,18}$/.test(clean);
}

export interface StatutoryKycInput {
  fssaiNumber: string;
  pan: string;
  bankIfsc: string;
  gstin?: string | null;
  bankAccount?: string | null;
}

export interface StatutoryKycValidationResult {
  isValid: boolean;
  errors: {
    fssai?: string;
    pan?: string;
    bankIfsc?: string;
    gstin?: string;
    bankAccount?: string;
  };
  details: {
    fssaiValid: boolean;
    panValid: boolean;
    ifscValid: boolean;
    gstinValid: boolean;
    bankAccountValid: boolean;
  };
}

/**
 * Comprehensive Statutory KYC Validator
 * Validates all statutory registration credentials required for merchant acquisition.
 */
export function validateStatutoryKyc(input: StatutoryKycInput): StatutoryKycValidationResult {
  const errors: StatutoryKycValidationResult["errors"] = {};

  const fssaiValid = validateFssai(input.fssaiNumber);
  if (!fssaiValid) {
    const parse = parseFssai(input.fssaiNumber);
    errors.fssai = parse.error || "Invalid 14-digit FSSAI registration number. Must be 14 digits with valid state & license codes.";
  }

  const panValid = validatePan(input.pan);
  if (!panValid) {
    errors.pan = "Invalid PAN card number. Must be 10 characters (e.g. ABCDE1234F).";
  }

  const ifscValid = validateIfsc(input.bankIfsc);
  if (!ifscValid) {
    errors.bankIfsc = "Invalid Bank IFSC code. Must be 4 letters followed by '0' and 6 alphanumeric characters (e.g. HDFC0001234).";
  }

  let gstinValid = true;
  if (input.gstin && input.gstin.trim() !== "") {
    gstinValid = validateGstin(input.gstin);
    if (!gstinValid) {
      errors.gstin = "Invalid GSTIN format. Must be 15 statutory characters with valid state code (e.g. 29ABCDE1234F1Z5).";
    }
  }

  let bankAccountValid = true;
  if (input.bankAccount !== undefined && input.bankAccount !== null && input.bankAccount.trim() !== "") {
    bankAccountValid = validateBankAccount(input.bankAccount);
    if (!bankAccountValid) {
      errors.bankAccount = "Invalid Bank Account number. Must be 9 to 18 numeric digits.";
    }
  }

  const isValid = fssaiValid && panValid && ifscValid && gstinValid && bankAccountValid;

  return {
    isValid,
    errors,
    details: {
      fssaiValid,
      panValid,
      ifscValid,
      gstinValid,
      bankAccountValid,
    },
  };
}

// =========================================================================
// MENU LOCKING & STATUTORY KYC STATUS ENFORCEMENT
// =========================================================================

export type MenuLockStatus = "ACTIVE" | "PENDING_VERIFICATION";

/**
 * Returns true if the merchant's statutory KYC has been verified and approved.
 */
export function isStatutoryKycApproved(status: string | undefined | null): boolean {
  if (!status) return false;
  const normalized = status.trim().toUpperCase();
  return normalized === "APPROVED" || normalized === "VERIFIED";
}

/**
 * Computes menu lock state based on restaurant verification status.
 * Unverified restaurants have their menus locked in 'PENDING_VERIFICATION' state.
 */
export function getMenuLockState(status: string | undefined | null): {
  isLocked: boolean;
  menuStatus: MenuLockStatus;
  reason: string | null;
} {
  if (isStatutoryKycApproved(status)) {
    return {
      isLocked: false,
      menuStatus: "ACTIVE",
      reason: null,
    };
  }

  return {
    isLocked: true,
    menuStatus: "PENDING_VERIFICATION",
    reason: "Menu is locked in 'PENDING_VERIFICATION' state until statutory KYC is approved.",
  };
}

/**
 * Guard assertion that ensures the menu is not locked.
 * Throws an informative Error if the restaurant's KYC is unapproved.
 */
export function assertMenuUnlocked(status: string | undefined | null): void {
  if (!isStatutoryKycApproved(status)) {
    throw new Error("Menu is locked in 'PENDING_VERIFICATION' state until statutory KYC is approved.");
  }
}
