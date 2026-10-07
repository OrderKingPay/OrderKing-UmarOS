// Reality Engine & Zero-Fabrication Verification Core (Directive 25)
// Strictly distinguishes Fact, Estimate, Forecast, Recommendation, Attempt, Completed, Verified, Failed, and Unknown.
// Prevents unverified claims from being presented as verified truth.

export type RealityTruthStatus =
  | "Fact"
  | "Estimate"
  | "Forecast"
  | "Recommendation"
  | "Attempt"
  | "Completed"
  | "Verified"
  | "Failed"
  | "Unknown";

export interface RealityResult<T = unknown> {
  subject: string;
  data: T;
  evidence?: string[];
  sourceUrl?: string;
  verifiedBy?: string;
  timestamp?: string;
  status?: RealityTruthStatus;
  claimable?: boolean;
  notes?: string[];
}

export interface RealityAssertion {
  status: "VERIFIED" | "UNVERIFIED";
  claimable: boolean;
  truthStatus: RealityTruthStatus;
  reason?: string;
}

export function assertReality<T>(result: RealityResult<T>): RealityAssertion {
  if (!result.evidence || result.evidence.length === 0) {
    return {
      status: "UNVERIFIED",
      claimable: false,
      truthStatus: result.status || "Unknown",
      reason: "No verifiable evidence or audit trail provided.",
    };
  }

  return {
    status: "VERIFIED",
    claimable: true,
    truthStatus: result.status || "Verified",
  };
}

export class RealityEngine {
  private assertions: Array<{ id: string; subject: string; assertion: RealityAssertion; timestamp: string }> = [];

  verify<T>(subject: string, data: T, evidence?: string[], explicitStatus?: RealityTruthStatus): RealityAssertion {
    const res: RealityResult<T> = {
      subject,
      data,
      evidence: evidence && evidence.length > 0 ? evidence : undefined,
      status: explicitStatus,
      timestamp: new Date().toISOString(),
    };

    const assertion = assertReality(res);
    this.assertions.push({
      id: `ASSERT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      subject,
      assertion,
      timestamp: new Date().toISOString(),
    });

    return assertion;
  }

  getAuditLog() {
    return [...this.assertions];
  }

  classifyTruth(status: RealityTruthStatus, text: string): string {
    return `[${status.toUpperCase()}] ${text}`;
  }
}

export const realityEngine = new RealityEngine();
