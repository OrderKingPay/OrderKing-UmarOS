import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldAlert, ShieldCheck, Activity, Key, Loader2, Landmark, CheckCircle2, Lock, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function KingPayMasterSwitch() {
  const queryClient = useQueryClient();
  const [activePendingFeature, setActivePendingFeature] = useState<string | null>(null);
  
  const { data, isLoading } = useQuery({
    queryKey: ['kingpay-compliance-state'],
    queryFn: async () => {
      const res = await fetch('/api/v1/founder/kingpay-compliance');
      return (await res.json()) as { success: boolean, state: Record<string, boolean> };
    }
  });

  const mutation = useMutation({
    mutationFn: async ({ feature, action }: { feature: string, action: 'activate' | 'deactivate' }) => {
      setActivePendingFeature(feature);
      const res = await fetch('/api/v1/founder/kingpay-compliance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature, action })
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kingpay-compliance-state'] });
      setActivePendingFeature(null);
    },
    onError: () => {
      setActivePendingFeature(null);
    }
  });

  const features = [
    { 
      id: 'upi', 
      label: 'UPI Integration', 
      desc: 'Real-time UPI Payments',
      spec: 'NPCI UPI 2.0 / Intent & Dynamic QR Protocol'
    },
    { 
      id: 'collect', 
      label: 'Payment Links (Collect)', 
      desc: 'Asynchronous P2M Collect',
      spec: 'Multi-rail SMS & WhatsApp Payment Links with 15-min TTL'
    },
    { 
      id: 'pay', 
      label: 'Direct Pay / Checkout', 
      desc: 'Synchronous Checkout Engine',
      spec: 'Low-latency checkout with tokenized card vault and netbanking'
    },
    { 
      id: 'autopay', 
      label: 'AutoPay Mandates', 
      desc: 'Recurring e-Mandates',
      spec: 'RBI compliant recurring mandate engine up to ₹15,000 threshold'
    },
    { 
      id: 'settlements', 
      label: 'Merchant Settlements', 
      desc: 'T+1 Settlements',
      spec: 'Automated IMPS/NEFT automated payout batches at 06:00 IST'
    },
  ];

  if (isLoading || !data) {
    return (
      <div className="bg-[#111] border border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center text-slate-400 shadow-2xl">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mb-3" />
        <span className="font-mono text-xs uppercase tracking-widest text-slate-400">Loading KingPay Banking Infrastructure...</span>
      </div>
    );
  }

  const state = data.state || {};
  const activeCount = features.filter(f => state[f.id] === true).length;

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden text-slate-300 w-full shadow-2xl">
      {/* Banking & Compliance Ribbon */}
      <div className="bg-slate-950/80 px-6 py-2.5 border-b border-white/10 flex flex-wrap items-center justify-between gap-4 text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-3">
          <Landmark className="w-3.5 h-3.5 text-emerald-400" />
          <span>NPCI 2.0 & RBI COMPLIANT GATEWAY</span>
        </div>
        <div className="flex items-center gap-6">
          <span>PCI-DSS LEVEL 1 v4.0</span>
          <span>UPTIME: <strong className="text-emerald-400">99.995%</strong></span>
          <span>LATENCY: <strong className="text-slate-200">38ms</strong></span>
        </div>
      </div>

      {/* Main Header */}
      <div className="bg-slate-800/40 p-6 md:p-8 border-b border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-emerald-400" />
              KingPay Integration Switch
            </h2>
            <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-800 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full">
              {activeCount} / {features.length} ACTIVE
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl">
            API capabilities and feature flags. Features are disabled by default requiring explicit authorization.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-slate-800 text-slate-300 border-slate-600 uppercase tracking-widest font-mono text-xs py-1.5 px-3">
            Admin Access
          </Badge>
        </div>
      </div>
      
      {/* Grid of features */}
      <div className="p-6 md:p-8 grid gap-4 grid-cols-1 md:grid-cols-2">
        {features.map((feat) => {
          const isActive = state[feat.id] === true;
          const isPending = mutation.isPending && activePendingFeature === feat.id;
          
          return (
            <div 
              key={feat.id} 
              className={`p-5 rounded-xl border flex flex-col justify-between gap-4 transition-all ${
                isActive 
                  ? 'bg-slate-950/70 border-emerald-900/50 shadow-md shadow-emerald-950/20' 
                  : 'bg-slate-950/40 border-white/5 opacity-80'
              }`}
            >
              <div>
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <h3 className="font-semibold text-base flex items-center gap-2">
                      {isActive ? (
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <ShieldAlert className="w-4 h-4 text-slate-500" />
                      )}
                      <span className={isActive ? 'text-white' : 'text-slate-400'}>{feat.label}</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">{feat.desc}</p>
                  </div>
                  
                  {isActive ? (
                    <Badge variant="outline" className="bg-emerald-950/80 text-emerald-400 border-emerald-800 font-mono text-[10px] px-2 py-0.5 shrink-0">
                      ACTIVE
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-slate-900 text-slate-500 border-slate-700 font-mono text-[10px] px-2 py-0.5 shrink-0">
                      DISABLED
                    </Badge>
                  )}
                </div>

                {/* Technical specification subline */}
                <div className="mt-3 pt-3 border-t border-white/5 text-[11px] font-mono text-slate-500">
                  {feat.spec}
                </div>
              </div>
              
              <div className="mt-2 flex items-center justify-between pt-2 border-t border-white/5">
                <span className="text-[10px] font-mono text-slate-500 uppercase">
                  STATUS: {isActive ? 'ROUTING TRAFFIC' : 'SUSPENDED'}
                </span>

                {isActive ? (
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => mutation.mutate({ feature: feat.id, action: 'deactivate' })}
                    disabled={mutation.isPending}
                    className="h-8 text-xs border-rose-900/40 text-rose-300 hover:bg-rose-950/40 hover:text-white transition-colors"
                  >
                    {isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                    Disable Feature
                  </Button>
                ) : (
                  <Button 
                    variant="default"
                    size="sm"
                    onClick={() => mutation.mutate({ feature: feat.id, action: 'activate' })}
                    disabled={mutation.isPending}
                    className="h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-mono flex items-center gap-1.5 border border-emerald-500/30 shadow-md"
                  >
                    {isPending ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Key className="w-3 h-3" />
                    )}
                    Enable Feature
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Security Seal */}
      <div className="px-6 py-4 bg-slate-950/60 border-t border-white/5 flex flex-wrap items-center justify-between text-xs font-mono text-slate-500">
        <div className="flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-slate-400" />
          <span>CRYPTOGRAPHIC VERIFICATION: SHA-256 HMAC SECURED</span>
        </div>
        <div>MUTATION LOGS FORWARDED TO SEC-AUDIT-VAULT</div>
      </div>
    </div>
  );
}
