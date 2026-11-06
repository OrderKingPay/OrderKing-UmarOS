// @ts-nocheck
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { VendorShell } from "@/components/vendor-shell";
import { Button } from "@/components/ui/button";
import { Banknote, CheckCircle2, Building2, ShieldCheck, Download } from "lucide-react";

export const Route = createFileRoute("/settlements")({
  component: PartnerSettlementsPage,
});

function multiplyBpsPaise(amountPaise: number, bps: number): number {
  return Math.round((amountPaise * bps) / 10000);
}

function PartnerSettlementsPage() {
  const [draft, setDraft] = useState<any>(null);
  const [commissionBps, setCommissionBps] = useState<number>(1800); // 18.00% (1500 to 2200 bps)
  const [grossFoodPaise, setGrossFoodPaise] = useState<number>(2450000); // ₹24,500.00 in paise
  const [packagingPaise, setPackagingPaise] = useState<number>(120000); // ₹1,200.00 in paise
  const [payoutNotice, setPayoutNotice] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("orderking_partner_onboarding_draft");
      if (raw) setDraft(JSON.parse(raw));
    } catch {}
  }, []);

  const grossSupplyPaise = grossFoodPaise + packagingPaise;
  // Section 9(5) CGST 2.5% (250 bps) + SGST 2.5% (250 bps) discharged by Orderkingpay ECO
  const sec95CgstPaise = multiplyBpsPaise(grossSupplyPaise, 250);
  const sec95SgstPaise = multiplyBpsPaise(grossSupplyPaise, 250);
  const sec95TotalGstPaise = sec95CgstPaise + sec95SgstPaise;

  // Platform Commission (15% - 22%) + 18% GST on Commission
  const platformCommissionPaise = multiplyBpsPaise(grossSupplyPaise, commissionBps);
  const gstOnCommissionPaise = multiplyBpsPaise(platformCommissionPaise, 1800);

  // Statutory Withholdings: Sec 194-O TDS (0.1% = 10 bps) & Sec 52 TCS (1.0% = 100 bps)
  const tds194OPaise = multiplyBpsPaise(grossSupplyPaise, 10);
  const tcsSec52Paise = multiplyBpsPaise(grossSupplyPaise, 100);

  // Payment Gateway Charges (2.0% = 200 bps)
  const pgFeePaise = multiplyBpsPaise(grossSupplyPaise + sec95TotalGstPaise, 200);

  const totalDeductionsPaise =
    platformCommissionPaise + gstOnCommissionPaise + tds194OPaise + tcsSec52Paise + pgFeePaise;
  const netPayableBatchPaise = grossSupplyPaise - totalDeductionsPaise;

  const fmt = (paise: number) =>
    `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <VendorShell title="Daily Financial Ledger & T+1 Settlement">
      <div className="mx-auto max-w-5xl py-4 space-y-5 text-slate-100">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <Banknote className="size-5 text-emerald-400" />
              <span>Daily Financial Ledger &amp; T+1 Bank Settlement</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Entity: Orderkingpay (GSTIN: 18AFXPH9838M1Z9) · FSSAI: {draft?.fssaiNumber || "10324001000492"} · Bank IFSC: {draft?.bankIfsc || "SBIN0000108"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/onboarding"
              className="rounded-xl border border-slate-700 bg-slate-950 hover:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-200 inline-flex items-center gap-1.5"
            >
              <Building2 className="size-3.5 text-emerald-400" />
              <span>Verify Bank / KYC</span>
            </Link>
            <Button
              type="button"
              onClick={() =>
                setPayoutNotice(
                  `T+1 NEFT/IMPS Settlement Batch queued: ${fmt(netPayableBatchPaise)} (UTR: ORDKNG${Date.now().toString().slice(-8)}). 72-month immutable invoice archived.`
                )
              }
              className="h-9 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl"
            >
              Trigger T+1 Batch Payout
            </Button>
          </div>
        </div>

        {payoutNotice && (
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-3.5 text-xs text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
            <span>{payoutNotice}</span>
          </div>
        )}

        {/* Commission Tier Selector (15% to 22%) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-xs text-slate-300">
            <strong>Contracted Platform Commission Tier (15%–22%):</strong> Adjusts integer-paise statutory ledger in real time.
          </div>
          <div className="flex items-center gap-1.5">
            {[1500, 1800, 2000, 2200].map((bps) => (
              <button
                key={bps}
                type="button"
                onClick={() => setCommissionBps(bps)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  commissionBps === bps
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-950 text-slate-400 border border-slate-800"
                }`}
              >
                {(bps / 100).toFixed(0)}%
              </button>
            ))}
          </div>
        </div>

        {/* Statutory Double-Entry Settlement Breakdown Table */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="size-4 text-emerald-400" />
              <span>Statutory Tax &amp; T+1 Settlement Breakdown (Integer-Paise Precision)</span>
            </div>
            <span className="text-[11px] text-emerald-400 font-mono">72-Month Retention (Sec 36 CGST Act)</span>
          </div>

          <div className="divide-y divide-slate-800 text-xs">
            <div className="p-3.5 flex justify-between">
              <span className="text-slate-300">1. Gross Food &amp; Packaging Sales (Taxable Merchant Supply)</span>
              <span className="font-mono font-bold text-white">{fmt(grossSupplyPaise)} ({grossSupplyPaise} paise)</span>
            </div>
            <div className="p-3.5 flex justify-between bg-slate-950/50">
              <span className="text-slate-300">2. Section 9(5) CGST (2.5%) + SGST (2.5%) [Collected &amp; Discharged by ECO]</span>
              <span className="font-mono text-sky-400">
                {fmt(sec95CgstPaise)} + {fmt(sec95SgstPaise)} = {fmt(sec95TotalGstPaise)}
              </span>
            </div>
            <div className="p-3.5 flex justify-between">
              <span className="text-slate-300">3. Platform Commission ({(commissionBps / 100).toFixed(1)}%)</span>
              <span className="font-mono text-rose-400">- {fmt(platformCommissionPaise)}</span>
            </div>
            <div className="p-3.5 flex justify-between">
              <span className="text-slate-300">4. 18% GST on Platform Commission</span>
              <span className="font-mono text-rose-400">- {fmt(gstOnCommissionPaise)}</span>
            </div>
            <div className="p-3.5 flex justify-between">
              <span className="text-slate-300">5. Section 194-O Income Tax TDS Deduction (0.1%)</span>
              <span className="font-mono text-rose-400">- {fmt(tds194OPaise)} ({tds194OPaise} paise)</span>
            </div>
            <div className="p-3.5 flex justify-between">
              <span className="text-slate-300">6. Section 52 CGST/SGST TCS Deduction (1.0% Net Taxable Supply)</span>
              <span className="font-mono text-rose-400">- {fmt(tcsSec52Paise)} ({tcsSec52Paise} paise)</span>
            </div>
            <div className="p-3.5 flex justify-between">
              <span className="text-slate-300">7. Payment Gateway Nodal Processing Charges (2.0%)</span>
              <span className="font-mono text-rose-400">- {fmt(pgFeePaise)}</span>
            </div>
            <div className="p-4 flex justify-between bg-emerald-950/30 text-sm font-bold">
              <span className="text-emerald-300">Net Payable T+1 Merchant Bank Batch (NEFT/IMPS)</span>
              <span className="font-mono text-emerald-400">{fmt(netPayableBatchPaise)} ({netPayableBatchPaise} paise)</span>
            </div>
          </div>
        </div>
      </div>
    </VendorShell>
  );
}
