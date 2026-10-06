
import { type ReactNode, useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, Car, CreditCard, History, Plane, QrCode, ShieldCheck, Sparkles, User, UtilityPole, Wallet, Zap, House, ClipboardList, GraduationCap, UserRound } from "lucide-react";
import { KingPayMark, KingPayWordmark } from "@/components/brand/kingpay-mark";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type KingPaySection = "pay" | "garage" | "loan" | "travel" | "bills" | "passbook" | "account";

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
    <div className="min-h-screen bg-bg text-fg flex flex-col antialiased selection:bg-amber-400 selection:text-black">
      {/* PURE FINTECH DEDICATED KINGPAY TOP APP BAR */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-surface/95 px-4 py-3 backdrop-blur-md shadow-xs">
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
                <span>RBI Escrow Protected · 256-Bit</span>
              </p>
            </div>
          </div>

          {/* Right Controls: Wallet Balance, Travel Shortcut & Notifications */}
          <div className="flex items-center gap-2">
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
              <span>Flights &amp; Travel</span>
              <span className="rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 px-1 py-0.2 text-[9px] font-extrabold">
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
                className="rounded-full bg-primary px-1.5 py-0.2 text-[9px] font-bold text-white hover:bg-primary/90 transition"
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
                <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-rose-600 text-[9px] font-bold text-white shadow-xs animate-pulse">
                  {alertsCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* MAIN FINTECH CONTENT AREA */}
      <main className="flex-1 pb-24">{children}</main>

      {/* Massive distinct Back button */}
      <div className="fixed inset-x-0 bottom-24 z-40 flex justify-center px-4 pointer-events-none">
        <Link
          to="/"
          className="pointer-events-auto group flex w-full max-w-sm items-center justify-center gap-2 rounded-full border-2 border-amber-400/50 bg-amber-500 text-black px-6 py-4 text-base font-black shadow-[0_8px_32px_rgba(245,158,11,0.4)] backdrop-blur-md transition-all hover:scale-105 active:scale-95 no-underline"
        >
          <span className="text-xl leading-none">←</span>
          <span>Back to Order King Food</span>
        </Link>
      </div>

      {/* STANDARD BOTTOM NAVIGATION BAR */}
      <nav
        aria-label="App Navigation"
        className="fixed bottom-4 left-4 right-4 z-40 rounded-3xl border border-black/5 bg-white/80 pb-0 backdrop-blur-lg shadow-[0_8px_32px_rgba(0,0,0,0.08)] overflow-hidden"
      >
        <ul className="mx-auto grid grid-cols-5 items-center justify-items-center relative px-2">
          <NavItem to="/" icon={House} label="Home" active={false} />
          <NavItem to="/orders" icon={ClipboardList} label="Orders" active={false} />
          
          <li className="relative -top-2 flex w-full justify-center">
            <Link
              to="/king-pay"
              className="group relative flex h-12 w-12 flex-col items-center justify-center gap-0.5 rounded-full border-2 border-amber-400 bg-gradient-to-br from-amber-400 to-yellow-600 text-white shadow-[0_0_15px_rgba(251,191,36,0.4)] text-xs no-underline transition-all active:scale-95"
            >
              <span className="text-lg leading-none">👑</span>
              <span className="text-[8px] font-black tracking-tight leading-none">KingPay</span>
            </Link>
          </li>
          <NavItem to="/tutor" icon={GraduationCap} label="AI Tutor" active={false} />
          <NavItem to="/account" icon={UserRound} label="Profile" active={false} />
        </ul>
      </nav>
    </div>
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
          active ? "text-primary font-bold" : "text-slate-500 hover:text-slate-700 font-medium",
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
