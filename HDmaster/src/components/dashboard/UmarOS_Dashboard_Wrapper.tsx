
import { UmarOSMasterDashboard, type UmarOSMasterDashboardEngine } from './UmarOS_Master_Dashboard';
import {
  getMarginSnapshotFn,
  updateMarginsFn,
  listStrategicProposalsFn,
  executeStrategicProposalFn,
  getBroadcastStatusFn,
  executeGlobalBroadcastFn
} from './dashboard-backend.server';

export const engine: UmarOSMasterDashboardEngine = {
  getMarginSnapshot: async () => getMarginSnapshotFn(),
  updateMargins: async (input) => updateMarginsFn({ data: input }),
  listStrategicProposals: async () => listStrategicProposalsFn(),
  executeStrategicProposal: async (id) => executeStrategicProposalFn({ data: id }),
  getBroadcastStatus: async () => getBroadcastStatusFn(),
  executeGlobalBroadcast: async () => executeGlobalBroadcastFn()
};

export function UmarOSDashboardWrapper() {
  return <UmarOSMasterDashboard engine={engine} />;
}

