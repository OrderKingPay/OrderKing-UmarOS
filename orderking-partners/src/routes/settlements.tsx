import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { VendorShell } from "@/components/vendor-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { MoneyText } from "@/components/money-text";
import { useT } from "@/components/use-t";
import { useVendor } from "@/components/use-vendor";
import { getSettlements, requestExpressDailyPayout } from "@/lib/server/api-finance";
import { getRestaurant, updateRestaurantProfile } from "@/lib/server/api-bootstrap";
import { validateIfsc } from "@/lib/merchant-kyc";
import { formatINR, STATUTORY_TAX_RATES } from "@/lib/money";
import { can } from "@/lib/rbac";
import { platformConfig } from "@/lib/platform-config";
import { useCommissionTokens } from "@orderking/ui";
import { MonthlyGstr1InvoiceModal } from "@/components/settlements/monthly-gstr1-invoice-modal";
import {
  Banknote,
  Building2,
  CheckCircle2,
  Clock,
  Download,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  Info,
  Printer,
  Scale,
  ShieldCheck,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/settlements")({ component: SettlementsPage });

function SettlementsPage() {
  const t = useT();
  const vendor = useVendor();
  const qc = useQueryClient();
  const allowed = vendor.role ? can(vendor.role, "settlements.view") : false;
  const canEditBank = vendor.role ? can(vendor.role, "settings.financial") : false;

  const [selectedCycle, setSelectedCycle] = useState<"STANDARD_WEEKLY" | "EXPRESS_DAILY">("STANDARD_WEEKLY");
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [expressSettling, setExpressSettling] = useState(false);
  const [expressSuccess, setExpressSuccess] = useState<{
    batchId: string;
    grossAmountPaise: number;
    earlyLiquidityFeePaise: number;
    feeGstPaise: number;
    netPayoutPaise: number;
    payoutDate: string;
  } | null>(null);
  const [expressError, setExpressError] = useState<string | null>(null);

  const [editingBank, setEditingBank] = useState(false);
  const [bankHolder, setBankHolder] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankIfsc, setBankIfsc] = useState("");
  const [bankSaving, setBankSaving] = useState(false);
  const [bankMsg, setBankMsg] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ["settle", vendor.restaurantId],
    queryFn: () => getSettlements({ data: { restaurantId: vendor.restaurantId } }),
    enabled: Boolean(vendor.restaurantId) && allowed,
  });

  const restQ = useQuery({
    queryKey: ["restaurant", vendor.restaurantId],
    queryFn: () => getRestaurant({ data: { restaurantId: vendor.restaurantId } }),
    enabled: Boolean(vendor.restaurantId) && allowed,
  });

  const currentPayable = q.data?.currentPayablePaise ?? 0;
  const earlyFeePaise = Math.round((currentPayable * STATUTORY_TAX_RATES.EXPRESS_DAILY_EARLY_LIQUIDITY_FEE_BPS) / 10000);
  const earlyFeeGstPaise = Math.round((earlyFeePaise * 18) / 100);
  const expressNetDisbursed = Math.max(0, currentPayable - earlyFeePaise - earlyFeeGstPaise);

  const handleRequestExpressDailyPayout = async () => {
    if (!vendor.restaurantId || currentPayable <= 0) return;
    setExpressSettling(true);
    setExpressError(null);
    setExpressSuccess(null);
    try {
      const res = await requestExpressDailyPayout({
        data: {
          restaurantId: vendor.restaurantId,
          idempotencyKey: `exp_ui_${vendor.restaurantId}_${Date.now()}`,
        },
      });
      setExpressSuccess({
        batchId: res.batchId,
        grossAmountPaise: res.grossAmountPaise,
        earlyLiquidityFeePaise: res.earlyLiquidityFeePaise,
        feeGstPaise: res.feeGstPaise,
        netPayoutPaise: res.netPayoutPaise,
        payoutDate: res.payoutDate,
      });
      await qc.invalidateQueries({ queryKey: ["settle"] });
    } catch (error) {
      setExpressError(error instanceof Error ? error.message : "Express settlement unavailable");
    } finally {
      setExpressSettling(false);
    }
  };

  if (vendor.role && !allowed) {
    return (
      <VendorShell title={t("nav.settlements")} dataLabel={vendor.dataLabel}>
        <Card className="p-6 text-sm text-gray-500 bg-white border-gray-200">
          {t("settings.financialLocked")}
        </Card>
      </VendorShell>
    );
  }

  function download(kind: "csv" | "json", batchId?: string) {
    const allBatches = q.data?.batches ?? [];
    const batches = batchId ? allBatches.filter((b) => b.id === batchId) : allBatches;
    if (kind === "json") {
      const blob = new Blob([JSON.stringify({ dataLabel: q.data?.dataLabel, batches }, null, 2)], {
        type: "application/json",
      });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = batchId ? `orderking-settlement-${batchId}.json` : "orderking-settlement.json";
      a.click();
      return;
    }
    const headers = [
      "order_number",
      "gross_sales_paise",
      "food_value_paise",
      "packing_paise",
      "restaurant_discount_paise",
      "platform_funded_discount_paise",
      "net_taxable_supply_paise",
      "commission_paise",
      "commission_gst_paise",
      "gateway_fee_paise",
      "gateway_fee_gst_paise",
      "tcs_sec52_paise",
      "tds_sec194o_paise",
      "sec9_5_food_gst_platform_remitted_paise",
      "refund_adjustment_paise",
      "net_payable_paise",
    ];
    const lines = [headers.join(",")];
    for (const b of batches) {
      for (const l of b.lines) {
        lines.push(
          [
            l.order_number,
            l.grossSalesPaise,
            l.foodValuePaise,
            l.packingPaise,
            l.restaurantDiscountPaise,
            l.platformFundedDiscountPaise,
            l.netTaxableSupplyPaise,
            l.commissionPaise,
            l.commissionGstPaise,
            l.gatewayFeePaise,
            l.gatewayFeeGstPaise,
            l.tcsSec52Paise,
            l.tdsSec194OPaise,
            l.sec9_5GstPaise,
            l.refundAdjustmentPaise,
            l.restaurantPayablePaise,
          ].join(","),
        );
      }
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = batchId ? `orderking-settlement-${batchId}.csv` : "orderking-settlement.csv";
    a.click();
  }

  async function handleSaveBankDetails() {
    if (!vendor.restaurantId) return;
    setBankMsg(null);
    const r = restQ.data?.restaurant;
    const nextHolder = (bankHolder || String(r?.bank_name ?? "")).trim();
    const nextAcct = (bankAccount || String(r?.bank_account ?? "")).trim();
    const nextIfsc = (bankIfsc || String(r?.bank_ifsc ?? "")).trim().toUpperCase();

    if (!nextAcct || !validateIfsc(nextIfsc)) {
      setBankMsg("Please provide a valid bank account number and 11-character IFSC code (e.g. HDFC0001234).");
      return;
    }

    setBankSaving(true);
    try {
      await updateRestaurantProfile({
        data: {
          restaurantId: vendor.restaurantId,
          bankName: nextHolder,
          bankAccount: nextAcct,
          bankIfsc: nextIfsc,
        },
      });
      await qc.invalidateQueries({ queryKey: ["restaurant"] });
      setEditingBank(false);
      setBankMsg("Settlement bank account & IFSC updated.");
    } catch (err) {
      setBankMsg(err instanceof Error ? err.message : "Could not update bank details");
    } finally {
      setBankSaving(false);
    }
  }

  const commissionTokens = useCommissionTokens();
  const effectiveCommissionPct = (
    (vendor.selected?.commissionBps ??
      commissionTokens.standardDeliveryBps ??
      platformConfig.commission.targetBps) /
    100
  ).toFixed(1);

  const allLines = (q.data?.batches ?? []).flatMap((b) => b.lines);
  const totals = allLines.reduce(
    (acc, l) => {
      acc.food += l.foodValuePaise;
      acc.packing += l.packingPaise;
      acc.gross += l.grossSalesPaise;
      acc.delivery += Math.round(l.grossSalesPaise * 0.05);
      acc.restDisc += l.restaurantDiscountPaise;
      acc.platDisc += l.platformFundedDiscountPaise;
      acc.commission += l.commissionPaise;
      acc.commGst += l.commissionGstPaise;
      acc.gwFee += l.gatewayFeePaise;
      acc.gwGst += l.gatewayFeeGstPaise;
      acc.tcs += l.tcsSec52Paise;
      acc.tds += l.tdsSec194OPaise;
      acc.sec9_5 += l.sec9_5GstPaise;
      acc.refund += l.refundAdjustmentPaise;
      acc.payable += l.restaurantPayablePaise;
      return acc;
    },
    {
      food: 0,
      packing: 0,
      gross: 0,
      delivery: 0,
      restDisc: 0,
      platDisc: 0,
      commission: 0,
      commGst: 0,
      gwFee: 0,
      gwGst: 0,
      tcs: 0,
      tds: 0,
      sec9_5: 0,
      refund: 0,
      payable: 0,
    },
  );

  const r = restQ.data?.restaurant;

  return (
    <VendorShell
      title={t("nav.settlements")}
      dataLabel={q.data?.dataLabel ?? vendor.dataLabel}
      restaurantName={vendor.selected?.restaurantName}
    >
      <div className="space-y-5">
        {/* Dual Settlement Cycle Switcher & Accrued Balance Hero Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 border-gray-200 bg-white p-5 shadow-xs relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <span className="text-xs uppercase tracking-wider text-[#E23744] font-bold flex items-center gap-1.5">
                  <Scale className="size-3.5" />
                  Settlement & Payouts
                </span>
                <h2 className="text-xl font-display font-bold text-gray-900 mt-1">
                  Settlement Ledger & Payout History
                </h2>
              </div>

              {/* Cycle Toggle */}
              <div className="inline-flex rounded-xl bg-gray-100 p-1 border border-gray-200">
                <button
                  type="button"
                  onClick={() => setSelectedCycle("STANDARD_WEEKLY")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center gap-1.5 ${selectedCycle === "STANDARD_WEEKLY"
                      ? "bg-white text-gray-900 shadow-xs"
                      : "text-gray-500 hover:text-gray-800"
                    }`}
                >
                  <Clock className="size-3.5" />
                  Standard Weekly (Wed)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCycle("EXPRESS_DAILY")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center gap-1.5 ${selectedCycle === "EXPRESS_DAILY"
                      ? "bg-[#E23744] text-white shadow-xs"
                      : "text-gray-500 hover:text-gray-800"
                    }`}
                >
                  <Zap className="size-3.5" />
                  Express Daily (T+1)
                </button>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Accrued Delivered Orders Balance
                </div>
                <div className="font-display text-3xl font-extrabold text-gray-900 mt-1 tabular">
                  {q.data ? <MoneyText paise={currentPayable} /> : "—"}
                </div>
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                  <Info className="size-3.5 text-gray-400" />
                  {selectedCycle === "STANDARD_WEEKLY"
                    ? "Disbursed weekly on Wednesday for Monday 00:00:00 to Sunday 23:59:59 orders (Standard settlement)."
                    : "Available for instant T+1 payout of yesterday's net earnings for a nominal 0.5% liquidity fee."}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowInvoiceModal(true)}
                  className="h-9 text-xs border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-semibold flex items-center gap-1.5 rounded-xl"
                >
                  <FileText className="size-4 text-[#E23744]" />
                  Monthly Tax Invoice (PDF)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => download("csv")}
                  className="h-9 text-xs border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-semibold flex items-center gap-1.5 rounded-xl"
                >
                  <FileSpreadsheet className="size-4 text-emerald-600" />
                  {t("settlements.exportCsv")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => download("json")}
                  className="h-9 text-xs border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-semibold flex items-center gap-1.5 rounded-xl"
                >
                  <Download className="size-4 text-gray-500" />
                  {t("settlements.exportJson")}
                </Button>
              </div>
            </div>
          </Card>

          {/* Express Daily (T+1) Action Card */}
          <Card className="border-gray-200 bg-white p-5 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#E23744] font-bold uppercase flex items-center gap-1.5">
                  <Zap className="size-3.5 text-orange-500" />
                  Express Daily Payout
                </span>
                <span className="rounded bg-orange-50 border border-orange-200 text-orange-900 px-2 py-0.5 text-[10px] font-bold">
                  T+1 DISBURSEMENT
                </span>
              </div>
              <h3 className="font-bold text-gray-900 text-base mt-2">
                Withdraw Yesterday's Earnings
              </h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Receive direct bank transfer today with a nominal 0.5% early-liquidity fee.
              </p>

              <div className="mt-3 p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-1 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Accrued Amount:</span>
                  <span className="font-semibold text-gray-900">{formatINR(currentPayable)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>0.5% Liquidity Fee:</span>
                  <span className="text-rose-600 font-semibold">−{formatINR(earlyFeePaise)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>18% GST on Fee:</span>
                  <span className="text-rose-600 font-semibold">−{formatINR(earlyFeeGstPaise)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-1 font-bold text-gray-900">
                  <span>Net Disbursed:</span>
                  <span className="text-emerald-700 font-bold">{formatINR(expressNetDisbursed)}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <Button
                size="sm"
                disabled={currentPayable <= 0 || expressSettling}
                onClick={() => void handleRequestExpressDailyPayout()}
                className="w-full bg-[#E23744] hover:bg-[#d32f2f] text-white font-bold text-xs h-10 rounded-xl shadow-xs"
              >
                {expressSettling ? (
                  "Initiating Transfer..."
                ) : (
                  <>
                    <Zap className="mr-1.5 size-4 text-orange-300" />
                    Request Express Payout ({formatINR(expressNetDisbursed)})
                  </>
                )}
              </Button>

              {expressSuccess && (
                <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-2.5 text-xs text-emerald-800 space-y-0.5">
                  <div className="font-bold flex items-center gap-1">
                    <CheckCircle2 className="size-3.5" /> Express Payout Initiated!
                  </div>
                  <div className="text-[11px] text-gray-600">
                    Batch: {expressSuccess.batchId} · Disbursed: {formatINR(expressSuccess.netPayoutPaise)}
                  </div>
                </div>
              )}

              {expressError && (
                <div className="rounded-lg border border-rose-300 bg-rose-50 p-2.5 text-xs text-rose-800">
                  {expressError}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Self-Service Settlement Bank Account */}
        <Card className="border-gray-200 bg-white p-4 space-y-3 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Building2 className="size-4 text-[#E23744]" />
              <div>
                <h3 className="font-bold text-gray-900 text-sm">
                  Registered Settlement Bank Account
                </h3>
                <p className="text-xs text-gray-500">
                  Beneficiary: <span className="text-gray-900 font-medium">{r?.bank_name || r?.name || "—"}</span>
                  {" · "}Account: <span className="font-mono text-gray-900 font-semibold">{r?.bank_account || "Not set"}</span>
                  {" · "}IFSC: <span className="font-mono text-emerald-700 font-semibold">{r?.bank_ifsc || "Not set"}</span>
                </p>
              </div>
            </div>
            {canEditBank ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditingBank(!editingBank)}
                className="text-xs border-gray-300 text-gray-700 rounded-xl"
              >
                {editingBank ? "Cancel" : "Update Bank Account"}
              </Button>
            ) : null}
          </div>

          {editingBank && canEditBank ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-gray-100">
              <div>
                <Label className="text-xs text-gray-700 font-semibold">Beneficiary Name</Label>
                <Input
                  value={bankHolder || String(r?.bank_name ?? "")}
                  onChange={(e) => setBankHolder(e.target.value)}
                  placeholder="Account holder name"
                  className="h-10 text-xs bg-white border-gray-300 text-gray-900 rounded-xl"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-700 font-semibold">Bank Account Number</Label>
                <Input
                  value={bankAccount || String(r?.bank_account ?? "")}
                  onChange={(e) => setBankAccount(e.target.value)}
                  placeholder="e.g. 50100234567890"
                  className="h-10 text-xs bg-white border-gray-300 text-gray-900 font-mono rounded-xl"
                />
              </div>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Label className="text-xs text-gray-700 font-semibold">11-Char IFSC Code</Label>
                  <Input
                    value={bankIfsc || String(r?.bank_ifsc ?? "")}
                    onChange={(e) => setBankIfsc(e.target.value.toUpperCase().slice(0, 11))}
                    placeholder="e.g. HDFC0001234"
                    className="h-10 text-xs bg-white border-gray-300 text-gray-900 font-mono uppercase rounded-xl"
                  />
                </div>
                <Button
                  size="sm"
                  disabled={bankSaving}
                  onClick={() => void handleSaveBankDetails()}
                  className="h-10 bg-[#E23744] hover:bg-[#d32f2f] text-white font-bold text-xs rounded-xl px-5"
                >
                  {bankSaving ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          ) : null}

          {bankMsg ? (
            <div className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5" />
              <span>{bankMsg}</span>
            </div>
          ) : null}
        </Card>

        {/* Cumulative Chartered Accountant (CA) Ledger & Statutory Tax Reconciliation */}
        {allLines.length > 0 ? (
          <Card className="border-gray-200 bg-white p-5 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-3 gap-2">
              <div>
                <div className="text-xs uppercase tracking-wider text-[#E23744] font-bold">
                  Statutory Tax & Settlement Summary ({allLines.length} Settled Orders)
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  PAN: <span className="font-mono text-gray-900 font-semibold">{r?.pan || "—"}</span> · GSTIN:{" "}
                  <span className="font-mono text-gray-900 font-semibold">{r?.gstin || "Unregistered"}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => setShowInvoiceModal(true)}
                  className="h-8 text-xs bg-[#E23744] hover:bg-[#d32f2f] text-white font-semibold gap-1 rounded-xl shadow-xs"
                >
                  <FileText className="size-3.5 text-white" />
                  GSTR-1 Tax Invoice (PDF)
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 text-xs">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-2.5">
                <div className="text-[10px] text-gray-500 font-semibold">GROSS SALES</div>
                <div className="font-bold text-gray-900 mt-0.5 tabular">{formatINR(totals.gross)}</div>
                <div className="text-[9px] text-gray-400 mt-0.5">Food + Packing</div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-2.5">
                <div className="text-[10px] text-gray-500 font-semibold">REST. DISC</div>
                <div className="font-bold text-rose-600 mt-0.5 tabular">−{formatINR(totals.restDisc)}</div>
                <div className="text-[9px] text-gray-400 mt-0.5">Kitchen funded</div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-2.5">
                <div className="text-[10px] text-gray-500 font-semibold">COMMISSION</div>
                <div className="font-bold text-rose-600 mt-0.5 tabular">−{formatINR(totals.commission)}</div>
                <div className="text-[9px] text-gray-400 mt-0.5">{effectiveCommissionPct}% fee</div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-2.5">
                <div className="text-[10px] text-gray-500 font-semibold">COMM. GST (18%)</div>
                <div className="font-bold text-rose-600 mt-0.5 tabular">−{formatINR(totals.commGst)}</div>
                <div className="text-[9px] text-gray-400 mt-0.5">9% CGST + 9% SGST</div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-2.5">
                <div className="text-[10px] text-gray-500 font-semibold">PG FEES (1.8%)</div>
                <div className="font-bold text-rose-600 mt-0.5 tabular">−{formatINR(totals.gwFee + totals.gwGst)}</div>
                <div className="text-[9px] text-gray-400 mt-0.5">Fee + 18% GST</div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-2.5">
                <div className="text-[10px] text-gray-500 font-semibold">TCS (SEC 52)</div>
                <div className="font-bold text-rose-600 mt-0.5 tabular">−{formatINR(totals.tcs)}</div>
                <div className="text-[9px] text-gray-400 mt-0.5">1% Net Supply</div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-2.5">
                <div className="text-[10px] text-gray-500 font-semibold">TDS (SEC 194-O)</div>
                <div className="font-bold text-rose-600 mt-0.5 tabular">−{formatINR(totals.tds)}</div>
                <div className="text-[9px] text-gray-400 mt-0.5">1% Gross Sales</div>
              </div>
              <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-2.5">
                <div className="text-[10px] text-emerald-800 font-bold">NET PAYABLE</div>
                <div className="font-extrabold text-emerald-700 mt-0.5 tabular text-sm">{formatINR(totals.payable)}</div>
                <div className="text-[9px] text-emerald-600 mt-0.5">Bank transfer</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-blue-600" />
                <span>
                  <strong>Section 9(5) CGST Act Remittance:</strong> Platform collected and deposited{" "}
                  <span className="font-mono text-blue-950 font-bold">{formatINR(totals.sec9_5)}</span> (5% restaurant GST)
                  directly to the Government under Orderkingpay GSTIN (18AFXPH9838M1Z9). (Not debited from your payout).
                </span>
              </div>
              <span className="text-[10px] font-bold text-blue-700 shrink-0">
                100% Tax Compliant
              </span>
            </div>
          </Card>
        ) : null}

        {/* Order-Level Reconciliation Statement Batches */}
        {(q.data?.batches.length ?? 0) === 0 ? (
          <Card className="p-6 text-sm text-gray-500 bg-white border-gray-200 text-center">
            {t("settlements.empty")}
          </Card>
        ) : (
          q.data?.batches.map((b) => (
            <Card key={b.id} className="space-y-4 border-gray-200 bg-white p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      {b.status}
                    </span>
                    <span className="text-xs text-gray-500 font-mono">
                      ID: {b.id}
                    </span>
                  </div>
                  <div className="font-semibold text-gray-900 text-sm mt-1">
                    Settlement Period: {b.period_start} to {b.period_end} ({b.lines.length} orders)
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowInvoiceModal(true)}
                    className="h-8 text-xs border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-lg"
                  >
                    <FileText className="size-3.5 mr-1 text-[#E23744]" /> Tax Invoice
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => download("csv", b.id)}
                    className="h-8 text-xs border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-lg"
                  >
                    <Download className="size-3.5 mr-1" /> Batch CSV
                  </Button>
                  <div className="text-right">
                    <div className="text-[10px] text-gray-500 font-medium uppercase">Net Disbursed</div>
                    <MoneyText paise={b.totalPayablePaise} className="text-xl font-bold text-gray-900 tabular" />
                  </div>
                </div>
              </div>

              {/* Order-Level Statement Table */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[950px] text-left text-xs border-collapse">
                  <thead className="text-[11px] font-semibold uppercase text-gray-500 border-b border-gray-200 bg-gray-50/50">
                    <tr>
                      <th className="py-2.5 px-2">Order</th>
                      <th className="py-2.5 px-2">Gross Sales</th>
                      <th className="py-2.5 px-2">Rest. Disc</th>
                      <th className="py-2.5 px-2">Commission ({effectiveCommissionPct}%)</th>
                      <th className="py-2.5 px-2">PG Fee (1.8%)</th>
                      <th className="py-2.5 px-2">TCS (1%)</th>
                      <th className="py-2.5 px-2">TDS (1%)</th>
                      <th className="py-2.5 px-2">Sec 9(5) Remitted</th>
                      <th className="py-2.5 px-2">Plat. Promo</th>
                      <th className="py-2.5 px-2 text-right">Net Payable</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {b.lines.map((l) => (
                      <tr key={l.id} className="hover:bg-gray-50/80 transition-colors tabular">
                        <td className="py-2 px-2 font-mono text-gray-900 font-bold">{l.order_number}</td>
                        <td className="py-2 px-2 font-semibold text-gray-900">{formatINR(l.grossSalesPaise)}</td>
                        <td className="py-2 px-2 text-rose-600">
                          {l.restaurantDiscountPaise > 0 ? `−${formatINR(l.restaurantDiscountPaise)}` : "—"}
                        </td>
                        <td className="py-2 px-2 text-rose-600">
                          −{formatINR(l.commissionPaise + l.commissionGstPaise)}
                        </td>
                        <td className="py-2 px-2 text-rose-600">
                          −{formatINR(l.gatewayFeePaise + l.gatewayFeeGstPaise)}
                        </td>
                        <td className="py-2 px-2 text-orange-700">−{formatINR(l.tcsSec52Paise)}</td>
                        <td className="py-2 px-2 text-orange-700">−{formatINR(l.tdsSec194OPaise)}</td>
                        <td className="py-2 px-2 text-blue-700 font-mono text-[11px]">
                          {formatINR(l.sec9_5GstPaise)}
                        </td>
                        <td className="py-2 px-2 text-emerald-700">
                          {l.platformFundedDiscountPaise > 0 ? `+${formatINR(l.platformFundedDiscountPaise)}` : "—"}
                        </td>
                        <td className="py-2 px-2 text-right font-extrabold text-gray-900">
                          {formatINR(l.restaurantPayablePaise)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ))
        )}
      </div>

      <MonthlyGstr1InvoiceModal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        restaurant={r}
        restaurantName={vendor.selected?.restaurantName}
        restaurantId={vendor.restaurantId}
        commissionPct={effectiveCommissionPct}
        totals={totals}
        settledOrdersCount={allLines.length}
      />
    </VendorShell>
  );
}
