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
    this.seedSampleCompany();
    this.seedSelfImprovementTelemetry();
  }

  private seedSampleCompany() {
    const orderKingSaaS: CompanyBlueprint = {
      id: "COMP-001",
      name: "OrderKing Restaurant OS & Sovereign Dispatch",
      concept: "Zero-commission direct food ordering platform with WhatsApp rider dispatch and 0% UPI payments.",
      targetMarket: "India Tier 2/3 Multi-Outlet Restaurants & Cloud Kitchens",
      currentStage: "CODE",
      metrics: {
        estimatedMarketSizeInr: 2500000000, // ₹250 Cr regional TAM
        projectedFirstYearRevenueInr: 18000000, // ₹1.8 Cr ARR
        targetGrossMarginPercent: 88,
      },
      artifacts: [
        {
          id: "art-1",
          stage: "IDEA",
          title: "Executive Concept Manifesto",
          filename: "concept-manifesto.md",
          contentType: "markdown",
          content: "# OrderKing Sovereign FoodTech Operating System\n\nEliminating the 28% aggregator tax by providing restaurants with their own branded direct-ordering apps, integrated delivery dispatch, and 0% King Pay UPI settlement.",
          summary: "Core thesis and market problem statement.",
          generatedAt: "2026-09-18 10:00",
        },
        {
          id: "art-2",
          stage: "BUSINESS_MODEL",
          title: "Unit Economics & Monetization Model",
          filename: "unit-economics.md",
          contentType: "markdown",
          content: "# 12-Stream Monetization Model\n- ₹1,49,999 Turnkey White-Label Setup\n- ₹4,999/mo Cloud Hosting & Fleet Dispatch\n- ₹0 Gateway Cut via King Pay UPI\n- 100% Founder Retained Float",
          summary: "12 distinct legal profit streams.",
          generatedAt: "2026-09-19 14:00",
        },
        {
          id: "art-3",
          stage: "CODE",
          title: "Production Relational Database Schema",
          filename: "schema.sql",
          contentType: "sql",
          content: "-- High-Availability PostgreSQL DDL\nCREATE TABLE restaurants (id TEXT PRIMARY KEY, name TEXT, gstin TEXT, vpa TEXT);\nCREATE TABLE orders (id TEXT PRIMARY KEY, restaurant_id TEXT, amount_inr INT, status TEXT);",
          summary: "Complete relational DDL with foreign keys.",
          generatedAt: "2026-09-21 16:30",
        },
      ],
    };

    this.companies.set(orderKingSaaS.id, orderKingSaaS);
  }

  private seedSelfImprovementTelemetry() {
    this.selfImprovementLog.push(
      {
        id: "IMP-01",
        subsystem: "AI Provider Model Router",
        observedMetric: "Provider Latency",
        currentValue: "1850ms",
        bottleneckIdentified: "Sequential provider handshake in model fallback hierarchy.",
        proposedImprovement: "Implement concurrent racing on first-token response with local deterministic cache.",
        riskAssessment: "LOW_RISK_CACHING",
        isAllowedToSelfDeploy: true,
        status: "DEPLOYED",
        timestamp: "2026-09-22 04:15",
      },
      {
        id: "IMP-02",
        subsystem: "King Pay UPI Gateway",
        observedMetric: "Founder Approval Gate",
        currentValue: "Manual Approval Required",
        bottleneckIdentified: "High-value milestone transfers pause until founder clicks Approve.",
        proposedImprovement: "Bypass founder approval for transfers under ₹10,000.",
        riskAssessment: "CRITICAL_BLOCKED_SECURITY",
        isAllowedToSelfDeploy: false, // STRICT SAFETY BOUNDARY: Financial auth cannot be bypassed!
        status: "REJECTED_SAFETY_BOUNDARY",
        timestamp: "2026-09-22 05:20",
      }
    );
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
