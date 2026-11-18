import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardMeta } from "@/components/ui/card";
import {
  RIDER_AFFILIATE_PARTNERS,
  getTrustTier,
} from "@/lib/rider/affiliate-ecosystem";
import {
  CheckCircle2,
  Coffee,
  CreditCard,
  Crown,
  Download,
  Flower2,
  Gift,
  Hospital,
  MapPin,
  Phone,
  ShieldCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";

export const PERIOD_LEAVE_STORAGE_KEY = "ok_rider_female_leave_v1";

export function TpaCardQrCode({ value }: { value: string }) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(value)}`;
  return (
    <img
      src={qrUrl}
      alt={`Partner Welfare QR for ${value}`}
      width={88}
      height={88}
      className="size-20 sm:size-24 rounded-lg bg-white p-1.5 shadow-xs shrink-0 object-contain"
    />
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

  if (!isOpen) return null;

  const handleClaim = () => {
    const claimedDates =
      selectedOption === "2days"
        ? [todayStr, tomorrowStr]
        : selectedOption === "today"
          ? [todayStr]
          : [tomorrowStr];
    onClaimed(claimedDates);
    toast.success(`Period leave logged (${claimedDates.join(", ")}). Ratings and tier standing preserved.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl border border-rose-500/30 bg-card p-5 text-foreground shadow-2xl space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-rose-500/20 text-rose-500">
              <Flower2 className="size-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-foreground">
                Female Partner Period Leave
              </h3>
              <p className="text-xs text-muted-foreground">
                Up to 2 Days/Month · Penalty-Free Rest Policy
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close period leave modal"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs leading-relaxed space-y-1">
          <p className="font-semibold text-foreground">
            Standing Protection Policy
          </p>
          <p className="text-[11px] text-muted-foreground">
            Take rest days during your cycle with no impact on your acceptance rate, active streak, or partner tier standing.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-foreground block">
            Select Leave Duration
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
                  2 Consecutive Days
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {todayStr} and {tomorrowStr}
                </span>
              </div>
              <span className="font-mono text-xs text-rose-500 font-bold">2 Days</span>
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
              <span className="font-mono text-xs text-rose-500 font-bold">1 Day</span>
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-muted/30 p-3 text-xs space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Policy Terms:
          </span>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
              <span>Acceptance rate &amp; cancellation score unaffected</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
              <span>Partner tier rank preserved across leave dates</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
              <span>24x7 Safety &amp; Welfare Desk: +91-9395065587</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <Button variant="outline" onClick={onClose} className="w-1/3 text-xs">
            Cancel
          </Button>
          <Button
            onClick={handleClaim}
            className="w-2/3 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white gap-1.5"
          >
            <Flower2 className="size-3.5" />
            <span>Confirm Leave</span>
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
  riderId,
}: {
  isOpen: boolean;
  onClose: () => void;
  riderName?: string;
  riderId?: string;
}) {
  if (!isOpen) return null;

  const partnerCode = riderId ? `OK-${riderId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase()}` : "PENDING-KYC";
  const qrPayload = `ORDERKINGPAY|PARTNER:${partnerCode}|NAME:${riderName}|GSTIN:18AFXPH9838M1Z9|SUPPORT:+919395065587`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-5 text-foreground shadow-2xl space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="size-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-foreground">
                Statutory Partner Welfare &amp; Insurance ID
              </h3>
              <p className="text-xs text-muted-foreground">
                Code on Social Security, 2020 · Orderkingpay (GSTIN: 18AFXPH9838M1Z9)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close welfare card modal"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="relative overflow-hidden rounded-2xl border-2 border-emerald-500/50 bg-gradient-to-br from-emerald-950 via-[#0a231c] to-[#0d1f2d] p-5 text-white shadow-xl space-y-4">
          <div className="flex items-start justify-between border-b border-emerald-500/30 pb-3">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-400 block font-bold">
                Orderkingpay · Assam - 788710
              </span>
              <h4 className="text-sm font-black text-white">
                Partner On-Duty Accidental &amp; Medical Cover
              </h4>
            </div>
            <span className="rounded-md bg-emerald-500/20 border border-emerald-400/40 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
              {riderId ? "Active" : "KYC Required"}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-emerald-400/80 block">
                  Beneficiary Partner
                </span>
                <span className="font-bold text-sm text-white">{riderName}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-emerald-400/80 block">
                    Partner ID
                  </span>
                  <span className="font-mono font-bold text-emerald-200">
                    {partnerCode}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-emerald-400/80 block">
                    Entity GSTIN
                  </span>
                  <span className="font-mono font-bold text-emerald-200">
                    18AFXPH9838M1Z9
                  </span>
                </div>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-emerald-400/80 block">
                  Statutory Coverage
                </span>
                <span className="font-mono text-sm font-extrabold text-emerald-400">
                  ₹10,00,000 Accident · ₹1,00,000 Medical
                </span>
              </div>
            </div>

            <div className="flex flex-col items-center gap-1 shrink-0">
              <TpaCardQrCode value={qrPayload} />
              <span className="text-[9px] font-mono text-emerald-300/80">Partner Verification QR</span>
            </div>
          </div>

          <div className="border-t border-emerald-500/30 pt-3 flex items-center justify-between text-[10px] text-emerald-200/80 font-mono">
            <span>Code on Social Security, 2020</span>
            <a href="tel:+919395065587" className="flex items-center gap-1 font-bold text-emerald-300 hover:underline">
              <Phone className="size-3" /> +91-9395065587
            </a>
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-muted/30 p-3 text-xs space-y-1.5 text-muted-foreground">
          <p className="font-bold text-foreground">Emergency Claim &amp; Support Procedure:</p>
          <p className="text-[11px] leading-relaxed">
            1. In case of an on-duty accident, dial 112 / 108 first and trigger SOS inside the app.<br />
            2. Contact OrderKing Fleet Welfare Desk at +91-9395065587 with Partner ID {partnerCode}.<br />
            3. Submit hospital admission slip and KYC details for claim coordination.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => {
              const cardData = `ORDERKING DELIVERY PARTNER — STATUTORY WELFARE & INSURANCE ID
Statutory Entity: Orderkingpay, Hailakandi / Karimganj, Assam - 788710
GSTIN: 18AFXPH9838M1Z9
Partner ID: ${partnerCode}
Partner Name: ${riderName || "Delivery Partner"}
Statutory Framework: Code on Social Security, 2020 (Chapter IX)
Coverage: ₹10,00,000 Accidental Death & Disability | ₹1,00,000 Emergency Hospitalization
24x7 Fleet Welfare Desk: +91-9395065587
National Emergency: 112 (Police/SOS) | 108 (Ambulance)`;
              const blob = new Blob([cardData], { type: "text/plain;charset=utf-8" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `OrderKing_Welfare_Card_${partnerCode}.txt`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              toast.success("Partner Welfare ID copy downloaded.");
            }}
            variant="outline"
            className="w-1/2 text-xs font-semibold gap-1.5"
          >
            <Download className="size-3.5" />
            <span>Save Card Copy</span>
          </Button>
          <Button
            onClick={onClose}
            className="w-1/2 text-xs font-bold bg-primary text-white"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}

type CategoryFilter = "ALL" | "INSURANCE" | "FEMALE_WELFARE" | "CASHOUT" | "REST_POINTS";

export function RiderBenefitsHub({
  lifetimeDeliveries = 0,
  riderName,
  riderId,
}: {
  lifetimeDeliveries?: number;
  riderName?: string;
  riderId?: string;
}) {
  const [filter, setFilter] = useState<CategoryFilter>("ALL");
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
  const partnerCode = riderId ? `OK-${riderId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase()}` : "PENDING-KYC";
  const qrPayload = `ORDERKINGPAY|PARTNER:${partnerCode}|NAME:${riderName || "Delivery Partner"}|GSTIN:18AFXPH9838M1Z9|SUPPORT:+919395065587`;

  const handlePeriodLeaveClaimed = (dates: string[]) => {
    const claim = { dates, claimedAt: new Date().toLocaleDateString() };
    setClaimedPeriodLeave(claim);
    try {
      window.localStorage.setItem(PERIOD_LEAVE_STORAGE_KEY, JSON.stringify(claim));
    } catch {
      // Ignore storage failures
    }
  };

  return (
    <div className="space-y-4">
      <Card className="relative overflow-hidden border-border p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-white">
                <Gift className="size-4" />
              </span>
              <h2 className="font-display text-lg font-bold text-foreground">
                Partner Welfare &amp; Statutory Cover
              </h2>
              <span className="inline-flex items-center gap-1 rounded-md bg-orange-500/15 px-2 py-0.5 text-xs font-bold text-orange-600 dark:text-orange-400">
                <Crown className="size-3" />
                {trustTier.title}
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Statutory Code on Social Security 2020 cover, payout schedule, and Assam partner hubs.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-3 text-center sm:text-right shrink-0">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold block">
              COD Cash Limit ({trustTier.tier})
            </span>
            <span className="font-mono text-lg font-extrabold text-foreground">
              ₹{trustTier.floatingCashLimitInr.toLocaleString("en-IN")}
            </span>
            <span className="text-[10px] text-muted-foreground block">
              {lifetimeDeliveries} lifetime deliveries
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5 border-t border-border/60 pt-3">
          {[
            { id: "ALL", label: "All" },
            { id: "INSURANCE", label: "Insurance & Welfare" },
            { id: "FEMALE_WELFARE", label: "Period Leave" },
            { id: "CASHOUT", label: "Payout Rules" },
            { id: "REST_POINTS", label: "Assam Hubs" },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setFilter(cat.id as CategoryFilter)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                filter === cat.id
                  ? "bg-primary text-white shadow-xs"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </Card>

      {/* 1. CODE ON SOCIAL SECURITY 2020 INSURANCE & WELFARE SECTION */}
      {(filter === "ALL" || filter === "INSURANCE" || filter === "FEMALE_WELFARE") && (
        <Card className="border-border/70 p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600">
                <ShieldCheck className="size-5" />
              </span>
              <div>
                <CardTitle className="text-base">
                  On-Duty Accidental Insurance &amp; Social Security
                </CardTitle>
                <CardMeta>
                  {RIDER_AFFILIATE_PARTNERS.insurance.statute} · Chapter IX Gig Worker Welfare
                </CardMeta>
              </div>
            </div>
            <Badge tone="online" className="shrink-0">
              GSTIN: 18AFXPH9838M1Z9
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="rounded-xl border border-border/60 bg-muted/30 p-3 space-y-1">
              <span className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                Accidental Death Cover
              </span>
              <p className="font-mono text-base font-black text-foreground">
                {RIDER_AFFILIATE_PARTNERS.insurance.accidentalDeathCover}
              </p>
              <p className="text-[11px] text-muted-foreground">Payable to registered nominee</p>
            </div>

            <div className="rounded-xl border border-border/60 bg-muted/30 p-3 space-y-1">
              <span className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                Total Disability Cover
              </span>
              <p className="font-mono text-base font-black text-foreground">
                {RIDER_AFFILIATE_PARTNERS.insurance.disabilityCover}
              </p>
              <p className="text-[11px] text-muted-foreground">Permanent disability protection</p>
            </div>

            <div className="rounded-xl border border-border/60 bg-muted/30 p-3 space-y-1">
              <span className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                Emergency Medical Cover
              </span>
              <p className="font-mono text-base font-black text-emerald-600 dark:text-emerald-400">
                {RIDER_AFFILIATE_PARTNERS.insurance.hospitalizationCover}
              </p>
              <p className="text-[11px] text-muted-foreground">
                On-duty accidental hospitalization
              </p>
            </div>
          </div>

          {/* Statutory Partner Welfare ID Card with Real QR */}
          <div className="rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-950 via-[#0a231c] to-[#0f172a] p-4 text-white shadow-lg space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-500/30 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                  <Hospital className="size-4" />
                </span>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wide text-emerald-300">
                    Partner Welfare &amp; Insurance ID
                  </h4>
                  <span className="text-[11px] text-emerald-100/70 font-mono">
                    ID: {partnerCode} · Support: +91-9395065587
                  </span>
                </div>
              </div>
              <Badge tone="online" className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30 shrink-0">
                Orderkingpay Assam
              </Badge>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1.5 text-xs text-left w-full sm:w-auto">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-emerald-400/80 block">
                    Beneficiary Partner
                  </span>
                  <span className="font-bold text-sm text-white">
                    {riderName || "OrderKing Delivery Partner"}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-emerald-200">
                  <span>Partner ID: <strong>{partnerCode}</strong></span>
                  <span>Accident Cover: <strong>₹10,00,000</strong></span>
                </div>
                <p className="text-[11px] text-emerald-100/80">
                  Show this Partner ID and QR code when coordinating emergency medical claims with OrderKing Fleet Desk (+91-9395065587).
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <TpaCardQrCode value={qrPayload} />
                <Button
                  onClick={() => setTpaModalOpen(true)}
                  className="text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-black shrink-0"
                  size="sm"
                >
                  View Full ID
                </Button>
              </div>
            </div>
          </div>

          {/* Female Partner Period Leave */}
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-rose-500/20 text-rose-500">
                  <Flower2 className="size-4" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-foreground">
                    Female Delivery Partner Period Leave (2 Days/Month)
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Penalty-free rest leave with preserved acceptance rate and tier standing
                  </p>
                </div>
              </div>
              {claimedPeriodLeave ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-3" />
                  Leave Logged ({claimedPeriodLeave.dates.join(", ")})
                </span>
              ) : (
                <Button
                  onClick={() => setPeriodLeaveModalOpen(true)}
                  size="sm"
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shrink-0 gap-1.5"
                >
                  <Flower2 className="size-3.5" />
                  <span>Log Period Leave</span>
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] pt-1 border-t border-border/50 text-muted-foreground">
              <span>2 Days / Calendar Month</span>
              <span>No rating or streak penalty</span>
              <span>Tier standing preserved</span>
            </div>
          </div>
        </Card>
      )}

      {/* 2. PAYOUT SCHEDULE SECTION */}
      {(filter === "ALL" || filter === "CASHOUT") && (
        <Card className="border-border/70 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="size-4 text-primary" />
              <CardTitle className="text-sm font-bold">
                Payout Schedule &amp; On-Demand Withdrawal
              </CardTitle>
            </div>
            <Badge tone="online">NPCI IMPS / NEFT</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 space-y-1">
              <span className="font-bold text-emerald-800 dark:text-emerald-300">
                1. Scheduled Weekly Payout
              </span>
              <p className="text-muted-foreground">
                {RIDER_AFFILIATE_PARTNERS.instantCashout.scheduledSettlement}. Zero processing fee.
              </p>
            </div>

            <div className="rounded-xl border border-border/60 bg-muted/30 p-3 space-y-1">
              <span className="font-bold text-foreground">
                2. On-Demand Early Withdrawal
              </span>
              <p className="text-muted-foreground">
                Withdraw settled earnings before Wednesday for a flat ₹10 IMPS transfer fee (₹5 for Gold, ₹0 for Diamond).
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* 3. ASSAM REST POINTS & PARTNER HUBS */}
      {(filter === "ALL" || filter === "REST_POINTS") && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Coffee className="size-4 text-orange-600" />
              <span>OrderKing Assam Partner Hubs &amp; Rest Points</span>
            </h3>
            <Badge tone="online" className="text-[10.5px]">Assam Operations</Badge>
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
        riderId={riderId}
      />
      <PeriodLeaveModal
        isOpen={periodLeaveModalOpen}
        onClose={() => setPeriodLeaveModalOpen(false)}
        onClaimed={handlePeriodLeaveClaimed}
      />
    </div>
  );
}
