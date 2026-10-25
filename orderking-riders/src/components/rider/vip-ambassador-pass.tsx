import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Award,
  Check,
  ChevronRight,
  Copy,
  Crown,
  Gift,
  HelpCircle,
  IndianRupee,
  Layers,
  Printer,
  QrCode,
  Share2,
  Sparkles,
  TrendingUp,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { getAmbassadorStatsFn, creditReferralCommissionFn } from "@/lib/server/rider-fns";
import type { AmbassadorStats } from "@/lib/rider/types";
import { formatPaise } from "@/lib/rider/money";

export interface VipAmbassadorPassProps {
  riderName?: string | null;
  riderId?: string | null;
  phone?: string | null;
  className?: string;
  compact?: boolean;
  onCommissionCredited?: () => void;
}

export function VipAmbassadorPass({
  riderName,
  riderId,
  phone: _phone,
  className = "",
  compact = false,
  onCommissionCredited,
}: VipAmbassadorPassProps) {
  const [copied, setCopied] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"pass" | "calculator" | "ledger">("pass");
  const [stats, setStats] = useState<AmbassadorStats | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [dailyHandovers, setDailyHandovers] = useState<number>(15);

  const cleanName = (riderName?.trim() || "Delivery Partner").split(" ")[0];
  const cleanId = (riderId || "FLEET786").replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase();
  const referralCode = `OK-VIP-${cleanId}`;

  const landingUrl = `https://orderking.in/vip?ref=${encodeURIComponent(referralCode)}&ambassador=courier`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
    landingUrl,
  )}&color=0B0F19&bgcolor=FFFFFF`;

  // Fetch live ambassador statistics from courier wallet ledger
  const loadStats = async () => {
    try {
      const s = await getAmbassadorStatsFn();
      setStats(s);
    } catch {
      // Graceful fallback for offline network mode
    }
  };

  useEffect(() => {
    void loadStats();
  }, []);

  const copyCode = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(referralCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // ignore
    }
  };

  const handleSimulateCredit = async (type: "FIRST_ORDER_BONUS" | "LIFETIME_ROYALTY") => {
    setSimulating(true);
    setFeedbackMessage(null);
    try {
      const randomOrder = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
      const randomOrderTotal = type === "LIFETIME_ROYALTY" ? Math.floor(45000 + Math.random() * 35000) : undefined;
      const res = await creditReferralCommissionFn({
        data: {
          type,
          orderCode: randomOrder,
          customerName: `Customer #${cleanId.slice(-3)}`,
          orderTotalPaise: randomOrderTotal,
        },
      });

      const msg =
        type === "FIRST_ORDER_BONUS"
          ? `✓ ₹25.00 Instant Cash Bonus credited directly to your courier wallet ledger!`
          : `✓ ${formatPaise(res.amountPaise)} (1% Lifetime Micro-Royalty) credited to your ledger for order #${res.orderCode}!`;

      setFeedbackMessage(msg);
      await loadStats();
      onCommissionCredited?.();
      setTimeout(() => setFeedbackMessage(null), 6000);
    } catch {
      setFeedbackMessage("Unable to process referral credit at this moment.");
    } finally {
      setSimulating(false);
    }
  };

  const whatsappMessage = encodeURIComponent(
    `👑 Exclusive OrderKing VIP Invitation from ${cleanName}!\n\n` +
      `🎁 Get ₹100 OFF your direct restaurant order when you order through OrderKing direct:\n` +
      `🔗 Order Link: ${landingUrl}\n` +
      `🎟️ Use My Ambassador VIP Code: ${referralCode}\n\n` +
      `Enjoy fresh hot food delivered faster with zero extra platform markups!`,
  );
  const whatsappUrl = `https://wa.me/?text=${whatsappMessage}`;

  // Interactive royalty calculator math
  const monthlyCards = dailyHandovers * 30;
  const estimatedConversions = Math.round(monthlyCards * 0.2); // 20% conversion benchmark
  const monthlyInstantBonus = estimatedConversions * 25; // ₹25 per first order
  const monthlyOrdersPerCustomer = 3;
  const avgOrderValueInr = 500;
  const monthlyLifetimeRoyalty = Math.round(
    estimatedConversions * monthlyOrdersPerCustomer * avgOrderValueInr * 0.01,
  );
  const totalMonthlyEarningsBoost = monthlyInstantBonus + monthlyLifetimeRoyalty;

  return (
    <>
      <div
        className={`relative overflow-hidden rounded-2xl border border-[#E5A93C]/40 bg-gradient-to-br from-[#0B0F19] via-[#0F172A] to-[#1E293B] p-5 shadow-2xl text-white ${className}`}
      >
        {/* Luxury Background Glow Highlights */}
        <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-[#E5A93C]/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-16 size-48 rounded-full bg-[#2563EB]/20 blur-3xl" />

        {/* Top Header & Elite Tier Badge */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 border-b border-[#E5A93C]/20 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#E5A93C] to-[#B37D20] text-black shadow-md shadow-[#E5A93C]/30">
              <Crown className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base font-bold tracking-wide text-[#E5A93C]">
                  OrderKing VIP Ambassador Pass
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full border border-[#E5A93C]/40 bg-[#E5A93C]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#E5A93C]">
                  <Sparkles className="size-3" /> Elite Tier
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Doorstep Customer Acquisition &amp; Lifetime Micro-Royalty Protocol
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setActiveTab("pass");
                setModalOpen(true);
              }}
              className="h-8 border-[#E5A93C]/50 bg-black/40 text-xs text-[#E5A93C] hover:bg-[#E5A93C]/20 hover:text-white"
            >
              <QrCode className="mr-1.5 size-3.5" />
              Digital Pass
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setActiveTab("calculator");
                setModalOpen(true);
              }}
              className="h-8 border-sky-400/40 bg-sky-950/40 text-xs text-sky-300 hover:bg-sky-900/40 hover:text-white"
            >
              <TrendingUp className="mr-1.5 size-3.5" />
              Royalty Calculator
            </Button>
          </div>
        </div>

        {/* Live Wallet Ledger Referral Tracker */}
        <div className="relative z-10 mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-xl border border-border/40 bg-black/40 p-3 backdrop-blur-sm">
          <div className="space-y-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Ledger Royalties
            </span>
            <p className="font-mono text-base font-bold text-[#E5A93C]">
              {formatPaise(stats?.totalEarnedPaise ?? 0)}
            </p>
            <p className="text-[10px] text-slate-400">Credited to wallet</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Acquired Customers
            </span>
            <p className="font-mono text-base font-bold text-sky-300">
              {stats?.totalCustomersReferred ?? 0}
            </p>
            <p className="text-[10px] text-slate-400">Direct buyers</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              ₹25 Cash Bonuses
            </span>
            <p className="font-mono text-base font-bold text-emerald-400">
              {formatPaise(stats?.firstOrderBonusPaise ?? 0)}
            </p>
            <p className="text-[10px] text-slate-400">{stats?.firstOrderBonusCount ?? 0} 1st orders</p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              1% Micro-Royalties
            </span>
            <p className="font-mono text-base font-bold text-amber-300">
              {formatPaise(stats?.royaltyPaise ?? 0)}
            </p>
            <p className="text-[10px] text-slate-400">{stats?.royaltyCount ?? 0} repeat orders</p>
          </div>
        </div>

        {/* Value Proposition Grid */}
        <div className="relative z-10 mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {/* Tile 1: Customer Discount */}
          <div className="rounded-xl border border-[#E5A93C]/25 bg-black/50 p-3 backdrop-blur-sm">
            <div className="flex items-center justify-between text-xs text-[#E5A93C]">
              <span className="font-semibold uppercase tracking-wider">Customer Gets</span>
              <Gift className="size-4 text-[#E5A93C]" />
            </div>
            <p className="mt-1 font-display text-2xl font-bold text-white">₹100 OFF</p>
            <p className="mt-0.5 text-[11px] leading-tight text-slate-300">
              Instant discount on their direct food order when scanning your VIP Pass.
            </p>
          </div>

          {/* Tile 2: Rider Instant Bonus */}
          <div className="rounded-xl border border-[#2563EB]/40 bg-[#2563EB]/15 p-3 backdrop-blur-sm">
            <div className="flex items-center justify-between text-xs text-sky-300">
              <span className="font-semibold uppercase tracking-wider">Instant Cash Bonus</span>
              <Zap className="size-4 text-sky-400" />
            </div>
            <p className="mt-1 font-display text-2xl font-bold text-sky-100">₹25 CASH</p>
            <p className="mt-0.5 text-[11px] leading-tight text-slate-300">
              Credited straight to your courier wallet ledger on that customer&apos;s very first order.
            </p>
          </div>

          {/* Tile 3: Lifetime Micro-Royalty */}
          <div className="rounded-xl border border-[#E5A93C]/40 bg-gradient-to-br from-[#E5A93C]/15 to-transparent p-3 backdrop-blur-sm">
            <div className="flex items-center justify-between text-xs text-[#E5A93C]">
              <span className="font-semibold uppercase tracking-wider">Lifetime Royalty</span>
              <TrendingUp className="size-4 text-[#E5A93C]" />
            </div>
            <p className="mt-1 font-display text-2xl font-bold text-[#E5A93C]">1% FOREVER</p>
            <p className="mt-0.5 text-[11px] leading-tight text-slate-300">
              Earn 1% micro-royalty on every subsequent order placed by that customer forever.
            </p>
          </div>
        </div>

        {/* Feedback / Toast Message */}
        {feedbackMessage ? (
          <div className="relative z-10 mt-3 rounded-lg border border-emerald-500/50 bg-emerald-950/80 p-2.5 text-xs text-emerald-200 backdrop-blur-sm flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <Check className="size-4 text-emerald-400 shrink-0" />
              <span>{feedbackMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedbackMessage(null)}
              className="text-emerald-400 hover:text-emerald-200"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ) : null}

        {/* Interactive VIP Code & Dynamic QR Section */}
        <div className="relative z-10 mt-3 flex flex-col gap-4 rounded-xl border border-[#E5A93C]/30 bg-[#0B0F19]/90 p-3.5 sm:flex-row sm:items-center">
          {/* Dynamic QR Box */}
          <div className="flex shrink-0 items-center justify-center rounded-xl bg-white p-2 shadow-lg shadow-black/60">
            <img
              src={qrCodeUrl}
              alt="OrderKing Ambassador VIP QR Code"
              className="size-24 rounded object-contain sm:size-28"
              loading="lazy"
            />
          </div>

          {/* Code & Quick Action Controls */}
          <div className="flex-1 space-y-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Your Personal VIP Ambassador Code
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="rounded-lg border border-[#E5A93C]/40 bg-black/60 px-3 py-1 font-mono text-base font-bold tracking-wider text-[#E5A93C] select-all shadow-inner">
                  {referralCode}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => void copyCode()}
                  className="h-8 border-[#E5A93C]/40 bg-[#E5A93C]/10 text-xs text-[#E5A93C] hover:bg-[#E5A93C]/20"
                >
                  {copied ? (
                    <>
                      <Check className="mr-1 size-3.5 text-emerald-400" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1 size-3.5" /> Copy Code
                    </>
                  )}
                </Button>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#2563EB] px-3 text-xs font-semibold text-white shadow hover:bg-[#1D4ED8]"
                >
                  <Share2 className="size-3.5" /> Share Pass
                </a>
              </div>
            </div>

            <p className="text-[11px] leading-relaxed text-slate-300">
              💡 <strong>Ambassador Protocol:</strong> Hand this pass to customers when handing
              over orders at their doorstep. Tell them: <em>&quot;Scan this VIP Pass for ₹100 off your next direct order!&quot;</em>
            </p>
          </div>
        </div>

        {/* Footer Guarantee */}
        <div className="relative z-10 mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
          <span>✓ Automated weekly Wednesday settlement for all referral bonuses &amp; royalties.</span>
          <span className="text-[#E5A93C]">Positioned strictly as an elite courier earnings booster.</span>
        </div>
      </div>

      {/* Modal: Fullscreen Digital Pass / Print Slip / Calculator */}
      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border-2 border-[#E5A93C] bg-gradient-to-b from-[#0B0F19] via-[#0F172A] to-[#1E293B] p-6 shadow-2xl text-white max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="absolute right-4 top-4 rounded-full bg-white/10 p-1.5 text-slate-300 hover:bg-white/20 hover:text-white"
            >
              <X className="size-4" />
            </button>

            {/* Modal Header */}
            <div className="text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E5A93C] to-[#B37D20] text-black shadow-lg shadow-[#E5A93C]/40">
                <Crown className="size-7" />
              </div>
              <h4 className="mt-3 font-display text-xl font-bold tracking-wide text-[#E5A93C]">
                ORDERKING VIP AMBASSADOR PASS
              </h4>
              <p className="text-xs text-slate-300">
                Ambassador: <strong>{riderName || "Delivery Partner"}</strong> · ID: {cleanId}
              </p>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="mt-4 flex rounded-lg bg-black/40 p-1 border border-border/40">
              <button
                type="button"
                onClick={() => setActiveTab("pass")}
                className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition ${
                  activeTab === "pass"
                    ? "bg-[#E5A93C] text-black shadow"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                VIP Pass &amp; QR
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("calculator")}
                className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition ${
                  activeTab === "calculator"
                    ? "bg-[#E5A93C] text-black shadow"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                Royalty Calculator
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("ledger")}
                className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition ${
                  activeTab === "ledger"
                    ? "bg-[#E5A93C] text-black shadow"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                Wallet Ledger
              </button>
            </div>

            {/* Tab 1: Pass & QR */}
            {activeTab === "pass" ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-xl border border-[#E5A93C]/50 bg-white p-5 text-center text-slate-900 shadow-xl">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#B37D20]">
                    Scan For ₹100 Instant Discount
                  </p>
                  <div className="my-3 flex justify-center">
                    <img
                      src={qrCodeUrl}
                      alt="OrderKing Ambassador VIP QR"
                      className="size-48 rounded-lg shadow-sm"
                    />
                  </div>
                  <p className="text-[11px] font-semibold text-slate-600">
                    Or visit <strong>orderking.in/vip</strong> &amp; enter code:
                  </p>
                  <div className="mt-1 inline-block rounded-lg bg-slate-900 px-4 py-1.5 font-mono text-lg font-bold tracking-widest text-[#E5A93C]">
                    {referralCode}
                  </div>
                </div>

                <div className="rounded-xl border border-[#2563EB]/40 bg-[#2563EB]/15 p-3 text-xs leading-relaxed text-slate-200">
                  <strong className="text-sky-300">Ambassador Handover Pitch:</strong>
                  <p className="mt-1 text-[11px]">
                    &ldquo;Here is your exclusive OrderKing VIP Pass! You get <strong>₹100 OFF</strong> your
                    food order with zero platform markup fees when you order direct.&rdquo;
                  </p>
                </div>
              </div>
            ) : null}

            {/* Tab 2: Royalty Calculator */}
            {activeTab === "calculator" ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-xl border border-white/15 bg-black/40 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300">
                      Daily Pass Handovers:
                    </span>
                    <span className="font-mono text-sm font-bold text-[#E5A93C]">
                      {dailyHandovers} customers/day
                    </span>
                  </div>

                  <div className="flex gap-2">
                    {[5, 10, 15, 20, 30].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setDailyHandovers(num)}
                        className={`flex-1 rounded py-1 text-xs font-semibold transition ${
                          dailyHandovers === num
                            ? "bg-[#E5A93C] text-black"
                            : "bg-white/10 text-slate-300 hover:bg-white/20"
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>

                  <div className="border-t border-white/10 pt-3 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>Monthly Cards Handed Out:</span>
                      <span className="font-semibold text-white">{monthlyCards}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Est. Direct Customers (20% conversion):</span>
                      <span className="font-semibold text-sky-300">{estimatedConversions}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>₹25 Instant Cash Bonuses:</span>
                      <span className="font-semibold text-emerald-400">
                        ₹{monthlyInstantBonus.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>1% Lifetime Micro-Royalties (3 orders/mo):</span>
                      <span className="font-semibold text-amber-300">
                        ₹{monthlyLifetimeRoyalty.toLocaleString("en-IN")}/mo
                      </span>
                    </div>

                    <div className="rounded-lg bg-emerald-500/20 border border-emerald-500/40 p-3 mt-2 flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Projected Monthly Boost:</span>
                      <span className="font-mono text-lg font-bold text-emerald-400">
                        +₹{totalMonthlyEarningsBoost.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 italic">
                  *Lifetime micro-royalties continue paying on all future orders placed by your acquired customers month after month without expiration.
                </p>
              </div>
            ) : null}

            {/* Tab 3: Wallet Ledger */}
            {activeTab === "ledger" ? (
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg bg-black/40 border border-[#E5A93C]/30 p-2.5">
                    <span className="text-slate-400">Total Ambassador Earnings:</span>
                    <p className="mt-1 font-mono text-base font-bold text-[#E5A93C]">
                      {formatPaise(stats?.totalEarnedPaise ?? 0)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-black/40 border border-sky-400/30 p-2.5">
                    <span className="text-slate-400">Direct Customers:</span>
                    <p className="mt-1 font-mono text-base font-bold text-sky-300">
                      {stats?.totalCustomersReferred ?? 0}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                  <p className="text-xs font-semibold text-slate-300 mb-2">
                    Recent Ambassador Ledger Entries:
                  </p>
                  {stats?.recentReferrals && stats.recentReferrals.length > 0 ? (
                    <ul className="divide-y divide-white/10 text-xs">
                      {stats.recentReferrals.map((r) => (
                        <li key={r.id} className="py-2 flex items-center justify-between">
                          <div>
                            <p className="font-medium text-slate-200">{r.note}</p>
                            <p className="text-[10px] text-slate-400">
                              {new Date(r.at).toLocaleDateString("en-IN")}
                            </p>
                          </div>
                          <span className="font-mono font-bold text-emerald-400">
                            +{formatPaise(r.amountPaise)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-400 py-3 text-center">
                      No referral commissions recorded yet. Hand out your VIP pass to start earning!
                    </p>
                  )}
                </div>

                {/* Live ledger status */}
                <div className="flex items-center justify-between px-1 text-[11px] text-slate-400">
                  <span>Automatic referral attribution active</span>
                  <span className="text-emerald-400 font-semibold">100% Genuine Ledger</span>
                </div>
              </div>
            ) : null}

            <div className="mt-5 flex gap-2">
              <Button
                type="button"
                className="flex-1 bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
                onClick={() => {
                  if (typeof window !== "undefined") window.print();
                }}
              >
                <Printer className="mr-1.5 size-4" /> Print Handover Slips
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-[#E5A93C]/50 text-[#E5A93C] hover:bg-[#E5A93C]/20"
                onClick={() => setModalOpen(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
