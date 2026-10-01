import { UmarOSMasterDashboard } from "./UmarOS_Master_Dashboard";
import { engine } from "./dashboard-backend";

export function UmarOSDashboardWrapper() {
  return <UmarOSMasterDashboard engine={engine} />;
}
