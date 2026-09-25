import { createServerFn } from "@tanstack/react-start";
import { liveOrchestrationEngine } from "../ai/live-orchestration-engine";
import { businessOsModules } from "../ai/business-os-modules";
import { founderApprovalGates } from "../ai/founder-approval-gates";
import { autonomousCommandOrchestrator } from "../ai/autonomous-command-orchestrator";

export const getPendingApprovals = createServerFn({ method: "GET" }).handler(async () => {
  return founderApprovalGates.listPendingRequests();
});

export const getBudgetStatus = createServerFn({ method: "GET" }).handler(async () => {
  return liveOrchestrationEngine.getBudgetStatus();
});

export const getRegisteredAdapters = createServerFn({ method: "GET" }).handler(async () => {
  return liveOrchestrationEngine.listRegisteredAdapters();
});

export const getFinancialPnL = createServerFn({ method: "GET" }).handler(async () => {
  return businessOsModules.calculateFinancialPnL();
});

export const getLawfulOpportunities = createServerFn({ method: "GET" }).handler(async () => {
  return businessOsModules.discoverLawfulOpportunities();
});

export const getKitchenSlas = createServerFn({ method: "GET" }).handler(async () => {
  return businessOsModules.auditKitchenSlas();
});

export const getInventoryAlerts = createServerFn({ method: "GET" }).handler(async () => {
  return businessOsModules.inspectInventoryAlerts();
});

export const getSreHealth = createServerFn({ method: "GET" }).handler(async () => {
  return businessOsModules.inspectSreHealth();
});

export const getMinimalStaffRoster = createServerFn({ method: "GET" }).handler(async () => {
  return businessOsModules.getMinimalStaffRoster();
});

export const getAuditChain = createServerFn({ method: "GET" }).handler(async () => {
  return founderApprovalGates.getAuditChain();
});
