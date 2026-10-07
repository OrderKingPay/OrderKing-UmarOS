import { createServerFn } from "@tanstack/react-start";
import { getSessionUser } from "@/lib/auth/verify.server";
import { ensureWorkspace } from "./workspace.server";
import { liveOrchestrationEngine } from "../ai/live-orchestration-engine";
import { businessOsModules } from "../ai/business-os-modules";
import { founderApprovalGates } from "../ai/founder-approval-gates";
import { autonomousCommandOrchestrator } from "../ai/autonomous-command-orchestrator";

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
    adapters: liveOrchestrationEngine.listRegisteredAdapters().map(({ executePrompt, ...rest }) => rest) as any,
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
  return liveOrchestrationEngine.listRegisteredAdapters().map(({ executePrompt, ...rest }) => rest) ;
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
