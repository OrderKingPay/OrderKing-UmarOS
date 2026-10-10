import { useState } from "react";
import { CreditCard, Sparkles, Zap, ShieldCheck, Share2, Gem, ArrowRight, TrendingUp, Gift, Briefcase, ChevronRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function KingPayWealthHub() {
  const [activeCard, setActiveCard] = useState<"hdfc" | "sbi" | null>(null);

  return (
    <div className="space-y-6 text-fg p-4 md:p-6 animate-in fade-in zoom-in-95 duration-300">
      
      {/* Header Section */}
      <div className="flex flex-col items-center justify-center text-center space-y-2 mb-8">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-500 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
          <Gem className="size-3.5" /> Premium Financial Services
        </div>
        <h2 className="font-display text-3xl sm:text-4xl font-black text-fg tracking-tight">
          Wealth &amp; <span className="text-amber-500">Privilege</span>
        </h2>
        <p className="text-muted text-sm sm:text-base font-medium max-w-md">
          Unlock exclusive financial products designed for OrderKing royalty. Build wealth, access credit, and earn passive income.
        </p>
      </div>

      {/* 1. Premium Credit Cards Section */}
      <div className="rounded-3xl border border-border bg-gradient-to-br from-surface to-slate-900 overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 right-0 p-34 opacity-5 pointer-events-none">
          <CreditCard className="size-64" />
        </div>
        <div className="p-6 sm:p-8 relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="size-5 text-amber-400" />
            <h3 className="text-xl font-black text-fg">Premium Credit Cards</h3>
          </div>
          <p className="text-sm text-muted mb-6">Pre-approved limits up to ₹10 Lakhs. Lifetime free for top KingPay users.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* HDFC Card */}
            <div 
              className={`rounded-2xl border-2 transition-all cursor-pointer overflow-hidden ${activeCard === "hdfc" ? "border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)] bg-amber-500/5" : "border-border/50 bg-surface-2 hover:border-amber-500/50"}`}
              onClick={() => setActiveCard("hdfc")}
            >
              <div className="p-5 h-full flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-lg font-black text-indigo-400 tracking-wider">HDFC INFINIA</span>
                    <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full">INVITE ONLY</span>
                  </div>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-center gap-2 text-xs text-muted"><CheckCircle2 className="size-3.5 text-emerald-500" /> Unlimited Lounge Access</li>
                    <li className="flex items-center gap-2 text-xs text-muted"><CheckCircle2 className="size-3.5 text-emerald-500" /> 5% Cashback on OrderKing</li>
                    <li className="flex items-center gap-2 text-xs text-muted"><CheckCircle2 className="size-3.5 text-emerald-500" /> Zero Forex Markup</li>
                  </ul>
                </div>
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md font-bold">
                  Apply Now <ArrowRight className="size-4 ml-2" />
                </Button>
              </div>
            </div>

            {/* SBI Card */}
            <div 
              className={`rounded-2xl border-2 transition-all cursor-pointer overflow-hidden ${activeCard === "sbi" ? "border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)] bg-amber-500/5" : "border-border/50 bg-surface-2 hover:border-amber-500/50"}`}
              onClick={() => setActiveCard("sbi")}
            >
              <div className="p-5 h-full flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-lg font-black text-cyan-400 tracking-wider">SBI ELITE</span>
                    <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">PRE-APPROVED</span>
                  </div>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-center gap-2 text-xs text-muted"><CheckCircle2 className="size-3.5 text-emerald-500" /> ₹5,000 Welcome Voucher</li>
                    <li className="flex items-center gap-2 text-xs text-muted"><CheckCircle2 className="size-3.5 text-emerald-500" /> 2.5% Reward Rate</li>
                    <li className="flex items-center gap-2 text-xs text-muted"><CheckCircle2 className="size-3.5 text-emerald-500" /> Free Movie Tickets Monthly</li>
                  </ul>
                </div>
                <Button className="w-full bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl shadow-md font-bold">
                  Claim Card <ArrowRight className="size-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-muted uppercase tracking-wider font-semibold">
            <ShieldCheck className="size-3.5 text-emerald-500" /> Bank-grade security. 100% paperless process.
          </div>
        </div>
      </div>

      {/* 2. Zero-Interest Micro Loans */}
      <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-center gap-6">
        <div className="flex-1 space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-500">
            <Zap className="size-3.5" /> Instant Liquidity
          </div>
          <h3 className="text-2xl font-black text-emerald-400">Zero-Interest Micro Loans</h3>
          <p className="text-sm text-muted">
            Need cash fast? Get up to ₹50,000 instantly credited to your KingPay wallet. Repay in 30 days with <strong className="text-fg">0% interest</strong> and zero hidden fees.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600/80">
              <CheckCircle2 className="size-3.5" /> No Credit Check
            </span>
            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600/80">
              <CheckCircle2 className="size-3.5" /> 60-Second Disbursal
            </span>
            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600/80">
              <CheckCircle2 className="size-3.5" /> RBI Compliant
            </span>
          </div>
        </div>
        <div className="w-full md:w-auto shrink-0">
          <div className="bg-surface rounded-2xl p-5 border border-emerald-500/20 text-center shadow-lg">
            <h4 className="text-xs font-bold text-muted mb-1">Available Limit</h4>
            <div className="text-3xl font-black text-fg mb-4">₹50,000</div>
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-fg font-bold rounded-xl shadow-[0_0_15px_rgba(5,150,105,0.4)] transition-all hover:scale-105 active:scale-95">
              Withdraw Now
            </Button>
          </div>
        </div>
      </div>

      {/* 3. Referral Wealth */}
      <div className="rounded-3xl border border-primary/30 bg-gradient-to-b from-primary/10 to-transparent p-6 sm:p-8 shadow-lg">
        <div className="flex flex-col items-center text-center space-y-4 mb-8">
          <div className="size-16 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30 shadow-[0_0_20px_rgba(var(--primary),0.3)]">
            <TrendingUp className="size-8 text-primary" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-fg mb-2">Referral Wealth Network</h3>
            <p className="text-sm text-muted max-w-md mx-auto">
              Transform your network into net worth. Invite friends to OrderKing and earn lifetime royalties on every transaction they make.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-surface-2/50 border border-border/50 rounded-2xl p-5 text-center">
            <Share2 className="size-6 text-primary mx-auto mb-3" />
            <h4 className="text-sm font-bold text-fg mb-1">1. Invite Friends</h4>
            <p className="text-[10px] text-muted">Share your unique VIP link with your contacts.</p>
          </div>
          <div className="bg-surface-2/50 border border-border/50 rounded-2xl p-5 text-center">
            <Gift className="size-6 text-primary mx-auto mb-3" />
            <h4 className="text-sm font-bold text-fg mb-1">2. Instant Bonus</h4>
            <p className="text-[10px] text-muted">Get ₹500 instantly when they make their first order.</p>
          </div>
          <div className="bg-surface-2/50 border border-border/50 rounded-2xl p-5 text-center">
            <Briefcase className="size-6 text-primary mx-auto mb-3" />
            <h4 className="text-sm font-bold text-fg mb-1">3. Lifetime Royalties</h4>
            <p className="text-[10px] text-muted">Earn 1% cashback on every future purchase they make.</p>
          </div>
        </div>

        <div className="bg-surface rounded-2xl border border-primary/20 p-2 pl-4 flex items-center justify-between">
          <div className="text-xs font-mono font-bold text-muted truncate">
            https://orderking.com/vip/ref_842X9A
          </div>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl ml-2 shadow-md">
            Copy Link
          </Button>
        </div>
      </div>

    </div>
  );
}
