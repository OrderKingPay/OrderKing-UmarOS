import { useState, useEffect } from "react";
import { 
  Users, 
  Gift, 
  Sparkles, 
  Zap, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  Copy, 
  ChevronRight, 
  Clock, 
  Flame, 
  Share2, 
  Crown,
  Trophy,
  ArrowRight
} from "lucide-react";
import { toast } from "sonner";

interface ReferralGamifiedLoopProps {
  className?: string;
  source?: "home" | "checkout" | "restaurant" | "rewards";
  compact?: boolean;
}

const PEER_ACTIVITIES = [
  { name: "Rahul S.", city: "Karimganj", action: "cashed out ₹500 to UPI", time: "2m ago" },
  { name: "Priya D.", city: "Silchar", action: "unlocked Lifetime Free Delivery", time: "4m ago" },
  { name: "Aman K.", city: "Sribhumi", action: "shared on WhatsApp (1 step to ₹500)", time: "6m ago" },
  { name: "Sneha B.", city: "Badarpur", action: "received ₹500 KingPay bonus", time: "9m ago" },
  { name: "Vikram R.", city: "Hailakandi", action: "completed 3/3 friend loop", time: "11m ago" },
];

export function ReferralGamifiedLoop({
  className = "",
  source = "home",
  compact = false,
}: ReferralGamifiedLoopProps) {
  const [copied, setCopied] = useState(false);
  const [activeStep, setActiveStep] = useState(1); // 1, 2, or 3
  const [tickerIndex, setTickerIndex] = useState(0);
  const [scratched, setScratched] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ hours: 11, minutes: 42, seconds: 19 });

  const inviteCode = "KING500";
  const inviteLink = `https://orderking.app/earn?ref=${inviteCode}`;

  // Countdown timer for psychological urgency & loss aversion
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Peer activity ticker
  useEffect(() => {
    const ticker = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % PEER_ACTIVITIES.length);
    }, 3800);
    return () => clearInterval(ticker);
  }, []);

  const handleCopy = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast.success("Referral Link Copied! Share in your WhatsApp groups.");
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleWhatsAppShare = () => {
    const message = encodeURIComponent(
      `👑 OrderKing is giving ₹500 instant cash for food orders right now! 🍔🍕\n\nUse my exclusive VIP link to claim your ₹500 welcome bonus on your first meal: ${inviteLink}\n\nFast delivery, zero surge fees, and free food! Claim before daily limit resets! 🚀`
    );
    window.open(`https://wa.me/?text=${message}`, "_blank", "noopener,noreferrer");
    toast.success("WhatsApp opened! Send to friends to secure your ₹500 unlock.");
  };

  const handleScratch = () => {
    if (!scratched) {
      setScratched(true);
      toast.success("🎉 Mystery Reward Unlocked: 2X Boost Multiplier Active for 24h!");
    }
  };

  const currentPeer = PEER_ACTIVITIES[tickerIndex];

  return (
    <div className={`relative overflow-hidden rounded-3xl border-2 border-emerald-500/30 bg-gradient-to-b from-zinc-950 via-zinc-900 to-black p-5 sm:p-7 shadow-[0_0_50px_rgba(16,185,129,0.15)] ${className}`}>
      {/* Background glow flares */}
      <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-emerald-600/20 blur-[90px] pointer-events-none" />
      <div className="absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-amber-500/15 blur-[90px] pointer-events-none" />
      
      {/* Real-time FOMO / Social Proof Ticker */}
      <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-3 mb-5 text-[11px]">
        <div className="flex items-center gap-2 overflow-hidden text-zinc-300">
          <span className="flex size-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
          <span className="font-bold text-white shrink-0">Live Claims:</span>
          <span className="truncate transition-all duration-500 text-zinc-300">
            <strong className="text-emerald-400">{currentPeer.name}</strong> ({currentPeer.city}) {currentPeer.action} • <span className="text-zinc-500">{currentPeer.time}</span>
          </span>
        </div>
        <div className="flex items-center gap-1 text-amber-400 shrink-0 font-mono font-bold text-[10px] bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
          <Clock className="size-3" />
          <span>{String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}</span>
        </div>
      </div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
        {/* Left Column: Psychological Hook & Gamified Loop */}
        <div className="flex-1 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 border border-emerald-500/30">
            <Gift className="size-3.5 text-emerald-400" />
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400">
              Refer a Friend, Get ₹500 Gamified Loop
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
            Invite 3 Friends on WhatsApp <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300">
              Unlock ₹500 Cash + Lifetime Free Delivery
            </span>
          </h2>

          <p className="text-xs sm:text-sm text-zinc-300 max-w-lg leading-relaxed">
            Give ₹500, Get ₹500. Every time a friend orders using your WhatsApp deep link, you instantly unlock cash milestones deposited directly into your KingPay balance.
          </p>

          {/* Gamified 3-Step Milestone Ladder */}
          <div className="pt-2 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
              <span className="flex items-center gap-1.5">
                <Zap className="size-3.5 text-amber-400 fill-amber-400" />
                <span>Your Referral Progress:</span>
              </span>
              <span className="font-mono text-emerald-400">
                {activeStep === 1 ? "1 / 3 Friends (33%)" : activeStep === 2 ? "2 / 3 Friends (66%)" : "3 / 3 Friends (100% UNLOCKED)"}
              </span>
            </div>

            {/* Segmented Milestone Progress Bar */}
            <div className="grid grid-cols-3 gap-2">
              {/* Step 1 */}
              <div 
                onClick={() => setActiveStep(1)}
                className={`cursor-pointer rounded-xl p-2.5 border transition-all ${
                  activeStep >= 1 
                    ? "border-emerald-500/50 bg-emerald-950/40 shadow-sm" 
                    : "border-white/10 bg-white/5"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-zinc-400">STEP 1</span>
                  <CheckCircle2 className="size-3 text-emerald-400" />
                </div>
                <p className="text-xs font-bold text-white">₹150 Cash</p>
                <p className="text-[10px] text-zinc-400">+ 30d Free Delivery</p>
              </div>

              {/* Step 2 */}
              <div 
                onClick={() => setActiveStep(2)}
                className={`cursor-pointer rounded-xl p-2.5 border transition-all ${
                  activeStep >= 2 
                    ? "border-emerald-500/50 bg-emerald-950/40 shadow-sm" 
                    : "border-white/10 bg-white/5"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-zinc-400">STEP 2</span>
                  {activeStep >= 2 ? <CheckCircle2 className="size-3 text-emerald-400" /> : <Lock className="size-3 text-zinc-500" />}
                </div>
                <p className="text-xs font-bold text-white">₹350 Cash</p>
                <p className="text-[10px] text-zinc-400">+ 20% Extra Cashback</p>
              </div>

              {/* Step 3 - Jackpot */}
              <div 
                onClick={() => setActiveStep(3)}
                className={`cursor-pointer rounded-xl p-2.5 border transition-all ${
                  activeStep >= 3 
                    ? "border-amber-500/60 bg-amber-950/40 shadow-md" 
                    : "border-white/10 bg-white/5"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-amber-400">JACKPOT</span>
                  <Crown className="size-3 text-amber-400" />
                </div>
                <p className="text-xs font-bold text-amber-300">₹500 Cash</p>
                <p className="text-[10px] text-amber-400/80">Lifetime VIP Pass</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Actions & Mystery Scratch Box */}
        <div className="w-full md:w-80 space-y-3 shrink-0">
          {/* Main Viral CTA: WhatsApp Deep Link Share */}
          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="w-full group flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 px-5 py-4 text-sm font-bold text-white shadow-[0_0_30px_rgba(16,185,129,0.35)] hover:shadow-[0_0_40px_rgba(16,185,129,0.55)] transition-all hover:scale-[1.02] active:scale-95 cursor-pointer border border-green-400/50"
          >
            <svg className="size-5 fill-current" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.888 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.004c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            <span>Share on WhatsApp to Unlock ₹500</span>
            <ChevronRight className="size-4 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Copy Code / Direct Link */}
          <button
            type="button"
            onClick={handleCopy}
            className="w-full flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-white/10 transition active:scale-95 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">Code:</span>
              <span className="font-mono font-bold text-white tracking-wider">{inviteCode}</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400">
              {copied ? <CheckCircle2 className="size-4" /> : <Copy className="size-3.5" />}
              <span>{copied ? "Copied" : "Copy Link"}</span>
            </div>
          </button>

          {/* Gamified Mystery Multiplier Scratch Box */}
          <div 
            onClick={handleScratch}
            className={`cursor-pointer rounded-2xl border border-dashed transition-all p-3 text-center ${
              scratched 
                ? "border-amber-400/50 bg-amber-500/10 text-amber-300" 
                : "border-white/20 bg-white/5 hover:border-amber-400/40 hover:bg-white/10"
            }`}
          >
            {scratched ? (
              <div className="space-y-0.5 animate-in fade-in zoom-in-95 duration-200">
                <span className="text-base">🎉</span>
                <p className="text-xs font-bold text-amber-300">2X Boost Multiplier Activated!</p>
                <p className="text-[10px] text-zinc-400">Next WhatsApp friend referral grants double King Coins.</p>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-zinc-300">
                <Sparkles className="size-4 text-amber-400 animate-pulse" />
                <span className="text-xs font-bold">Tap to Scratch Daily 2X Multiplier</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Psychological Loss Aversion Footer Banner */}
      <div className="relative z-10 mt-5 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-400">
        <span className="flex items-center gap-1.5">
          <Flame className="size-3.5 text-rose-400" />
          <span>High Demand: Referral budget resets tonight at 12:00 AM</span>
        </span>
        <span className="text-zinc-500 font-medium">
          Zero-risk · Instant KingPay wallet credits · Real food cash
        </span>
      </div>
    </div>
  );
}
