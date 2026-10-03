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

      <Card className="border border-line bg-surface-2 p-4 space-y-2">
        <h3 className="font-semibold text-sm">Bank payout connection</h3>
        <p className="text-xs text-muted">
          Automated bank payout is not connected in this environment. No payout can be initiated from Partner, and this screen will not claim a transfer occurred.
        </p>
      </Card>

      <Card className="space-y-2 text-sm">
        <h2 className="font-display text-lg">{t("settlements.formula")}</h2>
        <p className="text-muted">{t("settlements.formulaHint")}</p>
      </Card>
      <Card className="border border-line bg-surface-2 p-4 space-y-2 text-xs">
        <h3 className="font-semibold text-sm">Settlement accounting</h3>
        <p className="text-muted leading-relaxed">
          The figures above and in each statement are derived from the Partner settlement data available to this restaurant. Tax treatment, platform fees, refunds, and other deductions must be verified against the actual statement and applicable records; no statutory guarantee is asserted here.
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
