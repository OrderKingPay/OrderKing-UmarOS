import { useState } from "react";
import { CheckCircle2, ChevronRight, Copy, Gift, Share2, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";

export function GrowthWidget() {
  const [copied, setCopied] = useState(false);
  const inviteLink = "orderking.app/invite/KING500";

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://${inviteLink}`);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 p-6 my-4 shadow-xl transition-all">
      {/* Eye-catching premium dynamic background effect */}
      <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-blue-600/20 blur-[80px] pointer-events-none"></div>
      <div className="absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-emerald-500/20 blur-[80px] pointer-events-none"></div>
      
      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex-1 space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 border border-white/10">
            <Gift className="size-3.5 text-white" />
            <span className="text-[11px] font-bold tracking-wide text-white">
              REFERRAL REWARD
            </span>
          </div>
          <h3 className="text-3xl font-bold text-white tracking-tight leading-tight">
            Invite Friends. <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Earn ₹500 instantly.</span>
          </h3>
          <p className="text-sm text-zinc-400 max-w-sm leading-relaxed font-medium">
            When your friend places their first order, both of you receive ₹500 in your wallet. No hidden terms.
          </p>
        </div>

        <div className="w-full sm:w-auto flex flex-col gap-3 shrink-0">
          <button
            onClick={handleCopy}
            className="group flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 transition hover:bg-white/10 active:scale-95"
          >
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-start">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Your Invite Link</span>
                <span className="text-sm font-bold text-white tracking-wide">{inviteLink}</span>
              </div>
            </div>
            {copied ? <CheckCircle2 className="size-5 text-emerald-400" /> : <Copy className="size-5 text-zinc-400 group-hover:text-white transition-colors" />}
          </button>
          
          <button className="flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3.5 text-sm font-bold text-black transition hover:bg-zinc-200 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
            Share on WhatsApp <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
      
      {/* Progress Bar / Urgency Mechanic */}
      <div className="relative z-10 mt-8 border-t border-white/10 pt-5">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5"><Zap className="size-3.5 text-amber-400"/> Milestone Progress</span>
          <span className="text-xs font-bold text-white">0 / 5 Invites</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/5 border border-white/10">
          <div className="h-full w-[5%] rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"></div>
        </div>
        <p className="mt-2.5 text-[11px] font-medium text-zinc-400">
          Reach 5 invites to unlock <strong className="text-white">Lifetime Free Delivery</strong>.
        </p>
      </div>
    </div>
  );
}
