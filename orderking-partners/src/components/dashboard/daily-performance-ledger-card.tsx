import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  Banknote,
  Building2,
  CalendarCheck,
  ChevronDown,
  Clock,
  Coins,
  FileSpreadsheet,
  HelpCircle,
  Receipt,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/money";
import {
  calculateDailyBusinessSummary,
  formatTPlus1Countdown,
  type DailyBusinessSummary,
  type DeliveredOrderInput,
} from "@/lib/finance/daily-summary";

export interface DailyPerformanceLedgerCardProps {
  orders?: DeliveredOrderInput[];
  customSummary?: Partial<DailyBusinessSummary>;
}

export function DailyPerformanceLedgerCard({
  orders,
  customSummary,
}: DailyPerformanceLedgerCardProps) {
  const [showItemized, setShowItemized] = useState(false);
  const [now, setNow] = useState(() => new Date());

  // Update countdown every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const effectiveOrders = orders && orders.length > 0 ? orders : [];
  const computed = calculateDailyBusinessSummary(effectiveOrders, { refDate: now });

  const summary: DailyBusinessSummary = {
    ...computed,
    ...customSummary,
  };

  const dynamicCountdown = formatTPlus1Countdown(
    new Date(summary.nextSettlementDate),
    now
  );

  return (
    <Card className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-2xl backdrop-blur-xl font-sans space-y-5">
      {/* Ambient Top Glow */}
      <div className="pointer-events-none absolute -top-24 right-0 size-60 rounded-full bg-emerald-500/10 blur-3xl" />

      {/* Header Badge & Title */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 font-mono">
              Daily Business Performance &amp; Settlement Ledger
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-white mt-1">
            Today&apos;s Revenue &amp; Estimated Net Payout
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Transparent breakdown of gross GMV, statutory deductions, and T+1 daily settlement bank payout.
          </p>
        </div>

        {/* T+1 Daily Payout Live Timer Pill */}
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 px-3.5 py-2 font-mono text-xs flex items-center gap-2.5 shadow-inner">
          <Clock className="size-4 text-emerald-400 animate-spin" />
          <div>
            <div className="text-[10px] uppercase font-bold text-emerald-400">
              T+1 Daily Payout Timer
            </div>
            <div className="text-xs font-bold text-white">
              {dynamicCountdown.formatted}
            </div>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Metric 1: Delivered Orders Count */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono uppercase text-[10px] tracking-wider">
              Delivered Orders
            </span>
            <CalendarCheck className="size-4 text-emerald-400" />
          </div>
          <div className="font-display text-2xl font-bold text-white tabular">
            {summary.deliveredOrdersCount} <span className="text-xs font-normal text-slate-400">orders</span>
          </div>
          <div className="text-[11px] text-emerald-400/90 flex items-center gap-1 font-mono">
            <span>● Verified On-Time Fulfillment</span>
          </div>
        </div>

        {/* Metric 2: Gross GMV */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono uppercase text-[10px] tracking-wider">
              Gross GMV
            </span>
            <TrendingUp className="size-4 text-emerald-400" />
          </div>
          <div className="font-display text-2xl font-bold text-white tabular">
            {formatINR(summary.grossGmvPaise)}
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            Food: {formatINR(summary.totalFoodValuePaise)} · Pack: {formatINR(summary.totalPackingPaise)}
          </div>
        </div>

        {/* Metric 3: Total Deductions Breakdown */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-mono uppercase text-[10px] tracking-wider">
              Total Deductions
            </span>
            <Receipt className="size-4 text-rose-400" />
          </div>
          <div className="font-display text-2xl font-bold text-rose-400 tabular">
            -{formatINR(summary.totalDebitedDeductionsPaise)}
          </div>
          <div className="text-[11px] text-slate-400 font-mono truncate">
            Comm + 18% GST + Gateway fees
          </div>
        </div>

        {/* Metric 4: Net Estimated Payout for Today */}
        <div className="rounded-xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/60 to-slate-950 p-3.5 space-y-1 shadow-md shadow-emerald-950/30">
          <div className="flex items-center justify-between text-xs text-emerald-300">
            <span className="font-mono uppercase text-[10px] font-bold tracking-wider">
              Net Estimated Payout
            </span>
            <Banknote className="size-4 text-emerald-400" />
          </div>
          <div className="font-display text-2xl font-extrabold text-emerald-300 tabular">
            {formatINR(summary.netEstimatedPayoutPaise)}
          </div>
          <div className="text-[11px] text-emerald-400/90 font-mono flex items-center gap-1">
            <ShieldCheck className="size-3" />
            <span>Ready for Next NEFT Batch</span>
          </div>
        </div>
      </div>

      {/* Itemized Deductions Drawer Trigger & Summary Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Receipt className="size-4 text-emerald-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Statutory &amp; Commercial Deductions Breakdown
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowItemized(!showItemized)}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>{showItemized ? "Hide Itemized Details" : "View Itemized Calculation"}</span>
            <ChevronDown
              className={`size-3.5 transition-transform duration-200 ${
                showItemized ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>

        {/* Concise Deductions Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono pt-1">
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
            <div className="text-[10px] text-slate-400">Platform Commission (25%)</div>
            <div className="font-bold text-slate-200 mt-0.5">
              -{formatINR(summary.platformCommissionPaise)}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
            <div className="text-[10px] text-slate-400">GST on Services (18%)</div>
            <div className="font-bold text-slate-200 mt-0.5">
              -{formatINR(summary.servicesGstTotalPaise)}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
            <div className="text-[10px] text-slate-400">Payment Gateway (1.84%)</div>
            <div className="font-bold text-slate-200 mt-0.5">
              -{formatINR(summary.gatewayFeePaise)}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
            <div className="text-[10px] text-slate-400">GST §9(5) Food Tax (5%)</div>
            <div className="font-bold text-emerald-400 mt-0.5">
              {formatINR(summary.sec9_5GstPaise)}{" "}
              <span className="text-[9px] text-slate-400 font-normal">(ECO Remitted)</span>
            </div>
          </div>
        </div>

        {/* Detailed Itemized Drawer */}
        {showItemized && (
          <div className="mt-3 rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-3 text-xs font-mono animate-in fade-in duration-150">
            <div className="text-[11px] font-bold text-white uppercase tracking-wider font-sans border-b border-slate-800 pb-2">
              Itemized Settlement Accounting Ledger (Integer Paise Precision)
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-slate-300">
                <span>1. Food Value Gross Subtotal:</span>
                <span className="font-bold text-white">{formatINR(summary.totalFoodValuePaise)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>2. Packaging Charges Collected:</span>
                <span className="font-bold text-white">{formatINR(summary.totalPackingPaise)}</span>
              </div>
              {summary.totalRestaurantDiscountsPaise > 0 && (
                <div className="flex justify-between text-rose-300">
                  <span>3. Restaurant-Funded Promos (Deducted from taxable base):</span>
                  <span>-{formatINR(summary.totalRestaurantDiscountsPaise)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-800 pt-1 text-slate-200 font-bold">
                <span>Net Taxable Supply Base:</span>
                <span>{formatINR(summary.netTaxableSupplyPaise)}</span>
              </div>

              <div className="pt-2 border-t border-dashed border-slate-800 text-[10px] text-slate-400 uppercase tracking-widest font-sans">
                Statutory Deductions &amp; Service Levies
              </div>

              <div className="flex justify-between text-slate-300">
                <span>• Platform Take-Rate Commission:</span>
                <span className="text-rose-300">-{formatINR(summary.platformCommissionPaise)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>• 18% GST on Platform Commission (9% CGST + 9% SGST):</span>
                <span className="text-rose-300">-{formatINR(summary.commissionGstPaise)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>• Online Payment Gateway Fee (1.84% + 18% GST):</span>
                <span className="text-rose-300">-{formatINR(summary.totalGatewayFeeWithGstPaise)}</span>
              </div>

              <div className="flex justify-between rounded-lg bg-emerald-950/30 border border-emerald-500/20 p-2 text-emerald-300">
                <span>• Statutory GST §9(5) Remitted Directly by OrderKing to Govt (5%):</span>
                <span className="font-bold">{formatINR(summary.sec9_5GstPaise)} (Zero Merchant Liability)</span>
              </div>

              <div className="flex justify-between border-t-2 border-slate-700 pt-2 text-sm font-extrabold text-emerald-300 font-sans">
                <span>Estimated Net Payout for Today:</span>
                <span>{formatINR(summary.netEstimatedPayoutPaise)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Settlement Notice & Quick Links */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-800/80 text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <Building2 className="size-4 text-emerald-400" />
          <span>
            Next Settlement Date: <strong className="text-white">{summary.nextSettlementFormatted}</strong> · Regular Daily Payout Batch
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="outline" className="text-xs border-slate-700 bg-slate-800 text-slate-200 hover:text-white">
            <Link to="/settlements">
              <Wallet className="mr-1.5 size-3.5 text-emerald-400" />
              View Full Settlement Ledger
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
