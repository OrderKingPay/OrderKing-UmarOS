import { createServerFn } from "@tanstack/start";
import { liveOrchestrationEngine } from "../ai/live-orchestration-engine";
import { businessOsModules } from "../ai/business-os-modules";
import { founderApprovalGates } from "../ai/founder-approval-gates";
import { autonomousCommandOrchestrator } from "../ai/autonomous-command-orchestrator";

export const getPendingApprovals = createServerFn("GET", async () => {
  return founderApprovalGates.listPendingRequests();
});

export const getBudgetStatus = createServerFn("GET", async () => {
  return liveOrchestrationEngine.getBudgetStatus();
});

export const getRegisteredAdapters = createServerFn("GET", async () => {
  return liveOrchestrationEngine.listRegisteredAdapters();
});

export const getFinancialPnL = createServerFn("GET", async () => {
  return businessOsModules.calculateFinancialPnL();
});

export const getLawfulOpportunities = createServerFn("GET", async () => {
  return businessOsModules.discoverLawfulOpportunities();
});

export const getKitchenSlas = createServerFn("GET", async () => {
  return businessOsModules.auditKitchenSlas();
});

export const getInventoryAlerts = createServerFn("GET", async () => {
  return businessOsModules.inspectInventoryAlerts();
});

export const getSreHealth = createServerFn("GET", async () => {
  return businessOsModules.inspectSreHealth();
});

export const getMinimalStaffRoster = createServerFn("GET", async () => {
  return businessOsModules.getMinimalStaffRoster();
});

export const getAuditChain = createServerFn("GET", async () => {
  return founderApprovalGates.getAuditChain();
});
