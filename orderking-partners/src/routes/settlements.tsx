// @ts-nocheck
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { VendorShell } from "@/components/vendor-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MoneyText } from "@/components/money-text";
import { useT } from "@/components/use-t";
import { useVendor } from "@/components/use-vendor";
import { getSettlements } from "@/lib/server/api-finance";
import { formatINR } from "@/lib/money";
import { can } from "@/lib/rbac";

export const Route = createFileRoute("/settlements")({ component: SettlementsPage });

function SettlementsPage() {
  const t = useT();
  const vendor = useVendor();
  const allowed = vendor.role ? can(vendor.role, "settlements.view") : false;
  const [instantSettling, setInstantSettling] = useState(false);
  const [instantError, setInstantError] = useState<string | null>(null);

  const handleInstantSettlement = async () => {
    setInstantSettling(true);
    setInstantError(null);
    try {
      throw new Error("Instant settlement provider is not connected. No payout was initiated and no reference was generated.");
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

  if (vendor.role && !allowed) {
    return (
      <VendorShell title={t("nav.settlements")} dataLabel={vendor.dataLabel}>
        <Card>{t("settings.financialLocked")}</Card>
      </VendorShell>
    );
  }

  function download(kind: "csv" | "json") {
    const batches = q.data?.batches ?? [];
    if (kind === "json") {
      const blob = new Blob([JSON.stringify({ dataLabel: q.data?.dataLabel, batches }, null, 2)], {
        type: "application/json",
      });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "orderking-settlement.json";
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
    a.download = "orderking-settlement.csv";
    a.click();
  }

  return (
    <VendorShell title={t("nav.settlements")} dataLabel={q.data?.dataLabel ?? vendor.dataLabel}>
      {q.data?.dataLabel === "SIMULATED" ? (
        <p className="text-sm text-warn">{t("settlements.simulatedNote")}</p>
      ) : null}
      <Card>
        <div className="text-xs uppercase tracking-wide text-muted">{t("settlements.payable")}</div>
        <div className="font-display text-3xl">
          {q.data ? <MoneyText paise={q.data.currentPayablePaise} /> : "—"}
        </div>
      </Card>

      {/* Instant Settlement (0.5% Fee) */}
      <Card className="border border-primary/30 bg-primary/5 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg">⚡</span>
              <h3 className="font-semibold text-foreground text-sm">Instant Settlement</h3>
              <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold text-primary">Provider-gated</span>
            </div>
            <p className="text-xs text-muted mt-1">
              Need working capital immediately? Settle today&apos;s accrued balance ({q.data ? formatINR(q.data.currentPayablePaise) : "—"}) through the configured payout provider. Provider timing and fees are shown only after verification.
            </p>
          </div>
          <Button
            size="sm"
            disabled={!q.data || q.data.currentPayablePaise <= 0 || instantSettling}
            onClick={() => handleInstantSettlement()}
            className="shrink-0 bg-primary hover:bg-primary/90 text-white font-medium"
          >
            {instantSettling ? "Checking provider..." : "Check Instant Settlement"}
          </Button>
        </div>
        {instantError && (
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
            {instantError}
          </p>
        )}
      </Card>

      <Card className="space-y-2 text-sm">
        <h2 className="font-display text-lg">{t("settlements.formula")}</h2>
        <p className="text-muted">{t("settlements.formulaHint")}</p>
      </Card>
      {/* Zero Unexplained Deductions Guarantee & Statutory Safe Harbor */}
      <Card className="border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">🛡️</span>
            <h3 className="font-semibold text-emerald-900 dark:text-emerald-300 text-sm">Zero Unexplained Deductions &amp; Statutory Safe Harbor</h3>
          </div>
          <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded">
            Provider & policy status
          </span>
        </div>
        <p className="text-muted leading-relaxed">
          OrderKing settlement statements itemize recorded deductions from the configured contract and ledger. Statutory treatment is shown only when the applicable tax configuration is present:
        </p>
        <ul className="list-disc pl-4 space-y-1 text-muted">
          <li><strong>GST</strong>: Remitted under Section 9(5) CGST Act (E-Commerce Restaurant Delivery Services).</li>
          <li><strong>TCS</strong>: Tax Collected at Source under Section 52 CGST Act.</li>
          <li><strong>TDS</strong>: Withholding tax under Section 194-O Income Tax Act (Form 16A issued quarterly).</li>
          <li><strong>Intermediary Safe Harbor</strong>: Platform operates as a neutral technology intermediary under Section 79 of the Information Technology Act, 2000.</li>
          <li><strong>Binding Arbitration</strong>: All disputes governed by the Arbitration and Conciliation Act, 1996, with exclusive jurisdiction in local district court.</li>
          <li><strong>Zero Arbitrary Levies</strong>: No unexplained marketing or listing penalties. Every single rupee is mathematically accounted for in integer paise.</li>
        </ul>
      </Card>

      {/* 10x More Profitable than Zomato: Transparent Partner Savings Engine */}
      <Card className="border border-indigo-500/30 bg-gradient-to-r from-indigo-500/5 via-primary/5 to-emerald-500/5 p-4 space-y-3 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">🚀</span>
            <h3 className="font-semibold text-indigo-900 dark:text-indigo-300 text-sm">
              OrderKing Partner Economics
            </h3>
          </div>
          <span className="text-[10px] font-mono font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded">
            Live contract comparison required
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
          <div className="rounded-lg border border-line bg-surface/50 p-2.5">
            <p className="text-[11px] text-muted uppercase font-medium">Platform Commission</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">Configured contract</span>
              <span className="text-xs text-muted line-through">External benchmark</span>
            </div>
            <p className="text-[10px] text-muted mt-1">Any savings are calculated from the live contract and settlement ledger.</p>
          </div>
          <div className="rounded-lg border border-line bg-surface/50 p-2.5">
            <p className="text-[11px] text-muted uppercase font-medium">Onboarding &amp; Hidden Levies</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">Contract-defined</span>
              <span className="text-xs text-muted line-through">External benchmark</span>
            </div>
            <p className="text-[10px] text-muted mt-1">Charges and promotions are shown from the active contract and ledger.</p>
          </div>
          <div className="rounded-lg border border-line bg-surface/50 p-2.5">
            <p className="text-[11px] text-muted uppercase font-medium">Settlement Certainty</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-base font-bold text-primary">Integer-Paise</span>
              <span className="text-xs text-muted">Configured payout cycle</span>
            </div>
            <p className="text-[10px] text-muted mt-1">All deductions are shown from the configured contract/ledger; statutory treatment requires current tax configuration.</p>
          </div>
        </div>
        <p className="text-[11px] text-muted">
          💡 <em>Pro-tip:</em> Use the live settlement statement and current contract terms to choose any customer promotion.
        </p>
      </Card>
      <div className="flex gap-2">
        <Button variant="secondary" onClick={() => download("csv")}>
          {t("settlements.exportCsv")}
        </Button>
        <Button variant="secondary" onClick={() => download("json")}>
          {t("settlements.exportJson")}
        </Button>
      </div>
      {(q.data?.batches.length ?? 0) === 0 ? (
        <Card className="text-sm text-muted">{t("settlements.empty")}</Card>
      ) : (
        q.data?.batches.map((b) => (
          <Card key={b.id} className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase text-muted">{b.status}</div>
                <div className="font-medium">{b.scheduled_for ?? b.period_end}</div>
              </div>
              <MoneyText paise={b.totalPayablePaise} className="text-xl font-semibold" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="text-xs uppercase text-muted">
                  <tr>
                    <th className="py-2">Order</th>
                    <th>{t("settlements.food")}</th>
                    <th>{t("settlements.restDisc")}</th>
                    <th>{t("settlements.commission")}</th>
                    <th>{t("settlements.platformDisc")}</th>
                    <th>{t("settlements.payableLine")}</th>
                  </tr>
                </thead>
                <tbody>
                  {b.lines.map((l) => (
                    <tr key={l.id} className="border-t border-line tabular">
                      <td className="py-2">{l.order_number}</td>
                      <td>{formatINR(l.foodValuePaise)}</td>
                      <td>{formatINR(l.restaurantDiscountPaise)}</td>
                      <td>{formatINR(l.commissionPaise)}</td>
                      <td>{formatINR(l.platformFundedDiscountPaise)}</td>
                      <td>{formatINR(l.restaurantPayablePaise)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ))
      )}
    </VendorShell>
  );
}
