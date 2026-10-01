// Compatibility export for older internal imports.
// The authoritative implementation lives in dashboard-backend.ts and contains
// only real platform settings/approval actions plus an explicit provider lock
// when broadcast infrastructure is not connected.
export {
  getMarginSnapshot,
  updateMargins,
  listStrategicProposals,
  executeStrategicProposal,
  getBroadcastStatus,
  executeGlobalBroadcast,
  engine,
} from "./dashboard-backend";
