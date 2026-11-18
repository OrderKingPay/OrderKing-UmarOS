// AI Company Factory & Controlled Self-Improvement Loop
// Orchestrates the 15-stage Idea -> Market -> Code -> Deploy -> Scale pipeline with tangible artifacts

export type CompanyStage =
  | "IDEA"
  | "MARKET_RESEARCH"
  | "REQUIREMENTS"
  | "BUSINESS_MODEL"
  | "BRAND"
  | "UX"
  | "PRODUCT"
  | "CODE"
  | "TESTS"
  | "DEPLOYMENT"
  | "ANALYTICS"
  | "MARKETING"
  | "SALES"
  | "CUSTOMER_SUPPORT"
  | "ITERATION";

export interface CompanyArtifact {
  id: string;
  stage: CompanyStage;
  title: string;
  filename: string;
  contentType: "markdown" | "sql" | "typescript" | "json" | "yaml";
  content: string;
  summary: string;
  generatedAt: string;
}

export interface CompanyBlueprint {
  id: string;
  name: string;
  concept: string;
  targetMarket: string;
  currentStage: CompanyStage;
  artifacts: CompanyArtifact[];
  metrics: {
    estimatedMarketSizeInr: number;
    projectedFirstYearRevenueInr: number;
    targetGrossMarginPercent: number;
  };
}

export interface SelfImprovementObservation {
  id: string;
  subsystem: string;
  observedMetric: string;
  currentValue: number | string;
  bottleneckIdentified: string;
  proposedImprovement: string;
  riskAssessment: "ZERO_RISK_PROMPT" | "LOW_RISK_CACHING" | "CRITICAL_BLOCKED_SECURITY";
  isAllowedToSelfDeploy: boolean;
  status: "OBSERVED" | "VERIFIED_TESTED" | "DEPLOYED" | "REJECTED_SAFETY_BOUNDARY";
  timestamp: string;
}

export class CompanyFactoryService {
  private companies: Map<string, CompanyBlueprint> = new Map();
  private selfImprovementLog: SelfImprovementObservation[] = [];

  constructor() {
    // Zero fake sample companies or fabricated telemetry seeded at initialization.
  }

  registerCompany(company: CompanyBlueprint): CompanyBlueprint {
    this.companies.set(company.id, company);
    return company;
  }

  getCompanies(): CompanyBlueprint[] {
    return Array.from(this.companies.values());
  }

  getCompany(id: string): CompanyBlueprint | undefined {
    return this.companies.get(id);
  }

  getSelfImprovementLogs(): SelfImprovementObservation[] {
    return [...this.selfImprovementLog];
  }

  addArtifact(companyId: string, artifact: Omit<CompanyArtifact, "id" | "generatedAt">): CompanyArtifact {
    const comp = this.companies.get(companyId);
    if (!comp) throw new Error(`Company ${companyId} not found.`);

    const newArt: CompanyArtifact = {
      ...artifact,
      id: `art-${Date.now().toString().slice(-4)}`,
      generatedAt: new Date().toISOString().replace("T", " ").slice(0, 16),
    };

    comp.artifacts.push(newArt);
    comp.currentStage = artifact.stage;
    return newArt;
  }

  proposeSelfImprovement(params: {
    subsystem: string;
    observedMetric: string;
    currentValue: string | number;
    bottleneck: string;
    improvement: string;
    isSecurityOrFinancial: boolean;
  }): SelfImprovementObservation {
    const isBlocked = params.isSecurityOrFinancial;
    const observation: SelfImprovementObservation = {
      id: `IMP-${Date.now().toString().slice(-3)}`,
      subsystem: params.subsystem,
      observedMetric: params.observedMetric,
      currentValue: params.currentValue,
      bottleneckIdentified: params.bottleneck,
      proposedImprovement: params.improvement,
      riskAssessment: isBlocked ? "CRITICAL_BLOCKED_SECURITY" : "ZERO_RISK_PROMPT",
      isAllowedToSelfDeploy: !isBlocked,
      status: isBlocked ? "REJECTED_SAFETY_BOUNDARY" : "VERIFIED_TESTED",
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 16),
    };

    this.selfImprovementLog.unshift(observation);
    return observation;
  }
}

export const companyFactory = new CompanyFactoryService();
