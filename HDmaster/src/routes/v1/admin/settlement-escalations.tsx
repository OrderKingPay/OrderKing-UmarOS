import { createFileRoute, redirect } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { verifyAdminSessionFn } from '@/lib/auth/server-session';

export const Route = createFileRoute('/v1/admin/settlement-escalations')({
  beforeLoad: async () => {
    try {
      const res = await verifyAdminSessionFn();
      if (!res?.ok) throw redirect({ to: "/login" });
    } catch {
      throw redirect({ to: "/login" });
    }
  },
  component: SettlementEscalations,
});

function SettlementEscalations() {
  const qc = useQueryClient();
  const [adjustingBatchId, setAdjustingBatchId] = useState<string | null>(null);
  const [deductionPaise, setDeductionPaise] = useState<string>("0");

  const { data, isLoading } = useQuery({
    queryKey: ['escalated-settlements'],
    queryFn: async () => {
      const res = await fetch('/api/finance/escalations');
      if (!res.ok) return [];
      return res.json();
    }
  });

  const actionMutation = useMutation({
    mutationFn: async (payload: { batchId: string; action: 'ADJUST' | 'FORCE_RESOLVE'; adjustmentPaise?: number }) => {
      const res = await fetch('/api/finance/escalations', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `Escalation action failed (HTTP ${res.status})`);
      }
      return res.json();
    },
    onSuccess: (_data, vars) => {
      toast.success(
        vars.action === 'FORCE_RESOLVE'
          ? `Batch ${vars.batchId} resolved and queued for T+1 settlement.`
          : `Deductions adjusted for batch ${vars.batchId}.`
      );
      setAdjustingBatchId(null);
      void qc.invalidateQueries({ queryKey: ['escalated-settlements'] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Settlement escalation update failed');
    },
  });

  return (
    <div className="min-h-screen bg-[#07130F] text-slate-100 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <header className="border-b border-rose-500/30 pb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3">
              <span className="text-xs font-black uppercase tracking-wider text-rose-400">ALERT</span> 
              AI Settlement Escalations
            </h1>
            <p className="text-sm text-rose-400 mt-2 max-w-2xl">
              The AI Settlement Engine has mathematically detected deficits in these weekly payouts. 
              Settlement amounts exceeding automated dispute or negative balance thresholds have been held 
              pending administrative verification and statutory reconciliation in accordance with Section 9(5) CGST Act.
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
                <p className="text-emerald-400 font-bold text-lg">Reconciliation Clear</p>
                <p className="text-slate-400 text-sm mt-1">No escalated settlement deficits detected in the current reconciliation cycle. All automated batches are processing within statutory thresholds.</p>
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
                        <p className="text-sm font-bold text-rose-400">AI Reason for Freezing:</p>
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

                  <div className="mt-6 pt-6 border-t border-slate-800 flex flex-wrap items-center justify-end gap-3">
                    {adjustingBatchId === batch.batch_id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={deductionPaise}
                          onChange={(e) => setDeductionPaise(e.target.value)}
                          placeholder="Adjustment (paise)"
                          className="w-40 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white font-mono"
                        />
                        <button
                          type="button"
                          disabled={actionMutation.isPending}
                          onClick={() =>
                            actionMutation.mutate({
                              batchId: batch.batch_id,
                              action: 'ADJUST',
                              adjustmentPaise: Number(deductionPaise) || 0,
                            })
                          }
                          className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                        >
                          Save Adjustment
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdjustingBatchId(null)}
                          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setAdjustingBatchId(batch.batch_id);
                          setDeductionPaise("0");
                        }}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-colors"
                      >
                        Adjust Deductions
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={actionMutation.isPending}
                      onClick={() => actionMutation.mutate({ batchId: batch.batch_id, action: 'FORCE_RESOLVE' })}
                      className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-lg shadow-[0_0_15px_rgba(244,63,94,0.4)] transition-all disabled:opacity-50"
                    >
                      {actionMutation.isPending ? 'Processing...' : 'Force Resolve (Admin)'}
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


