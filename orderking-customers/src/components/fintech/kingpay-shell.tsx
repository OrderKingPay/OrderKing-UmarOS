
import { type ReactNode, useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, Car, CreditCard, Crown, History, Plane, PlusCircle, QrCode, ShieldCheck, Search, Sparkles, User, UtilityPole, Wallet, Zap } from "lucide-react";
import { KingPayMark, KingPayWordmark } from "@/components/brand/kingpay-mark";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DeviceAvatar } from "@/components/common/device-avatar";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useRealKingPayWallet } from "@/lib/hooks/use-real-kingpay-wallet";
import { CustomerFloatingBottomNav } from "@/components/navigation/floating-bottom-nav";
import { ErrorBoundary } from "@/components/error-boundary";
import { formatPaise } from "@/lib/money";

export type KingPaySection = "pay" | "garage" | "loan" | "travel" | "bills" | "passbook" | "account" | "wealth";

type Props = {
  children: ReactNode;
  walletBalance?: number;
  onAddMoneyClick: () => void;
  onOpenScannerClick: () => void;
  activeSection: KingPaySection;
  onSelectSection: (section: KingPaySection) => void;
  alertsCount?: number;
};

export function KingPayShell({
  children,
  walletBalance: explicitWalletBalance,
  onAddMoneyClick,
  onOpenScannerClick,
  activeSection,
  onSelectSection,
  alertsCount = 0,
}: Props) {
  const { walletBalancePaise: liveWalletBalancePaise } = useRealKingPayWallet();
  const walletBalance = explicitWalletBalance !== undefined ? explicitWalletBalance : liveWalletBalancePaise;
  const [serviceQuery, setServiceQuery] = useState("");
  const { user, isPending } = useCurrentUserState();
  const searchableFeatures: { label: string; keywords: string; section: KingPaySection }[] = [
    { label: "Pay & Transfer (UPI / QR)", keywords: "pay send money transfer upi qr scan", section: "pay" },
    { label: "Bills & Utility Recharges", keywords: "electricity water dth broadband mobile gas lpg bill", section: "bills" },
    { label: "Garage & FASTag", keywords: "car bike vehicle fastag toll insurance challan", section: "garage" },
    { label: "Credit & Pay Later", keywords: "loan credit bnpl emi limit", section: "loan" },
    { label: "Passbook & Statement", keywords: "history passbook ledger entries statement", section: "passbook" },
    { label: "Wealth & Rewards", keywords: "wealth features products crown rewards", section: "wealth" },
    { label: "Account & Security", keywords: "profile details kyc bank settings", section: "account" },
    { label: "Travel & Bookings", keywords: "flights trains hotels travel booking", section: "travel" },
  ];
  const matchedFeatures = searchableFeatures.filter((feature) =>
    (feature.label + " " + feature.keywords)
      .toLocaleLowerCase()
      .includes(serviceQuery.trim().toLocaleLowerCase())
  );

  useEffect(() => {
    if (typeof document !== "undefined") {
      const prevHtmlBg = document.documentElement.style.backgroundColor;
      const prevBodyBg = document.body.style.backgroundColor;
      document.documentElement.style.transition = "background-color 0.25s ease";
      document.body.style.transition = "background-color 0.25s ease";
      document.documentElement.style.backgroundColor = "#0a0a0f";
      document.body.style.backgroundColor = "#0a0a0f";
      return () => {
        document.documentElement.style.backgroundColor = prevHtmlBg || "#FCFAF7";
        document.body.style.backgroundColor = prevBodyBg || "#FCFAF7";
      };
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-tr from-slate-950 via-[#0a0a0f] to-indigo-950 text-slate-50 flex flex-col antialiased selection:bg-amber-400 selection:text-black pb-24">
      {/* PURE FINTECH DEDICATED KINGPAY TOP APP BAR */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 px-4 py-3 backdrop-blur-3xl shadow-2xl">
        <div className="mx-auto flex max-w-lg flex-wrap items-center justify-between gap-3 md:max-w-5xl">
          {/* KingPay Brand Identity */}
          <div className="flex items-center gap-2.5">
            <KingPayMark className="size-8 rounded-xl shadow-md" />
            <div className="flex items-center gap-1.5">
              <span className="font-display font-black text-lg tracking-tight text-fg leading-none">
                King<span className="text-amber-500">Pay</span>
              </span>
              <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                Fintech Hub
              </span>
            </div>
          </div>

          {/* Right Controls: Wallet Balance, Travel Shortcut & Notifications */}
          <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
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
                Explore
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
                Check terms
              </span>
            </button>

            {/* Hide QR scan and wallet top-up until provider authorization is verified. Original controls retained. */}
            {false && (
              <>
            {/* Scan QR Quick Action */}
            <button
              type="button"
              onClick={onOpenScannerClick}
              className="flex items-center gap-1.5 rounded-full border border-amber-400/60 bg-amber-500/15 px-3 py-1.5 text-xs font-black text-amber-300 hover:bg-amber-500/25 transition shadow-sm"
              title="Scan any UPI / BharatQR Code"
            >
              <QrCode className="size-3.5 text-amber-300" />
              <span>Scan QR</span>
            </button>

            {/* Sovereign KingPay Wallet Balance & Add Money Button */}
            <button
              type="button"
              onClick={onAddMoneyClick}
              className="flex items-center gap-2 rounded-full border border-amber-400/80 bg-gradient-to-r from-amber-500/20 via-amber-600/20 to-yellow-600/20 px-3 py-1 text-xs text-white shadow-md hover:border-amber-300 transition group"
              title="Click to Add Money to Sovereign Wallet (₹0 fee)"
            >
              <Wallet className="size-4 shrink-0 text-amber-300 group-hover:scale-110 transition-transform" aria-hidden />
              <div className="flex flex-col text-left leading-tight">
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-amber-400">
                  KingPay Vault
                </span>
                <span className="font-mono font-black text-white text-xs">
                  {formatPaise(walletBalance ?? 0)}
                </span>
              </div>
              <PlusCircle className="size-3.5 text-amber-400 ml-0.5 group-hover:rotate-90 transition-transform" />
            </button>

              </>
            )}

            {/* Far-right unified profile entry. Avatar is device-local until secure profile storage is enabled. */}
            <Link to={user ? "/account" : "/login"} aria-label={user ? "Open your OrderKing profile" : "Sign in to OrderKing"}
              className="shrink-0 rounded-full border border-amber-400/70 bg-emerald-950 p-1 text-amber-200 no-underline shadow-sm hover:border-amber-200">
              {isPending ? <span className="block size-8 animate-pulse rounded-full bg-slate-700" /> :
                user ? <DeviceAvatar userId={user.id} name={user.displayName} imageUrl={user.profileImageUrl} profileImageUrl={user.profileImageUrl} /> :
                <span className="flex size-8 items-center justify-center"><Crown className="size-5" aria-hidden /></span>}
            </Link>

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

      {/* Search King Pay services */}
      <section aria-label="King Pay service search" className="mx-auto w-full max-w-lg px-4 pt-3 md:max-w-5xl">
        <div className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3">
          <Search className="size-4 text-amber-300" aria-hidden />
          <input
            id="kingpay-service-search"
            type="search"
            value={serviceQuery}
            autoComplete="off"
            onChange={(e) => setServiceQuery(e.target.value)}
            placeholder="Search payments, bills, FASTag, passbook, wealth, travel..."
            aria-label="Search King Pay services"
            className="h-10 min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-slate-400 focus:outline-none"
          />
        </div>
        {serviceQuery.trim() && (
          <div className="mt-2 space-y-1 rounded-xl border border-white/20 bg-slate-900 p-1">
            {matchedFeatures.length > 0 ? (
              matchedFeatures.map((feature) => (
                <button
                  key={feature.section}
                  type="button"
                  onClick={() => { onSelectSection(feature.section); setServiceQuery(""); }}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-white hover:bg-slate-800"
                >
                  {feature.label}
                </button>
              ))
            ) : (
              <p className="px-3 py-2 text-xs text-slate-400">No matching King Pay service found.</p>
            )}
          </div>
        )}
      </section>

      {/* MAIN FINTECH CONTENT AREA */}
      <main className="flex-1 pb-24">
        <ErrorBoundary sectionName="KingPay Hub">
          {children}
        </ErrorBoundary>
      </main>

      {/* ULTRA-LUXURIOUS FLOATING DOCKED BOTTOM NAVIGATION */}
      <CustomerFloatingBottomNav />
    </div>
  );
}
