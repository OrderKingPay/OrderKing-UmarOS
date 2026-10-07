import { createServerFn } from "@tanstack/react-start";
import { getSessionUser } from "@/lib/auth/verify.server";
import { ensureWorkspace } from "@/lib/orderking/server/workspace.server";
import { liveOrchestrationEngine } from "@/lib/orderking/ai/live-orchestration-engine";
import { businessOsModules } from "@/lib/orderking/ai/business-os-modules";
import { founderApprovalGates } from "@/lib/orderking/ai/founder-approval-gates";
import { autonomousCommandOrchestrator } from "@/lib/orderking/ai/autonomous-command-orchestrator";

async function requireFounderAccess() {
  const session = await getSessionUser();
  if (!session?.id) throw new Error("AUTH_REQUIRED");
  const workspace = await ensureWorkspace(session.id);
  const isFounder =
    workspace.ctx.roleKey === "SUPER_ADMIN" ||
    workspace.ctx.permissions.includes("access_CEO_dashboard");
  if (!isFounder) throw new Error("FOUNDER_ACCESS_REQUIRED");
  return workspace;
}

export const getBusinessOsSnapshot = createServerFn({ method: "GET" }).handler(async () => {
  await requireFounderAccess();
  return {
    budgetStatus: liveOrchestrationEngine.getBudgetStatus(),
    adapters: liveOrchestrationEngine.listRegisteredAdapters().map(({ executePrompt, ...rest }) => rest),
    pnl: businessOsModules.calculateFinancialPnL(),
    leads: businessOsModules.discoverLawfulOpportunities(),
    slas: businessOsModules.auditKitchenSlas(),
    inventory: businessOsModules.inspectInventoryAlerts(),
    sre: businessOsModules.inspectSreHealth(),
    roster: businessOsModules.getMinimalStaffRoster(),
    pendingApprovals: founderApprovalGates.listPendingRequests(),
    auditChain: founderApprovalGates.getAuditChain(),
  };
});

export const executeFounderCommandFn = createServerFn({ method: "POST" })
  .validator((input: { command: string }) => input)
  .handler(async ({ data }) => {
    await requireFounderAccess();
    return autonomousCommandOrchestrator.executeFounderCommand(data.command);
  });

export const approveFounderActionFn = createServerFn({ method: "POST" })
  .validator((input: { id: string }) => input)
  .handler(async ({ data }) => {
    await requireFounderAccess();
    return founderApprovalGates.approveRequest(data.id);
  });

export const rejectFounderActionFn = createServerFn({ method: "POST" })
  .validator((input: { id: string; reason?: string }) => input)
  .handler(async ({ data }) => {
    await requireFounderAccess();
    return founderApprovalGates.rejectRequest(data.id, data.reason);
  });

// Compatibility exports for existing callers.
export const getPendingApprovals = createServerFn({ method: "GET" }).handler(async () => {
  await requireFounderAccess();
  return founderApprovalGates.listPendingRequests();
});

export const getBudgetStatus = createServerFn({ method: "GET" }).handler(async () => {
  await requireFounderAccess();
  return liveOrchestrationEngine.getBudgetStatus();
});

export const getRegisteredAdapters = createServerFn({ method: "GET" }).handler(async () => {
  await requireFounderAccess();
  return liveOrchestrationEngine.listRegisteredAdapters().map(({ executePrompt, ...rest }) => rest);
});

export const getFinancialPnL = createServerFn({ method: "GET" }).handler(async () => {
  await requireFounderAccess();
  return businessOsModules.calculateFinancialPnL();
});

export const getLawfulOpportunities = createServerFn({ method: "GET" }).handler(async () => {
  await requireFounderAccess();
  return businessOsModules.discoverLawfulOpportunities();
});

export const getKitchenSlas = createServerFn({ method: "GET" }).handler(async () => {
  await requireFounderAccess();
  return businessOsModules.auditKitchenSlas();
});

export const getInventoryAlerts = createServerFn({ method: "GET" }).handler(async () => {
  await requireFounderAccess();
  return businessOsModules.inspectInventoryAlerts();
});

export const getSreHealth = createServerFn({ method: "GET" }).handler(async () => {
  await requireFounderAccess();
  return businessOsModules.inspectSreHealth();
});

export const getMinimalStaffRoster = createServerFn({ method: "GET" }).handler(async () => {
  await requireFounderAccess();
  return businessOsModules.getMinimalStaffRoster();
});

export const getAuditChain = createServerFn({ method: "GET" }).handler(async () => {
  await requireFounderAccess();
  return founderApprovalGates.getAuditChain();
});

import { getSql } from "@/lib/db";

export const getDigitalWorkforceData = createServerFn({ method: "GET" }).handler(async () => {
  await requireFounderAccess();
  const sql = await getSql();
  
  const agents = await sql`
    SELECT id, role, capabilities, status, created_at 
    FROM agent_registry 
    ORDER BY created_at DESC
  `;
  
  const activeTasks = await sql`
    SELECT t.id, t.agent_id, t.payload, t.status, t.cost, t.started_at, a.role
    FROM agent_tasks t
    JOIN agent_registry a ON t.agent_id = a.id
    WHERE t.status IN ('PENDING', 'RUNNING')
    ORDER BY t.started_at DESC NULLS LAST
  `;
  
  const taskHistory = await sql`
    SELECT t.id, t.agent_id, t.payload, t.status, t.result, t.cost, t.error_details, t.completed_at, a.role
    FROM agent_tasks t
    JOIN agent_registry a ON t.agent_id = a.id
    WHERE t.status IN ('COMPLETED', 'FAILED')
    ORDER BY t.completed_at DESC
    LIMIT 50
  `;
  
  return {
    agents: agents as any[],
    activeTasks: activeTasks as any[],
    taskHistory: taskHistory as any[]
  };
});

