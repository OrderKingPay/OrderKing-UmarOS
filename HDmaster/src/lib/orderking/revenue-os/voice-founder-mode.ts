// Voice-First Founder Mode & Live State Telemetry (Directive 22)
// Interprets natural voice commands and returns actual verifiable system state.
// Never returns fictional conversational answers.

import { opportunityEngine } from "./opportunity-engine.ts";
import { clientAcquisitionMachine } from "./client-acquisition-machine.ts";
import { deliveryFactory } from "./delivery-factory.ts";
import { revenueTruthDB } from "./revenue-truth-database.ts";

export interface VoiceCommandResult {
  command: string;
  matchedIntent: string;
  spokenSummary: string;
  liveSystemData: unknown;
  actionTaken?: string;
}

export class VoiceFounderMode {
  executeVoiceCommand(rawTranscript: string): VoiceCommandResult {
    const text = rawTranscript.trim().toLowerCase();

    // 1. "Show me today's revenue" / "What is our revenue?"
    if (text.includes("revenue") || text.includes("money") || text.includes("earned") || text.includes("collections")) {
      const verifiedInr = revenueTruthDB.getVerifiedRevenue("INR");
      const pendingInr = revenueTruthDB.getPendingPayments("INR");
      return {
        command: rawTranscript,
        matchedIntent: "QUERY_REVENUE",
        spokenSummary: `Verified bank-deposited revenue is ₹${verifiedInr.toLocaleString()}. Pending invoices total ₹${pendingInr.toLocaleString()}. All figures verified against bank ledger.`,
        liveSystemData: {
          verifiedRevenueInr: verifiedInr,
          pendingPaymentsInr: pendingInr,
          immutableEventCount: revenueTruthDB.getEvents().length,
        },
      };
    }

    // 2. "Find me new development opportunities" / "What opportunities do we have?"
    if (text.includes("opportunit") || text.includes("jobs") || text.includes("work") || text.includes("contracts")) {
      const opps = opportunityEngine.getOpportunities();
      const top = opps.slice(0, 3);
      return {
        command: rawTranscript,
        matchedIntent: "DISCOVER_OPPORTUNITIES",
        spokenSummary: `Found ${opps.length} verified opportunities. Top match: "${top[0]?.title || "None"}" with stated budget of ${top[0]?.currency || "INR"} ${(top[0]?.statedBudget || 0).toLocaleString()}.`,
        liveSystemData: {
          totalOpportunities: opps.length,
          topMatches: top,
        },
      };
    }

    // 3. "Check which prospects need follow-up"
    if (text.includes("prospect") || text.includes("follow") || text.includes("lead") || text.includes("outreach")) {
      const prospects = clientAcquisitionMachine.getProspects();
      const needsFollowUp = prospects.filter((p) => p.stage === "OUTREACH_SENT" || p.stage === "OUTREACH_DRAFTED");
      return {
        command: rawTranscript,
        matchedIntent: "QUERY_PROSPECT_FOLLOWUPS",
        spokenSummary: `There are ${needsFollowUp.length} prospects requiring action. Top target: ${needsFollowUp[0]?.businessName || "None"}.`,
        liveSystemData: {
          needsActionCount: needsFollowUp.length,
          prospects: needsFollowUp,
        },
      };
    }

    // 4. "What is blocking the current projects?" / "Project status"
    if (text.includes("blocking") || text.includes("project") || text.includes("delivery") || text.includes("build")) {
      const projects = deliveryFactory.getProjects();
      const active = projects.filter((p) => !p.isDelivered);
      const blockedTasks = active.flatMap((p) => p.taskGraph.filter((t) => t.status === "BLOCKED" || t.status === "FAILED"));

      return {
        command: rawTranscript,
        matchedIntent: "QUERY_PROJECT_BLOCKERS",
        spokenSummary: blockedTasks.length === 0
          ? `All ${active.length} active delivery projects are running smoothly with zero blocked tasks.`
          : `Alert: ${blockedTasks.length} tasks currently require resolution.`,
        liveSystemData: {
          activeProjectsCount: active.length,
          blockedTasks,
        },
      };
    }

    // 5. Default fallback to live OS status
    return {
      command: rawTranscript,
      matchedIntent: "UNKNOWN_INTENT_SYSTEM_SUMMARY",
      spokenSummary: `HDmaster Supreme AI OS is online. Verified revenue: ₹${revenueTruthDB.getVerifiedRevenue("INR").toLocaleString()}. Active projects: ${deliveryFactory.getProjects().length}.`,
      liveSystemData: {
        timestamp: new Date().toISOString(),
      },
    };
  }
}

export const voiceFounderMode = new VoiceFounderMode();
