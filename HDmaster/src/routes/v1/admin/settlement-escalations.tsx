import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/v1/admin/settlement-escalations")({
  component: SettlementEscalations,
});

function SettlementEscalations() {
  const { data, isLoading } = useQuery({
    queryKey: ["escalated-settlements"],
    queryFn: async () => {
      const res = await fetch("/api/finance/escalations");
      if (!res.ok) return [];
      return (await res.json()) as Array<Record<string, unknown>>;
    },
  });

  return (
    <div className="min-h-screen bg-[#07130F] text-slate-100 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="border-b border-rose-500/30 pb-6">
          <h1 className="text-3xl font-black text-white">Settlement Escalations</h1>
          <p className="text-sm text-rose-300 mt-2 max-w-3xl">
            This view shows reconciliation exceptions returned by the settlement ledger.
            It does not imply that a provider payout has been frozen, that a loss was avoided,
            or that the platform is guaranteed to be protected.
          </p>
        </header>

        {isLoading ? (
          <div className="animate-pulse h-32 bg-slate-800 rounded-xl w-full" />
        ) : !data || data.length === 0 ? (
          <div className="bg-slate-900 border border-slate-700 p-8 rounded-xl text-center">
            <p className="text-slate-200 font-bold text-lg">No escalated batches returned.</p>
            <p className="text-slate-400 text-sm mt-1">
              This is a query result, not proof that the settlement system has no underlying risks.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {data.map((batch) => (
              <div key={String(batch.batch_id)} className="bg-[#111C18] border-l-4 border-rose-500 p-6 rounded-xl">
                <div className="flex justify-between items-start gap-6">
                  <div className="space-y-2">
                    <h3 className="font-bold text-lg text-white">
                      Batch ID: <span className="font-mono text-rose-400">{String(batch.batch_id)}</span>
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      Entity: {String(batch.entity_type)} {String(batch.entity_id)}
                    </p>
                    <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg mt-4">
                      <p className="text-xs text-slate-300">{String(batch.notes ?? "No notes recorded.")}</p>
                    </div>
                  </div>
                  <div className="text-right bg-black/40 p-4 rounded-xl border border-slate-800">
                    <p className="text-xs text-slate-400 uppercase font-bold">Commission ledger</p>
                    <p className="text-xl font-mono text-emerald-400 font-black">
                      ₹{(Number(batch.commission_paise ?? 0) / 100).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
