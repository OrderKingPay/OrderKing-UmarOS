const fs = require('fs');
let c = fs.readFileSync('HDmaster/src/routes/index.tsx', 'utf8');

const integrationPanel = \nfunction IntegrationsPanel({ integrations }: { integrations: any[] }) {
  return (
    <div className="space-y-6">
       <div className="bg-slate-900/80 border border-white/10 rounded-xl shadow-lg p-6">
         <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><LinkIcon className="h-5 w-5 text-indigo-400" /> Integration Registry</h3>
         <p className="text-sm text-slate-400 mb-6">Real-time status of external platform integrations. Red indicates missing environment credentials.</p>
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {integrations.map((i: any) => (
               <div key={i.id} className="p-4 bg-white/5 border border-white/5 rounded-lg flex items-center justify-between">
                 <div>
                   <h4 className="font-bold text-slate-200">{i.name}</h4>
                   <p className="text-xs text-slate-400 mt-1">{i.type}</p>
                 </div>
                 <div className={\px-3 py-1 text-xs font-bold rounded-full \\}>
                   {i.status}
                 </div>
               </div>
            ))}
         </div>
       </div>
    </div>
  );
};

fs.writeFileSync('HDmaster/src/routes/index.tsx', c + integrationPanel, 'utf8');
