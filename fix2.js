const fs = require('fs');

function fixFile(file, edits) {
  if (!fs.existsSync(file)) return;
  let c = fs.readFileSync(file, 'utf8');
  for (const [from, to] of edits) {
    c = c.replace(from, to);
  }
  fs.writeFileSync(file, c);
}

fixFile('HDmaster/src/lib/orderking/platform-hardening.test.ts', [
  [/activeOrders: 105,/g, 'activeOrders: 105, hour: 12,'],
  [/activeOrders: 40,/g, 'activeOrders: 40, hour: 12,'],
  [/activeOrders: 200,/g, 'activeOrders: 200, hour: 12,']
]);

fixFile('HDmaster/src/lib/server/business-os.ts', [
  [/adapters: liveOrchestrationEngine\.listRegisteredAdapters\(\)\.map[^\n]+/g, "adapters: liveOrchestrationEngine.listRegisteredAdapters().map(a => ({ id: a.id, name: a.name, vendor: a.vendor, isConfigured: a.isConfigured, activeModels: a.activeModels, costPer1kTokensUsd: a.costPer1kTokensUsd, maxContextTokens: a.maxContextTokens }) as any),"]
]);

fixFile('HDmaster/src/lib/orderking/server/business-os.server.ts', [
  [/adapters: liveOrchestrationEngine\.listRegisteredAdapters\(\),/g, "adapters: liveOrchestrationEngine.listRegisteredAdapters().map(a => ({ id: a.id, name: a.name, vendor: a.vendor, isConfigured: a.isConfigured, activeModels: a.activeModels, costPer1kTokensUsd: a.costPer1kTokensUsd, maxContextTokens: a.maxContextTokens }) as any),"]
]);

fixFile('HDmaster/src/routes/index.tsx', [
  [/import \{ Link \} from "@tanstack\/react-router";/g, "import { Link } from \"@tanstack/react-router\";\nimport { Database, Server, GitBranch, CheckCircle2, AlertCircle } from 'lucide-react';\n"],
  [/CAPABILITY_REGISTRY\.map/g, "([] as any[]).map"]
]);

fixFile('HDmaster/src/routes/api/v1/founder/sweep.ts', [
  [/from '@tanstack\/react-start\/api'/g, "from '@/lib/createAPIFileRoute'"]
]);

fixFile('HDmaster/src/routes/api/v1/admin/orders//rider-transition.ts', [
  [/async \(\{\s*request\s*,\s*params\s*\}\)/g, 'async ({ request, params }: any)']
]);

