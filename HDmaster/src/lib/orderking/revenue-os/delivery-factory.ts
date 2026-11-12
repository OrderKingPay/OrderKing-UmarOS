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

  constructor() {}

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
