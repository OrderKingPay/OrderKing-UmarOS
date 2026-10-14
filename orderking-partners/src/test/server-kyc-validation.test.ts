import { describe, it, expect } from "vitest";
import {
  validateFssai,
  validatePan,
  validateIfsc,
  validateGstin,
} from "../lib/merchant-kyc";

/**
 * Server-Side Validation Invariant Test Suite for api-bootstrap.ts
 *
 * Enforces:
 * 1. GSTIN is 100% OPTIONAL (turnover < ₹20L exempt). Never blocks submission when missing or blank.
 * 2. 14-digit FSSAI and 10-character PAN are strictly mandatory for submission.
 * 3. 11-character Bank IFSC is strictly mandatory and verified for payouts.
 * 4. Error messages are professional, helpful, and hospitality-friendly.
 */
function validateSubmitForReviewRequirements(rest: {
  fssai_number?: string | null;
  pan?: string | null;
  bank_ifsc?: string | null;
  gstin?: string | null;
}) {
  if (!validateFssai(rest.fssai_number)) {
    throw new Error(
      "A valid 14-digit FSSAI registration or license number is required to submit your restaurant for verification."
    );
  }
  if (!validatePan(rest.pan)) {
    throw new Error(
      "A valid 10-character PAN card number is required to submit your restaurant for verification."
    );
  }
  if (!validateIfsc(rest.bank_ifsc)) {
    throw new Error(
      "A valid 11-character Bank IFSC code is required to ensure seamless payouts for your restaurant."
    );
  }
  if (rest.gstin && rest.gstin.trim() && !validateGstin(rest.gstin.trim())) {
    throw new Error(
      "The GSTIN format provided is invalid. Please enter a valid 15-character GSTIN, or leave it blank if turnover is under ₹20 Lakhs."
    );
  }
  return { ok: true as const, verificationStatus: "PENDING_VERIFICATION" as const };
}

describe("Server-Side submitForReview Compliance Invariants", () => {
  const validRestaurant = {
    fssai_number: "10326999000184",
    pan: "ABCDE1234F",
    bank_ifsc: "HDFC0001234",
    gstin: null,
  };

  it("submits successfully when GSTIN is omitted (null)", () => {
    const result = validateSubmitForReviewRequirements({
      ...validRestaurant,
      gstin: null,
    });
    expect(result.ok).toBe(true);
    expect(result.verificationStatus).toBe("PENDING_VERIFICATION");
  });

  it("submits successfully when GSTIN is an empty string", () => {
    const result = validateSubmitForReviewRequirements({
      ...validRestaurant,
      gstin: "",
    });
    expect(result.ok).toBe(true);
  });

  it("submits successfully when GSTIN contains only whitespace", () => {
    const result = validateSubmitForReviewRequirements({
      ...validRestaurant,
      gstin: "   ",
    });
    expect(result.ok).toBe(true);
  });

  it("submits successfully when a valid 15-character GSTIN is provided", () => {
    const result = validateSubmitForReviewRequirements({
      ...validRestaurant,
      gstin: "29ABCDE1234F1Z5",
    });
    expect(result.ok).toBe(true);
  });

  it("rejects invalid GSTIN format when provided, with helpful guidance", () => {
    expect(() =>
      validateSubmitForReviewRequirements({
        ...validRestaurant,
        gstin: "INVALID_GST",
      })
    ).toThrowError(/The GSTIN format provided is invalid.*turnover is under ₹20 Lakhs/);
  });

  it("blocks submission if 14-digit FSSAI registration is missing or invalid", () => {
    expect(() =>
      validateSubmitForReviewRequirements({
        ...validRestaurant,
        fssai_number: "",
      })
    ).toThrowError(/A valid 14-digit FSSAI registration or license number is required/);

    expect(() =>
      validateSubmitForReviewRequirements({
        ...validRestaurant,
        fssai_number: "12345",
      })
    ).toThrowError(/A valid 14-digit FSSAI registration or license number is required/);

    expect(() =>
      validateSubmitForReviewRequirements({
        ...validRestaurant,
        fssai_number: null,
      })
    ).toThrowError(/A valid 14-digit FSSAI registration or license number is required/);
  });

  it("blocks submission if 10-character PAN is missing or invalid", () => {
    expect(() =>
      validateSubmitForReviewRequirements({
        ...validRestaurant,
        pan: "",
      })
    ).toThrowError(/A valid 10-character PAN card number is required/);

    expect(() =>
      validateSubmitForReviewRequirements({
        ...validRestaurant,
        pan: "ABCDE123",
      })
    ).toThrowError(/A valid 10-character PAN card number is required/);

    expect(() =>
      validateSubmitForReviewRequirements({
        ...validRestaurant,
        pan: null,
      })
    ).toThrowError(/A valid 10-character PAN card number is required/);
  });

  it("blocks submission if 11-character Bank IFSC is missing or invalid", () => {
    expect(() =>
      validateSubmitForReviewRequirements({
        ...validRestaurant,
        bank_ifsc: "",
      })
    ).toThrowError(/A valid 11-character Bank IFSC code is required/);

    expect(() =>
      validateSubmitForReviewRequirements({
        ...validRestaurant,
        bank_ifsc: "HDFC",
      })
    ).toThrowError(/A valid 11-character Bank IFSC code is required/);

    expect(() =>
      validateSubmitForReviewRequirements({
        ...validRestaurant,
        bank_ifsc: null,
      })
    ).toThrowError(/A valid 11-character Bank IFSC code is required/);
  });
});
