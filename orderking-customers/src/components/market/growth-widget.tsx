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
    <div className="relative overflow-hidden rounded-3xl border-2 border-emerald-500/20 bg-zinc-950 p-6 my-4 shadow-2xl transition-all hover:border-emerald-500/40 hover:shadow-emerald-900/20 cursor-pointer">
      {/* Eye-catching premium dynamic background effect */}
      <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-emerald-600/20 blur-[80px] pointer-events-none"></div>
      <div className="absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-cyan-500/20 blur-[80px] pointer-events-none"></div>
      <div className="absolute top-0 right-0 p-4 opacity-10">
         <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
      </div>
      
      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex-1 space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 border border-emerald-500/20">
            <Lock className="size-3.5 text-emerald-400" />
            <span className="text-[11px] font-bold tracking-wide text-emerald-400 uppercase">
              Locked: 0 Delivery Fees
            </span>
          </div>
          <h3 className="text-3xl font-bold text-white tracking-tight leading-tight">
            Force-Unlock <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 drop-shadow-sm">Lifetime Free Delivery</span>
          </h3>
          <p className="text-sm text-zinc-300 max-w-sm leading-relaxed font-medium">
            Invite exactly 3 friends on WhatsApp. The moment they order, your account gets upgraded to Lifetime Free Delivery + ₹500 Cash.
          </p>
        </div>

        <div className="w-full sm:w-auto flex flex-col gap-3 shrink-0">
          <button 
            onClick={handleWhatsAppShare}
            className="group flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4 text-sm font-bold text-white transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] border border-green-400"
          >
            Share on WhatsApp <ChevronRight className="size-4 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <button
            onClick={handleCopy}
            className="group flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition hover:bg-white/10 active:scale-95"
          >
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-start">
                <span className="text-sm font-bold text-zinc-300 tracking-wide">{inviteLink}</span>
              </div>
            </div>
            {copied ? <CheckCircle2 className="size-5 text-emerald-400" /> : <Copy className="size-4 text-zinc-400 group-hover:text-white transition-colors" />}
          </button>
        </div>
      </div>
      
      {/* Viral Progress Engine */}
      <div className="relative z-10 mt-8 border-t border-white/10 pt-5">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
             <Zap className="size-3.5 text-amber-400 fill-amber-400"/> 
             Viral Unlock Engine
          </span>
          <span className="text-xs font-bold text-white tracking-widest uppercase">0 / 3 Friends</span>
        </div>
        <div className="flex gap-2">
           <div className="flex-1 h-3 rounded-full bg-white/5 border border-white/10 overflow-hidden relative">
              {/* <div className="absolute inset-0 bg-emerald-500 w-full animate-pulse"></div> */}
           </div>
           <div className="flex-1 h-3 rounded-full bg-white/5 border border-white/10"></div>
           <div className="flex-1 h-3 rounded-full bg-white/5 border border-white/10"></div>
        </div>
        <p className="mt-3 text-[11px] font-bold text-zinc-400 tracking-wide">
          <span className="text-emerald-400">0%</span> of the way to ruling the empire.
        </p>
      </div>
    </div>
  );
}
