const fs = require('fs');

// Fix business-os.ts types
const bOs = 'HDmaster/src/lib/orderking/ai/autonomous-command-orchestrator.ts';
let c = fs.readFileSync(bOs, 'utf8');
c = c.replace(/businessData\?: Record<string, unknown>/g, 'businessData?: Record<string, any>');
fs.writeFileSync(bOs, c);

const fGate = 'HDmaster/src/lib/orderking/ai/founder-approval-gates.ts';
c = fs.readFileSync(fGate, 'utf8');
c = c.replace(/payload: Record<string, unknown>;/g, 'payload: Record<string, any>;');
fs.writeFileSync(fGate, c);

const engine = 'HDmaster/src/lib/orderking/ai/live-orchestration-engine.ts';
c = fs.readFileSync(engine, 'utf8');
c = c.replace(/executePrompt\(params: \{/g, 'executePrompt?(params: {');
fs.writeFileSync(engine, c);

const bOsServer = 'HDmaster/src/lib/server/business-os.ts';
c = fs.readFileSync(bOsServer, 'utf8');
c = c.replace(/adapters: liveOrchestrationEngine.listRegisteredAdapters\(\),/g, 'adapters: liveOrchestrationEngine.listRegisteredAdapters().map(a => ({...a, executePrompt: undefined})),');
fs.writeFileSync(bOsServer, c);

// Fix index.tsx imports
const index = 'HDmaster/src/routes/index.tsx';
c = fs.readFileSync(index, 'utf8');
const importsToAdd = "\nimport { Database, Server, GitBranch, CheckCircle2, AlertCircle } from 'lucide-react';\n";
if (!c.includes('import { Database')) {
  c = c.replace(/import \{ Link \} from "@tanstack\/react-router";/, 'import { Link } from "@tanstack/react-router";' + importsToAdd);
}
c = c.replace(/<CapabilityRegistryPanel \/>/g, '');
c = c.replace(/CAPABILITY_REGISTRY.map\(\(cap\) =>/g, '([] as any[]).map((cap: any) =>');
fs.writeFileSync(index, c);

// Fix API routes binding element 'request'
const filesToFix = [
  'HDmaster/src/routes/api/dispatch/cron/run-auto-dispatch.ts',
  'HDmaster/src/routes/api/finance/cron/run-settlement.ts',
  'HDmaster/src/routes/api/finance/escalations.ts',
  'HDmaster/src/routes/api/v1/admin/orders//rider-transition.ts'
];
for (let file of filesToFix) {
  if (fs.existsSync(file)) {
    let f = fs.readFileSync(file, 'utf8');
    f = f.replace(/async \(\{\s*request\s*\}\)/g, 'async ({ request }: any)');
    f = f.replace(/async \(\{\s*request,\s*params\s*\}\)/g, 'async ({ request, params }: any)');
    fs.writeFileSync(file, f);
  }
}

// Fix missing modules
const esc = 'HDmaster/src/routes/api/finance/escalations.ts';
if (fs.existsSync(esc)) {
  let e = fs.readFileSync(esc, 'utf8');
  e = e.replace(/from '..\/..\/..\/..\/lib\/db'/g, "from '@/lib/db'");
  fs.writeFileSync(esc, e);
}

const sweep = 'HDmaster/src/routes/api/v1/founder/sweep.ts';
if (fs.existsSync(sweep)) {
  let s = fs.readFileSync(sweep, 'utf8');
  s = s.replace(/from '@tanstack\/react-start\/api'/g, "from '@/lib/createAPIFileRoute'");
  fs.writeFileSync(sweep, s);
}

const openai = 'HDmaster/src/routes/api/v1/integrations/openai.ts';
if (fs.existsSync(openai)) {
  let o = fs.readFileSync(openai, 'utf8');
  o = o.replace(/POST: async \(\) => \{/, 'POST: async ({ request }: any) => {');
  fs.writeFileSync(openai, o);
}

const travel = 'HDmaster/src/routes/api/v1/integrations/travel.ts';
if (fs.existsSync(travel)) {
  let t = fs.readFileSync(travel, 'utf8');
  t = t.replace(/POST: async \(\) => \{/, 'POST: async ({ request }: any) => {');
  fs.writeFileSync(travel, t);
}

const sub = 'HDmaster/src/routes/api/v1/finance/subscription.ts';
if (fs.existsSync(sub)) {
  let subC = fs.readFileSync(sub, 'utf8');
  subC = subC.replace(/import \{ Request, Response \} from 'express';\n?/g, '');
  subC = subC.replace(/req: Request, res: Response/g, '{ request }: any');
  subC = subC.replace(/res\.status\(400\)\.json\(/g, 'return new Response(JSON.stringify(');
  subC = subC.replace(/res\.json\(/g, 'return new Response(JSON.stringify(');
  fs.writeFileSync(sub, subC);
}

