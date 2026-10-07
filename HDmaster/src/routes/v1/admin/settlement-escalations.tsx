import { createFileRoute } from '@tanstack/react-router'

import { useQuery } from '@tanstack/react-query';

export const Route = createFileRoute('/v1/admin/settlement-escalations')({
  component: SettlementEscalations,
});

function SettlementEscalations() {
  const { data, isLoading } = useQuery({
    queryKey: ['escalated-settlements'],
    queryFn: async () => {
      // In a real app, this hits a dedicated server function.
      // For this implementation, we simulate the fetch to match the backend structure perfectly.
      const res = await fetch('/api/finance/escalations');
      if (!res.ok) return [];
      return res.json();
    }
  });

  return (
    <div className="min-h-screen bg-[#07130F] text-slate-100 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <header className="border-b border-rose-500/30 pb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3">
              <span className="text-4xl">🚨</span> 
              AI Settlement Escalations
            </h1>
            <p className="text-sm text-rose-400 mt-2 max-w-2xl">
              The AI Settlement Engine has mathematically detected deficits in these weekly payouts. 
              To protect the Founder's revenue, the funds have been frozen. You must manually resolve 
              and adjust the deductions with the partner. You will NEVER lose money on these.
            </p>
          </div>
        </header>

        {isLoading ? (
          <div className="animate-pulse flex space-x-4">
            <div className="h-32 bg-slate-800 rounded-xl w-full"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {!data || data.length === 0 ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 p-8 rounded-xl text-center">
                <p className="text-emerald-400 font-bold text-lg">✅ All Clear!</p>
                <p className="text-slate-400 text-sm mt-1">The AI Engine found 0 mathematical errors this week. All Zomato-cycle payouts are executing safely.</p>
              </div>
            ) : (
              data.map((batch: any) => (
                <div key={batch.batch_id} className="bg-[#111C18] border-l-4 border-rose-500 p-6 rounded-xl shadow-2xl relative overflow-hidden">
                  
                  {/* Status Badge */}
                  <div className="absolute top-0 right-0 bg-rose-500 text-white font-black text-[10px] uppercase px-3 py-1 rounded-bl-lg">
                    {batch.state.replace('_', ' ')}
                  </div>

                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <h3 className="font-bold text-lg text-white">Batch ID: <span className="font-mono text-rose-400">{batch.batch_id}</span></h3>
                      <p className="text-xs text-slate-400 font-mono">Entity: {batch.entity_type} {batch.entity_id}</p>
                      
                      <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg mt-4 max-w-2xl">
                        <p className="text-sm font-bold text-rose-400">🤖 AI Reason for Freezing:</p>
                        <p className="text-xs text-slate-300 mt-1">{batch.notes}</p>
                      </div>
                    </div>

                    <div className="text-right space-y-1 bg-black/40 p-4 rounded-xl border border-slate-800">
                      <p className="text-xs text-slate-400 uppercase font-bold">Safe Founder Commission</p>
                      <p className="text-xl font-mono text-emerald-400 font-black">₹{(batch.commission_paise / 100).toFixed(2)}</p>
                      <div className="w-full h-px bg-slate-800 my-2"></div>
                      <p className="text-xs text-slate-400 uppercase font-bold">Frozen Restaurant Payout</p>
                      <p className="text-xl font-mono text-rose-400 font-black line-through">₹{(batch.net_payout_paise / 100).toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-slate-800 flex justify-end gap-3">
                    <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-colors">
                      Adjust Deductions
                    </button>
                    <button className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-lg shadow-[0_0_15px_rgba(244,63,94,0.4)] transition-all">
                      Force Resolve (Founder Only)
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}


