import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { VendorShell } from "@/components/vendor-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { useT } from "@/components/use-t";
import { useVendor } from "@/components/use-vendor";
import {
  getReviews,
  respondToReview,
  getCustomerComplaints,
  disputeCustomerComplaint,
  type CustomerComplaintRecord,
} from "@/lib/server/api-more";
import { formatINR } from "@/lib/money";
import {
  AlertTriangle,
  Bike,
  CheckCircle2,
  Clock,
  FileText,
  PackageCheck,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Star,
  UtensilsCrossed,
  X,
  XCircle,
} from "lucide-react";

export const Route = createFileRoute("/reviews")({ component: ReviewsPage });

type MainTab = "COMPLAINTS" | "RATINGS";
type ComplaintFilter = "ALL" | "TRANSIT_DAMAGE" | "MISSING_ITEM" | "ACTION_REQUIRED" | "DISPUTED";
type ReviewFilter = "ALL" | "NEEDS_REPLY" | "CRITICAL" | "POSITIVE";
type QuickReplyTone = "WARM_GRATITUDE" | "EMPATHETIC_QA" | "INVITE_BACK";

function buildHumanStyleReply(
  rating: number,
  body: string,
  restaurantName?: string,
  tone: QuickReplyTone = rating >= 4 ? "WARM_GRATITUDE" : rating === 3 ? "INVITE_BACK" : "EMPATHETIC_QA",
): string {
  const store = restaurantName || "our kitchen";
  const lower = body.toLowerCase();

  if (tone === "WARM_GRATITUDE") {
    if (lower.includes("pack") || lower.includes("hot") || lower.includes("fresh")) {
      return `Thank you so much! Our kitchen team at ${store} takes extra care to pack every dish hot and sealed fresh. We look forward to cooking for you again soon!`;
    }
    if (lower.includes("portion") || lower.includes("quantity") || lower.includes("value")) {
      return `Thank you for the wonderful feedback! At ${store}, generous portions and quality ingredients are our top priority. We appreciate your support!`;
    }
    if (rating >= 4) {
      return `Thank you for the ${rating}-star review! It means a lot to our entire team at ${store}. See you on your next order!`;
    }
    return `Thank you for reviewing your meal from ${store}. Your feedback helps our kitchen serve you better.`;
  }

  if (tone === "EMPATHETIC_QA") {
    if (lower.includes("late") || lower.includes("delay") || lower.includes("cold")) {
      return `We are truly sorry that your order from ${store} did not arrive on time. We have reviewed our kitchen dispatch timing to ensure faster turnaround. We hope to serve you better next time.`;
    }
    if (lower.includes("pack") || lower.includes("spill") || lower.includes("leak")) {
      return `Please accept our sincere apologies for the packaging issue. At ${store}, we have briefed our packing counter to double-seal all containers before handover.`;
    }
    return `We sincerely apologize that your meal from ${store} fell short of expectations. We have shared this with our head chef to tighten quality checks.`;
  }

  // INVITE_BACK
  return `Thank you for dining with ${store}! We look forward to preparing your favorites again very soon.`;
}

function ReviewsPage() {
  const t = useT();
  const vendor = useVendor();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<MainTab>("COMPLAINTS");
  const [complaintFilter, setComplaintFilter] = useState<ComplaintFilter>("ALL");
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>("ALL");

  // Dispute modal state
  const [disputeTarget, setDisputeTarget] = useState<CustomerComplaintRecord | null>(null);
  const [disputeReason, setDisputeReason] = useState("PACKAGING_INTACT_AT_DISPATCH");
  const [disputeNotes, setDisputeNotes] = useState("");
  const [disputing, setDisputing] = useState(false);
  const [disputeSuccessBanner, setDisputeSuccessBanner] = useState<string | null>(null);

  // Queries
  const reviewsQuery = useQuery({
    queryKey: ["reviews", vendor.restaurantId],
    queryFn: () => getReviews({ data: { restaurantId: vendor.restaurantId } }),
    enabled: Boolean(vendor.restaurantId),
  });

  const complaintsQuery = useQuery({
    queryKey: ["complaints", vendor.restaurantId],
    queryFn: () => getCustomerComplaints({ data: { restaurantId: vendor.restaurantId } }),
    enabled: Boolean(vendor.restaurantId),
  });

  const allReviews = reviewsQuery.data?.reviews ?? [];
  const totalReviewsCount = allReviews.length;
  const avgRating =
    totalReviewsCount > 0
      ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviewsCount).toFixed(1)
      : "—";
  const unansweredReviewsCount = allReviews.filter((r) => !r.response).length;
  const positiveCount = allReviews.filter((r) => r.rating >= 4).length;
  const criticalCount = allReviews.filter((r) => r.rating <= 2).length;

  const complaints = complaintsQuery.data?.complaints ?? [];
  const totalComplaints = complaints.length;
  const zeroDedCount = complaints.filter((c) => c.deductedPaise === 0).length;
  const disputedCount = complaints.filter((c) => c.status === "DISPUTED").length;
  const actionRequiredCount = complaints.filter((c) => c.status === "ACTION_REQUIRED").length;

  const filteredComplaints = complaints.filter((c) => {
    if (complaintFilter === "TRANSIT_DAMAGE") return c.category === "TRANSIT_DAMAGE";
    if (complaintFilter === "MISSING_ITEM") return c.category === "MISSING_ITEM";
    if (complaintFilter === "ACTION_REQUIRED") return c.status === "ACTION_REQUIRED";
    if (complaintFilter === "DISPUTED") return c.status === "DISPUTED";
    return true;
  });

  const filteredReviews = allReviews.filter((r) => {
    if (reviewFilter === "NEEDS_REPLY") return !r.response;
    if (reviewFilter === "CRITICAL") return r.rating <= 2;
    if (reviewFilter === "POSITIVE") return r.rating >= 4;
    return true;
  });

  async function handleDisputeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!disputeTarget || disputing) return;
    setDisputing(true);
    try {
      const res = await disputeCustomerComplaint({
        data: {
          restaurantId: vendor.restaurantId,
          complaintId: disputeTarget.id,
          orderId: disputeTarget.orderId,
          reason: disputeReason,
          notes: disputeNotes.trim(),
        },
      });
      setDisputeSuccessBanner(
        `Dispute logged under Ticket #${res.ticketNumber}. Platform merchant care will review dispatch evidence.`
      );
      setDisputeTarget(null);
      setDisputeNotes("");
      await qc.invalidateQueries({ queryKey: ["complaints"] });
    } catch (err) {
      alert(`Error submitting dispute: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setDisputing(false);
    }
  }

  return (
    <VendorShell
      title="Customer Feedback & Complaints"
      dataLabel={reviewsQuery.data?.dataLabel ?? vendor.dataLabel}
      restaurantName={vendor.selected?.restaurantName}
    >
      <div className="space-y-4 font-sans text-gray-900">
        {/* Navigation Tabs: Zomato Parity Structure */}
        <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab("COMPLAINTS")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${activeTab === "COMPLAINTS"
                ? "bg-[#E23744] text-white shadow-xs"
                : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }`}
          >
            <ShieldAlert className="size-4" />
            <span>Order Complaints &amp; Deductions</span>
            {actionRequiredCount > 0 && (
              <span className="ml-1 rounded-full bg-white text-[#E23744] px-1.5 py-0.2 text-[10px] font-black">
                {actionRequiredCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("RATINGS")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${activeTab === "RATINGS"
                ? "bg-[#E23744] text-white shadow-xs"
                : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }`}
          >
            <Star className="size-4" />
            <span>Ratings &amp; Reviews</span>
            {unansweredReviewsCount > 0 && (
              <span className="ml-1 rounded-full bg-amber-100 text-amber-800 px-1.5 py-0.2 text-[10px] font-bold">
                {unansweredReviewsCount}
              </span>
            )}
          </button>
        </div>

        {disputeSuccessBanner && (
          <div className="flex items-center justify-between rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-900">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
              {disputeSuccessBanner}
            </span>
            <button
              type="button"
              onClick={() => setDisputeSuccessBanner(null)}
              className="text-emerald-700 underline text-xs cursor-pointer ml-3"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* TAB 1: ORDER COMPLAINTS & DEDUCTIONS */}
        {activeTab === "COMPLAINTS" && (
          <div className="space-y-4">
            {/* Summary Metrics */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
              <div className="rounded-2xl border border-gray-200 bg-white p-3.5 shadow-xs">
                <div className="text-[10px] uppercase font-bold text-gray-400">Reported Issues</div>
                <div className="text-xl font-black text-gray-900 mt-1">{totalComplaints}</div>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3.5 shadow-xs">
                <div className="text-[10px] uppercase font-bold text-emerald-800">Transit Damage (₹0 Ded)</div>
                <div className="text-xl font-black text-emerald-700 mt-1">{zeroDedCount}</div>
                <div className="text-[10px] text-emerald-600 mt-0.5 font-medium">100% Platform Covered</div>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-3.5 shadow-xs">
                <div className="text-[10px] uppercase font-bold text-amber-800">Needs Action</div>
                <div className="text-xl font-black text-amber-700 mt-1">{actionRequiredCount}</div>
                <div className="text-[10px] text-amber-600 mt-0.5 font-medium">48h Dispute Window</div>
              </div>
              <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-3.5 shadow-xs">
                <div className="text-[10px] uppercase font-bold text-blue-800">Under Review</div>
                <div className="text-xl font-black text-blue-700 mt-1">{disputedCount}</div>
                <div className="text-[10px] text-blue-600 mt-0.5 font-medium">Merchant Care Ticket Active</div>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: "ALL", label: `All Issues (${totalComplaints})` },
                { id: "TRANSIT_DAMAGE", label: `Transit Spillage (${zeroDedCount})` },
                { id: "MISSING_ITEM", label: `Missing Items` },
                { id: "ACTION_REQUIRED", label: `Needs Action (${actionRequiredCount})` },
                { id: "DISPUTED", label: `Disputed (${disputedCount})` },
              ].map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setComplaintFilter(pill.id as ComplaintFilter)}
                  className={`rounded-full px-3.5 py-1 text-xs font-bold transition cursor-pointer ${complaintFilter === pill.id
                      ? "bg-[#E23744] text-white shadow-xs"
                      : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Complaints List */}
            {filteredComplaints.length === 0 ? (
              <Card className="border-gray-200 bg-white p-8 text-center rounded-2xl shadow-xs space-y-4">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="size-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-base text-gray-900">Zero Active Complaints</h3>
                  <p className="text-xs text-gray-500 max-w-md mx-auto">
                    Your kitchen maintains 100% order accuracy. No unresolved customer claims or packaging disputes exist for your restaurant.
                  </p>
                </div>
                {/* Zomato Standard Policy Guarantee */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 text-left max-w-2xl mx-auto text-xs">
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="font-bold text-gray-900 flex items-center gap-1.5">
                      <Bike className="size-3.5 text-emerald-600" /> Transit Spillage
                    </div>
                    <div className="text-[11px] text-gray-500 mt-1">
                      100% platform delivery liability. ₹0 deducted from restaurant payout when containers are properly sealed.
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="font-bold text-gray-900 flex items-center gap-1.5">
                      <Scale className="size-3.5 text-amber-600" /> Missing Items
                    </div>
                    <div className="text-[11px] text-gray-500 mt-1">
                      48-hour dispute window to upload packaging CCTV timestamp or KDS packing checklist.
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="font-bold text-gray-900 flex items-center gap-1.5">
                      <Clock className="size-3.5 text-blue-600" /> Rider Delays
                    </div>
                    <div className="text-[11px] text-gray-500 mt-1">
                      Rider traffic or delayed pickup is logged automatically as logistics fault. Zero restaurant penalty.
                    </div>
                  </div>
                </div>
              </Card>
            ) : (
              <div className="grid gap-3">
                {filteredComplaints.map((item) => (
                  <Card key={item.id} className="border-gray-200 bg-white p-4.5 rounded-2xl shadow-xs space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2.5 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{item.orderNumber}</span>
                        <span className="text-gray-400">·</span>
                        <span className="text-gray-500">{new Date(item.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                        <span className="text-gray-400">·</span>
                        <span className="text-gray-600 font-medium">{item.itemsSummary}</span>
                      </div>
                      <div>
                        {item.status === "RESOLVED_ZERO_DEDUCTION" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ShieldCheck className="size-3" /> Platform Logistics Covered (₹0 Deduction)
                          </span>
                        ) : item.status === "DISPUTED" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <Clock className="size-3" /> Disputed · Under Review
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <AlertTriangle className="size-3" /> Action Required (48h Window)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="font-bold text-gray-900 text-sm">{item.title}</div>
                        <p className="text-gray-600 leading-relaxed">{item.description}</p>
                      </div>

                      <div className="flex items-center gap-4 shrink-0 sm:border-l sm:border-gray-100 sm:pl-4">
                        <div>
                          <div className="text-[10px] uppercase font-bold text-gray-400">Deduction</div>
                          <div className={`text-sm font-bold ${item.deductedPaise === 0 ? "text-emerald-700" : "text-rose-700"}`}>
                            {formatINR(item.deductedPaise)}
                          </div>
                        </div>

                        {item.status === "ACTION_REQUIRED" && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setDisputeTarget(item);
                              setDisputeNotes(`Confirming that order ${item.orderNumber} was packed in full and sealed with tamper-evident tape before rider pickup.`);
                            }}
                            className="bg-[#E23744] hover:bg-[#d32f2f] text-white font-bold text-xs h-9 px-4 rounded-xl cursor-pointer"
                          >
                            Dispute Deduction
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: RATINGS & REVIEWS */}
        {activeTab === "RATINGS" && (
          <div className="space-y-4">
            {/* Rating Summary Card */}
            <Card className="border-gray-200 bg-white p-5 rounded-2xl shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-100 pb-4">
                <div className="flex items-center gap-4">
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-center">
                    <div className="font-display text-3xl font-black text-amber-600 tabular flex items-center justify-center gap-1">
                      {avgRating} <Star className="size-5 fill-amber-500 text-amber-500" />
                    </div>
                    <div className="text-[11px] font-semibold text-gray-600 mt-0.5">
                      {totalReviewsCount} {totalReviewsCount === 1 ? "Review" : "Reviews"}
                    </div>
                  </div>
                  <div>
                    <h2 className="font-bold text-base text-gray-900">Customer Reviews &amp; Ratings</h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      100% verified order reviews from authenticated diners.
                    </p>
                    <div className="flex items-center gap-3 text-xs font-semibold mt-1">
                      <span className="text-emerald-700">
                        {unansweredReviewsCount === 0
                          ? "All reviews replied"
                          : `${unansweredReviewsCount} awaiting reply`}
                      </span>
                      <span className="text-gray-400">·</span>
                      <span className="text-gray-600">4–5 Stars: {positiveCount}</span>
                      <span className="text-gray-400">·</span>
                      <span className="text-gray-600">1–2 Stars: {criticalCount}</span>
                    </div>
                  </div>
                </div>

                {/* 5-Star to 1-Star Progress Bars */}
                <div className="w-full md:w-60 space-y-1 text-xs">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = allReviews.filter((r) => r.rating === star).length;
                    const pct = totalReviewsCount > 0 ? Math.round((count * 100) / totalReviewsCount) : 0;
                    return (
                      <div key={star} className="flex items-center gap-2">
                        <span className="w-10 text-gray-600 font-semibold inline-flex items-center gap-1">
                          {star} <Star className="size-3 fill-amber-500 text-amber-500" />
                        </span>
                        <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${star >= 4 ? "bg-emerald-500" : star === 3 ? "bg-amber-400" : "bg-rose-500"
                              }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-12 text-right font-mono text-gray-400 tabular">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Review Filter Pills */}
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "ALL", label: `All Reviews (${totalReviewsCount})` },
                  { id: "NEEDS_REPLY", label: `Needs Reply (${unansweredReviewsCount})` },
                  { id: "CRITICAL", label: `Critical 1–2 Stars (${criticalCount})` },
                  { id: "POSITIVE", label: `Positive 4–5 Stars (${positiveCount})` },
                ].map((pill) => (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => setReviewFilter(pill.id as ReviewFilter)}
                    className={`rounded-full px-3.5 py-1 text-xs font-bold transition cursor-pointer ${reviewFilter === pill.id
                        ? "bg-[#E23744] text-white shadow-xs"
                        : "border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
                      }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
            </Card>

            {/* Reviews List */}
            {filteredReviews.length === 0 ? (
              <Card className="text-xs text-gray-500 p-6 border-gray-200 bg-white text-center rounded-2xl shadow-xs">
                No customer reviews in this category yet.
              </Card>
            ) : (
              filteredReviews.map((r) => (
                <ReviewCard
                  key={r.id}
                  review={r}
                  canRespond={Boolean(reviewsQuery.data?.canRespond)}
                  restaurantId={vendor.restaurantId}
                  restaurantName={vendor.selected?.restaurantName}
                  onSaved={() => void qc.invalidateQueries({ queryKey: ["reviews"] })}
                />
              ))
            )}
          </div>
        )}

        {/* Dispute Submission Modal */}
        {disputeTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <Scale className="size-4 text-[#E23744]" />
                  <h3 className="font-bold text-base text-gray-900">
                    Dispute Customer Deduction ({disputeTarget.orderNumber})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setDisputeTarget(null)}
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-900"
                >
                  <X className="size-4" />
                </button>
              </div>

              <form onSubmit={handleDisputeSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Dispute Reason</label>
                  <select
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    className="w-full h-10 rounded-xl border border-gray-300 bg-gray-50 px-3 text-xs font-semibold text-gray-900 outline-none focus:border-[#E23744]"
                  >
                    <option value="PACKAGING_INTACT_AT_DISPATCH">Packaging was fully sealed and intact upon dispatch</option>
                    <option value="ALL_ITEMS_INCLUDED_VERIFIED">All items verified on kitchen dispatch checklist</option>
                    <option value="TRANSIT_SPILLAGE_RIDER_FAULT">Transit spillage occurred during bike delivery (Rider Liability)</option>
                    <option value="CUSTOMER_FALSE_CLAIM">Customer incorrect complaint / dish delivered as ordered</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Kitchen Rebuttal &amp; Dispatch Proof Notes</label>
                  <Textarea
                    rows={4}
                    value={disputeNotes}
                    onChange={(e) => setDisputeNotes(e.target.value)}
                    placeholder="Provide KDS packing time, CCTV verification note, or package seal proof..."
                    className="text-xs border-gray-300 rounded-xl"
                  />
                </div>

                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                  <strong>Notice:</strong> Submitting a dispute raises an urgent ticket to Platform Partner Care. If approved, the deduction will be credited back to your next T+1 daily settlement ledger.
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDisputeTarget(null)}
                    className="h-10 text-xs rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={disputing}
                    className="h-10 bg-[#E23744] hover:bg-[#d32f2f] text-white font-bold text-xs rounded-xl px-5"
                  >
                    {disputing ? "Submitting Dispute..." : "Submit Formal Dispute"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </VendorShell>
  );
}

function ReviewCard({
  review,
  canRespond,
  restaurantId,
  restaurantName,
  onSaved,
}: {
  review: {
    id: string;
    rating: number;
    body: string;
    createdAt: string;
    orderId?: string | null;
    response: string | null;
    dataLabel: string;
  };
  canRespond: boolean;
  restaurantId?: string;
  restaurantName?: string;
  onSaved: () => void;
}) {
  const [text, setText] = useState(review.response ?? "");
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  async function handleSendReply(customText?: string) {
    const bodyToSend = (customText ?? text).trim();
    if (!bodyToSend || saving) return;
    setSaving(true);
    try {
      await respondToReview({
        data: {
          restaurantId,
          reviewId: review.id,
          body: bodyToSend,
        },
      });
      setText(bodyToSend);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      onSaved();
    } catch (err) {
      alert(`Failed to save reply: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="border-gray-200 bg-white p-4.5 rounded-2xl shadow-xs space-y-3 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2.5">
        <div className="flex items-center gap-2">
          <span
            className={`rounded-md px-2 py-0.5 font-bold ${review.rating >= 4
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : review.rating === 3
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "bg-rose-50 text-rose-700 border border-rose-200"
              }`}
          >
            {review.rating} / 5
          </span>
          {review.orderId && (
            <span className="text-gray-500 font-mono">Order #{review.orderId.slice(-6)}</span>
          )}
        </div>
        <div className="text-gray-400">
          {new Date(review.createdAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </div>
      </div>

      <p className="text-gray-800 leading-relaxed font-normal">{review.body}</p>

      {/* Existing Response */}
      {review.response ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 space-y-1">
          <div className="font-bold text-emerald-800 flex items-center gap-1.5 text-[11px]">
            <CheckCircle2 className="size-3 text-emerald-600" />
            <span>Partner Reply</span>
          </div>
          <p className="text-gray-700">{review.response}</p>
        </div>
      ) : canRespond ? (
        <div className="space-y-2 pt-1 border-t border-gray-100">
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="font-bold text-gray-500">Quick Reply:</span>
            <button
              type="button"
              onClick={() => {
                const r = buildHumanStyleReply(review.rating, review.body, restaurantName, "WARM_GRATITUDE");
                setText(r);
              }}
              className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold cursor-pointer transition"
            >
              Gratitude
            </button>
            <button
              type="button"
              onClick={() => {
                const r = buildHumanStyleReply(review.rating, review.body, restaurantName, "EMPATHETIC_QA");
                setText(r);
              }}
              className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold cursor-pointer transition"
            >
              Chef Apology
            </button>
            <button
              type="button"
              onClick={() => {
                const r = buildHumanStyleReply(review.rating, review.body, restaurantName, "INVITE_BACK");
                setText(r);
              }}
              className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold cursor-pointer transition"
            >
              Invite Back
            </button>
          </div>

          <div className="flex gap-2">
            <Textarea
              rows={2}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a polite, personal reply to the customer..."
              className="text-xs border-gray-300 rounded-xl"
            />
            <Button
              type="button"
              disabled={!text.trim() || saving}
              onClick={() => handleSendReply()}
              className="h-auto bg-[#E23744] hover:bg-[#d32f2f] text-white font-bold text-xs rounded-xl px-4 shrink-0"
            >
              {saving ? "Sending..." : "Reply"}
            </Button>
          </div>
          {savedSuccess && (
            <div className="text-[11px] font-bold text-emerald-700">Reply sent to customer.</div>
          )}
        </div>
      ) : null}
    </Card>
  );
}
