const fs = require('fs');
let code = fs.readFileSync('HDmaster/src/routes/index.tsx', 'utf8');

const s = `{activeDomain === 'automation' && <PlaceholderPanel title="Automation Engine" desc="Rules, triggers, and scheduled task orchestration." />}
              {activeDomain === 'algorithms' && <PlaceholderPanel title="Algorithm Controls" desc="Geographic ranking, matching thresholds, and dispatch policies." />}
              {activeDomain === 'integrations' && <IntegrationsPanel integrations={stats.integrations} />}
              {activeDomain === 'content' && <PlaceholderPanel title="Content Management" desc="App banners, AI Tutor knowledge base, and Daily Hub curation." />}
              {activeDomain === 'operations' && <PlaceholderPanel title="Live Operations" desc="Support tickets, active disputes, and fleet mapping." />}
              {activeDomain === 'security' && <SecurityPanel />}
              {activeDomain === 'infrastructure' && <PlaceholderPanel title="Infrastructure" desc="Database health, worker logs, and deployment states." />}`;

const r = `{activeDomain === 'automation' && <CapabilityRegistryPanel />}
              {activeDomain === 'algorithms' && <CapabilityRegistryPanel />}
              {activeDomain === 'integrations' && <IntegrationsPanel integrations={stats.integrations} />}
              {activeDomain === 'content' && <CapabilityRegistryPanel />}
              {activeDomain === 'operations' && <CapabilityRegistryPanel />}
              {activeDomain === 'security' && <SecurityPanel />}
              {activeDomain === 'infrastructure' && <CapabilityRegistryPanel />}`;

code = code.replace(s, r);
code = code.replace(/import \{ LinkIcon.*\} from \"lucide-react\";/, 'import { LinkIcon, Server, FileText, Settings, ShieldCheck, Database, GitBranch, AlertCircle, CheckCircle2 } from "lucide-react";\nimport { CAPABILITY_REGISTRY } from "@/lib/capabilities";');

const c = `
function CapabilityRegistryPanel() {
  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col gap-2">
        <h3 className="text-2xl font-black text-white flex items-center gap-3"><Database className="text-emerald-500 h-7 w-7" /> System Capability Registry</h3>
        <p className="text-sm text-slate-400 max-w-3xl">Strict factual matrix of maximum real-world technology capabilities supported by the current architecture. Automatically generated from core systems.</p>
      </div>
      
      <div className="grid gap-4 mt-6">
        {CAPABILITY_REGISTRY.map(cap => (
          <div key={cap.id} className="bg-slate-900/50 border border-white/5 rounded-xl p-5 hover:bg-slate-800/50 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase tracking-wider">{cap.domain}</span>
                  <h4 className="text-lg font-bold text-slate-200">{cap.name}</h4>
                </div>
                <p className="text-sm text-slate-400 mb-4">{cap.description}</p>
                
                <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-500">
                  <span className="flex items-center gap-1"><Server className="h-3 w-3" /> v{cap.version}</span>
                  <span className="flex items-center gap-1"><GitBranch className="h-3 w-3" /> Rollback: {cap.rollbackPath || 'None'}</span>
                  <span>Deps: {cap.dependencies.join(', ') || 'None'}</span>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-2">
                {cap.status === 'IMPLEMENTED' && <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded flex items-center gap-1 text-xs font-bold uppercase"><CheckCircle2 className="h-3 w-3" /> Implemented</span>}
                {cap.status === 'PARTIAL' && <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded flex items-center gap-1 text-xs font-bold uppercase"><AlertCircle className="h-3 w-3" /> Partial</span>}
                {cap.status === 'NOT_IMPLEMENTED' && <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-3 py-1 rounded flex items-center gap-1 text-xs font-bold uppercase">Not Implemented</span>}
                {cap.health === 'ONLINE' ? <span className="text-emerald-500 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div> ONLINE</span> : <span className="text-amber-500 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></div> DEGRADED</span>}
              </div>
            </div>
            
            {cap.blockerReason && (
              <div className="mt-4 p-3 bg-amber-950/30 border border-amber-500/20 rounded-lg text-amber-400 text-xs flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p><strong className="font-bold">BLOCKER:</strong> {cap.blockerReason}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
`;

code = code + '\n\n' + c;
fs.writeFileSync('HDmaster/src/routes/index.tsx', code, 'utf8');
