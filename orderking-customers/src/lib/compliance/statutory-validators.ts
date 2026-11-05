// File: orderking-partners/src/lib/compliance/statutory-validators.ts
// Shared across orderking-partners, orderking-riders, orderking-customers, and HDmaster

export const ORDERKING_STATUTORY_CONSTANTS = {
  COMPANY_GSTIN: '18AFXPH9838M1Z9',
  PRIMARY_STATE_CODE: '18', // Assam
  PRIMARY_UPI_VPA: 'orderking@ybl',
  SECONDARY_UPI_VPA: '9395065587@ybl',
  CGST_SEC_9_5_FOOD_TAX_BPS: 500, // 5.00% under Section 9(5) CGST Act 2017
  CGST_SEC_52_TCS_BPS: 100,       // 1.00% TCS
  IT_SEC_194O_TDS_BPS: 10,        // 0.10% TDS
} as const;

// Dihedral Group D5 multiplication table for UIDAI Aadhaar Verhoeff Checksum
const VERHOEFF_D: ReadonlyArray<ReadonlyArray<number>> = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];

// Permutation table for UIDAI Aadhaar Verhoeff Checksum
const VERHOEFF_P: ReadonlyArray<ReadonlyArray<number>> = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

// Multiplicative inverse table for UIDAI Aadhaar Verhoeff Checksum
const VERHOEFF_INV: ReadonlyArray<number> = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

/**
 * Computes the Verhoeff check digit for an 11-digit prefix.
 */
export function computeVerhoeffCheckDigit(elevenDigits: string): number {
  const clean = elevenDigits.replace(/\s+/g, '');
  if (!/^\d{11}$/.test(clean)) {
    throw new Error('Input must be exactly 11 numeric digits to compute Verhoeff check digit.');
  }
  let c = 0;
  const reversed = clean.split('').reverse().map(Number);
  for (let i = 0; i < reversed.length; i++) {
    c = VERHOEFF_D[c][VERHOEFF_P[(i + 1) % 8][reversed[i]]];
  }
  return VERHOEFF_INV[c];
}

/**
 * Validates a 12-digit Indian UIDAI Aadhaar number using the mathematical Verhoeff algorithm.
 * First digit of Aadhaar is never 0 or 1 per UIDAI numbering standard.
 */
export function validateAadhaarVerhoeff(rawAadhaar: string): {
  valid: boolean;
  normalized: string;
  reason?: string;
} {
  const clean = (rawAadhaar || '').replace(/[\s-]/g, '');
  if (!/^[2-9]\d{11}$/.test(clean)) {
    return {
      valid: false,
      normalized: clean,
      reason: 'Aadhaar must be 12 digits, cannot start with 0 or 1, and must contain digits only.',
    };
  }
  let c = 0;
  const reversed = clean.split('').reverse().map(Number);
  for (let i = 0; i < reversed.length; i++) {
    c = VERHOEFF_D[c][VERHOEFF_P[i % 8][reversed[i]]];
  }
  if (c !== 0) {
    return {
      valid: false,
      normalized: clean,
      reason: 'Aadhaar failed mathematical UIDAI Verhoeff checksum verification.',
    };
  }
  return { valid: true, normalized: clean };
}

/**
 * Validates a 14-digit FSSAI License / Registration Number:
 * - Digit 1: 1 (Registration) or 2 (State/Central License)
 * - Digits 2-3: Official Indian State/UT Code (01 to 38)
 * - Digits 4-5: Year of issuance (00 to 99)
 * - Digits 6-14: Licensing authority & sequential registration number
 */
export function validateFssaiLicense(rawFssai: string): {
  valid: boolean;
  normalized: string;
  licenseType?: 'CENTRAL_OR_STATE_LICENSE' | 'BASIC_REGISTRATION';
  stateCode?: string;
  reason?: string;
} {
  const clean = (rawFssai || '').replace(/\s+/g, '');
  if (!/^[12]\d{13}$/.test(clean)) {
    return {
      valid: false,
      normalized: clean,
      reason: 'FSSAI number must be 14 digits starting with 1 (Registration) or 2 (License).',
    };
  }
  const stateCodeNum = parseInt(clean.slice(1, 3), 10);
  if (stateCodeNum < 1 || stateCodeNum > 38) {
    return {
      valid: false,
      normalized: clean,
      reason: `Invalid Indian State code "${clean.slice(1, 3)}" in FSSAI number (must be 01-38).`,
    };
  }
  return {
    valid: true,
    normalized: clean,
    licenseType: clean[0] === '1' ? 'CENTRAL_OR_STATE_LICENSE' : 'BASIC_REGISTRATION',
    stateCode: clean.slice(1, 3),
  };
}

/**
 * Validates a 15-character Indian GSTIN (or optional Section 9(5) exemption).
 * Structure: 2-digit State Code (01-38) + 10-char PAN + Entity Code + 'Z' + Checksum char.
 */
export function validateGstin(
  rawGstin: string,
  options: { allowSection95Exempt?: boolean } = { allowSection95Exempt: true }
): {
  valid: boolean;
  normalized: string;
  isExempt: boolean;
  stateCode?: string;
  pan?: string;
  reason?: string;
} {
  const clean = (rawGstin || '').trim().toUpperCase();
  if (options.allowSection95Exempt && (!clean || clean === 'GST_EXEMPT_SEC_9_5')) {
    return {
      valid: true,
      normalized: 'GST_EXEMPT_SEC_9_5',
      isExempt: true,
    };
  }
  const gstRegex = /^(\d{2})([A-Z]{5}\d{4}[A-Z]{1})([1-9A-Z]{1})Z([0-9A-Z]{1})$/;
  const match = clean.match(gstRegex);
  if (!match) {
    return {
      valid: false,
      normalized: clean,
      isExempt: false,
      reason: 'GSTIN must be 15 characters (e.g., 18AFXPH9838M1Z9) with valid State code and PAN.',
    };
  }
  const stateCodeNum = parseInt(match[1], 10);
  if (stateCodeNum < 1 || stateCodeNum > 38) {
    return {
      valid: false,
      normalized: clean,
      isExempt: false,
      reason: `Invalid GST State code "${match[1]}" (must be between 01 and 38).`,
    };
  }
  return {
    valid: true,
    normalized: clean,
    isExempt: false,
    stateCode: match[1],
    pan: match[2],
  };
}

/**
 * Validates an 11-character Indian Bank IFSC code (4 bank letters + '0' + 6 branch alphanumeric chars).
 */
export function validateIfscCode(rawIfsc: string): {
  valid: boolean;
  normalized: string;
  bankCode?: string;
  branchCode?: string;
  reason?: string;
} {
  const clean = (rawIfsc || '').trim().toUpperCase();
  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(clean)) {
    return {
      valid: false,
      normalized: clean,
      reason: 'IFSC must be 11 characters: 4 bank letters, 0 as the 5th character, and 6 branch characters.',
    };
  }
  return {
    valid: true,
    normalized: clean,
    bankCode: clean.slice(0, 4),
    branchCode: clean.slice(5),
  };
}

/**
 * Calculates statutory Section 9(5) CGST Act 2017 food tax and partner settlement in integer paise.
 */
export function calculateStatutoryOrderTaxAndSettlementPaise(params: {
  foodSubtotalPaise: number;
  packagingPaise: number;
  merchantFundedDiscountPaise: number;
  commissionRateBps?: number; // default 1000 (10.00%)
  isRestaurantGstRegistered: boolean;
}): {
  netTaxableFoodPaise: number;
  sec95CgstPaise: number;
  sec95SgstPaise: number;
  totalFoodGstPaise: number;
  platformCommissionPaise: number;
  gstOnCommissionPaise: number;
  tcsSec52Paise: number;
  tdsSec194OPaise: number;
  merchantNetPayablePaise: number;
} {
  const netTaxableFoodPaise = Math.max(
    0,
    Math.trunc(params.foodSubtotalPaise) +
      Math.trunc(params.packagingPaise) -
      Math.trunc(params.merchantFundedDiscountPaise)
  );
  // 5% GST on food (2.5% CGST + 2.5% SGST) collected & remitted by ECO under Sec 9(5) CGST Act 2017
  const totalFoodGstPaise = Math.round(
    (netTaxableFoodPaise * ORDERKING_STATUTORY_CONSTANTS.CGST_SEC_9_5_FOOD_TAX_BPS) / 10000
  );
  const sec95CgstPaise = Math.floor(totalFoodGstPaise / 2);
  const sec95SgstPaise = totalFoodGstPaise - sec95CgstPaise;

  const commBps = params.commissionRateBps ?? 1000;
  const platformCommissionPaise = Math.round((netTaxableFoodPaise * commBps) / 10000);
  const gstOnCommissionPaise = Math.round((platformCommissionPaise * 1800) / 10000); // 18% GST
  const tcsSec52Paise = params.isRestaurantGstRegistered
    ? Math.round((netTaxableFoodPaise * ORDERKING_STATUTORY_CONSTANTS.CGST_SEC_52_TCS_BPS) / 10000)
    : 0;
  const tdsSec194OPaise = Math.round(
    (netTaxableFoodPaise * ORDERKING_STATUTORY_CONSTANTS.IT_SEC_194O_TDS_BPS) / 10000
  );

  const merchantNetPayablePaise = Math.max(
    0,
    netTaxableFoodPaise -
      platformCommissionPaise -
      gstOnCommissionPaise -
      tcsSec52Paise -
      tdsSec194OPaise
  );

  return {
    netTaxableFoodPaise,
    sec95CgstPaise,
    sec95SgstPaise,
    totalFoodGstPaise,
    platformCommissionPaise,
    gstOnCommissionPaise,
    tcsSec52Paise,
    tdsSec194OPaise,
    merchantNetPayablePaise,
  };
}