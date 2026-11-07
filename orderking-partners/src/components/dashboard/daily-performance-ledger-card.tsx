import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  Banknote,
  Building2,
  CalendarCheck,
  ChevronDown,
  Clock,
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
    <Card className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-6 shadow-xs font-sans space-y-5 text-gray-900">
      {/* Header Badge & Title */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 font-mono">
              Daily Performance &amp; Settlement Ledger
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-gray-900 mt-1">
            Today&apos;s Revenue &amp; Estimated Net Payout
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Transparent breakdown of gross sales, service deductions, and daily bank payout.
          </p>
        </div>

        {/* T+1 Daily Payout Live Timer Pill */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-3.5 py-2 font-mono text-xs flex items-center gap-2.5 text-emerald-800 shadow-xs">
          <Clock className="size-4 text-emerald-600 animate-spin" />
          <div>
            <div className="text-[10px] uppercase font-bold text-emerald-700">
              T+1 Payout Timer
            </div>
            <div className="text-xs font-black text-gray-900">
              {dynamicCountdown.formatted}
            </div>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Metric 1: Delivered Orders Count */}
        <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-500 font-semibold">
            <span className="uppercase text-[10px] tracking-wider">
              Delivered Orders
            </span>
            <CalendarCheck className="size-4 text-emerald-600" />
          </div>
          <div className="font-display text-2xl font-black text-gray-900 tabular">
            {summary.deliveredOrdersCount} <span className="text-xs font-normal text-gray-500">orders</span>
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
            <span>● Verified Fulfillment</span>
          </div>
        </div>

        {/* Metric 2: Gross GMV */}
        <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-500 font-semibold">
            <span className="uppercase text-[10px] tracking-wider">
              Gross Sales
            </span>
            <TrendingUp className="size-4 text-[#E23744]" />
          </div>
          <div className="font-display text-2xl font-black text-gray-900 tabular">
            {formatINR(summary.grossGmvPaise)}
          </div>
          <div className="text-[11px] text-gray-500 font-mono">
            Food: {formatINR(summary.totalFoodValuePaise)}
          </div>
        </div>

        {/* Metric 3: Total Deductions Breakdown */}
        <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-500 font-semibold">
            <span className="uppercase text-[10px] tracking-wider">
              Total Deductions
            </span>
            <Receipt className="size-4 text-rose-600" />
          </div>
          <div className="font-display text-2xl font-black text-rose-600 tabular">
            -{formatINR(summary.totalDebitedDeductionsPaise)}
          </div>
          <div className="text-[11px] text-gray-500 font-mono truncate">
            Commission + GST + Gateway
          </div>
        </div>

        {/* Metric 4: Net Estimated Payout for Today */}
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50/70 p-4 space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-xs text-emerald-800 font-bold">
            <span className="uppercase text-[10px] tracking-wider">
              Net Estimated Payout
            </span>
            <Banknote className="size-4 text-emerald-700" />
          </div>
          <div className="font-display text-2xl font-black text-emerald-800 tabular">
            {formatINR(summary.netEstimatedPayoutPaise)}
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
            <ShieldCheck className="size-3.5" />
            <span>Ready for Next Bank Batch</span>
          </div>
        </div>
      </div>

      {/* Itemized Deductions Drawer Trigger & Summary Table */}
      <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Receipt className="size-4 text-[#E23744]" />
            <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
              Settlement &amp; Deductions Breakdown
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowItemized(!showItemized)}
            className="text-xs text-[#E23744] hover:text-[#d32f2f] font-bold flex items-center gap-1 cursor-pointer"
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
          <div className="p-2.5 rounded-xl bg-white border border-gray-200">
            <div className="text-[10px] text-gray-500">Platform Commission (25%)</div>
            <div className="font-bold text-gray-900 mt-0.5">
              -{formatINR(summary.platformCommissionPaise)}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-white border border-gray-200">
            <div className="text-[10px] text-gray-500">GST on Commission (18%)</div>
            <div className="font-bold text-gray-900 mt-0.5">
              -{formatINR(summary.servicesGstTotalPaise)}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-white border border-gray-200">
            <div className="text-[10px] text-gray-500">Payment Gateway (1.84%)</div>
            <div className="font-bold text-gray-900 mt-0.5">
              -{formatINR(summary.gatewayFeePaise)}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-white border border-gray-200">
            <div className="text-[10px] text-gray-500">GST §9(5) Food Tax (5%)</div>
            <div className="font-bold text-emerald-700 mt-0.5">
              {formatINR(summary.sec9_5GstPaise)}{" "}
              <span className="text-[9px] text-gray-400 font-normal">(Remitted)</span>
            </div>
          </div>
        </div>

        {/* Detailed Itemized Drawer */}
        {showItemized && (
          <div className="mt-3 rounded-xl border border-gray-200 bg-white p-4 space-y-3 text-xs font-mono animate-in fade-in duration-150">
            <div className="text-[11px] font-bold text-gray-900 uppercase tracking-wider font-sans border-b border-gray-100 pb-2">
              Itemized Settlement Accounting Ledger
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-gray-700">
                <span>1. Food Value Gross Subtotal:</span>
                <span className="font-bold text-gray-900">{formatINR(summary.totalFoodValuePaise)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>2. Packaging Charges Collected:</span>
                <span className="font-bold text-gray-900">{formatINR(summary.totalPackingPaise)}</span>
              </div>
              {summary.totalRestaurantDiscountsPaise > 0 && (
                <div className="flex justify-between text-rose-700">
                  <span>3. Restaurant-Funded Promos:</span>
                  <span>-{formatINR(summary.totalRestaurantDiscountsPaise)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-200 pt-1 text-gray-900 font-bold">
                <span>Net Taxable Supply Base:</span>
                <span>{formatINR(summary.netTaxableSupplyPaise)}</span>
              </div>

              <div className="pt-2 border-t border-dashed border-gray-200 text-[10px] text-gray-500 uppercase tracking-widest font-sans">
                Deductions
              </div>

              <div className="flex justify-between text-gray-700">
                <span>• Platform Commission:</span>
                <span className="text-rose-600">-{formatINR(summary.platformCommissionPaise)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>• 18% GST on Commission:</span>
                <span className="text-rose-600">-{formatINR(summary.commissionGstPaise)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>• Payment Gateway Fee:</span>
                <span className="text-rose-600">-{formatINR(summary.totalGatewayFeeWithGstPaise)}</span>
              </div>

              <div className="flex justify-between rounded-xl bg-emerald-50 border border-emerald-200 p-2 text-emerald-800">
                <span>• Statutory GST §9(5) Remitted to Govt (5%):</span>
                <span className="font-bold">{formatINR(summary.sec9_5GstPaise)} (Zero Merchant Liability)</span>
              </div>

              <div className="flex justify-between border-t-2 border-gray-200 pt-2 text-sm font-black text-emerald-800 font-sans">
                <span>Estimated Net Payout for Today:</span>
                <span>{formatINR(summary.netEstimatedPayoutPaise)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Settlement Notice & Quick Links */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100 text-xs">
        <div className="flex items-center gap-2 text-gray-600">
          <Building2 className="size-4 text-emerald-600" />
          <span>
            Next Settlement: <strong className="text-gray-900">{summary.nextSettlementFormatted}</strong> · Regular Daily Payout Batch
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="outline" className="text-xs border-gray-300 bg-white text-gray-800 hover:bg-gray-50 h-9 rounded-xl font-semibold">
            <Link to="/settlements">
              <Wallet className="mr-1.5 size-3.5 text-[#E23744]" />
              View Full Settlement Ledger
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
