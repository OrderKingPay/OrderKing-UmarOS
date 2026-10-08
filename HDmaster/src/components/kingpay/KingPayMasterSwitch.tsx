import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldAlert, ShieldCheck, Activity, Key, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function KingPayMasterSwitch() {
  const queryClient = useQueryClient();
  
  const { data, isLoading } = useQuery({
    queryKey: ['kingpay-compliance-state'],
    queryFn: async () => {
      const res = await fetch('/api/v1/founder/kingpay-compliance');
      return (await res.json()) as { success: boolean, state: Record<string, boolean> };
    }
  });

  const mutation = useMutation({
    mutationFn: async ({ feature, action }: { feature: string, action: 'activate' | 'deactivate' }) => {
      const res = await fetch('/api/v1/founder/kingpay-compliance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature, action })
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kingpay-compliance-state'] });
    }
  });

  const features = [
    { id: 'upi', label: 'UPI Integration', desc: 'Real-time UPI Payments' },
    { id: 'collect', label: 'Payment Links (Collect)', desc: 'Asynchronous P2M Collect' },
    { id: 'pay', label: 'Direct Pay / Checkout', desc: 'Synchronous Checkout Engine' },
    { id: 'scan', label: 'Scan to Pay (QR)', desc: 'Dynamic QR Code Generation' },
    { id: 'wallet', label: 'KingPay Wallet', desc: 'Prepaid Closed-Loop Wallet' },
    { id: 'recharge', label: 'Wallet Recharge', desc: 'Add funds to wallet' },
    { id: 'autopay', label: 'AutoPay Mandates', desc: 'Recurring e-Mandates' },
    { id: 'settlements', label: 'Merchant Settlements', desc: 'T+1 Nodal Settlements' },
  ];

  if (isLoading || !data) {
    return <div className="p-8 flex justify-center text-slate-400 animate-pulse"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  const state = data.state || {};

  return (
    <div className="bg-[#111] border border-red-900/50 rounded-xl overflow-hidden text-slate-300 w-full max-w-4xl shadow-2xl">
      <div className="bg-red-950/30 p-6 border-b border-red-900/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-red-500 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5" />
            KingPay Regulated Feature Master Switch
          </h2>
          <p className="text-sm text-red-400/80 mt-1 max-w-2xl">
            Strict Regulatory Enforcement Engine. Features are disabled by default requiring explicit Founder Authorization. Non-authorized activation attempts are logged.
          </p>
        </div>
        <Badge variant="outline" className="bg-red-950 text-red-400 border-red-800 uppercase tracking-widest font-mono text-xs py-1 px-3">
          Level 4 Authorization
        </Badge>
      </div>
      
      <div className="p-6 grid gap-4 grid-cols-1 md:grid-cols-2">
        {features.map((feat) => {
          const isActive = state[feat.id] === true;
          
          return (
            <div key={feat.id} className={`p-4 rounded-lg border flex flex-col gap-3 transition-colors ${isActive ? 'bg-green-950/10 border-green-900/30' : 'bg-black/40 border-red-900/20'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    {isActive ? <ShieldCheck className="w-4 h-4 text-green-500" /> : <ShieldAlert className="w-4 h-4 text-red-500" />}
                    <span className={isActive ? 'text-green-400' : 'text-slate-400'}>{feat.label}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">{feat.desc}</p>
                </div>
                
                {isActive ? (
                  <Badge variant="outline" className="bg-green-950 text-green-400 border-green-800 font-mono text-[10px]">
                    LIVE
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-950 text-red-500 border-red-900 font-mono text-[10px] animate-pulse">
                    AWAITING AUTHORIZATION
                  </Badge>
                )}
              </div>
              
              <div className="mt-2 flex justify-end">
                {isActive ? (
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => mutation.mutate({ feature: feat.id, action: 'deactivate' })}
                    disabled={mutation.isPending}
                    className="h-8 text-xs border-red-900/50 hover:bg-red-950 hover:text-red-400 transition-colors"
                  >
                    Revoke Access
                  </Button>
                ) : (
                  <Button 
                    variant="default"
                    size="sm"
                    onClick={() => mutation.mutate({ feature: feat.id, action: 'activate' })}
                    disabled={mutation.isPending}
                    className="h-8 text-xs bg-red-900 hover:bg-red-800 text-white font-mono flex items-center gap-2"
                  >
                    <Key className="w-3 h-3" />
                    AUTHORIZE OVERRIDE
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
