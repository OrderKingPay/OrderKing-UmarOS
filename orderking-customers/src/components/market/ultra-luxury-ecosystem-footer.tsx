import { Link } from "@tanstack/react-router";
import {
  Crown,
  Sparkles,
  ShieldCheck,
  Zap,
  UtensilsCrossed,
  CreditCard,
      Wine,
  ArrowRight,
  CheckCircle2,
  Lock,
  Award,
  ChevronRight,
  Coins,
  TrendingUp,
  Plane,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function UltraLuxuryEcosystemFooter({ className }: { className?: string }) {
  return (
    <footer
      className={cn(
        "relative mt-12 w-full overflow-hidden rounded-t-[36px] bg-gradient-to-b from-[#111827] via-[#0B0F19] to-[#030712] px-4 pt-10 pb-28 text-white select-none shadow-[0_-25px_60px_rgba(0,0,0,0.4)] border-t-2 border-amber-500/40",
        className
      )}
    >
      {/* ─── PRISMATIC SPECULAR AURAS ─── */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-400 via-yellow-300 via-amber-400 to-transparent opacity-90 drop-shadow-[0_2px_12px_rgba(245,158,11,0.9)]" />
      
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 size-96 rounded-full bg-gradient-to-br from-amber-500/20 via-emerald-500/10 to-indigo-500/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 size-80 rounded-full bg-gradient-to-tl from-yellow-500/10 via-rose-500/10 to-transparent blur-3xl" />

      <div className="relative mx-auto max-w-lg md:max-w-4xl space-y-8">
        {/* ─── BRAND HEADER & SOVEREIGN SEAL ─── */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/50 bg-gradient-to-r from-amber-950/80 via-yellow-900/60 to-amber-950/80 px-4 py-1.5 shadow-[0_4px_20px_rgba(245,158,11,0.25)] backdrop-blur-md">
            <Crown className="size-4 text-amber-400 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest text-amber-200">
              OrderKing Sovereign Ecosystem
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Direct Merchant Ordering. <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">Direct Pricing &amp; Reliable Delivery.</span>
          </h2>
          <p className="max-w-md text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
            Explore authentic restaurant dining, direct grocery catalogs, and local transport services.
          </p>
        </div>

        {/* ─── 5-SEGMENT 3D INTERACTIVE SOVEREIGN CARDS ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          {/* 1. FOOD GASTRONOMY (3D Gold Cloche & Emerald Jewel) */}
          <Link
            to="/"
            className="group relative overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-br from-slate-900/95 via-slate-900/80 to-amber-950/40 p-4 transition-all duration-300 hover:scale-[1.02] hover:border-amber-300 hover:shadow-[0_12px_32px_rgba(245,158,11,0.35)] no-underline shadow-lg"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 via-emerald-600 to-teal-900 text-white shadow-[0_6px_16px_rgba(16,185,129,0.5),inset_0_1px_2px_rgba(255,255,255,0.9)] group-hover:scale-105 transition-transform">
                <UtensilsCrossed className="size-5" />
              </div>
              <span className="rounded-full bg-gradient-to-r from-emerald-500/25 via-emerald-400/35 to-teal-500/25 border border-emerald-400/70 px-2.5 py-0.5 text-[10px] font-black text-emerald-300 uppercase tracking-wider shadow-2xs">
                👑 Verified Kitchens
              </span>
            </div>
            <div className="mt-3">
              <h3 className="text-sm font-black text-white group-hover:text-amber-300 transition-colors">
                Royal Gastronomy
              </h3>
              <p className="mt-1 text-xs text-slate-300 font-medium leading-snug">
                Curated dining & 100% direct chef handover with real-time temperature tracking at 82°C.
              </p>
            </div>
            <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-amber-400 group-hover:translate-x-1 transition-transform">
              <span>Order food now</span>
              <ArrowRight className="size-3" />
            </div>
          </Link>

          {/* 2. KINGPAY FINTECH (3D Minted Gold Coin) */}
          <Link
            to="/king-pay"
            className="group relative overflow-hidden rounded-2xl border border-amber-400/60 bg-gradient-to-br from-slate-900/95 via-slate-900/80 to-yellow-950/50 p-4 transition-all duration-300 hover:scale-[1.02] hover:border-amber-300 hover:shadow-[0_12px_36px_rgba(245,158,11,0.45)] no-underline shadow-lg"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-300 via-amber-500 to-amber-700 text-slate-950 shadow-[0_6px_16px_rgba(245,158,11,0.6),inset_0_2px_3px_rgba(255,255,255,0.95)] group-hover:scale-105 transition-transform">
                <Crown className="size-5" />
              </div>
              <span className="rounded-full bg-gradient-to-r from-amber-500/30 via-yellow-400/30 to-amber-500/30 border border-amber-400/80 px-2.5 py-0.5 text-[10px] font-black text-amber-200 uppercase tracking-wider shadow-2xs">
                👑 256-Bit UPI
              </span>
            </div>
            <div className="mt-3">
              <h3 className="text-sm font-black text-white group-hover:text-amber-300 transition-colors">
                KingPay Sovereign Wallet
              </h3>
              <p className="mt-1 text-xs text-slate-300 font-medium leading-snug">
                1-tap QR scan, instant bank settlement, authentic double-entry ledger & 24K gold rewards.
              </p>
            </div>
            <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-amber-400 group-hover:translate-x-1 transition-transform">
              <span>Open KingPay Hub</span>
              <ArrowRight className="size-3" />
            </div>
          </Link>

          {/* 3. ROYAL DINING & EXPERIENCES (3D Crystal Goblet & Ruby Jewel) */}
          <Link
            to="/dining"
            className="group relative overflow-hidden rounded-2xl border border-rose-500/40 bg-gradient-to-br from-slate-900/95 via-slate-900/80 to-rose-950/40 p-4 transition-all duration-300 hover:scale-[1.02] hover:border-rose-300 hover:shadow-[0_12px_32px_rgba(244,63,94,0.35)] no-underline shadow-lg"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-rose-400 via-pink-600 to-slate-900 text-white shadow-[0_6px_16px_rgba(244,63,94,0.5),inset_0_1px_2px_rgba(255,255,255,0.9)] group-hover:scale-105 transition-transform">
                <Wine className="size-5" />
              </div>
              <span className="rounded-full bg-gradient-to-r from-rose-500/25 via-rose-400/30 to-pink-500/25 border border-rose-400/70 px-2.5 py-0.5 text-[10px] font-black text-rose-200 uppercase tracking-wider shadow-2xs">
                👑 Instant Booking
              </span>
            </div>
            <div className="mt-3">
              <h3 className="text-sm font-black text-white group-hover:text-rose-300 transition-colors">
                VIP Dining Reserve
              </h3>
              <p className="mt-1 text-xs text-slate-300 font-medium leading-snug">
                Priority table reservations at Michelin-grade & 5-star fine dining destinations with bill discounts.
              </p>
            </div>
            <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-rose-400 group-hover:translate-x-1 transition-transform">
              <span>Reserve VIP table</span>
              <ArrowRight className="size-3" />
            </div>
          </Link>

          {/* 6. REAL-TIME ORDERS & TRACKING (3D Live Compass) */}
          <Link
            to="/orders"
            className="group relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-emerald-950/40 p-4 transition-all duration-300 hover:scale-[1.02] hover:border-emerald-400 hover:shadow-[0_12px_32px_rgba(16,185,129,0.25)] no-underline"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 via-teal-600 to-slate-900 text-white shadow-[0_6px_16px_rgba(16,185,129,0.5),inset_0_1px_2px_rgba(255,255,255,0.9)]">
                <ShieldCheck className="size-5" />
              </div>
              <span className="rounded-full bg-emerald-500/20 border border-emerald-400/40 px-2 py-0.5 text-[10px] font-black text-emerald-300 uppercase tracking-wider">
                Live GPS
              </span>
            </div>
            <div className="mt-3">
              <h3 className="text-sm font-black text-white group-hover:text-emerald-300 transition-colors">
                Passbook & Orders
              </h3>
              <p className="mt-1 text-xs text-slate-400 font-medium leading-snug">
                Sub-second rider GPS tracking, immutable digital invoices & 1-tap reorders.
              </p>
            </div>
            <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-emerald-400 group-hover:translate-x-1 transition-transform">
              <span>View live orders</span>
              <ArrowRight className="size-3" />
            </div>
          </Link>
        </div>

        {/* ─── TRANSPARENCY & VALUE MATRIX ─── */}
        <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-slate-900/90 via-slate-950 to-slate-900/90 p-5 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-3">
            <Award className="size-5 text-amber-400" />
            <span className="text-xs font-black uppercase tracking-wider text-amber-200">
              What to check before you order
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-3">
              <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="size-3.5" />
                <span>Compare menu prices</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-300">
                Check item prices and the complete payable total before confirming.
              </p>
            </div>

            <div className="rounded-2xl border border-sky-500/20 bg-sky-950/20 p-3">
              <div className="text-[11px] font-bold text-sky-400 flex items-center gap-1">
                <CheckCircle2 className="size-3.5" />
                <span>Review travel fees</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-300">
                Fees and availability depend on the actual booking provider.
              </p>
            </div>

            <div className="rounded-2xl border border-amber-500/20 bg-amber-950/20 p-3">
              <div className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                <CheckCircle2 className="size-3.5" />
                <span>Payment confirmation</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-300">
                Payment status is confirmed only after verification by the payment provider.
              </p>
            </div>
          </div>
        </div>

        {/* ─── OFFICIAL REGULATORY & STATUTORY TRUST SEALS ─── */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 pt-4 border-t border-white/10 text-[11px] font-bold text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="size-4 text-emerald-400" />
            <span>Check restaurant details</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Lock className="size-4 text-amber-400" />
            <span>Payment options vary by availability</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Plane className="size-4 text-sky-400" />
            <span>Travel services depend on providers</span>
          </div>
          <div className="flex items-center gap-1.5">
            <GraduationCap className="size-4 text-indigo-400" />
            <span>AI assistance when available</span>
          </div>
        </div>

        {/* ─── SOVEREIGN COPYRIGHT & ATTRIBUTION ─── */}
        <div className="text-center text-[11px] text-slate-500 font-medium">
          © {new Date().getFullYear()} OrderKing Sovereign Group. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
}
