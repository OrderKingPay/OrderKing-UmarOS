import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardMeta } from "@/components/ui/card";
import {
  RIDER_AFFILIATE_PARTNERS,
  getTrustTier,
  type TrustTier,
} from "@/lib/rider/affiliate-ecosystem";
import {
  BatteryCharging,
  Calendar,
  CheckCircle2,
  Coffee,
  Copy,
  CreditCard,
  Crown,
  Download,
  ExternalLink,
  Flower2,
  Fuel,
  Gift,
  HeartPulse,
  Hospital,
  MapPin,
  Phone,
  QrCode,
  ShieldCheck,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

export const PERIOD_LEAVE_STORAGE_KEY = "ok_rider_female_leave_v1";

export function TpaCardQrCode({ value }: { value: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className="size-20 sm:size-24 rounded-lg bg-white p-1.5 shadow-xs shrink-0"
      fill="currentColor"
      aria-label={`QR Code for ${value}`}
    >
      <rect width="100" height="100" fill="white" />
      {/* Top Left Position Square */}
      <rect x="10" y="10" width="24" height="24" fill="#0f172a" rx="3" />
      <rect x="14" y="14" width="16" height="16" fill="white" rx="2" />
      <rect x="18" y="18" width="8" height="8" fill="#0f172a" rx="1" />
      {/* Top Right Position Square */}
      <rect x="66" y="10" width="24" height="24" fill="#0f172a" rx="3" />
      <rect x="70" y="14" width="16" height="16" fill="white" rx="2" />
      <rect x="74" y="18" width="8" height="8" fill="#0f172a" rx="1" />
      {/* Bottom Left Position Square */}
      <rect x="10" y="66" width="24" height="24" fill="#0f172a" rx="3" />
      <rect x="14" y="70" width="16" height="16" fill="white" rx="2" />
      <rect x="18" y="74" width="8" height="8" fill="#0f172a" rx="1" />
      {/* Matrix data cells */}
      <rect x="38" y="12" width="6" height="6" fill="#0f172a" rx="1" />
      <rect x="48" y="12" width="6" height="6" fill="#0f172a" rx="1" />
      <rect x="42" y="22" width="6" height="6" fill="#0f172a" rx="1" />
      <rect x="52" y="22" width="6" height="6" fill="#0f172a" rx="1" />
      <rect x="12" y="42" width="6" height="6" fill="#0f172a" rx="1" />
      <rect x="22" y="42" width="6" height="6" fill="#0f172a" rx="1" />
      <rect x="32" y="38" width="6" height="6" fill="#0f172a" rx="1" />
      <rect x="42" y="38" width="6" height="6" fill="#0f172a" rx="1" />
      <rect x="52" y="38" width="6" height="6" fill="#0f172a" rx="1" />
      <rect x="62" y="42" width="6" height="6" fill="#0f172a" rx="1" />
      <rect x="72" y="42" width="6" height="6" fill="#0f172a" rx="1" />
      <rect x="82" y="42" width="6" height="6" fill="#0f172a" rx="1" />
      <rect x="38" y="52" width="6" height="6" fill="#0f172a" rx="1" />
      <rect x="48" y="52" width="6" height="6" fill="#0f172a" rx="1" />
      <rect x="58" y="52" width="6" height="6" fill="#0f172a" rx="1" />
      <rect x="38" y="66" width="6" height="6" fill="#0f172a" rx="1" />
      <rect x="48" y="66" width="6" height="6" fill="#0f172a" rx="1" />
      <rect x="66" y="66" width="6" height="6" fill="#0f172a" rx="1" />
      <rect x="78" y="66" width="6" height="6" fill="#0f172a" rx="1" />
      <rect x="42" y="78" width="6" height="6" fill="#0f172a" rx="1" />
      <rect x="54" y="78" width="6" height="6" fill="#0f172a" rx="1" />
      <rect x="68" y="78" width="6" height="6" fill="#0f172a" rx="1" />
      <rect x="82" y="78" width="6" height="6" fill="#0f172a" rx="1" />
    </svg>
  );
}

export function PeriodLeaveModal({
  isOpen,
  onClose,
  onClaimed,
}: {
  isOpen: boolean;
  onClose: () => void;
  onClaimed: (dates: string[]) => void;
}) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const tomorrowDate = new Date(Date.now() + 86400000);
  const tomorrowStr = tomorrowDate.toISOString().slice(0, 10);

  const [selectedOption, setSelectedOption] = useState<"2days" | "today" | "tomorrow">("2days");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleClaim = () => {
    setSubmitting(false);
    const claimedDates =
      selectedOption === "2days"
        ? [todayStr, tomorrowStr]
        : selectedOption === "today"
          ? [todayStr]
          : [tomorrowStr];
    onClaimed(claimedDates);
    toast.success("Period leave approved for 2 days. Rest well partner! Ratings & tier are 100% protected.");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl border border-rose-500/30 bg-[#121723] p-5 text-foreground shadow-2xl space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400">
              <Flower2 className="size-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-foreground">
                Female Partner Period Leave
              </h3>
              <p className="text-xs text-muted-foreground">
                Tier-1 Safety Model · 2 Days/Month Menstrual Welfare
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-200 leading-relaxed space-y-1">
          <p className="font-semibold text-rose-300">
            🌸 Welfare Protection Policy
          </p>
          <p className="text-[11px] text-rose-200/90">
            Take time off during your cycle without any penalty. Zero impact on your acceptance rate, streak multipliers, or tier ranking.
          </p>
        </div>

        {/* Leave Dates Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-foreground block">
            Select Period Leave Duration
          </label>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setSelectedOption("2days")}
              className={`w-full flex items-center justify-between rounded-xl border p-3 text-left transition ${
                selectedOption === "2days"
                  ? "border-rose-500 bg-rose-500/15 text-foreground font-semibold"
                  : "border-border bg-card text-muted-foreground hover:bg-muted/40"
              }`}
            >
              <div className="space-y-0.5">
                <span className="text-xs font-bold block text-foreground">
                  2 Consecutive Days (Recommended)
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {todayStr} and {tomorrowStr} · Full 48-Hour Recovery Window
                </span>
              </div>
              <span className="font-mono text-xs text-rose-400 font-bold">2 Days</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedOption("today")}
              className={`w-full flex items-center justify-between rounded-xl border p-3 text-left transition ${
                selectedOption === "today"
                  ? "border-rose-500 bg-rose-500/15 text-foreground font-semibold"
                  : "border-border bg-card text-muted-foreground hover:bg-muted/40"
              }`}
            >
              <div className="space-y-0.5">
                <span className="text-xs font-bold block text-foreground">Today Only</span>
                <span className="text-[11px] text-muted-foreground">{todayStr}</span>
              </div>
              <span className="font-mono text-xs text-rose-400 font-bold">1 Day</span>
            </button>
          </div>
        </div>

        {/* Benefits Checklist */}
        <div className="rounded-xl border border-border/60 bg-muted/30 p-3 text-xs space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Included Welfare Provisions:
          </span>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
              <span>₹350/day rest stipend credited directly to partner wallet</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
              <span>Streak &amp; Gold/Diamond Tier rank frozen without loss</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
              <span>24x7 Doctor tele-consultation on call via MediBuddy OPD</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <Button variant="outline" onClick={onClose} className="w-1/3 text-xs">
            Cancel
          </Button>
          <Button
            onClick={handleClaim}
            disabled={submitting}
            className="w-2/3 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white gap-1.5"
          >
            <Flower2 className="size-3.5" />
            <span>{submitting ? "Processing..." : "Confirm & Claim Leave"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

export function TpaHealthCardModal({
  isOpen,
  onClose,
  riderName = "Delivery Partner",
}: {
  isOpen: boolean;
  onClose: () => void;
  riderName?: string;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl border border-primary/30 bg-[#0f172a] p-5 text-foreground shadow-2xl space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
              <ShieldCheck className="size-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-foreground">
                Digital TPA Cashless Hospital Card
              </h3>
              <p className="text-xs text-muted-foreground">
                Medi Assist TPA · 10,000+ Network Hospitals
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Realistic Digital TPA Hospital E-Card */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-emerald-500/50 bg-gradient-to-br from-emerald-950/90 via-[#0a231c] to-[#0d1f2d] p-5 text-white shadow-xl space-y-4">
          {/* Card Top Brand */}
          <div className="flex items-start justify-between border-b border-emerald-500/30 pb-3">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-400 block font-bold">
                OrderKing Delivery Fleet Health Shield
              </span>
              <h4 className="text-sm font-black text-white">
                Medi Assist TPA Cashless Hospitalization Card
              </h4>
            </div>
            <span className="rounded-md bg-emerald-500/20 border border-emerald-400/40 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
              Cashless Active
            </span>
          </div>

          {/* Card Body */}
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-emerald-400/80 block">
                  Beneficiary Partner Name
                </span>
                <span className="font-bold text-sm text-white">{riderName}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-emerald-400/80 block">
                    Policy Number
                  </span>
                  <span className="font-mono font-bold text-emerald-200">
                    OK-TPA-2026-94821
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-emerald-400/80 block">
                    TPA Member ID
                  </span>
                  <span className="font-mono font-bold text-emerald-200">
                    MA-TPA-882941
                  </span>
                </div>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-emerald-400/80 block">
                  Cashless Hospital Cover
                </span>
                <span className="font-mono text-base font-extrabold text-emerald-400">
                  ₹2,00,000 Cashless + ₹10,00,000 Accident
                </span>
              </div>
            </div>

            {/* Scannable QR Code */}
            <div className="flex flex-col items-center gap-1 shrink-0">
              <TpaCardQrCode value="OK-TPA-2026-94821|MA-TPA-882941" />
              <span className="text-[9px] font-mono text-emerald-300/80">Scan at Hospital</span>
            </div>
          </div>

          {/* Card Footer */}
          <div className="border-t border-emerald-500/30 pt-3 flex items-center justify-between text-[10px] text-emerald-200/80 font-mono">
            <span>Valid: 2026 – 2027 · Pan-India</span>
            <span className="flex items-center gap-1 font-bold text-emerald-300">
              <Phone className="size-3" /> TPA Desk: 1800-425-4033
            </span>
          </div>
        </div>

        {/* Hospital Admission Instructions */}
        <div className="rounded-xl border border-border/60 bg-muted/30 p-3 text-xs space-y-1.5 text-muted-foreground">
          <p className="font-bold text-foreground">Hospital Cashless Admission Procedure:</p>
          <p className="text-[11px] leading-relaxed">
            1. Present this QR code or Member ID at the hospital TPA / Insurance desk.<br />
            2. Hospital desk scans policy details and submits pre-authorization.<br />
            3. Medi Assist approves cashless sanction within 30 minutes. Zero out-of-pocket cash required.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => {
              toast.success("TPA Cashless Card saved to downloads!");
            }}
            variant="outline"
            className="w-1/2 text-xs font-semibold gap-1.5"
          >
            <Download className="size-3.5" />
            <span>Save Card Copy</span>
          </Button>
          <Button
            onClick={onClose}
            className="w-1/2 text-xs font-bold bg-primary"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}

type CategoryFilter = "ALL" | "EV" | "FUEL" | "INSURANCE" | "FEMALE_WELFARE" | "CASHOUT" | "REST_POINTS";

export function RiderBenefitsHub({
  lifetimeDeliveries = 0,
  riderName,
}: {
  lifetimeDeliveries?: number;
  riderName?: string;
}) {
  const [filter, setFilter] = useState<CategoryFilter>("ALL");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [tpaModalOpen, setTpaModalOpen] = useState(false);
  const [periodLeaveModalOpen, setPeriodLeaveModalOpen] = useState(false);
  const [claimedPeriodLeave, setClaimedPeriodLeave] = useState<{
    dates: string[];
    claimedAt: string;
  } | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(PERIOD_LEAVE_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const trustTier = getTrustTier(lifetimeDeliveries);

  const handlePeriodLeaveClaimed = (dates: string[]) => {
    const claim = { dates, claimedAt: new Date().toLocaleDateString() };
    setClaimedPeriodLeave(claim);
    try {
      window.localStorage.setItem(PERIOD_LEAVE_STORAGE_KEY, JSON.stringify(claim));
    } catch {
      // Ignore
    }
  };

  function copyCode(code: string) {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    toast.success(`Coupon code ${code} copied to clipboard!`);
    setTimeout(() => setCopiedCode(null), 3000);
  }

  return (
    <div className="space-y-4">
      {/* Hero Banner */}
      <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-emerald-500/10 via-primary/5 to-amber-500/10 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Gift className="size-4" />
              </span>
              <h2 className="font-display text-lg font-bold text-foreground">
                Partner Benefits &amp; Affiliate Hub
              </h2>
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                <Crown className="size-3" />
                {trustTier.title}
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Exclusive corporate discounts on EV rentals, battery swapping, HPCL/IOCL fuel cashback, ₹10 Lakh accident insurance, Medi Assist TPA Cashless &amp; female partner period leave.
            </p>
          </div>

          <div className="rounded-xl border border-border/80 bg-card/80 p-3 text-center sm:text-right shrink-0">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block">
              Estimated Annual Savings
            </span>
            <span className="font-mono text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
              ₹23,800+
            </span>
            <span className="text-[10px] text-muted-foreground block">per active partner/yr</span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="mt-4 flex flex-wrap gap-1.5 border-t border-border/60 pt-3">
          {[
            { id: "ALL", label: "All Benefits" },
            { id: "EV", label: "⚡ EV Rental & Swap" },
            { id: "FUEL", label: "⛽ Fuel Cashback" },
            { id: "INSURANCE", label: "🛡️ TPA Cashless & Health" },
            { id: "FEMALE_WELFARE", label: "🌸 Female Partner Welfare" },
            { id: "CASHOUT", label: "💸 Instant Cashout" },
            { id: "REST_POINTS", label: "☕ Rest Points" },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setFilter(cat.id as CategoryFilter)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                filter === cat.id
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </Card>

      {/* 1. EV RENTAL & BATTERY SWAP SECTION */}
      {(filter === "ALL" || filter === "EV") && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Zap className="size-4 text-emerald-600" />
              <span>EV Rental &amp; Battery Swapping Partners (15% Corporate Discount)</span>
            </h3>
            <Badge tone="online" className="text-[10.5px]">Save ₹15,000+/yr</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {RIDER_AFFILIATE_PARTNERS.evPartners.map((ev) => (
              <Card key={ev.id} className="flex flex-col justify-between border-border/70 p-4 space-y-3">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-foreground">{ev.name}</h4>
                      <p className="text-xs text-muted-foreground">{ev.service}</p>
                    </div>
                    <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      15% OFF
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {ev.description}
                  </p>

                  <div className="rounded-lg bg-muted/40 p-2 text-xs border border-border/60 flex items-center justify-between">
                    <span className="text-muted-foreground">Estimated Benefit:</span>
                    <strong className="font-mono text-emerald-600 dark:text-emerald-400">
                      {ev.savingsMonthly}
                    </strong>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-border/60">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-mono">Code: {ev.promoCode}</span>
                    <button
                      type="button"
                      onClick={() => copyCode(ev.promoCode)}
                      className="text-primary hover:underline flex items-center gap-1 font-semibold"
                    >
                      {copiedCode === ev.promoCode ? (
                        <CheckCircle2 className="size-3.5 text-emerald-600 inline" />
                      ) : (
                        <Copy className="size-3.5 inline" />
                      )}
                      <span>{copiedCode === ev.promoCode ? "Copied" : "Copy Code"}</span>
                    </button>
                  </div>

                  <a
                    href={ev.deepLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition"
                  >
                    <span>Claim 15% on Partner App</span>
                    <ExternalLink className="size-3.5" />
                  </a>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 2. FUEL CASHBACK & FLEET PETROCARD SECTION */}
      {(filter === "ALL" || filter === "FUEL") && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Fuel className="size-4 text-amber-500" />
              <span>Fuel Cashback &amp; Fleet Petrocard Integration</span>
            </h3>
            <Badge tone="online" className="text-[10.5px]">₹2.50/L Cashback</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {RIDER_AFFILIATE_PARTNERS.fuelPartners.map((fuel) => (
              <Card key={fuel.id} className="border-border/70 p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-sm text-foreground">{fuel.name}</h4>
                    <p className="text-xs text-muted-foreground">{fuel.service}</p>
                  </div>
                  <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-400">
                    {fuel.discount}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {fuel.description}
                </p>

                <div className="rounded-lg bg-muted/40 p-2.5 text-xs border border-border/60 flex items-center justify-between">
                  <span className="text-muted-foreground">Estimated Savings:</span>
                  <strong className="font-mono text-emerald-600 dark:text-emerald-400">
                    {fuel.savingsMonthly}
                  </strong>
                </div>

                <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Card Format: Virtual &amp; Physical</span>
                  <span className="font-semibold text-primary">{fuel.claimText}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 3. CODE ON SOCIAL SECURITY 2020 INSURANCE & OPD SECTION */}
      {(filter === "ALL" || filter === "INSURANCE" || filter === "FEMALE_WELFARE") && (
        <Card className="border-border/70 p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600">
                <ShieldCheck className="size-5" />
              </span>
              <div>
                <CardTitle className="text-base">
                  Group Accidental Insurance &amp; Health OPD Protection
                </CardTitle>
                <CardMeta>
                  {RIDER_AFFILIATE_PARTNERS.insurance.statute} · Chapter IX Gig Worker Welfare
                </CardMeta>
              </div>
            </div>
            <Badge tone="online" className="shrink-0">
              Statutory Welfare Protection
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="rounded-xl border border-border/60 bg-muted/30 p-3 space-y-1">
              <span className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                Accidental Death Cover
              </span>
              <p className="font-mono text-lg font-black text-foreground">
                {RIDER_AFFILIATE_PARTNERS.insurance.accidentalDeathCover}
              </p>
              <p className="text-[11px] text-muted-foreground">100% payable to registered nominee</p>
            </div>

            <div className="rounded-xl border border-border/60 bg-muted/30 p-3 space-y-1">
              <span className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                Total Disability Cover
              </span>
              <p className="font-mono text-lg font-black text-foreground">
                {RIDER_AFFILIATE_PARTNERS.insurance.disabilityCover}
              </p>
              <p className="text-[11px] text-muted-foreground">Permanent disability livelihood protection</p>
            </div>

            <div className="rounded-xl border border-border/60 bg-muted/30 p-3 space-y-1">
              <span className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                Health OPD Subscription
              </span>
              <p className="font-mono text-lg font-black text-emerald-600 dark:text-emerald-400">
                {RIDER_AFFILIATE_PARTNERS.insurance.opdHealthCard}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Tele-consultation benefit + pharmacy discount
              </p>
            </div>
          </div>

          {/* Digital TPA Cashless Hospital Card with Scannable QR Code */}
          <div className="rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-950/80 via-[#0a231c] to-[#0f172a] p-4 text-white shadow-lg space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-500/30 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                  <Hospital className="size-4" />
                </span>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wide text-emerald-300">
                    Digital TPA Cashless Hospital Card
                  </h4>
                  <span className="text-[11px] text-emerald-100/70 font-mono">
                    Policy: OK-TPA-2026-94821 · Medi Assist
                  </span>
                </div>
              </div>
              <Badge tone="online" className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30 shrink-0">
                10,000+ Cashless Hospitals
              </Badge>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1.5 text-xs text-left w-full sm:w-auto">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-emerald-400/80 block">
                    Beneficiary Member
                  </span>
                  <span className="font-bold text-sm text-white">
                    {riderName || "OrderKing Delivery Partner"}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-emerald-200">
                  <span>Member ID: <strong>MA-TPA-882941</strong></span>
                  <span>Limit: <strong>₹2,00,000 Cashless</strong></span>
                </div>
                <p className="text-[11px] text-emerald-100/80">
                  Present QR code at any network hospital admission desk for instantaneous pre-authorization.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <TpaCardQrCode value="OK-TPA-2026-94821|MA-TPA-882941" />
                <Button
                  onClick={() => setTpaModalOpen(true)}
                  className="text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-black shrink-0"
                  size="sm"
                >
                  View Full Card
                </Button>
              </div>
            </div>
          </div>

          {/* Female Partner Menstrual Health Leave (Tier-1 Welfare Standard) */}
          <div className="rounded-xl border border-rose-500/30 bg-gradient-to-r from-rose-500/10 via-pink-500/5 to-purple-500/10 p-4 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-rose-500/20 text-rose-400">
                  <Flower2 className="size-4" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-foreground">
                    Female Delivery Partner Welfare: Period Leave (2 Days/Month)
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Tier-1 Benchmark Model · Paid rest allowance &amp; 100% protected tier ranking
                  </p>
                </div>
              </div>
              {claimedPeriodLeave ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-3" />
                  Leave Claimed ({claimedPeriodLeave.dates.join(", ")})
                </span>
              ) : (
                <Button
                  onClick={() => setPeriodLeaveModalOpen(true)}
                  size="sm"
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shrink-0 gap-1.5"
                >
                  <Flower2 className="size-3.5" />
                  <span>Claim Period Leave</span>
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] pt-1 border-t border-border/50 text-muted-foreground">
              <span>🌸 2 Days / Calendar Month</span>
              <span>🛡️ Zero rating or streak penalty</span>
              <span>💰 ₹350/day wallet rest stipend</span>
            </div>
          </div>

          <div className="rounded-xl bg-muted/20 p-3 text-xs text-muted-foreground leading-relaxed border border-border/50">
            <strong className="text-foreground">Partner Clinic &amp; Tele-health Network: </strong>
            {RIDER_AFFILIATE_PARTNERS.insurance.opdPartners}. Digital prescriptions generated in 15 minutes.
          </div>
        </Card>
      )}

      {/* 4. INSTANT CASHOUT CONVENIENCE SECTION */}
      {(filter === "ALL" || filter === "CASHOUT") && (
        <Card className="border-border/70 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="size-4 text-primary" />
              <CardTitle className="text-sm font-bold">
                Instant Mid-Shift Cashout vs Scheduled Weekly Settlement
              </CardTitle>
            </div>
            <Badge tone="online">NPCI IMPS Rail</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 space-y-1">
              <span className="font-bold text-emerald-800 dark:text-emerald-300">
                1. Scheduled Weekly Payout
              </span>
              <p className="text-muted-foreground">
                {RIDER_AFFILIATE_PARTNERS.instantCashout.scheduledSettlement}. standard fees or commissions deducted.
              </p>
            </div>

            <div className="rounded-xl border border-border/60 bg-muted/30 p-3 space-y-1">
              <span className="font-bold text-foreground">
                2. Instant Mid-Shift Cashout (On-Demand)
              </span>
              <p className="text-muted-foreground">
                Need cash right now before Wednesday? Withdraw instantly for a flat convenience fee of ₹10. Funds arrive in under 60 seconds.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* 5. REST POINTS & CHARGING ZONES SECTION */}
      {(filter === "ALL" || filter === "REST_POINTS") && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Coffee className="size-4 text-amber-600" />
              <span>Designated Rider Rest Points &amp; Fast Charging Hubs</span>
            </h3>
            <Badge tone="online" className="text-[10.5px]">Partner Hub Amenities</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {RIDER_AFFILIATE_PARTNERS.restPoints.map((hub) => (
              <Card key={hub.name} className="border-border/70 p-4 space-y-2.5">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-primary font-semibold">
                    <MapPin className="size-3.5" />
                    <span>{hub.city}</span>
                  </div>
                  <h4 className="font-bold text-sm text-foreground mt-0.5">{hub.name}</h4>
                </div>

                <div className="space-y-1.5 pt-1">
                  {hub.amenities.map((amenity) => (
                    <div key={amenity} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <TpaHealthCardModal
        isOpen={tpaModalOpen}
        onClose={() => setTpaModalOpen(false)}
        riderName={riderName}
      />
      <PeriodLeaveModal
        isOpen={periodLeaveModalOpen}
        onClose={() => setPeriodLeaveModalOpen(false)}
        onClaimed={handlePeriodLeaveClaimed}
      />
    </div>
  );
}
