import { createServerFn } from "@tanstack/react-start";
import { liveOrchestrationEngine } from "../ai/live-orchestration-engine";
import { businessOsModules } from "../ai/business-os-modules";
import { founderApprovalGates } from "../ai/founder-approval-gates";
import { autonomousCommandOrchestrator } from "../ai/autonomous-command-orchestrator";

export const getPendingApprovals = createServerFn({ method: "GET" }).handler(async () => {
  return founderApprovalGates.listPendingRequests() as any;
});

export const getBudgetStatus = createServerFn({ method: "GET" }).handler(async () => {
  return liveOrchestrationEngine.getBudgetStatus() as any;
});

export const getRegisteredAdapters = createServerFn({ method: "GET" }).handler(async () => {
  return liveOrchestrationEngine.listRegisteredAdapters() as any;
});

export const getFinancialPnL = createServerFn({ method: "GET" }).handler(async () => {
  return businessOsModules.calculateFinancialPnL() as any;
});

export const getLawfulOpportunities = createServerFn({ method: "GET" }).handler(async () => {
  return businessOsModules.discoverLawfulOpportunities() as any;
});

export const getKitchenSlas = createServerFn({ method: "GET" }).handler(async () => {
  return businessOsModules.auditKitchenSlas() as any;
});

export const getInventoryAlerts = createServerFn({ method: "GET" }).handler(async () => {
  return businessOsModules.inspectInventoryAlerts() as any;
});

export const getSreHealth = createServerFn({ method: "GET" }).handler(async () => {
  return businessOsModules.inspectSreHealth() as any;
});

export const getMinimalStaffRoster = createServerFn({ method: "GET" }).handler(async () => {
  return businessOsModules.getMinimalStaffRoster() as any;
});

export const getAuditChain = createServerFn({ method: "GET" }).handler(async () => {
  return founderApprovalGates.getAuditChain() as any;
});
