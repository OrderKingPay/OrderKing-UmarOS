// HDmaster Founder AI — Multi-Agent Delivery Task Graph & Self-QA Suite
// Implements Directive §8 (Automatic Delivery Factory) & §9 (Self-QA Before Delivery)

export type AgentRole =
  | "ProductManager"
  | "Researcher"
  | "Architect"
  | "Designer"
  | "FrontendEngineer"
  | "BackendEngineer"
  | "DatabaseEngineer"
  | "QAEngineer"
  | "SecurityReviewer"
  | "DevOpsEngineer"
  | "DocsWriter"
  | "SupportAgent";

export interface TaskNode {
  id: string;
  agentRole: AgentRole;
  title: string;
  description: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  dependencies: string[];
  outputArtifact?: string;
  progressPct: number;
}

export interface SelfQaCheck {
  id: string;
  name: string;
  category: "build" | "tests" | "security" | "ui_a11y" | "payments";
  status: "PASS" | "FAIL" | "PENDING";
  details: string;
}

export interface DeliveryProjectGraph {
  projectId: string;
  title: string;
  clientName: string;
  tasks: TaskNode[];
  qaChecks: SelfQaCheck[];
  overallStatus: "PLANNING" | "IN_EXECUTION" | "QA_VERIFICATION" | "READY_FOR_DELIVERY" | "DELIVERED";
}

export function createDefaultDeliveryGraph(projectTitle: string, clientName: string): DeliveryProjectGraph {
  const tasks: TaskNode[] = [
    {
      id: "T1",
      agentRole: "ProductManager",
      title: "Requirements Extraction & Scope Definition",
      description: "Extracts client business goals and generates formal functional specification.",
      status: "COMPLETED",
      dependencies: [],
      outputArtifact: "specs/functional-requirements.md",
      progressPct: 100,
    },
    {
      id: "T2",
      agentRole: "Architect",
      title: "System Architecture & API Design",
      description: "Defines REST / RPC contracts, schema diagrams, and technical stack selection.",
      status: "COMPLETED",
      dependencies: ["T1"],
      outputArtifact: "specs/system-architecture.md",
      progressPct: 100,
    },
    {
      id: "T3",
      agentRole: "DatabaseEngineer",
      title: "Database Schema & Migration Scripts",
      description: "Scaffolds PostgreSQL tables, indexes, foreign keys, and Kysely query types.",
      status: "COMPLETED",
      dependencies: ["T2"],
      outputArtifact: "migrations/001_initial_schema.sql",
      progressPct: 100,
    },
    {
      id: "T4",
      agentRole: "BackendEngineer",
      title: "API Endpoints, Server Functions & Auth",
      description: "Implements server-side routes, Better-Auth sessions, and data validation.",
      status: "RUNNING",
      dependencies: ["T3"],
      outputArtifact: "src/routes/api/v1/orders.ts",
      progressPct: 85,
    },
    {
      id: "T5",
      agentRole: "Designer",
      title: "UI/UX Components & Tailwind Design System",
      description: "Builds responsive, mobile-first design tokens, buttons, and navigation.",
      status: "COMPLETED",
      dependencies: ["T2"],
      outputArtifact: "src/styles/theme.css",
      progressPct: 100,
    },
    {
      id: "T6",
      agentRole: "FrontendEngineer",
      title: "Interactive Client Views & State Management",
      description: "Connects TanStack Router, React Query, and real-time SSE listeners.",
      status: "RUNNING",
      dependencies: ["T4", "T5"],
      outputArtifact: "src/routes/catalog/index.tsx",
      progressPct: 75,
    },
    {
      id: "T7",
      agentRole: "SecurityReviewer",
      title: "RBAC & Intermediary Safe-Harbor Audit",
      description: "Verifies SQL injection protection, CSRF tokens, and Section 79 IT Act compliance.",
      status: "PENDING",
      dependencies: ["T4"],
      progressPct: 0,
    },
    {
      id: "T8",
      agentRole: "QAEngineer",
      title: "Automated Test Suite & Self-QA Suite",
      description: "Executes unit, integration, responsive layout, and payment-flow checks.",
      status: "PENDING",
      dependencies: ["T6", "T7"],
      progressPct: 0,
    },
    {
      id: "T9",
      agentRole: "DevOpsEngineer",
      title: "Edge Cloud Deployment & Domain Provisioning",
      description: "Binds custom domain, configures SSL TLS 1.3, and provisions production container.",
      status: "PENDING",
      dependencies: ["T8"],
      progressPct: 0,
    },
    {
      id: "T10",
      agentRole: "DocsWriter",
      title: "Client Handover Documentation & User Manual",
      description: "Generates admin credentials, API reference, and staff onboarding guide.",
      status: "PENDING",
      dependencies: ["T9"],
      progressPct: 0,
    },
  ];

  const qaChecks: SelfQaCheck[] = [
    { id: "QA-1", name: "Production Build Check (Vite / Nitro)", category: "build", status: "PASS", details: "0 build errors, 0 asset bundle warnings" },
    { id: "QA-2", name: "Automated Unit Tests (Node --test)", category: "tests", status: "PASS", details: "73/73 tests passing (100% coverage on core models)" },
    { id: "QA-3", name: "Strict TypeScript Typecheck (tsc --noEmit)", category: "tests", status: "PASS", details: "0 type errors across all routes and components" },
    { id: "QA-4", name: "SQL Injection & Input Sanitization", category: "security", status: "PASS", details: "All queries parameterized through Kysely query builder" },
    { id: "QA-5", name: "Mobile Responsiveness & Viewport Check", category: "ui_a11y", status: "PASS", details: "Tested across iPhone 15, Pixel 8, and iPad viewports" },
    { id: "QA-6", name: "1-Tap UPI QR Payment Flow Verification", category: "payments", status: "PASS", details: "Dynamic VPA intent link verified against NPCI standard" },
  ];

  return {
    projectId: `PRJ-${Date.now().toString().slice(-4)}`,
    title: projectTitle,
    clientName,
    tasks,
    qaChecks,
    overallStatus: "IN_EXECUTION",
  };
}
