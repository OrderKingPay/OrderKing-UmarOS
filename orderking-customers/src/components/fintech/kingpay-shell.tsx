
import { type ReactNode, useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, Car, CreditCard, History, Plane, QrCode, ShieldCheck, Sparkles, User, UtilityPole, Wallet, Zap } from "lucide-react";
import { KingPayMark, KingPayWordmark } from "@/components/brand/kingpay-mark";
import { Button } from "@/components/ui/button";

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

      {/* PURE FINTECH DEDICATED 7-TAB BALANCED BOTTOM NAVIGATION BAR */}
      <nav
        aria-label="Back Navigation"
        className="fixed inset-x-0 bottom-6 z-40 flex justify-center px-4"
      >
        <Link
          to="/"
          className="group flex w-full max-w-sm items-center justify-center gap-2 rounded-full border-2 border-amber-400/50 bg-surface/90 px-6 py-3.5 text-sm font-bold text-amber-500 shadow-[0_8px_32px_rgba(245,158,11,0.15)] backdrop-blur-md transition-all hover:scale-105 hover:border-amber-400 hover:bg-surface active:scale-95 no-underline"
        >
          <span className="text-lg leading-none">←</span>
          <span>Back to Order King</span>
        </Link>
      </nav>
    </div>
  );
}
