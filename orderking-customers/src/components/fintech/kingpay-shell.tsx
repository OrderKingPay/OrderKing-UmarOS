
import { type ReactNode, useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { motion, LayoutGroup } from "framer-motion";
import { Bell, Car, CreditCard, History, Plane, QrCode, ShieldCheck, Sparkles, User, UtilityPole, Wallet, Zap, House, ClipboardList, GraduationCap, UserRound } from "lucide-react";
import { KingPayMark, KingPayWordmark } from "@/components/brand/kingpay-mark";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type KingPaySection = "pay" | "garage" | "loan" | "travel" | "bills" | "passbook" | "account" | "wealth";

type Props = {
  children: ReactNode;
  walletBalance: number;
  onAddMoneyClick: () => void;
  onOpenScannerClick: () => void;
  activeSection: KingPaySection;
  onSelectSection: (section: KingPaySection) => void;
  alertsCount?: number;
};

export function KingPayShell({
  children,
  walletBalance,
  onAddMoneyClick,
  onOpenScannerClick,
  activeSection,
  onSelectSection,
  alertsCount = 0,
}: Props) {
  return (
    <LayoutGroup>
    <motion.div layout className="min-h-screen bg-gradient-to-tr from-slate-950 via-[#0a0a0f] to-indigo-950 text-slate-50 flex flex-col antialiased selection:bg-amber-400 selection:text-black">
      {/* PURE FINTECH DEDICATED KINGPAY TOP APP BAR */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 px-4 py-3 backdrop-blur-3xl shadow-2xl">
        <div className="mx-auto flex max-w-lg md:max-w-5xl items-center justify-between gap-3">
          {/* KingPay Brand Identity */}
          <div className="flex items-center gap-2.5">
            <KingPayMark className="size-9 rounded-xl shadow-md" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-black text-lg tracking-tight text-fg leading-none">
                  King<span className="text-amber-500">Pay</span>
                </span>
                <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.2 text-[9px] font-extrabold text-emerald-700 dark:text-emerald-300">
                  NPCI UPI
                </span>
              </div>
              <p className="text-[10px] text-muted leading-tight mt-0.5 flex items-center gap-1">
                <ShieldCheck className="size-3 text-emerald-600" />
                <span>Secure Payments · 256-Bit</span>
              </p>
            </div>
          </div>

          {/* Right Controls: Wallet Balance, Travel Shortcut & Notifications */}
          <div className="flex items-center gap-2">
            {/* Wealth & Affiliate Quick Pill */}
            <button
              type="button"
              onClick={() => onSelectSection("wealth")}
              className={`hidden sm:flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold transition shadow-xs ${
                activeSection === "wealth"
                  ? "border-amber-500/50 bg-amber-500/15 text-amber-500 ring-1 ring-amber-500/30"
                  : "border-border bg-surface-2 text-muted hover:text-fg"
              }`}
            >
              <Sparkles className="size-3.5 text-amber-500" />
              <span>Wealth</span>
              <span className="rounded-full bg-emerald-500/10 text-emerald-500 px-1 py-0.2 text-[9px] font-extrabold">
                Earn
              </span>
            </button>

            {/* Travel / Flights Quick Pill */}
            <button
              type="button"
              onClick={() => onSelectSection("travel")}
              className={`hidden sm:flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold transition shadow-xs ${
                activeSection === "travel"
                  ? "border-cyan-500/50 bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 ring-1 ring-cyan-500/30"
                  : "border-border bg-surface-2 text-muted hover:text-fg"
              }`}
            >
              <Plane className="size-3.5 text-cyan-500" />
              <span>Travel</span>
              <span className="rounded-full bg-[#D4AF37]/10 text-emerald-600 dark:text-emerald-300 px-1 py-0.2 text-[9px] font-extrabold">
                ₹0 Fee
              </span>
            </button>

            {/* Wallet Balance Pill */}
            <div className="flex items-center gap-1.5 rounded-full border border-amber-400/60 bg-amber-500/10 px-2.5 py-1 text-xs shadow-xs">
              <Wallet className="size-3.5 text-amber-600 dark:text-amber-400" />
              <span className="font-mono font-bold text-fg">
                ₹{walletBalance.toLocaleString("en-IN")}.00
              </span>
              <button
                type="button"
                onClick={onAddMoneyClick}
                className="rounded-full bg-primary px-1.5 py-0.2 text-[9px] font-bold text-fg hover:bg-primary/90 transition"
              >
                + Add
              </button>
            </div>

            {/* Notification Bell with Badge */}
            <button
              type="button"
              onClick={() => onSelectSection("garage")}
              className="relative rounded-full p-2 text-muted hover:bg-surface-2 transition"
              title="Alerts & Dues"
              aria-label="View Pending Dues and Alerts"
            >
              <Bell className="size-4.5" />
              {alertsCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-rose-600 text-[9px] font-bold text-fg shadow-xs animate-pulse">
                  {alertsCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* MAIN FINTECH CONTENT AREA */}
      <main className="flex-1 pb-24">{children}</main>

      {/* ULTRA-LUXURIOUS STICKY BOTTOM NAVIGATION BAR */}
      <nav
        aria-label="App Navigation"
        className="fixed bottom-0 left-0 right-0 w-full z-50 bg-slate-950/95 backdrop-blur-2xl border-t border-amber-500/30 shadow-[0_-12px_40px_rgba(0,0,0,0.6)] pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      >
        {/* Subtle Gold Ambient Sheen Beam */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent pointer-events-none" />

        <ul className="mx-auto grid max-w-lg grid-cols-5 items-end justify-items-center relative px-2 pt-2">
          {/* 1. Delivery / Food */}
          <NavItem to="/" icon={House} label="Delivery" active={false} />

          {/* 2. Tutor & Jobs */}
          <NavItem to="/tutor" icon={GraduationCap} label="Tutor & Jobs" active={false} />

          {/* 3. CENTER ELEVATED JEWEL: ← Back to Order King Food */}
          <li className="w-full flex justify-center">
            <Link
              to="/"
              className="flex flex-col items-center justify-center no-underline relative transition-all -mt-4 sm:-mt-5 group"
              title="Back to Order King Food"
            >
              <div className="relative p-[2.5px] rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-300 to-yellow-200 shadow-[0_6px_20px_rgba(245,158,11,0.45)] transition-all duration-300 group-hover:scale-105 group-active:scale-95">
                <div className="flex size-11 sm:size-12 items-center justify-center rounded-[13px] bg-gradient-to-b from-gray-950 via-slate-900 to-black text-amber-300 shadow-inner">
                  <span className="text-xl sm:text-2xl filter drop-shadow-[0_2px_6px_rgba(245,158,11,0.6)]">
                    🍔
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-center mt-1">
                <span className="text-[10px] sm:text-[11px] font-black tracking-tight text-amber-400 group-hover:text-amber-200 flex items-center gap-0.5">
                  <span>←</span>
                  <span>Food</span>
                </span>
              </div>
            </Link>
          </li>

          {/* 4. Orders */}
          <NavItem to="/orders" icon={ClipboardList} label="Orders" active={false} />

          {/* 5. Travel & Bookings */}
          <NavItem to="/travel" icon={Plane} label="Travel" active={activeSection === "travel"} />
        </ul>
      </nav>
    </motion.div>
    </LayoutGroup>
  );
}

function NavItem({
  to,
  icon: Icon,
  label,
  active,
}: {
  to: string;
  icon: typeof House;
  label: string;
  active: boolean;
}) {
  return (
    <li className="w-full flex justify-center py-2">
      <Link
        to={to}
        className={cn(
          "flex flex-col items-center justify-center gap-1 text-[10px] sm:text-xs no-underline relative transition-colors",
          active ? "text-amber-400 font-bold" : "text-slate-400 hover:text-slate-200 font-medium",
        )}
      >
        <div className="relative flex items-center justify-center h-6 w-6">
          <Icon className={cn("size-5 sm:size-5.5 transition-transform", active && "scale-110")} aria-hidden />
        </div>
        <span className="text-center truncate w-full px-0.5">{label}</span>
      </Link>
    </li>
  );
}
