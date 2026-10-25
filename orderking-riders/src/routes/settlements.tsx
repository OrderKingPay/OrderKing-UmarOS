import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/rider/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardMeta, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { errorMessage, newIdempotencyKey } from "@/lib/client/errors";
import { DEFAULT_BRANDING } from "@/lib/rider/config";
import { useI18n } from "@/lib/rider/i18n-context";
import { formatPaise, computeNextWednesdaySettlementIst, computeNextDailySettlementIst } from "@/lib/rider/money";
import {
  bootstrapRiderFn,
  createTicketFn,
  getEarningsFn,
  getSettlementsFn,
  saveProfileFn,
} from "@/lib/server/rider-fns";
import type { RiderProfile, Settlement } from "@/lib/rider/types";
import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  Building2,
  CalendarClock,
  CheckCircle2,
  Download,
  Edit3,
  FileSpreadsheet,
  FileText,
  Printer,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/settlements")({ component: SettlementsDesk });

type Preset = "today" | "yesterday" | "week" | "month";

const ACK_STORAGE_KEY = "orderking_acknowledged_settlements_v1";

export function SettlementsDesk() {
  const { t } = useI18n();
  const [preset, setPreset] = useState<Preset>("week");
  const [rider, setRider] = useState<RiderProfile | null>(null);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [earnings, setEarnings] = useState<Awaited<ReturnType<typeof getEarningsFn>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Self-Service Mandate Update State
  const [editingMandate, setEditingMandate] = useState(false);
  const [upiInput, setUpiInput] = useState("");
  const [bankLast4Input, setBankLast4Input] = useState("");
  const [savingMandate, setSavingMandate] = useState(false);

  // Settlement Acknowledgement State
  const [acknowledgedIds, setAcknowledgedIds] = useState<Record<string, string>>({});
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  // Self-Service Reconciliation Ticket State
  const [disputeNote, setDisputeNote] = useState("");
  const [submittingDispute, setSubmittingDispute] = useState(false);

  const nextPayoutWindow = useMemo(() => computeNextDailySettlementIst(), []);
  const nextWeeklyPayout = useMemo(() => computeNextWednesdaySettlementIst(), []);

  async function loadAll(selectedPreset: Preset) {
    setLoading(true);
    setError(null);
    try {
      const [profileData, settlementsData, earningsData] = await Promise.all([
        bootstrapRiderFn(),
        getSettlementsFn(),
        getEarningsFn({ data: { preset: selectedPreset } }),
      ]);
      setRider(profileData);
      setUpiInput(profileData.payoutUpi ?? "");
      setBankLast4Input(profileData.payoutBankLast4 ?? "");
      setSettlements(settlementsData);
      setEarnings(earningsData);
    } catch (e) {
      setError(errorMessage(e, t("connectionLostBody")));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    try {
      const raw = localStorage.getItem(ACK_STORAGE_KEY);
      if (raw) {
        setAcknowledgedIds(JSON.parse(raw) as Record<string, string>);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void loadAll(preset);
  }, [preset]);

  async function confirmSettlementSeenFn(settlement: Settlement) {
    setConfirmingId(settlement.id);
    try {
      const stamp = new Date().toISOString();
      const nextMap = { ...acknowledgedIds, [settlement.id]: stamp };
      setAcknowledgedIds(nextMap);
      try {
        localStorage.setItem(ACK_STORAGE_KEY, JSON.stringify(nextMap));
      } catch {
        /* ignore */
      }
      if (rider) {
        const updated = await saveProfileFn({
          data: {
            availabilityNotes: `${rider.availabilityNotes ? `${rider.availabilityNotes} | ` : ""}ACK_SETTLEMENT:${settlement.id}@${stamp.slice(0, 10)}`,
          },
        });
        setRider(updated);
      }
      toast.success(`Settlement batch ${settlement.id.slice(0, 8)} acknowledged in Order King Partner Ledger.`);
    } catch (e) {
      toast.error(errorMessage(e, t("actionNotConfirmed")));
    } finally {
      setConfirmingId(null);
    }
  }

  async function handleSaveMandate(e: FormEvent) {
    e.preventDefault();
    if (!upiInput.trim() || !/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(upiInput.trim())) {
      setError("Please enter a valid UPI VPA handle (e.g., 9876543210@ybl or partner@okaxis).");
      return;
    }
    setSavingMandate(true);
    setError(null);
    try {
      const updated = await saveProfileFn({
        data: {
          payoutUpi: upiInput.trim().toLowerCase(),
          payoutBankLast4: bankLast4Input.trim().replace(/\D/g, "").slice(-4) || null,
        },
      });
      setRider(updated);
      setEditingMandate(false);
      toast.success("Bank & UPI settlement mandate updated for upcoming Wednesday payout.");
    } catch (e) {
      setError(errorMessage(e, t("actionNotConfirmed")));
    } finally {
      setSavingMandate(false);
    }
  }

  function downloadCsvVoucher(batch?: Settlement) {
    const rows: string[][] = [
      ["Orderkingpay - Official Partner Settlement & Section 194-O Tax Voucher"],
      ["Platform GSTIN", "18AFXPH9838M1Z9"],
      ["Partner Name", rider?.fullName || "Verified Delivery Partner"],
      ["Partner ID", rider?.id || "N/A"],
      ["Registered Mobile", rider?.phone || "N/A"],
      ["Settlement UPI Mandate", rider?.payoutUpi || "Not Configured"],
      ["Bank Account Last 4", rider?.payoutBankLast4 ? `XXXX-${rider.payoutBankLast4}` : "UPI Linked"],
      ["Statement Generated At", new Date().toISOString()],
      [],
      ["--- SETTLEMENT BATCH SUMMARY ---"],
      ["Batch ID", "Period Start", "Period End", "Status", "Amount (INR)", "Confirmed Paid At"],
    ];

    const targetBatches = batch ? [batch] : settlements;
    for (const s of targetBatches) {
      rows.push([
        s.id,
        s.periodStart,
        s.periodEnd,
        s.status,
        (s.amountPaise / 100).toFixed(2),
        s.confirmedPaidAt || "Scheduled Wednesday 14:00 IST Batch",
      ]);
    }

    rows.push([]);
    rows.push(["--- ITEMIZED EARNING LEDGER LINES ---"]);
    rows.push(["Line ID", "Timestamp", "Category", "Order Code", "Amount (INR)", "Ledger Note"]);

    for (const line of earnings?.lines ?? []) {
      rows.push([
        line.id,
        line.at,
        line.kind,
        line.orderCode || "N/A",
        (line.amountPaise / 100).toFixed(2),
        `"${(line.note || "").replace(/"/g, '""')}"`,
      ]);
    }

    const csvContent = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `OrderKing_Settlement_Voucher_${batch ? batch.id.slice(0, 8) : preset}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Settlement Voucher CSV downloaded for ITR / Bank income proof.");
  }

  async function handleRaiseReconciliationTicket(e: FormEvent) {
    e.preventDefault();
    if (!disputeNote.trim()) return;
    setSubmittingDispute(true);
    try {
      await createTicketFn({
        data: {
          topic: "PAYMENT_ISSUE",
          message: `[SETTLEMENT RECONCILIATION] ${disputeNote.trim()}`,
          deliveryId: null,
          idempotencyKey: newIdempotencyKey(),
        },
      });
      setDisputeNote("");
      toast.success("Settlement reconciliation ticket logged in Order King Support Desk.");
    } catch (e) {
      toast.error(errorMessage(e, t("actionNotConfirmed")));
    } finally {
      setSubmittingDispute(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6 font-sans">
        {/* 1. HEADER & ORDER KING TREASURY EXPLANATION */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Link
                to="/earnings"
                className="inline-flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition"
                title="Back to Earnings"
              >
                <ArrowLeft className="size-4" />
              </Link>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                    <ShieldCheck className="size-3.5 text-emerald-700" />
                    Order King Autonomous Treasury &amp; Tax Desk
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500">
                    Zero-Commission Partner Ledger
                  </span>
                </div>
                <h1 className="mt-1 font-display text-2xl sm:text-3xl font-bold text-slate-900">
                  Daily &amp; Weekly Payouts, Bank Mandate &amp; Tax Statements
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadCsvVoucher()}
                className="inline-flex items-center gap-1.5 border-slate-300 bg-white text-slate-800"
              >
                <FileSpreadsheet className="size-4 text-emerald-700" />
                <span>Download CSV Voucher</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 border-slate-300 bg-white text-slate-800"
              >
                <Printer className="size-4 text-slate-700" />
                <span>Print / Save PDF</span>
              </Button>
            </div>
          </div>

          {/* Human-Style Explanation of Settlement Schedule */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 text-xs text-slate-800 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-emerald-950 flex items-center gap-1.5 text-sm">
                  <CalendarClock className="size-4 text-emerald-700" />
                  Next-Day Daily Settlement (Default)
                </span>
                <span className="rounded-md bg-emerald-800 px-2 py-0.5 text-[10px] font-bold text-white">
                  In ~{nextPayoutWindow.hoursRemaining}h
                </span>
              </div>
              <p className="leading-relaxed text-slate-700">
                <strong>00:00–23:59:59 Midnight Cutoff:</strong> Shifts worked until 12:00 AM reconcile at 00:05 AM. Net payout releases next day between <strong>10:00 AM &amp; 12:00 PM IST</strong> directly to your UPI handle or Bank A/C.
              </p>
            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-4 text-xs text-slate-800 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-blue-950 flex items-center gap-1.5 text-sm">
                  <CalendarClock className="size-4 text-blue-700" />
                  Weekly Wednesday Sweep
                </span>
                <span className="rounded-md bg-blue-800 px-2 py-0.5 text-[10px] font-bold text-white">
                  In ~{nextWeeklyPayout.hoursRemaining}h
                </span>
              </div>
              <p className="leading-relaxed text-slate-700">
                <strong>Monday–Sunday Sweep:</strong> Full multi-day statutory reconciliation and cumulative tax summary disbursed every Wednesday at 14:00 IST via NEFT/IMPS with Section 194-O TDS compliance.
              </p>
            </div>
          </div>
        </div>

        {error ? (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-800">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        {/* 2. SELF-SERVICE BANK & UPI MANDATE CARD */}
        <Card className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="flex size-10 items-center justify-center rounded-xl bg-slate-100 text-slate-800">
                <Building2 className="size-5" />
              </div>
              <div>
                <CardTitle>Active Bank &amp; UPI Settlement Mandate</CardTitle>
                <CardMeta>
                  All weekly Wednesday settlements and instant tip transfers are routed to this account
                </CardMeta>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingMandate((v) => !v)}
              className="inline-flex items-center gap-1.5"
            >
              <Edit3 className="size-3.5" />
              <span>{editingMandate ? "Cancel" : "Update UPI / Bank Mandate"}</span>
            </Button>
          </div>

          {editingMandate ? (
            <form
              onSubmit={handleSaveMandate}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-border"
            >
              <div>
                <Label className="text-xs">Verified UPI ID (VPA) *</Label>
                <Input
                  className="mt-1"
                  required
                  placeholder="e.g. 9876543210@ybl or name@okaxis"
                  value={upiInput}
                  onChange={(e) => setUpiInput(e.target.value.toLowerCase())}
                />
              </div>
              <div>
                <Label className="text-xs">Bank Account Last 4 Digits</Label>
                <Input
                  className="mt-1"
                  maxLength={4}
                  inputMode="numeric"
                  placeholder="e.g. 4821"
                  value={bankLast4Input}
                  onChange={(e) => setBankLast4Input(e.target.value.replace(/\D/g, ""))}
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" className="w-full" disabled={savingMandate}>
                  {savingMandate ? "Saving Mandate..." : "Save Settlement Mandate"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
              <div className="rounded-xl border border-border bg-bg/60 p-3">
                <span className="text-[11px] text-muted-foreground block">Primary Settlement UPI ID</span>
                <p className="mt-0.5 text-sm font-bold text-fg">
                  {rider?.payoutUpi || "Not configured — click Update"}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-bg/60 p-3">
                <span className="text-[11px] text-muted-foreground block">Linked Bank Account</span>
                <p className="mt-0.5 text-sm font-bold text-fg">
                  {rider?.payoutBankLast4 ? `A/C Ending XXXX-${rider.payoutBankLast4}` : "Settled via UPI Mandate"}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-bg/60 p-3">
                <span className="text-[11px] text-muted-foreground block">KYC &amp; Payout Readiness</span>
                <p className="mt-0.5 text-sm font-bold text-online">
                  {rider?.kycStatus === "VERIFIED"
                    ? "Verified & Active for Payout"
                    : `KYC Status: ${rider?.kycStatus || "PENDING"}`}
                </p>
              </div>
            </div>
          )}
        </Card>

        {/* 3. PERIOD EARNINGS & CASH RECONCILIATION BREAKDOWN */}
        <Card className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle>Order King Ledger Reconciliation Breakdown</CardTitle>
              <CardMeta>
                Real-time computation of delivery payouts, incentives, tips, and COD cash in hand
              </CardMeta>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(["today", "yesterday", "week", "month"] as const).map((p) => (
                <Button
                  key={p}
                  size="sm"
                  variant={preset === p ? "default" : "outline"}
                  onClick={() => setPreset(p)}
                >
                  {t(p === "week" ? "thisWeek" : p === "month" ? "thisMonth" : p)}
                </Button>
              ))}
              <Button
                size="sm"
                variant="outline"
                onClick={() => void loadAll(preset)}
                disabled={loading}
                title="Refresh Ledger"
              >
                <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>

          {earnings ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-border bg-bg/50 p-3.5">
                <span className="text-[11px] font-medium text-muted-foreground block">
                  {t("payout")}
                </span>
                <span className="mt-1 block font-display text-xl font-bold text-fg">
                  {formatPaise(earnings.totals.payout)}
                </span>
              </div>
              <div className="rounded-xl border border-border bg-bg/50 p-3.5">
                <span className="text-[11px] font-medium text-muted-foreground block">
                  {t("incentive")} &amp; Adjustments
                </span>
                <span className="mt-1 block font-display text-xl font-bold text-fg">
                  {formatPaise(earnings.totals.incentive + earnings.totals.adjustment)}
                </span>
              </div>
              <div className="rounded-xl border border-border bg-bg/50 p-3.5">
                <span className="text-[11px] font-medium text-muted-foreground block">
                  100% {t("customerTip")}
                </span>
                <span className="mt-1 block font-display text-xl font-bold text-online">
                  {formatPaise(earnings.totals.tip ?? 0)}
                </span>
              </div>
              <div className="rounded-xl border border-emerald-300 bg-emerald-50/70 p-3.5 text-slate-900">
                <span className="text-[11px] font-bold uppercase text-emerald-900 block">
                  {t("netPayable")}
                </span>
                <span className="mt-1 block font-display text-2xl font-extrabold text-emerald-900">
                  {formatPaise(earnings.totals.netPayable)}
                </span>
              </div>
            </div>
          ) : null}

          {earnings ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <span className="text-muted-foreground">{t("cashCollectedLabel")} (COD)</span>
                <span className="font-bold">{formatPaise(earnings.totals.cashCollected)}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <span className="text-muted-foreground">{t("cashReconciled")}</span>
                <span className="font-bold">{formatPaise(earnings.totals.cashReconciled)}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <span className="text-muted-foreground">{t("deduction")}</span>
                <span className="font-bold">{formatPaise(earnings.totals.deduction)}</span>
              </div>
            </div>
          ) : null}
        </Card>

        {/* 4. WEEKLY SETTLEMENT BATCHES & VOUCHER ACKNOWLEDGEMENT */}
        <Card className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Banknote className="size-5 text-primary" />
              <div>
                <CardTitle>Settlement Batches &amp; Payment Vouchers</CardTitle>
                <CardMeta>
                  Verify your weekly settlement batches and download official CSV/PDF vouchers for bank loans or ITR filing
                </CardMeta>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {settlements.map((s) => {
              const ackTimestamp = acknowledgedIds[s.id];
              const isConfirmed = Boolean(s.confirmedPaidAt || ackTimestamp);
              return (
                <div
                  key={s.id}
                  className="rounded-xl border border-border bg-bg/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-fg">
                        Batch #{s.id.slice(0, 10).toUpperCase()}
                      </span>
                      <Badge
                        tone={
                          s.status === "PAID"
                            ? "online"
                            : s.status === "FAILED" || s.status === "DISPUTED"
                              ? "offline"
                              : "busy"
                        }
                      >
                        {s.status}
                      </Badge>
                      {isConfirmed && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                          <CheckCircle2 className="size-3" />
                          Statement Verified by Partner
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Settlement Period: <strong>{s.periodStart}</strong> to{" "}
                      <strong>{s.periodEnd}</strong>
                      {s.confirmedPaidAt ? ` · Paid at ${s.confirmedPaidAt.slice(0, 16)}` : " · Scheduled for Wednesday 14:00 IST Batch"}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <span className="font-display text-2xl font-bold text-fg mr-2">
                      {formatPaise(s.amountPaise)}
                    </span>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadCsvVoucher(s)}
                      className="inline-flex items-center gap-1.5"
                    >
                      <Download className="size-3.5" />
                      <span>Voucher CSV</span>
                    </Button>

                    <Button
                      size="sm"
                      variant={isConfirmed ? "outline" : "default"}
                      disabled={confirmingId === s.id || isConfirmed}
                      onClick={() => void confirmSettlementSeenFn(s)}
                    >
                      {confirmingId === s.id
                        ? "Recording..."
                        : isConfirmed
                          ? "Acknowledged"
                          : "Acknowledge Statement"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* 5. STATUTORY TAX COMPLIANCE & SELF-SERVICE DISPUTE DESK */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="size-5 text-primary" />
              <CardTitle>Statutory Tax &amp; Social Security Certificate Note</CardTitle>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Under the <strong>Income Tax Act, 1961</strong> and the{" "}
              <strong>Code on Social Security, 2020</strong>, your delivery earnings with{" "}
              {DEFAULT_BRANDING.legalCompanyName} are recorded as independent delivery partner service payouts.
            </p>
            <ul className="space-y-1.5 text-xs text-muted-foreground list-disc pl-4">
              <li>
                <strong>Zero Platform Commission on Rider Earnings:</strong> 100% of your calculated delivery fare, incentives, and customer tips are remitted without platform service fee deductions.
              </li>
              <li>
                <strong>Income Proof for Bank Loans &amp; ITR-4:</strong> Use the{" "}
                <em>Download CSV Voucher</em> or <em>Print / Save PDF</em> buttons above as verified proof of commercial gig earnings.
              </li>
            </ul>
          </Card>

          <Card className="space-y-3">
            <CardTitle>Self-Service Settlement Reconciliation Desk</CardTitle>
            <CardMeta>
              Missing a wait-time payout, tip, or COD reconciliation? Log an auditable ledger ticket directly to Order King Treasury.
            </CardMeta>
            <form onSubmit={handleRaiseReconciliationTicket} className="space-y-2.5 pt-1">
              <Input
                placeholder="Describe order code, batch date, or payout discrepancy..."
                value={disputeNote}
                onChange={(e) => setDisputeNote(e.target.value)}
                required
              />
              <Button type="submit" size="sm" disabled={submittingDispute || !disputeNote.trim()}>
                {submittingDispute ? "Submitting Ledger Ticket..." : "Log Settlement Reconciliation Ticket"}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
