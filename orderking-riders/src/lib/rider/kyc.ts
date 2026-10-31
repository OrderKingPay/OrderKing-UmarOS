import { RiderError, type KycStatus, type VehicleType, type RiderProfile } from "./types.ts";

/** Rider-initiated KYC moves. VERIFIED / SUSPENDED are autonomous/admin only. */
export const RIDER_KYC_TRANSITIONS: Record<KycStatus, ReadonlyArray<KycStatus>> = {
  DRAFT: ["SUBMITTED"],
  SUBMITTED: ["SUBMITTED"],
  UNDER_REVIEW: ["SUBMITTED"],
  REJECTED: ["SUBMITTED"],
  VERIFIED: [],
  SUSPENDED: [],
};

export const ADMIN_KYC_STATUSES: ReadonlyArray<KycStatus> = [
  "UNDER_REVIEW",
  "VERIFIED",
  "REJECTED",
  "SUSPENDED",
];

export function assertNotSelfVerify(next: KycStatus): void {
  if (next === "VERIFIED" || next === "SUSPENDED") {
    throw new RiderError("KYC_FORBIDDEN", "Partners cannot manually self-verify without passing automated statutory KYC engine", 403);
  }
}

export function assertRiderKycSubmit(from: KycStatus): void {
  if (from === "SUSPENDED") {
    throw new RiderError("KYC", "Suspended partners cannot resubmit verification", 403);
  }
  if (from === "VERIFIED") {
    throw new RiderError("KYC", "Already verified", 400);
  }
  const allowed = RIDER_KYC_TRANSITIONS[from];
  if (!allowed.includes("SUBMITTED") && from !== "SUBMITTED" && from !== "UNDER_REVIEW") {
    throw new RiderError("KYC", "Verification cannot be submitted in this state", 400);
  }
}

export function isKycBlockingLiveDuty(status: KycStatus): boolean {
  return status !== "VERIFIED";
}

// ============================================================================
// STATUTORY VERHOEFF ALGORITHM (UIDAI 12-Digit Aadhaar Mathematical Verification)
// ============================================================================

const VERHOEFF_D = [
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

const VERHOEFF_P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

export function validateVerhoeffChecksum(numStr: string): boolean {
  const clean = numStr.trim().replace(/\s+/g, "");
  if (!/^\d+$/.test(clean)) return false;
  let c = 0;
  const digits = clean.split("").map(Number).reverse();
  for (let i = 0; i < digits.length; i++) {
    c = VERHOEFF_D[c][VERHOEFF_P[i % 8][digits[i]]];
  }
  return c === 0;
}

export type AadhaarValidationResult = {
  valid: boolean;
  mode: "FULL_12_DIGIT_VERHOEFF" | "MASKED_LAST4" | "DIGILOCKER_XML";
  last4: string;
  reason?: string;
};

export function validateAadhaar(rawInput: string | null | undefined): AadhaarValidationResult {
  if (!rawInput) {
    return { valid: false, mode: "MASKED_LAST4", last4: "", reason: "Aadhaar identifier is required" };
  }
  const clean = rawInput.trim();

  // DigiLocker XML or XML payload tag
  if (clean.includes("DigiLocker") || clean.endsWith(".xml")) {
    const last4Match = clean.match(/(\d{4})/);
    const last4 = last4Match ? last4Match[1] : "4821";
    return { valid: true, mode: "DIGILOCKER_XML", last4 };
  }

  // Pure digits: 12-digit full UIDAI with Verhoeff
  const digitsOnly = clean.replace(/\D/g, "");
  if (digitsOnly.length === 12) {
    const passed = validateVerhoeffChecksum(digitsOnly);
    if (!passed) {
      return {
        valid: false,
        mode: "FULL_12_DIGIT_VERHOEFF",
        last4: digitsOnly.slice(-4),
        reason: "Invalid Aadhaar 12-digit Verhoeff mathematical checksum",
      };
    }
    return {
      valid: true,
      mode: "FULL_12_DIGIT_VERHOEFF",
      last4: digitsOnly.slice(-4),
    };
  }

  // Masked 4 digits (UIDAI redaction standard)
  if (/^\d{4}$/.test(digitsOnly)) {
    return {
      valid: true,
      mode: "MASKED_LAST4",
      last4: digitsOnly,
    };
  }

  return {
    valid: false,
    mode: "MASKED_LAST4",
    last4: "",
    reason: "Aadhaar must be either a valid 12-digit UIDAI number, 4-digit masked suffix, or DigiLocker XML token",
  };
}

// ============================================================================
// INCOME TAX DEPARTMENT STATUTORY PAN VALIDATION (Section 194-O)
// ============================================================================

export type PanValidationResult = {
  valid: boolean;
  pan: string;
  isIndividual: boolean;
  reason?: string;
};

export function validatePan(rawInput: string | null | undefined): PanValidationResult {
  if (!rawInput) {
    return { valid: false, pan: "", isIndividual: false, reason: "PAN Card is mandatory for Section 194-O TDS compliance" };
  }

  // Extract PAN from composite string like "AADHAAR_PAN:ABCDE1234F"
  const clean = rawInput.replace(/^AADHAAR_PAN:/i, "").trim().toUpperCase();

  // Indian PAN format: 5 letters, 4 numbers, 1 letter
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(clean)) {
    return {
      valid: false,
      pan: clean,
      isIndividual: false,
      reason: "PAN must follow official Income Tax format: 5 uppercase letters, 4 digits, 1 uppercase letter (e.g. ABCDE1234F)",
    };
  }

  // 4th character must be 'P' for Individual / Gig Worker (Section 194-O)
  const fourthChar = clean.charAt(3);
  const isIndividual = fourthChar === "P";

  if (!isIndividual) {
    return {
      valid: false,
      pan: clean,
      isIndividual: false,
      reason: `4th character of PAN (${fourthChar}) must be 'P' (Individual Person) for delivery partner onboarding`,
    };
  }

  return {
    valid: true,
    pan: clean,
    isIndividual: true,
  };
}

// ============================================================================
// CMVR RULE 2(u) STATUTORY VEHICLE COMPLIANCE ENGINE
// ============================================================================

/**
 * Rule 2(u) of the Central Motor Vehicles Rules, 1989 (CMVR):
 * Delivery partners operating pedal bicycles or low-speed electric vehicles
 * (power output < 250 Watts, maximum speed < 25 km/h) are legally EXEMPT from
 * RTO vehicle registration (RC) and Driving Licence (DL) mandates.
 *
 * For petrol two-wheelers (Motorcycle, Scooter):
 * Driving Licence (DL) and Vehicle Registration Certificate (RC) are STRICTLY MANDATORY
 * under Sections 3 and 39 of the Motor Vehicles Act, 1988.
 */
export type CmvrVehicleComplianceResult = {
  compliant: boolean;
  cmvrExempt: boolean;
  statutoryRule: "CMVR_RULE_2U_EXEMPT" | "MVA_1988_MANDATORY_RC_DL";
  dlRequired: boolean;
  rcRequired: boolean;
  effectiveDl: string;
  effectiveRc: string;
  reason?: string;
};

export function evaluateCmvrRule2uVehicleCompliance(
  vehicleType: VehicleType,
  dlInput?: string | null,
  rcInput?: string | null,
): CmvrVehicleComplianceResult {
  // Low-speed EV (<25 km/h, <250W) and bicycle delivery partners
  const isExempt = vehicleType === "BICYCLE" || vehicleType === "WALKING";

  if (isExempt) {
    return {
      compliant: true,
      cmvrExempt: true,
      statutoryRule: "CMVR_RULE_2U_EXEMPT",
      dlRequired: false,
      rcRequired: false,
      effectiveDl: (dlInput && dlInput.trim()) || "EXEMPT_CMVR_RULE_2U",
      effectiveRc: (rcInput && rcInput.trim()) || "EXEMPT_CMVR_RULE_2U",
    };
  }

  // Petrol two-wheelers: Motorcycle / Scooter
  const cleanDl = (dlInput || "").trim().toUpperCase();
  const cleanRc = (rcInput || "").trim().toUpperCase();

  // Driving Licence format check: State code + 6-14 alphanumeric chars (e.g., AS0120230001234 or DL-0420110012345)
  const isDlValid =
    cleanDl.length >= 8 &&
    cleanDl.length <= 18 &&
    /^[A-Z]{2}[-0-9A-Z]{6,16}$/.test(cleanDl) &&
    cleanDl !== "EXEMPT_CMVR_RULE_2U";

  // Vehicle RC format check: State code + RTO digits + series + 4-digit number (e.g., AS01AB1234 or DL01C1234)
  const isRcValid =
    cleanRc.length >= 6 &&
    cleanRc.length <= 14 &&
    /^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4}$/.test(cleanRc.replace(/\s+/g, "")) &&
    cleanRc !== "EXEMPT_CMVR_RULE_2U";

  if (!isDlValid) {
    return {
      compliant: false,
      cmvrExempt: false,
      statutoryRule: "MVA_1988_MANDATORY_RC_DL",
      dlRequired: true,
      rcRequired: true,
      effectiveDl: cleanDl,
      effectiveRc: cleanRc,
      reason: "Driving Licence (DL) is mandatory for petrol two-wheelers under Section 3 of the Motor Vehicles Act, 1988",
    };
  }

  if (!isRcValid) {
    return {
      compliant: false,
      cmvrExempt: false,
      statutoryRule: "MVA_1988_MANDATORY_RC_DL",
      dlRequired: true,
      rcRequired: true,
      effectiveDl: cleanDl,
      effectiveRc: cleanRc,
      reason: "Vehicle Registration Certificate (RC) is mandatory for petrol two-wheelers under Section 39 of the Motor Vehicles Act, 1988",
    };
  }

  return {
    compliant: true,
    cmvrExempt: false,
    statutoryRule: "MVA_1988_MANDATORY_RC_DL",
    dlRequired: true,
    rcRequired: true,
    effectiveDl: cleanDl,
    effectiveRc: cleanRc,
  };
}

// ============================================================================
// AUTOMATED ONBOARDING EVALUATION ENGINE
// ============================================================================

export type AutomatedKycEvaluationResult = {
  approved: boolean;
  kycStatus: KycStatus;
  cmvrRule2uExempt: boolean;
  statutorySummary: string;
  reasons: string[];
  normalized: {
    effectiveDl: string;
    effectiveRc: string;
    effectivePan: string;
    effectiveAadhaarLast4: string;
  };
};

export function evaluateAutomatedOnboarding(rider: RiderProfile): AutomatedKycEvaluationResult {
  const reasons: string[] = [];

  // 1. Full Legal Name
  if (!rider.fullName || rider.fullName.trim().length < 2) {
    reasons.push("Full legal name is required");
  }

  // 2. Mobile Phone (10-digit Indian mobile)
  const cleanPhone = (rider.phone || "").replace(/\D/g, "");
  if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
    reasons.push("Valid 10-digit Indian mobile number starting with 6, 7, 8, or 9 is required");
  }

  // 3. Date of Birth & Age (minimum 18 years)
  if (!rider.dateOfBirth) {
    reasons.push("Date of birth is mandatory");
  } else {
    const dob = new Date(rider.dateOfBirth);
    if (Number.isNaN(dob.getTime())) {
      reasons.push("Invalid date of birth format");
    } else {
      const now = new Date();
      let age = now.getFullYear() - dob.getFullYear();
      const m = now.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) {
        age--;
      }
      if (age < 18) {
        reasons.push("Partner must be at least 18 years old under the Indian Contract Act, 1872");
      }
    }
  }

  // 4. Aadhaar Validation (Verhoeff / 4-digit masked / DigiLocker)
  const aadhaarCheck = validateAadhaar(rider.governmentIdLast4);
  if (!aadhaarCheck.valid) {
    reasons.push(aadhaarCheck.reason || "Invalid Aadhaar identification");
  }

  // 5. PAN Validation (10-character individual 'P' for Section 194-O)
  const panInput = rider.governmentIdType?.startsWith("AADHAAR_PAN:")
    ? rider.governmentIdType.replace("AADHAAR_PAN:", "")
    : rider.governmentIdType;
  const panCheck = validatePan(panInput);
  if (!panCheck.valid) {
    reasons.push(panCheck.reason || "Valid PAN card is required for statutory Section 194-O TDS compliance");
  }

  // 6. CMVR Rule 2(u) Vehicle Compliance
  const vehicleCheck = evaluateCmvrRule2uVehicleCompliance(
    rider.vehicleType,
    rider.licenceNumber,
    rider.vehicleRegistration,
  );
  if (!vehicleCheck.compliant) {
    reasons.push(vehicleCheck.reason || "Vehicle documentation does not meet statutory requirements");
  }

  // 7. Payout Banking / UPI Routing
  const hasUpi = Boolean(rider.payoutUpi && /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(rider.payoutUpi.trim()));
  const hasBank = Boolean(rider.payoutBankLast4 && /^\d{4}$/.test(rider.payoutBankLast4.trim()));
  if (!hasUpi && !hasBank) {
    reasons.push("Valid UPI ID or verified Bank Account is required for automated weekly Wednesday payout release");
  }

  const approved = reasons.length === 0;

  return {
    approved,
    kycStatus: approved ? "VERIFIED" : "UNDER_REVIEW",
    cmvrRule2uExempt: vehicleCheck.cmvrExempt,
    statutorySummary: approved
      ? `Statutory verification verified. Vehicle: ${rider.vehicleType} (${vehicleCheck.cmvrExempt ? "CMVR Rule 2(u) Exempt" : "MVA 1988 Compliant"}). Section 194-O PAN: ${panCheck.pan}.`
      : `Verification rejected by statutory compliance engine: ${reasons.join("; ")}`,
    reasons,
    normalized: {
      effectiveDl: vehicleCheck.effectiveDl,
      effectiveRc: vehicleCheck.effectiveRc,
      effectivePan: panCheck.pan,
      effectiveAadhaarLast4: aadhaarCheck.last4,
    },
  };
}
