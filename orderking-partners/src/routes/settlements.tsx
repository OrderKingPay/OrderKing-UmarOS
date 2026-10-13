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
import { getSettlements } from "@/lib/server/api-finance";
import { getRestaurant, updateRestaurantProfile } from "@/lib/server/api-bootstrap";
import { validateIfsc } from "@/lib/merchant-kyc";
import { formatINR } from "@/lib/money";
import { can } from "@/lib/rbac";
import { platformConfig } from "@/lib/platform-config";
import { Banknote, Building2, CheckCircle2, Download, FileSpreadsheet, Scale, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/settlements")({ component: SettlementsPage });

function SettlementsPage() {
  const t = useT();
  const vendor = useVendor();
  const qc = useQueryClient();
  const allowed = vendor.role ? can(vendor.role, "settlements.view") : false;
  const canEditBank = vendor.role ? can(vendor.role, "settings.financial") : false;

  const [instantSettling, setInstantSettling] = useState(false);
  const [instantError, setInstantError] = useState<string | null>(null);

  const [editingBank, setEditingBank] = useState(false);
  const [bankHolder, setBankHolder] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankIfsc, setBankIfsc] = useState("");
  const [bankSaving, setBankSaving] = useState(false);
  const [bankMsg, setBankMsg] = useState<string | null>(null);

  const handleInstantSettlement = async () => {
    setInstantSettling(true);
    setInstantError(null);
    try {
      throw new Error(
        "Instant settlement provider is not connected. No payout was initiated and no reference was generated.",
      );
    } catch (error) {
      setInstantError(error instanceof Error ? error.message : "Settlement provider unavailable");
    } finally {
      setInstantSettling(false);
    }
  };

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

  if (vendor.role && !allowed) {
    return (
      <VendorShell title={t("nav.settlements")} dataLabel={vendor.dataLabel}>
        <Card>{t("settings.financialLocked")}</Card>
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
    const lines = ["order,food,restaurant_discount,commission,platform_funded,packing,refund,payable"];
    for (const b of batches) {
      for (const l of b.lines) {
        lines.push(
          [
            l.order_number,
            l.foodValuePaise,
            l.restaurantDiscountPaise,
            l.commissionPaise,
            l.platformFundedDiscountPaise,
            l.packingPaise,
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

  const effectiveCommissionPct = (
    (vendor.selected?.commissionBps ?? platformConfig.commission.targetBps) / 100
  ).toFixed(1);

  const allLines = (q.data?.batches ?? []).flatMap((b) => b.lines);
  const totals = allLines.reduce(
    (acc, l) => {
      acc.food += l.foodValuePaise;
      acc.packing += l.packingPaise;
      acc.restDisc += l.restaurantDiscountPaise;
      acc.platDisc += l.platformFundedDiscountPaise;
      acc.commission += l.commissionPaise;
      acc.refund += l.refundAdjustmentPaise;
      acc.payable += l.restaurantPayablePaise;
      return acc;
    },
    { food: 0, packing: 0, restDisc: 0, platDisc: 0, commission: 0, refund: 0, payable: 0 },
  );

  const r = restQ.data?.restaurant;

  return (
    <VendorShell
      title={t("nav.settlements")}
      dataLabel={q.data?.dataLabel ?? vendor.dataLabel}
      restaurantName={vendor.selected?.restaurantName}
    >
      <div className="space-y-4">
        {/* Current Unsettled Payable Balance */}
        <Card className="border-slate-800 bg-slate-900/80 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-slate-400">
              {t("settlements.payable")}
            </div>
            <div className="font-display text-3xl font-bold text-emerald-400 mt-1 tabular">
              {q.data ? <MoneyText paise={q.data.currentPayablePaise} /> : "—"}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Accrued from delivered orders awaiting scheduled weekly NEFT/IMPS batch settlement.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => download("csv")}>
              <FileSpreadsheet className="mr-1.5 size-4 text-emerald-400" />
              {t("settlements.exportCsv")}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => download("json")}>
              <Download className="mr-1.5 size-4 text-slate-300" />
              {t("settlements.exportJson")}
            </Button>
          </div>
        </Card>

        {/* Self-Service Settlement Bank Account & Tax Credentials Card */}
        <Card className="border-slate-800 bg-slate-900/70 p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Building2 className="size-4 text-emerald-400" />
              <div>
                <h3 className="font-semibold text-slate-100 text-sm">
                  Registered NEFT/IMPS Settlement Bank Account
                </h3>
                <p className="text-xs text-slate-400">
                  Beneficiary: <span className="text-slate-200 font-medium">{r?.bank_name || r?.name || "—"}</span>
                  {" · "}Account: <span className="font-mono text-slate-200">{r?.bank_account || "Not set"}</span>
                  {" · "}IFSC: <span className="font-mono text-emerald-400">{r?.bank_ifsc || "Not set"}</span>
                </p>
              </div>
            </div>
            {canEditBank ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setEditingBank(!editingBank)}
                className="text-xs shrink-0"
              >
                {editingBank ? "Cancel" : "Update Bank Account"}
              </Button>
            ) : null}
          </div>

          {editingBank && canEditBank ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800">
              <div>
                <Label className="text-xs text-slate-300">Beneficiary Name</Label>
                <Input
                  value={bankHolder || String(r?.bank_name ?? "")}
                  onChange={(e) => setBankHolder(e.target.value)}
                  placeholder="Account holder name"
                  className="h-9 text-xs bg-slate-950 border-slate-800"
                />
              </div>
              <div>
                <Label className="text-xs text-slate-300">Bank Account Number</Label>
                <Input
                  value={bankAccount || String(r?.bank_account ?? "")}
                  onChange={(e) => setBankAccount(e.target.value)}
                  placeholder="e.g. 50100234567890"
                  className="h-9 text-xs bg-slate-950 border-slate-800"
                />
              </div>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Label className="text-xs text-slate-300">11-Char IFSC Code</Label>
                  <Input
                    value={bankIfsc || String(r?.bank_ifsc ?? "")}
                    onChange={(e) => setBankIfsc(e.target.value.toUpperCase().slice(0, 11))}
                    placeholder="e.g. HDFC0001234"
                    className="h-9 text-xs bg-slate-950 border-slate-800"
                  />
                </div>
                <Button
                  size="sm"
                  disabled={bankSaving}
                  onClick={() => void handleSaveBankDetails()}
                  className="h-9 bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
                >
                  {bankSaving ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          ) : null}

          {bankMsg ? (
            <div className="text-xs text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5" />
              <span>{bankMsg}</span>
            </div>
          ) : null}
        </Card>

        {/* On-Demand IMPS Settlement Request */}
        <Card className="border-slate-800 bg-slate-900/60 p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Banknote className="size-4 text-emerald-400" />
                <h3 className="font-semibold text-slate-100 text-sm">On-Demand IMPS Settlement Request</h3>
                <span className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300">
                  BANK PAYOUT ADAPTER
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Request early disbursement of your accrued balance ({q.data ? formatINR(q.data.currentPayablePaise) : "—"}) to your registered settlement bank account.
              </p>
            </div>
            <Button
              size="sm"
              disabled={!q.data || q.data.currentPayablePaise <= 0 || instantSettling}
              onClick={() => void handleInstantSettlement()}
              className="shrink-0 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs"
            >
              {instantSettling
                ? "Checking Payout Gateway..."
                : `Request Instant Payout (${q.data ? formatINR(q.data.currentPayablePaise) : "—"})`}
            </Button>
          </div>
          {instantError ? (
            <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 px-3 py-2 text-xs font-medium text-amber-300">
              {instantError}
            </div>
          ) : null}
        </Card>

        {/* Cumulative Chartered Accountant (CA) Ledger & Tax Reconciliation Summary */}
        {allLines.length > 0 ? (
          <Card className="border-slate-800 bg-slate-900/70 p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="text-xs font-mono uppercase tracking-wider text-emerald-400">
                Cumulative Ledger &amp; Chartered Accountant Summary ({allLines.length} Settled Orders)
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                PAN: {r?.pan || "—"} · GSTIN: {r?.gstin || "Unregistered"}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 text-xs">
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2.5">
                <div className="text-[10px] font-mono text-slate-400">GROSS FOOD</div>
                <div className="font-bold text-slate-100 mt-0.5 tabular">{formatINR(totals.food)}</div>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2.5">
                <div className="text-[10px] font-mono text-slate-400">PACKAGING</div>
                <div className="font-bold text-slate-100 mt-0.5 tabular">{formatINR(totals.packing)}</div>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2.5">
                <div className="text-[10px] font-mono text-slate-400">REST. DISC</div>
                <div className="font-bold text-rose-400 mt-0.5 tabular">−{formatINR(totals.restDisc)}</div>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2.5">
                <div className="text-[10px] font-mono text-slate-400">COMMISSION</div>
                <div className="font-bold text-rose-400 mt-0.5 tabular">−{formatINR(totals.commission)}</div>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2.5">
                <div className="text-[10px] font-mono text-slate-400">PLATFORM PROMO</div>
                <div className="font-bold text-emerald-400 mt-0.5 tabular">+{formatINR(totals.platDisc)}</div>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2.5">
                <div className="text-[10px] font-mono text-slate-400">REFUND ADJ</div>
                <div className="font-bold text-slate-200 mt-0.5 tabular">{formatINR(totals.refund)}</div>
              </div>
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-2.5">
                <div className="text-[10px] font-mono text-emerald-400">NET PAYABLE</div>
                <div className="font-bold text-emerald-400 mt-0.5 tabular">{formatINR(totals.payable)}</div>
              </div>
            </div>
          </Card>
        ) : null}

        {/* Single Consistent Commercial & Statutory Settlement Breakdown Table */}
        <Card className="border-slate-800 bg-slate-900/70 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Scale className="size-4 text-emerald-400" />
              <h2 className="font-display text-base font-bold text-white">
                Commercial &amp; Statutory Settlement Breakdown
              </h2>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded">
              Active Outlet Commission: {effectiveCommissionPct}%
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Every order is accounted for in exact integer paise (1 INR = 100 paise) with zero floating-point rounding drift:
          </p>

          <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-3 font-mono text-xs text-emerald-300 overflow-x-auto">
            Restaurant Payable = Food Value + Packaging Charges − Restaurant Discount − Platform Commission ({effectiveCommissionPct}%) + Platform-Funded Promo − Refund Adjustments
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[580px] text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
                  <th className="py-2 pr-3">Ledger Component</th>
                  <th className="py-2 pr-3">Direction</th>
                  <th className="py-2 pr-3">Statutory / Commercial Basis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-slate-300">
                <tr>
                  <td className="py-2 pr-3 font-semibold text-white">Food Value &amp; Packaging</td>
                  <td className="py-2 pr-3 text-emerald-400 font-mono">+ Credit</td>
                  <td className="py-2 pr-3 text-slate-400">Base menu price + restaurant packaging charges collected from customer.</td>
                </tr>
                <tr>
                  <td className="py-2 pr-3 font-semibold text-white">Restaurant-Funded Discount</td>
                  <td className="py-2 pr-3 text-rose-400 font-mono">− Debit</td>
                  <td className="py-2 pr-3 text-slate-400">Promotional discount explicitly created and funded by the restaurant.</td>
                </tr>
                <tr>
                  <td className="py-2 pr-3 font-semibold text-white">Platform Commission ({effectiveCommissionPct}%)</td>
                  <td className="py-2 pr-3 text-rose-400 font-mono">− Debit</td>
                  <td className="py-2 pr-3 text-slate-400">Contracted platform marketplace service fee computed on net taxable food value.</td>
                </tr>
                <tr>
                  <td className="py-2 pr-3 font-semibold text-white">Platform-Funded Promo</td>
                  <td className="py-2 pr-3 text-emerald-400 font-mono">+ Credit</td>
                  <td className="py-2 pr-3 text-slate-400">Platform-sponsored coupon subsidy reimbursed 100% to the restaurant.</td>
                </tr>
                <tr>
                  <td className="py-2 pr-3 font-semibold text-white">GST under CGST Act §9(5)</td>
                  <td className="py-2 pr-3 text-slate-300 font-mono">Statutory</td>
                  <td className="py-2 pr-3 text-slate-400">5% GST on restaurant services collected and remitted directly by e-commerce operator under Section 9(5).</td>
                </tr>
                <tr>
                  <td className="py-2 pr-3 font-semibold text-white">TDS (§194-O) &amp; TCS (§52)</td>
                  <td className="py-2 pr-3 text-slate-300 font-mono">Statutory</td>
                  <td className="py-2 pr-3 text-slate-400">1% Income Tax TDS under Sec 194-O (Form 16A issued quarterly) &amp; 1% GST TCS under Sec 52 CGST Act.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* Statutory Safe Harbor Note */}
        <Card className="border-slate-800 bg-slate-900/50 p-4 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-emerald-400" />
              <h3 className="font-semibold text-slate-200 text-sm">
                Statutory Compliance &amp; Intermediary Safe Harbor
              </h3>
            </div>
            <span className="text-[10px] font-mono font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
              IT Act §79 Compliant
            </span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            All settlement batches are reconciled against order-level events and audited in integer paise. Any other deduction requires an explicit statutory or contractual reason code.
          </p>
        </Card>

        {/* Batch Settlement Statements */}
        {(q.data?.batches.length ?? 0) === 0 ? (
          <Card className="text-sm text-muted">{t("settlements.empty")}</Card>
        ) : (
          q.data?.batches.map((b) => (
            <Card key={b.id} className="space-y-3 border-slate-800 bg-slate-900/70 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <div className="text-xs font-mono uppercase text-emerald-400">{b.status}</div>
                  <div className="font-medium text-white">
                    Period: {b.period_start} → {b.period_end} ({b.lines.length} orders)
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => download("csv", b.id)}
                    className="h-8 text-xs"
                  >
                    Batch CSV
                  </Button>
                  <MoneyText paise={b.totalPayablePaise} className="text-xl font-bold text-white tabular" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-left text-xs">
                  <thead className="text-[11px] font-mono uppercase text-slate-400">
                    <tr>
                      <th className="py-2">Order</th>
                      <th>{t("settlements.food")}</th>
                      <th>Packing</th>
                      <th>{t("settlements.restDisc")}</th>
                      <th>{t("settlements.commission")}</th>
                      <th>{t("settlements.platformDisc")}</th>
                      <th>Refund Adj.</th>
                      <th>{t("settlements.payableLine")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {b.lines.map((l) => (
                      <tr key={l.id} className="border-t border-slate-800/80 tabular text-slate-200">
                        <td className="py-2 font-mono">{l.order_number}</td>
                        <td>{formatINR(l.foodValuePaise)}</td>
                        <td>{formatINR(l.packingPaise)}</td>
                        <td>{formatINR(l.restaurantDiscountPaise)}</td>
                        <td>{formatINR(l.commissionPaise)}</td>
                        <td>{formatINR(l.platformFundedDiscountPaise)}</td>
                        <td>{formatINR(l.refundAdjustmentPaise)}</td>
                        <td className="font-semibold text-emerald-400">{formatINR(l.restaurantPayablePaise)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ))
        )}
      </div>
    </VendorShell>
  );
}
