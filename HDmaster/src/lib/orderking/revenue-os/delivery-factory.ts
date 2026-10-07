// Automatic Delivery Factory & Project Task Graph Engine (Directive 8)
// Transforms client requirements into a 15-stage task graph executed across specialized agent roles.
// Specialized Agents: Product Manager, Researcher, Architect, Designer, Frontend Engineer, Backend Engineer, Database Engineer, QA Engineer, Security Reviewer, DevOps Engineer, Documentation Writer, Customer Support Agent.

export type DeliveryAgentRole =
  | "PRODUCT_MANAGER"
  | "RESEARCHER"
  | "ARCHITECT"
  | "DESIGNER"
  | "FRONTEND_ENGINEER"
  | "BACKEND_ENGINEER"
  | "DATABASE_ENGINEER"
  | "QA_ENGINEER"
  | "SECURITY_REVIEWER"
  | "DEVOPS_ENGINEER"
  | "DOCUMENTATION_WRITER"
  | "CUSTOMER_SUPPORT_AGENT";

export type DeliveryStage =
  | "CLIENT_REQUIREMENTS"
  | "REQUIREMENT_EXTRACTION"
  | "ARCHITECTURE"
  | "TASK_GRAPH"
  | "PARALLEL_EXECUTION"
  | "CODE"
  | "DESIGN"
  | "DATABASE"
  | "INTEGRATIONS"
  | "TESTS"
  | "SECURITY_CHECK"
  | "DEPLOYMENT"
  | "CLIENT_REVIEW"
  | "REVISION"
  | "FINAL_DELIVERY";

export interface DeliveryTaskNode {
  id: string;
  stage: DeliveryStage;
  title: string;
  assignedRole: DeliveryAgentRole;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED" | "BLOCKED";
  dependencies: string[]; // IDs of preceding tasks
  outputArtifacts?: string[];
  executionLog?: string[];
  startedAt?: string;
  completedAt?: string;
}

export interface ClientDeliveryProject {
  id: string;
  clientName: string;
  projectTitle: string;
  contractValueInr: number;
  currentStage: DeliveryStage;
  taskGraph: DeliveryTaskNode[];
  createdAt: string;
  targetDeliveryDate: string;
  isDelivered: boolean;
  liveHandoffCredentials?: {
    adminPortalUrl: string;
    adminUsername: string;
    temporaryPassword?: string;
    apiKeysProvided: boolean;
  };
}

export class DeliveryFactory {
  private projects: Map<string, ClientDeliveryProject> = new Map();

  constructor() {
    this.seedRealProject();
  }

  private seedRealProject() {
    const p1: ClientDeliveryProject = {
      id: "PROJ-701",
      clientName: "Royal Darbar Palace",
      projectTitle: "Turnkey Direct Food Ordering & WhatsApp Dispatch App",
      contractValueInr: 149999,
      currentStage: "TESTS",
      createdAt: "2026-09-20 10:00",
      targetDeliveryDate: "2026-10-04",
      isDelivered: false,
      liveHandoffCredentials: {
        adminPortalUrl: "https://darbar.orderking.in/admin",
        adminUsername: "admin@royaldarbar.in",
        apiKeysProvided: true,
      },
      taskGraph: [
        {
          id: "TASK-01",
          stage: "CLIENT_REQUIREMENTS",
          title: "Capture Menu, Outlets, and Delivery Radius Specs",
          assignedRole: "PRODUCT_MANAGER",
          status: "COMPLETED",
          dependencies: [],
          outputArtifacts: ["PRD-Royal-Darbar-v1.0.md"],
          startedAt: "2026-09-20 10:30",
          completedAt: "2026-09-20 11:30",
        },
        {
          id: "TASK-02",
          stage: "ARCHITECTURE",
          title: "Design Next.js 15 App Router & WebSocket Fleet Dispatch",
          assignedRole: "ARCHITECT",
          status: "COMPLETED",
          dependencies: ["TASK-01"],
          outputArtifacts: ["Architecture-Diagram.md", "tech-stack-spec.json"],
          startedAt: "2026-09-20 11:45",
          completedAt: "2026-09-20 13:00",
        },
        {
          id: "TASK-03",
          stage: "DATABASE",
          title: "PostgreSQL DDL with Orders, Outlets, Menu, Rider Tables",
          assignedRole: "DATABASE_ENGINEER",
          status: "COMPLETED",
          dependencies: ["TASK-02"],
          outputArtifacts: ["schema.sql", "seed-menu.sql"],
          startedAt: "2026-09-20 13:30",
          completedAt: "2026-09-20 15:00",
        },
        {
          id: "TASK-04",
          stage: "CODE",
          title: "Implement Responsive Web Ordering Frontend (React 19)",
          assignedRole: "FRONTEND_ENGINEER",
          status: "COMPLETED",
          dependencies: ["TASK-03"],
          outputArtifacts: ["OrderStorefront.tsx", "CartDrawer.tsx"],
          startedAt: "2026-09-21 09:00",
          completedAt: "2026-09-21 16:00",
        },
        {
          id: "TASK-05",
          stage: "INTEGRATIONS",
          title: "Wire King Pay Direct UPI QR & Webhook Settlement",
          assignedRole: "BACKEND_ENGINEER",
          status: "COMPLETED",
          dependencies: ["TASK-03"],
          outputArtifacts: ["payment-route.ts", "upi-webhook.ts"],
          startedAt: "2026-09-21 16:30",
          completedAt: "2026-09-21 18:30",
        },
        {
          id: "TASK-06",
          stage: "TESTS",
          title: "Execute Automated Self-QA 14-Check Verification Suite",
          assignedRole: "QA_ENGINEER",
          status: "IN_PROGRESS",
          dependencies: ["TASK-04", "TASK-05"],
          startedAt: "2026-09-22 06:00",
        },
        {
          id: "TASK-07",
          stage: "SECURITY_CHECK",
          title: "Perform OWASP Top 10 Audit & UPI Tamper Validation",
          assignedRole: "SECURITY_REVIEWER",
          status: "PENDING",
          dependencies: ["TASK-06"],
        },
        {
          id: "TASK-08",
          stage: "DEPLOYMENT",
          title: "Deploy Production Instance to Cloud Edge Infrastructure",
          assignedRole: "DEVOPS_ENGINEER",
          status: "PENDING",
          dependencies: ["TASK-07"],
        },
        {
          id: "TASK-09",
          stage: "CLIENT_REVIEW",
          title: "Conduct Client Staging Walkthrough & Menu Verification",
          assignedRole: "PRODUCT_MANAGER",
          status: "PENDING",
          dependencies: ["TASK-08"],
        },
        {
          id: "TASK-10",
          stage: "FINAL_DELIVERY",
          title: "Handoff Admin Credentials, Documentation & Issue Final Invoice",
          assignedRole: "CUSTOMER_SUPPORT_AGENT",
          status: "PENDING",
          dependencies: ["TASK-09"],
        },
      ],
    };

    this.projects.set(p1.id, p1);
  }

  getProjects(): ClientDeliveryProject[] {
    return Array.from(this.projects.values());
  }

  getProject(id: string): ClientDeliveryProject | undefined {
    return this.projects.get(id);
  }

  createProjectFromOpportunity(params: {
    clientName: string;
    projectTitle: string;
    contractValueInr: number;
    timelineDays?: number;
  }): ClientDeliveryProject {
    const id = `PROJ-${Date.now().toString().slice(-4)}`;
    const days = params.timelineDays || 14;
    const targetDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const project: ClientDeliveryProject = {
      id,
      clientName: params.clientName,
      projectTitle: params.projectTitle,
      contractValueInr: params.contractValueInr,
      currentStage: "CLIENT_REQUIREMENTS",
      createdAt: new Date().toISOString().replace("T", " ").slice(0, 16),
      targetDeliveryDate: targetDate,
      isDelivered: false,
      taskGraph: [
        {
          id: "T1",
          stage: "CLIENT_REQUIREMENTS",
          title: "Requirement Ingestion & Scope Definition",
          assignedRole: "PRODUCT_MANAGER",
          status: "IN_PROGRESS",
          dependencies: [],
          startedAt: new Date().toLocaleTimeString(),
        },
        {
          id: "T2",
          stage: "ARCHITECTURE",
          title: "Technical Architecture & API Specifications",
          assignedRole: "ARCHITECT",
          status: "PENDING",
          dependencies: ["T1"],
        },
        {
          id: "T3",
          stage: "DATABASE",
          title: "PostgreSQL Database Schema & Migrations",
          assignedRole: "DATABASE_ENGINEER",
          status: "PENDING",
          dependencies: ["T2"],
        },
        {
          id: "T4",
          stage: "CODE",
          title: "Core Fullstack Application Implementation",
          assignedRole: "FRONTEND_ENGINEER",
          status: "PENDING",
          dependencies: ["T3"],
        },
        {
          id: "T5",
          stage: "INTEGRATIONS",
          title: "Payment, Auth, & Third-Party Integrations",
          assignedRole: "BACKEND_ENGINEER",
          status: "PENDING",
          dependencies: ["T3"],
        },
        {
          id: "T6",
          stage: "TESTS",
          title: "Automated Self-QA Test Suite",
          assignedRole: "QA_ENGINEER",
          status: "PENDING",
          dependencies: ["T4", "T5"],
        },
        {
          id: "T7",
          stage: "SECURITY_CHECK",
          title: "Security & Vulnerability Audit",
          assignedRole: "SECURITY_REVIEWER",
          status: "PENDING",
          dependencies: ["T6"],
        },
        {
          id: "T8",
          stage: "DEPLOYMENT",
          title: "Edge Cloud Deployment & Domain Binding",
          assignedRole: "DEVOPS_ENGINEER",
          status: "PENDING",
          dependencies: ["T7"],
        },
        {
          id: "T9",
          stage: "CLIENT_REVIEW",
          title: "Client Acceptance Review & Signoff",
          assignedRole: "PRODUCT_MANAGER",
          status: "PENDING",
          dependencies: ["T8"],
        },
        {
          id: "T10",
          stage: "FINAL_DELIVERY",
          title: "Admin Handoff & Final Invoice Settlement",
          assignedRole: "CUSTOMER_SUPPORT_AGENT",
          status: "PENDING",
          dependencies: ["T9"],
        },
      ],
    };

    this.projects.set(id, project);
    return project;
  }

  completeTask(projectId: string, taskId: string, outputArtifact?: string): ClientDeliveryProject {
    const proj = this.projects.get(projectId);
    if (!proj) throw new Error(`Project ${projectId} not found.`);

    const task = proj.taskGraph.find((t) => t.id === taskId);
    if (!task) throw new Error(`Task ${taskId} not found in project ${projectId}.`);

    task.status = "COMPLETED";
    task.completedAt = new Date().toLocaleTimeString();
    if (outputArtifact) {
      task.outputArtifacts = task.outputArtifacts || [];
      task.outputArtifacts.push(outputArtifact);
    }

    // Advance project currentStage
    proj.currentStage = task.stage;

    // Unblock subsequent tasks if all dependencies completed
    for (const t of proj.taskGraph) {
      if (t.status === "PENDING" && t.dependencies.includes(taskId)) {
        const allDepsDone = t.dependencies.every(
          (depId) => proj.taskGraph.find((d) => d.id === depId)?.status === "COMPLETED"
        );
        if (allDepsDone) {
          t.status = "IN_PROGRESS";
          t.startedAt = new Date().toLocaleTimeString();
        }
      }
    }

    // If final delivery completed
    if (task.stage === "FINAL_DELIVERY") {
      proj.isDelivered = true;
    }

    return proj;
  }
}

export const deliveryFactory = new DeliveryFactory();
