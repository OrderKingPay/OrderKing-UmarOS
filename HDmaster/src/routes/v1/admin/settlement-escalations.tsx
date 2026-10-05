import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';

export const Route = createFileRoute('/v1/admin/settlement-escalations')({
  component: SettlementEscalations,
});

function SettlementEscalations() {
  const { data, isLoading } = useQuery({
    queryKey: ['escalated-settlements'],
    queryFn: async () => {
      const res = await fetch('/api/finance/escalations');
      if (!res.ok) return [];
      const body = await res.json() as { data?: unknown[] };
      return Array.isArray(body.data) ? body.data : [];
    },
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
              Settlement anomalies identified by the reconciliation engine remain paused until an authorized review resolves the underlying issue.
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
                <p className="text-emerald-400 font-bold text-lg">No escalations returned</p>
                <p className="text-slate-400 text-sm mt-1">The endpoint returned no currently visible reconciliation escalations.</p>
              </div>
            ) : (
              data.map((batch: any) => (
                <div key={batch.batch_id} className="bg-[#111C18] border-l-4 border-rose-500 p-6 rounded-xl shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-rose-500 text-white font-black text-[10px] uppercase px-3 py-1 rounded-bl-lg">
                    {String(batch.state).replaceAll('_', ' ')}
                  </div>
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <h3 className="font-bold text-lg text-white">Batch ID: <span className="font-mono text-rose-400">{batch.batch_id}</span></h3>
                      <p className="text-xs text-slate-400 font-mono">Entity: {batch.entity_type} {batch.entity_id}</p>
                      <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg mt-4 max-w-2xl">
                        <p className="text-sm font-bold text-rose-400">AI reason:</p>
                        <p className="text-xs text-slate-300 mt-1">{batch.notes}</p>
                      </div>
                    </div>
                    <div className="text-right space-y-1 bg-black/40 p-4 rounded-xl border border-slate-800">
                      <p className="text-xs text-slate-400 uppercase font-bold">Platform Commission</p>
                      <p className="text-xl font-mono text-emerald-400 font-black">₹{(Number(batch.commission_paise) / 100).toFixed(2)}</p>
                      <div className="w-full h-px bg-slate-800 my-2"></div>
                      <p className="text-xs text-slate-400 uppercase font-bold">Restaurant Net Payout</p>
                      <p className="text-xl font-mono text-rose-400 font-black">₹{(Number(batch.net_payout_paise) / 100).toFixed(2)}</p>
                    </div>
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
