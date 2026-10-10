import { useState } from "react";
import { CheckCircle2, ChevronRight, Copy, Share2, Sparkles } from "lucide-react";
import { toast } from "sonner";

export function GrowthWidget() {
  const [copied, setCopied] = useState(false);
  const inviteLink = "orderking.app/invite/KING500";

  const handleCopy = () => {
    navigator.clipboard.writeText(`https://${inviteLink}`);
    setCopied(true);
    toast.success("Invitation link secured. Awaiting their arrival.");
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-6 my-4 shadow-sm transition-all hover:border-zinc-700">
      {/* Subtle Premium Background Effect */}
      <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-white/5 blur-3xl pointer-events-none"></div>
      
      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-zinc-400" />
            <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-400">
              The Syndicate
            </span>
          </div>
          <h3 className="font-display text-xl font-medium text-white tracking-tight">
            Expand the Empire. <span className="text-zinc-400">Earn ₹500.</span>
          </h3>
          <p className="text-sm text-zinc-500 max-w-sm leading-relaxed">
            Invite peers to experience uncompromising culinary excellence. Upon their first order, a ₹500 credit is deposited directly to your portfolio.
          </p>
        </div>

        <div className="w-full sm:w-auto flex flex-col gap-3 shrink-0">
          <button
            onClick={handleCopy}
            className="group flex items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 transition hover:bg-zinc-800 hover:border-zinc-700 active:scale-95"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-950 border border-zinc-800">
                {copied ? <CheckCircle2 className="size-4 text-white" /> : <Share2 className="size-4 text-zinc-400 group-hover:text-white transition-colors" />}
              </div>
              <div className="flex flex-col items-start">
                <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Your Exclusive Link</span>
                <span className="text-sm font-medium text-white">{inviteLink}</span>
              </div>
            </div>
            <Copy className="size-4 text-zinc-500 group-hover:text-white transition-colors" />
          </button>
          
          <button className="flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-medium text-black transition hover:bg-zinc-200 active:scale-95">
            Share via WhatsApp <ChevronRight className="size-3" />
          </button>
        </div>
      </div>
      
      {/* Progress Bar / Urgency Mechanic */}
      <div className="relative z-10 mt-6 border-t border-zinc-900 pt-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-medium text-zinc-400">Syndicate Status</span>
          <span className="text-xs font-medium text-white">0 / 5 Referrals</span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-900">
          <div className="h-full w-[5%] rounded-full bg-zinc-700"></div>
        </div>
        <p className="mt-2 text-[10px] text-zinc-500">
          Unlock Platinum Delivery (Zero Surge Fees Forever) at 5 successful invitations.
        </p>
      </div>
    </div>
  );
}
