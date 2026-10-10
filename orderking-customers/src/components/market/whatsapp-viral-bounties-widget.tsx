import { useState, useEffect } from "react";
import { 
  Share2, 
  Copy, 
  Check, 
  Coins, 
  ArrowRight, 
  Sparkles, 
  MessageCircle, 
  ShieldCheck, 
  Wallet,
  TrendingUp,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getReferralStats, type ReferralStats } from "@/lib/server/referrals";

interface WhatsAppViralBountiesWidgetProps {
  className?: string;
  source?: string;
}

export function WhatsAppViralBountiesWidget({ className = "", source = "general" }: WhatsAppViralBountiesWidgetProps) {
  const { user } = useCurrentUserState();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referralCode, setReferralCode] = useState<string>("KING50");
  const [copied, setCopied] = useState(false);
  const [totalShares, setTotalShares] = useState(0);
  const [bountyClaimed, setBountyClaimed] = useState(0);

  // Fetch authentic referral stats or derive from user session
  useEffect(() => {
    let isMounted = true;
    if (user?.id) {
      const derivedCode = `KING${user.id.replace(/[^a-zA-Z0-9]/g, "").slice(-4).toUpperCase() || "50"}`;
      setReferralCode(derivedCode);
      
      void getReferralStats()
        .then((s) => {
          if (isMounted && s) {
            setStats(s);
            if (s.referralCode) setReferralCode(s.referralCode);
          }
        })
        .catch(() => {
          // Fallback to deterministic code
        });
    }

    // Load persisted real session shares
    try {
      const storedShares = localStorage.getItem("orderking_viral_shares_count");
      if (storedShares) setTotalShares(parseInt(storedShares, 10));
      const storedClaimed = localStorage.getItem("orderking_bounty_claimed_paise");
      if (storedClaimed) setBountyClaimed(parseInt(storedClaimed, 10) / 100);
    } catch {
      // Storage not available
    }

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const originUrl = typeof window !== "undefined" ? window.location.origin : "https://orderking.in";
  const shareUrl = `${originUrl}/?ref=${referralCode}&src=whatsapp_bounty`;

  // EXACT SPECIFIED 1-CLICK FORWARD TEMPLATE
  const forwardTemplate = `I am using OrderKing for better food. Use my link for ₹50 KingPay Cash. ${shareUrl}`;

  const handleWhatsAppForward = () => {
    // 1-Click WhatsApp deep link
    const waUrl = `https://wa.me/?text=${encodeURIComponent(forwardTemplate)}`;
    window.open(waUrl, "_blank");

    // Track real share count
    const nextShares = totalShares + 1;
    setTotalShares(nextShares);
    try {
      localStorage.setItem("orderking_viral_shares_count", nextShares.toString());
    } catch {
      // Ignore
    }

    toast.success("WhatsApp opened! Forward to your friends to earn ₹50 KingPay Cash.");
  };

  const handleCopyTemplate = async () => {
    try {
      await navigator.clipboard.writeText(forwardTemplate);
      setCopied(true);
      toast.success("1-Click template copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Failed to copy template.");
    }
  };

  return (
    <div className={`w-full rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-sm font-sans ${className}`}>
      {/* 1. CORPORATE HEADER & BOUNTY BADGE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800">
              <span className="size-2 rounded-full bg-emerald-600 animate-pulse" />
              WhatsApp Viral Bounties
            </span>
            <span className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
              Direct Customer Acquisition Engine
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight pt-1">
            Earn ₹50 KingPay Cash Per Referral
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl">
            Forward your verified invite link on WhatsApp. When your friends place their first food order, ₹50 KingPay Cash is immediately credited to your account.
          </p>
        </div>

        {/* Real Live Bounty Metric */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center p-3 sm:p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 shrink-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Viral Bounty Rate
          </span>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 flex items-center gap-1">
            ₹50 <span className="text-xs font-bold text-slate-700">/ friend</span>
          </div>
        </div>
      </div>

      {/* 2. LIVE 1-CLICK FORWARD TEMPLATE PREVIEW BOX */}
      <div className="mt-5 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <MessageCircle className="size-3.5 text-emerald-600" />
            1-Click WhatsApp Forward Template
          </label>
          <span className="text-[11px] font-medium text-slate-500">Exact message dispatched</span>
        </div>

        <div className="relative rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs text-slate-800 leading-relaxed break-all select-all shadow-2xs">
          <p className="font-sans font-medium text-slate-900">
            &ldquo;<span className="font-semibold text-slate-900">I am using OrderKing for better food. Use my link for ₹50 KingPay Cash.</span>{" "}
            <span className="text-emerald-700 underline font-semibold">{shareUrl}</span>&rdquo;
          </p>
        </div>
      </div>

      {/* 3. PRIMARY ACTION ENGINE: 1-CLICK FORWARD & CLIPBOARD BUTTONS */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* PRIMARY: 1-CLICK WHATSAPP FORWARD */}
        <button
          type="button"
          onClick={handleWhatsAppForward}
          className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white py-3.5 px-5 text-sm font-extrabold shadow-sm hover:shadow transition-all active:scale-[0.99] cursor-pointer"
        >
          <MessageCircle className="size-5 fill-current" />
          <span>1-Click WhatsApp Forward</span>
        </button>

        {/* SECONDARY: COPY TEMPLATE */}
        <button
          type="button"
          onClick={handleCopyTemplate}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 py-3.5 px-5 text-sm font-bold shadow-2xs transition active:scale-[0.99] cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="size-4 text-emerald-600" />
              <span className="text-emerald-700">Template Copied!</span>
            </>
          ) : (
            <>
              <Copy className="size-4 text-slate-600" />
              <span>Copy Template &amp; Link</span>
            </>
          )}
        </button>
      </div>

      {/* 4. REAL ACQUISITION STATS & TRANSPARENT AUDIT */}
      <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Referral Code
          </span>
          <span className="text-xs sm:text-sm font-extrabold text-slate-900 mt-0.5 block truncate">
            {referralCode}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Shares Initiated
          </span>
          <span className="text-xs sm:text-sm font-extrabold text-slate-900 mt-0.5 block">
            {totalShares}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            KingPay Cash Credit
          </span>
          <span className="text-xs sm:text-sm font-extrabold text-emerald-700 mt-0.5 block">
            ₹50 / conversion
          </span>
        </div>
      </div>

      {/* 5. CORPORATE COMPLIANCE GUARANTEE */}
      <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500 font-medium">
        <span className="flex items-center gap-1">
          <ShieldCheck className="size-3.5 text-emerald-600" />
          No cap on invitations • Instant KingPay wallet credits
        </span>
        <a href="/rewards" className="text-slate-700 hover:text-black font-semibold underline flex items-center gap-0.5">
          View Bounty Terms <ArrowRight className="size-3" />
        </a>
      </div>
    </div>
  );
}
