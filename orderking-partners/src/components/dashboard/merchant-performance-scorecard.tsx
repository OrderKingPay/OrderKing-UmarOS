import React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  AlertTriangle,
  Clock3,
  Star,
  ShieldCheck,
  TrendingUp,
  XCircle,
  HelpCircle,
} from "lucide-react";

export type AcceptanceStatus = "OPTIMAL" | "ATTENTION" | "ALERT";
export type CancellationStatus = "EXCELLENT" | "ACCEPTABLE" | "WARNING";
export type PrepTimeStatus = "FAST" | "NORMAL" | "DELAYED";
export type RatingStatus = "TOP_RATED" | "GOOD" | "NEEDS_IMPROVEMENT";

export interface MerchantScorecardInput {
  totalOrders: number;
  acceptedOrders: number;
  cancelledOrders: number;
  avgPrepMinutes?: number;
  rating?: number;
  ratingCount?: number;
}

export interface ComputedMerchantScorecard {
  acceptanceRatePct: number;
  acceptanceStatus: AcceptanceStatus;
  cancellationRatePct: number;
  cancellationStatus: CancellationStatus;
  avgPrepMinutes: number;
  prepTimeStatus: PrepTimeStatus;
  rating: number;
  ratingCount: number;
  ratingStatus: RatingStatus;
  overallHealthScore: number; // 0 to 100
  isEligibleForPromotedPlacement: boolean;
}

export function calculateMerchantScorecard(input: MerchantScorecardInput): ComputedMerchantScorecard {
  const total = Math.max(0, input.totalOrders);
  const accepted = Math.min(total, Math.max(0, input.acceptedOrders));
  const cancelled = Math.min(total, Math.max(0, input.cancelledOrders));
  const avgPrep = input.avgPrepMinutes != null && input.avgPrepMinutes > 0 ? input.avgPrepMinutes : 14;
  const rating = input.rating != null && input.rating > 0 ? Number(input.rating.toFixed(1)) : 0;
  const ratingCount = input.ratingCount ?? 0;

  // 1. Order Acceptance Rate
  // Target >= 98%, Alert if < 95%
  const acceptanceRatePct = total > 0
    ? Number(((accepted / total) * 100).toFixed(1))
    : 100.0;

  let acceptanceStatus: AcceptanceStatus = "OPTIMAL";
  if (acceptanceRatePct < 95.0) {
    acceptanceStatus = "ALERT";
  } else if (acceptanceRatePct < 98.0) {
    acceptanceStatus = "ATTENTION";
  }

  // 2. Merchant Cancellation Rate
  // Target < 0.5%, Warning if >= 1.0%
  const cancellationRatePct = total > 0
    ? Number(((cancelled / total) * 100).toFixed(1))
    : 0.0;

  let cancellationStatus: CancellationStatus = "EXCELLENT";
  if (cancellationRatePct >= 1.0) {
    cancellationStatus = "WARNING";
  } else if (cancellationRatePct >= 0.5) {
    cancellationStatus = "ACCEPTABLE";
  }

  // 3. Average Kitchen Preparation Time
  // Target <= 15m, Delay if > 25m
  let prepTimeStatus: PrepTimeStatus = "FAST";
  if (avgPrep > 25) {
    prepTimeStatus = "DELAYED";
  } else if (avgPrep > 15) {
    prepTimeStatus = "NORMAL";
  }

  // 4. Merchant Operational Rating
  // Benchmark comparison: 4.5+ is Top Rated
  let ratingStatus: RatingStatus = "GOOD";
  if (rating === 0) {
    ratingStatus = "GOOD";
  } else if (rating < 4.0) {
    ratingStatus = "NEEDS_IMPROVEMENT";
  } else if (rating < 4.5) {
    ratingStatus = "GOOD";
  } else {
    ratingStatus = "TOP_RATED";
  }

  // 5. Overall Platform Health Score (0 - 100)
  // Weighting: Acceptance 40%, Cancellation 30%, Prep Time 15%, Rating 15%
  const acceptanceScore = Math.min(40, (acceptanceRatePct / 100) * 40);
  const cancellationScore = Math.max(0, 30 - cancellationRatePct * 15);
  const prepScore = avgPrep <= 15 ? 15 : avgPrep <= 25 ? 10 : 4;
  const ratingScore = rating > 0 ? (rating / 5.0) * 15 : 12;
  const overallHealthScore = Math.min(
    100,
    Math.max(0, Math.round(acceptanceScore + cancellationScore + prepScore + ratingScore))
  );

  const isEligibleForPromotedPlacement =
    total >= 20 && acceptanceRatePct >= 98.0 && cancellationRatePct < 0.5 && rating >= 4.5;

  return {
    acceptanceRatePct,
    acceptanceStatus,
    cancellationRatePct,
    cancellationStatus,
    avgPrepMinutes: avgPrep,
    prepTimeStatus,
    rating,
    ratingCount,
    ratingStatus,
    overallHealthScore,
    isEligibleForPromotedPlacement,
  };
}

export interface MerchantPerformanceScorecardProps {
  data?: Partial<MerchantScorecardInput>;
  className?: string;
}

export function MerchantPerformanceScorecard({ data, className }: MerchantPerformanceScorecardProps) {
  const scorecard = calculateMerchantScorecard({
    totalOrders: data?.totalOrders ?? 0,
    acceptedOrders: data?.acceptedOrders ?? 0,
    cancelledOrders: data?.cancelledOrders ?? 0,
    avgPrepMinutes: data?.avgPrepMinutes ?? 14,
    rating: data?.rating ?? 0,
    ratingCount: data?.ratingCount ?? 0,
  });

  return (
    <Card className={cn("overflow-hidden rounded-3xl border border-gray-200 bg-white p-6 shadow-xs font-sans text-gray-900 space-y-5", className)}>
      {/* Scorecard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-emerald-600" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 font-mono">
              OrderKing Partner SLA Scorecard
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-gray-900 mt-0.5">
            Merchant Operational Scorecard &amp; SLA Health
          </h3>
          <p className="text-xs text-gray-500">
            Real-time tracking of kitchen acceptance, cancellation control, preparation speed, and diner satisfaction.
          </p>
        </div>

        {/* Overall Health Score Pill */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-gray-400 font-mono">Platform Health</div>
            <div className="text-2xl font-black text-gray-900 tabular font-display">
              {scorecard.overallHealthScore}<span className="text-sm font-semibold text-gray-400">/100</span>
            </div>
          </div>
          <div
            className={cn(
              "px-3 py-1.5 rounded-2xl text-xs font-bold border",
              scorecard.overallHealthScore >= 90
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : scorecard.overallHealthScore >= 75
                ? "bg-amber-50 text-amber-800 border-amber-200"
                : "bg-rose-50 text-rose-800 border-rose-200"
            )}
          >
            {scorecard.overallHealthScore >= 90
              ? "PLATINUM TIER"
              : scorecard.overallHealthScore >= 75
              ? "STANDARD TIER"
              : "AT RISK"}
          </div>
        </div>
      </div>

      {/* 4 Core Operational SLA Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Order Acceptance Rate */}
        <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 space-y-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-gray-500 font-semibold">
              <span className="uppercase text-[10px] tracking-wider">Acceptance Rate</span>
              {scorecard.acceptanceStatus === "OPTIMAL" ? (
                <CheckCircle2 className="size-4 text-emerald-600" />
              ) : scorecard.acceptanceStatus === "ATTENTION" ? (
                <AlertTriangle className="size-4 text-amber-500" />
              ) : (
                <XCircle className="size-4 text-rose-600" />
              )}
            </div>
            <div className="text-2xl font-black text-gray-900 mt-1 tabular font-display">
              {scorecard.acceptanceRatePct}%
            </div>
            <div className="text-[11px] text-gray-500">
              Target: <span className="font-bold text-gray-800">&gt;= 98.0%</span>
            </div>
          </div>
          <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between text-[11px]">
            <span
              className={cn(
                "font-bold",
                scorecard.acceptanceStatus === "OPTIMAL"
                  ? "text-emerald-700"
                  : scorecard.acceptanceStatus === "ATTENTION"
                  ? "text-amber-700"
                  : "text-rose-700 font-black animate-pulse"
              )}
            >
              {scorecard.acceptanceStatus === "OPTIMAL"
                ? "Optimal (No Auto-Rejection)"
                : scorecard.acceptanceStatus === "ATTENTION"
                ? "Attention (<98% Target)"
                : "Alert: High Rejections (<95%)"}
            </span>
          </div>
        </div>

        {/* Metric 2: Merchant Cancellation Rate */}
        <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 space-y-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-gray-500 font-semibold">
              <span className="uppercase text-[10px] tracking-wider">Cancellation Rate</span>
              {scorecard.cancellationStatus === "EXCELLENT" ? (
                <CheckCircle2 className="size-4 text-emerald-600" />
              ) : scorecard.cancellationStatus === "ACCEPTABLE" ? (
                <AlertTriangle className="size-4 text-amber-500" />
              ) : (
                <XCircle className="size-4 text-rose-600" />
              )}
            </div>
            <div
              className={cn(
                "text-2xl font-black mt-1 tabular font-display",
                scorecard.cancellationStatus === "WARNING" ? "text-rose-600" : "text-gray-900"
              )}
            >
              {scorecard.cancellationRatePct}%
            </div>
            <div className="text-[11px] text-gray-500">
              Target: <span className="font-bold text-gray-800">&lt; 0.5%</span> (SLA max 1.0%)
            </div>
          </div>
          <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between text-[11px]">
            <span
              className={cn(
                "font-bold",
                scorecard.cancellationStatus === "EXCELLENT"
                  ? "text-emerald-700"
                  : scorecard.cancellationStatus === "ACCEPTABLE"
                  ? "text-amber-700"
                  : "text-rose-700 font-black"
              )}
            >
              {scorecard.cancellationStatus === "EXCELLENT"
                ? "Excellent (No Fault Fees)"
                : scorecard.cancellationStatus === "ACCEPTABLE"
                ? "Acceptable (<1.0%)"
                : "Warning: High Fault Penalty (>=1%)"}
            </span>
          </div>
        </div>

        {/* Metric 3: Average Kitchen Prep Time */}
        <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 space-y-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-gray-500 font-semibold">
              <span className="uppercase text-[10px] tracking-wider">Avg Kitchen Prep Time</span>
              <Clock3 className="size-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-gray-900 mt-1 tabular font-display">
              {scorecard.avgPrepMinutes} <span className="text-xs font-normal text-gray-500">mins</span>
            </div>
            <div className="text-[11px] text-gray-500">
              Target: <span className="font-bold text-gray-800">&lt;= 15 mins</span> (Delay &gt; 25m)
            </div>
          </div>
          <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between text-[11px]">
            <span
              className={cn(
                "font-bold",
                scorecard.prepTimeStatus === "FAST"
                  ? "text-emerald-700"
                  : scorecard.prepTimeStatus === "NORMAL"
                  ? "text-gray-700"
                  : "text-rose-700 font-black"
              )}
            >
              {scorecard.prepTimeStatus === "FAST"
                ? "Fast Prep (Rider Ready)"
                : scorecard.prepTimeStatus === "NORMAL"
                ? "Standard Pacing"
                : "Delayed (>25 mins)"}
            </span>
          </div>
        </div>

        {/* Metric 4: Merchant Operational Rating */}
        <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 space-y-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-gray-500 font-semibold">
              <span className="uppercase text-[10px] tracking-wider">Merchant Rating</span>
              <Star className="size-4 text-[#E85D04] fill-[#E85D04]/30" />
            </div>
            <div className="text-2xl font-black text-gray-900 mt-1 tabular font-display flex items-baseline gap-1">
              {scorecard.rating > 0 ? (
                <>
                  {scorecard.rating.toFixed(1)} <span className="text-xs font-normal text-gray-500">/ 5.0</span>
                </>
              ) : (
                <span className="text-lg font-bold text-gray-400">No ratings yet</span>
              )}
              {scorecard.ratingCount > 0 && (
                <span className="text-xs font-normal text-gray-400">({scorecard.ratingCount})</span>
              )}
            </div>
            <div className="text-[11px] text-gray-500">
              Target: <span className="font-bold text-gray-800">4.5+ Top Rated</span>
            </div>
          </div>
          <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between text-[11px]">
            <span
              className={cn(
                "font-bold",
                scorecard.ratingStatus === "TOP_RATED"
                  ? "text-emerald-700"
                  : scorecard.ratingStatus === "GOOD"
                  ? "text-gray-700"
                  : "text-rose-700"
              )}
            >
              {scorecard.rating === 0
                ? "Awaiting verified diner reviews"
                : scorecard.ratingStatus === "TOP_RATED"
                ? "Top Rated Outlet"
                : scorecard.ratingStatus === "GOOD"
                ? "Good Standing"
                : "Needs Quality Attention"}
            </span>
          </div>
        </div>
      </div>

      {/* Promoted Placement Eligibility Banner */}
      <div className="rounded-2xl border border-gray-200 bg-gray-50/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <TrendingUp className="size-4 text-[#E23744]" />
          <div>
            <span className="font-bold text-gray-900">Featured Discovery Placement Eligibility: </span>
            <span className="text-gray-600">
              {scorecard.isEligibleForPromotedPlacement
                ? "Your outlet qualifies for 1st-page search boost and high-ranking banner placements on OrderKing."
                : "Maintain Acceptance >= 98%, Cancellation < 0.5%, and Rating >= 4.5 to qualify for search boost."}
            </span>
          </div>
        </div>
        <div className="shrink-0">
          <span
            className={cn(
              "px-3 py-1 rounded-full text-[11px] font-bold border",
              scorecard.isEligibleForPromotedPlacement
                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                : "bg-gray-100 text-gray-600 border-gray-300"
            )}
          >
            {scorecard.isEligibleForPromotedPlacement ? "ELIGIBLE FOR SEARCH BOOST" : "STANDARD DISCOVERY"}
          </span>
        </div>
      </div>
    </Card>
  );
}
