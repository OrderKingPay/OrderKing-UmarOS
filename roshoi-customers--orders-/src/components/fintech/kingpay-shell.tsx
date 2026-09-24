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
        aria-label="KingPay Navigation"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-7 items-center md:max-w-5xl relative px-0.5">
          {/* 1. Pay / Transfer Hub */}
          <li>
            <button
              type="button"
              onClick={() => onSelectSection("pay")}
              className={`flex w-full min-h-14 flex-col items-center justify-center gap-0.5 text-[10px] sm:text-xs transition ${
                activeSection === "pay"
                  ? "text-primary font-bold"
                  : "text-muted hover:text-fg"
              }`}
            >
              <Zap className="size-4.5 sm:size-5" />
              <span className="truncate">Pay</span>
            </button>
          </li>

          {/* 2. Vehicle Garage & Challans */}
          <li>
            <button
              type="button"
              onClick={() => onSelectSection("garage")}
              className={`relative flex w-full min-h-14 flex-col items-center justify-center gap-0.5 text-[10px] sm:text-xs transition ${
                activeSection === "garage"
                  ? "text-primary font-bold"
                  : "text-muted hover:text-fg"
              }`}
            >
              <Car className="size-4.5 sm:size-5" />
              <span className="truncate">Garage</span>
              {alertsCount > 0 && (
                <span className="absolute top-1 right-2 size-2 rounded-full bg-rose-500 animate-ping" />
              )}
            </button>
          </li>

          {/* 3. Micro-Loans & Credit Line */}
          <li>
            <button
              type="button"
              onClick={() => onSelectSection("loan")}
              className={`relative flex w-full min-h-14 flex-col items-center justify-center gap-0.5 text-[10px] sm:text-xs transition ${
                activeSection === "loan"
                  ? "text-cyan-600 dark:text-cyan-400 font-bold"
                  : "text-muted hover:text-fg"
              }`}
            >
              <CreditCard className="size-4.5 sm:size-5" />
              <span className="truncate">Loan</span>
            </button>
          </li>

          {/* 4. CENTER ELEVATED FLOATING SCANNER BUTTON */}
          <li className="relative flex justify-center -top-2.5 sm:-top-3">
            <button
              type="button"
              onClick={onOpenScannerClick}
              className="group flex flex-col items-center no-underline cursor-pointer"
              aria-label="Scan and Pay any QR code"
            >
              {/* Elevated 3D Glowing Circular Button */}
              <div className="relative flex size-11 sm:size-13 items-center justify-center rounded-full bg-gradient-to-tr from-[#0D3B2E] via-emerald-700 to-[#07241C] p-0.5 shadow-[0_6px_20px_rgba(13,59,46,0.45)] ring-3 sm:ring-4 ring-surface transition-all duration-200 group-hover:scale-105 group-active:scale-95 group-hover:shadow-[0_10px_25px_rgba(16,185,129,0.55)]">
                {/* 24K Gold Outer Bezel */}
                <div className="size-full rounded-full border-2 border-amber-400/90 flex items-center justify-center bg-gradient-to-b from-emerald-600/30 to-transparent">
                  {/* Custom High-Recognition QR Scanner Vector Icon */}
                  <svg viewBox="0 0 24 24" className="size-5 sm:size-6 text-white drop-shadow-md" fill="none">
                    <path d="M 3 7 L 3 4 A 1 1 0 0 1 4 3 L 7 3" stroke="#FDE68A" strokeWidth="2.2" strokeLinecap="round" />
                    <path d="M 17 3 L 20 3 A 1 1 0 0 1 21 4 L 21 7" stroke="#FDE68A" strokeWidth="2.2" strokeLinecap="round" />
                    <path d="M 21 17 L 21 20 A 1 1 0 0 1 20 21 L 17 21" stroke="#FDE68A" strokeWidth="2.2" strokeLinecap="round" />
                    <path d="M 7 21 L 4 21 A 1 1 0 0 1 3 20 L 3 17" stroke="#FDE68A" strokeWidth="2.2" strokeLinecap="round" />
                    
                    <rect x="6" y="6" width="4" height="4" rx="0.5" fill="#FFFFFF" />
                    <rect x="14" y="6" width="4" height="4" rx="0.5" fill="#FFFFFF" />
                    <rect x="6" y="14" width="4" height="4" rx="0.5" fill="#FFFFFF" />
                    <circle cx="16" cy="16" r="1.5" fill="#F59E0B" />
                    
                    <line x1="4" y1="12" x2="20" y2="12" stroke="#34D399" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </div>

                <span className="absolute -top-0.5 -right-0.5 flex size-2.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-amber-500" />
                </span>
              </div>
              <span className="mt-0.5 text-[9px] sm:text-[10px] font-black tracking-tight text-emerald-800 dark:text-emerald-300 group-hover:text-primary transition-colors truncate">
                Scan
              </span>
            </button>
          </li>

          {/* 5. Travel & Flight Tickets (Planet's Lowest Price) */}
          <li>
            <button
              type="button"
              onClick={() => onSelectSection("travel")}
              className={`relative flex w-full min-h-14 flex-col items-center justify-center gap-0.5 text-[10px] sm:text-xs transition ${
                activeSection === "travel"
                  ? "text-cyan-600 dark:text-cyan-400 font-bold"
                  : "text-muted hover:text-fg"
              }`}
            >
              <Plane className="size-4.5 sm:size-5" />
              <span className="truncate">Travel</span>
            </button>
          </li>

          {/* 6. Bills & Utilities (BBPS) */}
          <li>
            <button
              type="button"
              onClick={() => onSelectSection("bills")}
              className={`flex w-full min-h-14 flex-col items-center justify-center gap-0.5 text-[10px] sm:text-xs transition ${
                activeSection === "bills"
                  ? "text-primary font-bold"
                  : "text-muted hover:text-fg"
              }`}
            >
              <UtilityPole className="size-4.5 sm:size-5" />
              <span className="truncate">Bills</span>
            </button>
          </li>

          {/* 7. Complete Working My Account Hub */}
          <li>
            <button
              type="button"
              onClick={() => onSelectSection("account")}
              className={`flex w-full min-h-14 flex-col items-center justify-center gap-0.5 text-[10px] sm:text-xs transition ${
                activeSection === "account"
                  ? "text-primary font-bold"
                  : "text-muted hover:text-fg"
              }`}
            >
              <User className="size-4.5 sm:size-5" />
              <span className="truncate">Account</span>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
