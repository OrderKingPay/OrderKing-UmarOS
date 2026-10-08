export interface CustomerProfile {
  id: string;
  lifetimeValue: number;
  refundAbuseScore: "low" | "medium" | "high";
}

export interface Grievance {
  id: string;
  customerId: string;
  complaint: string;
}

export interface Resolution {
  status: "APPROVED" | "REJECTED";
  creditAmount: number;
  reason: string;
}

export class GrievanceResolutionAI {
  private static readonly MAX_CREDIT_AMOUNT = 50.00;

  /**
   * Evaluates mathematical retention logic based on LTV and abuse scores.
   * ZERO DUMB BOTS.
   */
  public static processGrievance(grievance: Grievance, customer: CustomerProfile): Resolution {
    const complaint = grievance.complaint.toLowerCase();
    
    let status: "APPROVED" | "REJECTED" = "REJECTED";
    let creditAmount = 0;
    let reason = "Complaint rejected by automated system.";

    if (complaint.includes("food is cold") || complaint.includes("late") || complaint.includes("missing")) {
      if (customer.lifetimeValue > 100 && customer.refundAbuseScore !== "high") {
        status = "APPROVED";
        // Base credit on LTV but cap it
        creditAmount = customer.refundAbuseScore === "low" ? 10.00 : 5.00;
        reason = "Automated resolution applied to retain customer.";
      } else {
        reason = "Account flagged for high refund rate or low LTV. No credit issued.";
      }
    } else {
      // Fallback for other complaints to avoid human review
      status = "REJECTED";
      reason = "Complaint type does not meet criteria for automated compensation.";
    }

    // Strict financial limits
    if (creditAmount > GrievanceResolutionAI.MAX_CREDIT_AMOUNT) {
      creditAmount = GrievanceResolutionAI.MAX_CREDIT_AMOUNT;
      reason += ` (Amount capped at $${GrievanceResolutionAI.MAX_CREDIT_AMOUNT})`;
    }

    return {
      status,
      creditAmount,
      reason
    };
  }
}
