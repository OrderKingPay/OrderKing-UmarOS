import { useState } from "react";
import { CheckCircle2, ChevronRight, Copy, Gift, Sparkles, Zap, Lock, Unlock } from "lucide-react";
import { toast } from "sonner";

export function GrowthWidget() {
  const [copied, setCopied] = useState(false);
  const inviteLink = "orderking.app/KING500";

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://${inviteLink}`);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 3000);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      "Hey! Use my exclusive OrderKing link to get ₹500 free on your first food order. I use it every day. Claim here: https://orderking.app/KING500"
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
    toast.success("WhatsApp opened. Share to secure your unlock!");
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 my-4 shadow-sm transition-all hover:border-slate-300">
      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex-1 space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 border border-emerald-200">
            <Lock className="size-3.5 text-emerald-700" />
            <span className="text-[11px] font-semibold tracking-wide text-emerald-700 uppercase">
              Free Delivery Reward
            </span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">
            Unlock Lifetime Free Delivery
          </h3>
          <p className="text-sm text-slate-600 max-w-sm leading-relaxed">
            Invite 3 colleagues or friends. Once they complete their first order, your account receives Lifetime Free Delivery + ₹500 credits.
          </p>
        </div>

        <div className="w-full sm:w-auto flex flex-col gap-3 shrink-0">
          <button 
            onClick={handleWhatsAppShare}
            className="group flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-6 py-3 text-sm font-semibold text-white transition-all shadow-xs"
          >
            Share on WhatsApp <ChevronRight className="size-4 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <button
            onClick={handleCopy}
            className="group flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 transition hover:bg-slate-100"
          >
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium text-slate-700 tracking-wide">{inviteLink}</span>
              </div>
            </div>
            {copied ? <CheckCircle2 className="size-5 text-emerald-600" /> : <Copy className="size-4 text-slate-400 group-hover:text-slate-600 transition-colors" />}
          </button>
        </div>
      </div>
      
      {/* Referral Progress Indicator */}
      <div className="relative z-10 mt-6 border-t border-slate-100 pt-5">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
             <Zap className="size-3.5 text-amber-500 fill-amber-500"/> 
             Referral Tier Progress
          </span>
          <span className="text-xs font-semibold text-slate-900 tracking-wider uppercase">0 / 3 Referrals</span>
        </div>
        <div className="flex gap-2">
           <div className="flex-1 h-2 rounded-full bg-slate-100 border border-slate-200 overflow-hidden relative">
           </div>
           <div className="flex-1 h-2 rounded-full bg-slate-100 border border-slate-200"></div>
           <div className="flex-1 h-2 rounded-full bg-slate-100 border border-slate-200"></div>
        </div>
        <p className="mt-2.5 text-[11px] text-slate-500">
          <span className="text-emerald-600 font-semibold">0%</span> of referral goal completed.
        </p>
      </div>
    </div>
  );
}
