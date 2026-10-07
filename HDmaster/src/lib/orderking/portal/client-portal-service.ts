// Client Trust System & Client Portal Backend Service
// Manages client-facing proposals, milestone signoffs, asset downloads, revision requests, and 0% UPI invoices

export interface ClientMilestone {
  id: string;
  title: string;
  deliverables: string[];
  amountInr: number;
  status: "PENDING_APPROVAL" | "APPROVED" | "IN_PROGRESS" | "DELIVERED" | "ACCEPTED";
  deliveredAt?: string;
  acceptedAt?: string;
  downloadableArtifacts?: Array<{ name: string; type: string; size: string; content?: string }>;
}

export interface ClientPortalProject {
  id: string;
  clientName: string;
  clientEmail: string;
  companyName: string;
  projectTitle: string;
  totalContractValueInr: number;
  amountPaidInr: number;
  amountOutstandingInr: number;
  scopeSummary: string;
  contractSigned: boolean;
  contractSignedAt?: string;
  activeMilestoneIndex: number;
  milestones: ClientMilestone[];
  invoices: Array<{
    id: string;
    description: string;
    amountInr: number;
    status: "PAID" | "PENDING";
    upiLink: string;
    issuedAt: string;
    paidAt?: string;
  }>;
  revisionRequests: Array<{
    id: string;
    milestoneId: string;
    details: string;
    submittedAt: string;
    status: "UNDER_REVIEW" | "RESOLVED";
  }>;
}

export class ClientPortalService {
  private projects: Map<string, ClientPortalProject> = new Map();

  constructor() {
    this.seedClientProject();
  }

  private seedClientProject() {
    const proj: ClientPortalProject = {
      id: "PROJ-801",
      clientName: "Afzal Hussain",
      clientEmail: "management@royaldarbar.in",
      companyName: "Royal Darbar Palace & Cloud Kitchens",
      projectTitle: "Turnkey OrderKing Direct Ordering & WhatsApp Fleet Dispatch",
      totalContractValueInr: 149999,
      amountPaidInr: 74999,
      amountOutstandingInr: 75000,
      scopeSummary: "Complete replacement of aggregator reliance with branded web & mobile ordering, live kitchen displays, and 0% King Pay UPI settlement.",
      contractSigned: true,
      contractSignedAt: "2026-09-21 11:00",
      activeMilestoneIndex: 1,
      milestones: [
        {
          id: "m1",
          title: "Milestone 1: Architectural Blueprint & 50% Advance",
          deliverables: [
            "React 19 Customer Web Ordering Application",
            "PostgreSQL Relational DDL & Foreign Key Architecture",
            "Merchant POS Order Console",
          ],
          amountInr: 74999,
          status: "ACCEPTED",
          deliveredAt: "2026-09-21 15:00",
          acceptedAt: "2026-09-21 15:30",
          downloadableArtifacts: [
            { name: "OrderKing-Architecture-v1.pdf", type: "application/pdf", size: "2.4 MB" },
            { name: "Production-Schema.sql", type: "text/sql", size: "14 KB" },
          ],
        },
        {
          id: "m2",
          title: "Milestone 2: Fleet Dispatch & King Pay UPI Integration",
          deliverables: [
            "WhatsApp Rider Dispatch Notification Webhook",
            "King Pay UPI 0% Direct Founder Settlement",
            "Real-time Order Status Tracking Dashboard",
          ],
          amountInr: 75000,
          status: "IN_PROGRESS",
          downloadableArtifacts: [
            { name: "Rider-Dispatch-APK-Preview.zip", type: "application/zip", size: "18.2 MB" },
          ],
        },
      ],
      invoices: [
        {
          id: "INV-8801",
          description: "50% Advance Milestone - Turnkey Setup",
          amountInr: 74999,
          status: "PAID",
          upiLink: "upi://pay?pa=orderking@okhdfcbank&pn=OrderKing&am=74999&cu=INR&tn=Milestone%201%20Advance",
          issuedAt: "2026-09-21 12:00",
          paidAt: "2026-09-21 15:40",
        },
        {
          id: "INV-8802",
          description: "Final 50% Milestone - Delivery & Handoff",
          amountInr: 75000,
          status: "PENDING",
          upiLink: "upi://pay?pa=orderking@okhdfcbank&pn=OrderKing&am=75000&cu=INR&tn=Milestone%202%20Final",
          issuedAt: "2026-09-22 06:00",
        },
      ],
      revisionRequests: [],
    };

    this.projects.set(proj.id, proj);
  }

  getProject(id: string): ClientPortalProject | undefined {
    return this.projects.get(id);
  }

  approveMilestone(projectId: string, milestoneId: string): ClientMilestone {
    const proj = this.projects.get(projectId);
    if (!proj) throw new Error(`Project ${projectId} not found.`);

    const m = proj.milestones.find((item) => item.id === milestoneId);
    if (!m) throw new Error(`Milestone ${milestoneId} not found.`);

    m.status = "ACCEPTED";
    m.acceptedAt = new Date().toISOString().replace("T", " ").slice(0, 16);
    return m;
  }

  submitRevisionRequest(projectId: string, milestoneId: string, details: string): { success: boolean; requestId: string } {
    const proj = this.projects.get(projectId);
    if (!proj) throw new Error(`Project ${projectId} not found.`);

    const reqId = `REV-${Date.now().toString().slice(-4)}`;
    proj.revisionRequests.push({
      id: reqId,
      milestoneId,
      details,
      submittedAt: new Date().toISOString().replace("T", " ").slice(0, 16),
      status: "UNDER_REVIEW",
    });

    return { success: true, requestId: reqId };
  }
}

export const clientPortalService = new ClientPortalService();
