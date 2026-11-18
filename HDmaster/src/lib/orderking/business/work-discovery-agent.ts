// Always-On Work Discovery & Autonomous Business Development Agent
// Scans legitimate freelance, contract, remote work, and enterprise software opportunities with objective metrics

export interface DiscoveredWorkOpportunity {
  id: string;
  title: string;
  sourcePlatform: "Toptal" | "Upwork_Enterprise" | "Direct_Client" | "Regional_Registry" | "AngelList_Remote";
  clientLocation: string;
  currency: "INR" | "USD" | "EUR" | "GBP";
  compensation: {
    type: "HOURLY" | "FIXED_MILESTONE" | "MONTHLY_RETAINER";
    amount: number;
    hourlyEquivalentUsd: number;
  };
  skillMatchScore: number; // 0-100%
  requiredSkills: string[];
  matchedSkills: string[];
  estimatedEffortHours: number;
  deadlineDays: number;
  competitionLevel: "LOW" | "MODERATE" | "HIGH";
  probabilityOfQualification: number; // 0.0 - 1.0
  riskLevel: "LOW" | "MODERATE" | "HIGH";
  requiredCredentials: string[];
  applicationComplexity: "ONE_CLICK" | "PROPOSAL_REQUIRED" | "TECHNICAL_INTERVIEW";
  recommendedPitch: string;
  tailoredProposal: string;
  sourceUrl?: string;
  discoveredAt: string;
}

export class WorkDiscoveryAgent {
  private opportunities: DiscoveredWorkOpportunity[] = [];

  registerOpportunity(opp: DiscoveredWorkOpportunity): void {
    this.opportunities.push(opp);
  }

  getOpportunities(filter?: { minRateUsd?: number; minMatchScore?: number }): DiscoveredWorkOpportunity[] {
    return this.opportunities.filter((opp) => {
      if (filter?.minRateUsd && opp.compensation.hourlyEquivalentUsd < filter.minRateUsd) return false;
      if (filter?.minMatchScore && opp.skillMatchScore < filter.minMatchScore) return false;
      return true;
    });
  }

  getOpportunityById(id: string): DiscoveredWorkOpportunity | undefined {
    return this.opportunities.find((o) => o.id === id);
  }

  evaluateOpportunity(opp: DiscoveredWorkOpportunity): {
    scoreBreakdown: { skillMatch: number; economicFeasibility: number; qualificationOdds: number };
    verdict: "STRONG_BUY" | "ACCEPTABLE" | "LOW_PRIORITY";
    recommendedAction: string;
  } {
    const skillScore = opp.skillMatchScore;
    const econScore = opp.compensation.hourlyEquivalentUsd >= 90 ? 100 : 80;
    const odds = Math.round(opp.probabilityOfQualification * 100);

    const avg = (skillScore + econScore + odds) / 3;
    const verdict = avg >= 90 ? "STRONG_BUY" : avg >= 75 ? "ACCEPTABLE" : "LOW_PRIORITY";

    return {
      scoreBreakdown: {
        skillMatch: skillScore,
        economicFeasibility: econScore,
        qualificationOdds: odds,
      },
      verdict,
      recommendedAction:
        verdict === "STRONG_BUY"
          ? "Submit customized proposal immediately and lock milestone advance."
          : "Queue for standard founder review.",
    };
  }
}

export const workDiscoveryAgent = new WorkDiscoveryAgent();
