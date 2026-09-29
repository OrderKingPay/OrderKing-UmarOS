import { executeTool } from "../src/lib/orderking/ai/master-ai-runtime.ts";

async function main() {
  const ws = {
    ctx: { orgId: "org_1", employeeId: "emp_1", userId: "usr_1", actingRoleKey: "OWNER_ROOT", roles: ["OWNER_ROOT"] },
    dataMode: "PRODUCTION",
    settings: {}
  };
  
  const result = await executeTool(ws as any, "run_hyper_cognitive_diagnostic_and_healing", {});
  console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error);
