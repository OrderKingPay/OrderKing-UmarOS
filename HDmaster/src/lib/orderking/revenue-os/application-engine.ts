// Automatic Application Engine (Directive 5)
// Builds truthful, customized proposals and applications based ONLY on verified capabilities and real project work.
// Never invents credentials, degrees, employment, customers, certifications, portfolio work, revenue, or testimonials.

import type { Opportunity } from "./opportunity-engine.ts";
import { opportunityEngine } from "./opportunity-engine.ts";
import { assertReality } from "./reality-engine.ts";

export interface PreparedApplication {
  id: string;
  opportunityId: string;
  opportunityTitle: string;
  clientName: string;
  customPitch: string;
  proposedPricing: {
    totalCommercialValue: number;
    advanceRequired: number;
    currency: string;
    pricingModel: "MILESTONE_ADVANCE" | "FIXED_SCOPE" | "HOURLY_RETAINER";
  };
  deliverablesPlan: string[];
  honestPortfolioProof: Array<{
    projectName: string;
    verifiedMetric: string;
    techStack: string[];
    repositoryReference?: string;
  }>;
  submissionStatus: "PREPARED" | "AWAITING_APPROVAL" | "SUBMITTED" | "REJECTED";
  submittedAt?: string;
  responseStatus: "PENDING_CLIENT_RESPONSE" | "INTERVIEW_SCHEDULED" | "DECLINED" | "ACCEPTED";
  followUpScheduledDate: string;
}

export class ApplicationEngine {
  private applications: Map<string, PreparedApplication> = new Map();

  // Truthful Verified Portfolio Artifacts
  private readonly verifiedPortfolio = [
    {
      projectName: "OrderKing Sovereign Ecosystem",
      verifiedMetric: "Atomic double-entry financial ledger, zero-loss float reconciliation, 4-app live architecture (Customer, Partner, Rider, Admin).",
      techStack: ["Next.js 15", "React 19", "TypeScript", "PostgreSQL", "Kysely", "King Pay UPI"],
      repositoryReference: "OrderKing/HDmaster",
    },
    {
      projectName: "King Pay UPI Section 79 Escrow Gateway",
      verifiedMetric: "Direct 0% fee peer-to-merchant UPI deep linking with instant webhook verification and bank UTR reconciliation.",
      techStack: ["TypeScript", "UPI Deep Links", "Webhook Signatures", "PostgreSQL"],
      repositoryReference: "OrderKing/HDmaster/src/lib/orderking/payments",
    },
    {
      projectName: "Hospital OPD Live Token Queue & Health Console",
      verifiedMetric: "Zero-latency patient queue allocation, doctor prescription pad, and digital billing.",
      techStack: ["React", "PostgreSQL", "TailwindCSS"],
      repositoryReference: "OrderKing/HDmaster/src/lib/orderking/business",
    },
  ];

  generateApplication(opportunityId: string): PreparedApplication {
    const opp = opportunityEngine.getOpportunity(opportunityId);
    if (!opp) throw new Error(`Opportunity ${opportunityId} not found.`);

    // 1. Calculate pricing realistically
    const budget = opp.statedBudget || (opp.estimatedEffort * 75);
    const advance = Math.round(budget * 0.5); // 50% milestone advance
    const currency = opp.currency || "INR";

    // 2. Select strictly matching portfolio evidence
    const relevantProof = this.verifiedPortfolio.filter((p) =>
      p.techStack.some((tech) => opp.skillsMatched.includes(tech))
    );

    // 3. Generate tailored, honest pitch
    const pitch = [
      `Hello ${opp.client || "Hiring Team"},`,
      ``,
      `I am writing regarding your requirement for "${opp.title}".`,
      `Our verified capabilities match your technical stack in ${opp.skillsMatched.join(", ")}.`,
      ``,
      `Concrete Deliverables:`,
      `1. Full architectural implementation meeting your specifications.`,
      `2. Production-grade test suite with unit, integration, and security checks.`,
      `3. Complete documentation, database schemas, and clean handoff credentials.`,
      ``,
      `Real Portfolio Reference:`,
      ...relevantProof.map((p) => `• ${p.projectName}: ${p.verifiedMetric} (${p.techStack.join(", ")})`),
      ``,
      `Commercial Terms:`,
      `• Stated Value: ${currency} ${budget.toLocaleString()}`,
      `• 50% Milestone Advance on Contract Signing: ${currency} ${advance.toLocaleString()}`,
      `• Final 50% upon verified acceptance and delivery.`,
    ].join("\n");

    const appId = `APP-${Date.now().toString().slice(-4)}`;
    const followUpDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const app: PreparedApplication = {
      id: appId,
      opportunityId: opp.id,
      opportunityTitle: opp.title,
      clientName: opp.client || "Prospective Client",
      customPitch: pitch,
      proposedPricing: {
        totalCommercialValue: budget,
        advanceRequired: advance,
        currency,
        pricingModel: "MILESTONE_ADVANCE",
      },
      deliverablesPlan: [
        "System Architecture & Database Schema",
        "Fullstack Core Implementation",
        "Self-QA Verification & Security Checks",
        "Deployment & Client Handoff",
      ],
      honestPortfolioProof: relevantProof,
      submissionStatus: "AWAITING_APPROVAL", // Always presents for approval
      responseStatus: "PENDING_CLIENT_RESPONSE",
      followUpScheduledDate: followUpDate,
    };

    this.applications.set(app.id, app);
    opportunityEngine.updateStatus(opp.id, "APPLICATION_PREPARED", `Application ${app.id} prepared and awaiting founder review.`);

    return app;
  }

  submitApplication(appId: string): PreparedApplication {
    const app = this.applications.get(appId);
    if (!app) throw new Error(`Application ${appId} not found.`);

    app.submissionStatus = "SUBMITTED";
    app.submittedAt = new Date().toISOString().replace("T", " ").slice(0, 16);
    opportunityEngine.updateStatus(app.opportunityId, "APPLIED", `Application submitted at ${app.submittedAt}. Follow-up on ${app.followUpScheduledDate}.`);

    return app;
  }

  getApplications(): PreparedApplication[] {
    return Array.from(this.applications.values());
  }

  getApplication(id: string): PreparedApplication | undefined {
    return this.applications.get(id);
  }
}

export const applicationEngine = new ApplicationEngine();
