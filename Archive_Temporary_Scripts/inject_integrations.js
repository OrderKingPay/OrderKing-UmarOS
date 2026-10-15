const fs = require('fs');
let c = fs.readFileSync('HDmaster/src/routes/index.tsx', 'utf8');

const replacementFn = const getUmarOSStats = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  const [{ count: userCount }] = await sql<{ count: number }>\SELECT COUNT(*) FROM "user"\ || [{ count: 0 }];
  const [{ count: restCount }] = await sql<{ count: number }>\SELECT COUNT(*) FROM restaurants\ || [{ count: 0 }];
  const [{ count: riderCount }] = await sql<{ count: number }>\SELECT COUNT(*) FROM riders\ || [{ count: 0 }];
  const [{ count: orderCount }] = await sql<{ count: number }>\SELECT COUNT(*) FROM orders WHERE created_at >= CURRENT_DATE\ || [{ count: 0 }];
  const pendingRestaurants = await sql<{ id: string, name: string, verification_status: string }>\SELECT id, name, verification_status FROM restaurants WHERE verification_status = 'PENDING_APPROVAL' LIMIT 5\ || [];

  const integrations = [
    { id: 'gemini', name: 'Google Gemini', type: 'AI Engine', status: process.env.GEMINI_API_KEY ? 'Connected' : 'Missing Key' },
    { id: 'openai', name: 'OpenAI GPT', type: 'AI Engine', status: process.env.OPENAI_API_KEY ? 'Connected' : 'Missing Key' },
    { id: 'razorpay', name: 'Razorpay', type: 'Payments', status: process.env.RAZORPAY_KEY ? 'Connected' : 'Missing Key' },
    { id: 'mapbox', name: 'Mapbox', type: 'Location', status: process.env.MAPBOX_TOKEN ? 'Connected' : 'Missing Key' }
  ];

  return {
    users: Number(userCount),
    restaurants: Number(restCount),
    riders: Number(riderCount),
    todayOrders: Number(orderCount),
    pendingRestaurants,
    integrations
  };
});;

c = c.replace(/const getUmarOSStats = createServerFn[^]+?return \{[^]+?\};\n\}\);/m, replacementFn);

const integrationPanel = unction IntegrationsPanel({ integrations }: { integrations: any[] }) {
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

c = c.replace(/\{activeDomain === 'integrations' && <PlaceholderPanel title=\"External Integrations\" [^\/]+\/>\}/, "{activeDomain === 'integrations' && <IntegrationsPanel integrations={stats.integrations} />}");

if (!c.includes('function IntegrationsPanel')) {
  c += '\n\n' + integrationPanel;
}

fs.writeFileSync('HDmaster/src/routes/index.tsx', c, 'utf8');
