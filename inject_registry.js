const fs = require('fs');
let code = fs.readFileSync('HDmaster/src/routes/index.tsx', 'utf8');

// Insert the import
code = code.replace(/import \{ LinkIcon.*\} from \"lucide-react\";/, 'import { LinkIcon, Server, FileText, Settings, ShieldCheck, Database, GitBranch, AlertCircle, CheckCircle2 } from "lucide-react";\nimport { CAPABILITY_REGISTRY } from "@/lib/capabilities";');

// Create the new component
const capabilityPanelCode = \
function CapabilityRegistryPanel() {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-black text-white flex items-center gap-2"><Database className="text-emerald-500 h-6 w-6" /> System Capability Registry</h3>
      <p className="text-sm text-slate-400">Strict factual matrix of maximum real-world technology capabilities supported by the current architecture.</p>
      
      <div className="grid gap-4 mt-6">
        {CAPABILITY_REGISTRY.map(cap => (
          <div key={cap.id} className="bg-slate-900/50 border border-white/5 rounded-xl p-5 hover:bg-slate-800/50 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-bold px-2 py-1 rounded bg-slate-800 text-slate-300 uppercase tracking-wider">{cap.domain}</span>
                  <h4 className="text-lg font-bold text-slate-200">{cap.name}</h4>
                </div>
                <p className="text-sm text-slate-400 mb-4">{cap.description}</p>
                
                <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-500">
                  <span className="flex items-center gap-1"><Server className="size-3" /> v{cap.version}</span>
                  <span className="flex items-center gap-1"><GitBranch className="size-3" /> Rollback: {cap.rollbackPath || 'None'}</span>
                  <span>Deps: {cap.dependencies.join(', ') || 'None'}</span>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-2">
                {cap.status === 'IMPLEMENTED' && <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded flex items-center gap-1 text-xs font-bold uppercase"><CheckCircle2 className="size-3" /> Implemented</span>}
                {cap.status === 'PARTIAL' && <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded flex items-center gap-1 text-xs font-bold uppercase"><AlertCircle className="size-3" /> Partial</span>}
                {cap.status === 'NOT_IMPLEMENTED' && <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-3 py-1 rounded flex items-center gap-1 text-xs font-bold uppercase">Not Implemented</span>}
                {cap.health === 'ONLINE' ? <span className="text-emerald-500 text-[10px] font-bold uppercase tracking-wider">● ONLINE</span> : <span className="text-amber-500 text-[10px] font-bold uppercase tracking-wider">● DEGRADED</span>}
              </div>
            </div>
            
            {cap.blockerReason && (
              <div className="mt-4 p-3 bg-amber-950/30 border border-amber-500/20 rounded-lg text-amber-400 text-xs flex items-start gap-2">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <p><strong className="font-bold">BLOCKER:</strong> {cap.blockerReason}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
\;

if (!code.includes('CapabilityRegistryPanel')) {
  code = code + '\n' + capabilityPanelCode;
}

// Replace placeholders in the UnifiedControlPlane
code = code.replace(/\{activeDomain === 'automation'[^]+\{activeDomain === 'infrastructure' && <PlaceholderPanel[^]+\}/, \
              {activeDomain === 'automation' && <CapabilityRegistryPanel />}
              {activeDomain === 'algorithms' && <CapabilityRegistryPanel />}
              {activeDomain === 'integrations' && <IntegrationsPanel integrations={stats.integrations} />}
              {activeDomain === 'content' && <CapabilityRegistryPanel />}
              {activeDomain === 'operations' && <CapabilityRegistryPanel />}
              {activeDomain === 'security' && <SecurityPanel />}
              {activeDomain === 'infrastructure' && <CapabilityRegistryPanel />}
\);

fs.writeFileSync('HDmaster/src/routes/index.tsx', code, 'utf8');
