import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { VendorShell } from "@/components/vendor-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { useT } from "@/components/use-t";
import { useVendor } from "@/components/use-vendor";
import { getReviews, respondToReview } from "@/lib/server/api-more";
import {
  CheckCircle2,
  MessageSquareHeart,
  ShieldCheck,
  Sparkles,
  Star,
  UtensilsCrossed,
} from "lucide-react";

export const Route = createFileRoute("/reviews")({ component: ReviewsPage });

const replyReview = respondToReview;

type ReviewFilter = "ALL" | "NEEDS_REPLY" | "CRITICAL" | "POSITIVE";
type SparkReplyTone = "WARM_GRATITUDE" | "EMPATHETIC_QA" | "INVITE_BACK";

function detectReviewTopics(body: string): string[] {
  const lower = body.toLowerCase();
  const topics: string[] = [];
  if (lower.includes("pack") || lower.includes("spill") || lower.includes("seal") || lower.includes("box")) {
    topics.push("Packaging & Sealing");
  }
  if (lower.includes("hot") || lower.includes("fresh") || lower.includes("warm") || lower.includes("cold")) {
    topics.push("Temperature & Freshness");
  }
  if (
    lower.includes("portion") ||
    lower.includes("quantity") ||
    lower.includes("serving") ||
    lower.includes("value")
  ) {
    topics.push("Portion & Value");
  }
  if (
    lower.includes("taste") ||
    lower.includes("delicious") ||
    lower.includes("spice") ||
    lower.includes("spicy") ||
    lower.includes("flavour") ||
    lower.includes("flavor")
  ) {
    topics.push("Taste & Seasoning");
  }
  if (
    lower.includes("late") ||
    lower.includes("delay") ||
    lower.includes("fast") ||
    lower.includes("quick") ||
    lower.includes("time")
  ) {
    topics.push("Prep & Dispatch Timing");
  }
  return topics;
}

function buildHumanStyleReply(
  rating: number,
  body: string,
  restaurantName?: string,
  tone: SparkReplyTone = rating >= 4 ? "WARM_GRATITUDE" : rating === 3 ? "INVITE_BACK" : "EMPATHETIC_QA",
): string {
  const store = restaurantName || "our kitchen";
  const lower = body.toLowerCase();

  if (tone === "WARM_GRATITUDE") {
    if (lower.includes("pack") || lower.includes("hot") || lower.includes("fresh")) {
      return `Thank you so much for your kind words! Our chefs and dispatch team at ${store} take extra care to cook and pack every order fresh and piping hot. We truly appreciate your support and look forward to cooking for you again soon!`;
    }
    if (lower.includes("portion") || lower.includes("quantity") || lower.includes("value")) {
      return `Thank you for the wonderful feedback! At ${store}, we believe in generous portions and authentic ingredients on every order. Your note made our kitchen team's day—see you on your next order!`;
    }
    if (rating >= 4) {
      return `Thank you for the ${rating}-star review! It truly means the world to our chefs and kitchen staff at ${store}. We cannot wait to prepare your favourites again soon!`;
    }
    return `Thank you for taking the time to review your meal from ${store}. Every piece of diner feedback helps our kitchen team serve you better, and we hope to welcome you back soon.`;
  }

  if (tone === "EMPATHETIC_QA") {
    if (lower.includes("late") || lower.includes("delay") || lower.includes("cold")) {
      return `We are truly sorry that your order from ${store} did not reach you fresh and on time. We have reviewed our KDS prep handoff timing and thermal foil packaging for this order so we can prevent any delay going forward. We hope to make this right on your next meal.`;
    }
    if (lower.includes("pack") || lower.includes("spill") || lower.includes("leak")) {
      return `Please accept our sincere apologies for the packaging issue on your order. At ${store}, we have briefed our packing station to double-check container seals and secondary taping before rider handoff. Thank you for bringing this to our attention.`;
    }
    if (lower.includes("spice") || lower.includes("spicy") || lower.includes("salt") || lower.includes("taste")) {
      return `Thank you for sharing this honest note about the seasoning. I have personally shared your feedback with our head chef at ${store} to recalibrate our prep line tasting checks. On your next order, please feel free to add a chef note and we will customize it to your exact preference.`;
    }
    return `We sincerely apologize that your meal from ${store} fell short of expectations. We have reviewed your feedback directly with our kitchen prep line to tighten quality checks before dispatch, and we are committed to delivering a 5-star experience next time.`;
  }

  // INVITE_BACK tone
  if (rating >= 4) {
    return `We are delighted that you enjoyed your meal from ${store}! Thank you for dining with us—our kitchen team looks forward to welcoming you back for another freshly prepared meal very soon.`;
  }
  return `Thank you for sharing your honest feedback with ${store}. We have shared your note with our head chef so we can improve and earn all 5 stars on your next order with us.`;
}

function ReviewsPage() {
  const t = useT();
  const vendor = useVendor();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<ReviewFilter>("ALL");

  const q = useQuery({
    queryKey: ["reviews", vendor.restaurantId],
    queryFn: () => getReviews({ data: { restaurantId: vendor.restaurantId } }),
    enabled: Boolean(vendor.restaurantId),
  });

  const allReviews = q.data?.reviews ?? [];
  const totalCount = allReviews.length;
  const avgRating =
    totalCount > 0
      ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / totalCount).toFixed(1)
      : "—";
  const unansweredCount = allReviews.filter((r) => !r.response).length;
  const answeredCount = totalCount - unansweredCount;
  const responseRatePct = totalCount > 0 ? Math.round((answeredCount * 100) / totalCount) : 100;
  const positiveCount = allReviews.filter((r) => r.rating >= 4).length;
  const criticalCount = allReviews.filter((r) => r.rating <= 2).length;

  // Deterministic topic frequency across real customer reviews
  const topicCounts = {
    taste: allReviews.filter((r) => detectReviewTopics(r.body).includes("Taste & Seasoning")).length,
    packaging: allReviews.filter((r) => detectReviewTopics(r.body).includes("Packaging & Sealing")).length,
    freshness: allReviews.filter((r) => detectReviewTopics(r.body).includes("Temperature & Freshness")).length,
    timing: allReviews.filter((r) => detectReviewTopics(r.body).includes("Prep & Dispatch Timing")).length,
  };

  const filteredReviews = allReviews.filter((r) => {
    if (filter === "NEEDS_REPLY") return !r.response;
    if (filter === "CRITICAL") return r.rating <= 2;
    if (filter === "POSITIVE") return r.rating >= 4;
    return true;
  });

  return (
    <VendorShell
      title={t("nav.reviews")}
      dataLabel={q.data?.dataLabel ?? vendor.dataLabel}
      restaurantName={vendor.selected?.restaurantName}
    >
      <div className="space-y-4">
        {/* Customer Sentiment, Rating Distribution & Spark AI Assistant Header */}
        <Card className="border-slate-800 bg-slate-900/80 p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-center">
                <div className="font-display text-3xl font-bold text-amber-400 tabular flex items-center justify-center gap-1">
                  {avgRating} <Star className="size-5 fill-amber-400 text-amber-400" />
                </div>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                  {totalCount} {totalCount === 1 ? "Verified Review" : "Verified Reviews"}
                </div>
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-base font-bold text-white">
                    Customer Rating Analytics &amp; Spark AI Reply Assistant
                  </h2>
                  <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="size-3" /> 100% Verified Order Reviews
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {t("reviews.cannotDelete")} Thoughtful, human-style partner responses build diner trust and repeat orders.
                </p>
                <div className="flex flex-wrap items-center gap-3 text-xs font-medium mt-1.5">
                  <span className="text-emerald-400">
                    {unansweredCount === 0
                      ? "100% of customer reviews have been answered."
                      : `${unansweredCount} review(s) awaiting your response (${responseRatePct}% response rate).`}
                  </span>
                  <span className="text-slate-400 font-mono">
                    · 4–5★: {positiveCount} · 1–2★: {criticalCount}
                  </span>
                </div>
              </div>
            </div>

            {/* 5★ to 1★ Rating Distribution Bars */}
            <div className="w-full md:w-64 space-y-1 text-xs">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = allReviews.filter((r) => r.rating === star).length;
                const pct = totalCount > 0 ? Math.round((count * 100) / totalCount) : 0;
                return (
                  <div key={star} className="flex items-center gap-2">
                    <span className="w-8 font-mono text-slate-300 tabular">{star} ★</span>
                    <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          star >= 4 ? "bg-emerald-500" : star === 3 ? "bg-amber-400" : "bg-rose-500"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-14 text-right font-mono text-slate-400 tabular">
                      {count} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Real Customer Feedback Themes Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-2.5">
              <div className="text-[10px] font-mono uppercase text-slate-400">Taste &amp; Seasoning</div>
              <div className="text-sm font-bold text-white mt-0.5 tabular">
                {topicCounts.taste} {topicCounts.taste === 1 ? "mention" : "mentions"}
              </div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-2.5">
              <div className="text-[10px] font-mono uppercase text-slate-400">Packaging &amp; Sealing</div>
              <div className="text-sm font-bold text-white mt-0.5 tabular">
                {topicCounts.packaging} {topicCounts.packaging === 1 ? "mention" : "mentions"}
              </div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-2.5">
              <div className="text-[10px] font-mono uppercase text-slate-400">Temp &amp; Freshness</div>
              <div className="text-sm font-bold text-white mt-0.5 tabular">
                {topicCounts.freshness} {topicCounts.freshness === 1 ? "mention" : "mentions"}
              </div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-2.5">
              <div className="text-[10px] font-mono uppercase text-slate-400">Prep &amp; Dispatch Speed</div>
              <div className="text-sm font-bold text-white mt-0.5 tabular">
                {topicCounts.timing} {topicCounts.timing === 1 ? "mention" : "mentions"}
              </div>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: "ALL", label: `All Reviews (${totalCount})` },
                { id: "NEEDS_REPLY", label: `Needs Reply (${unansweredCount})` },
                {
                  id: "CRITICAL",
                  label: `Critical 1–2★ (${criticalCount})`,
                },
                {
                  id: "POSITIVE",
                  label: `Positive 4–5★ (${positiveCount})`,
                },
              ] as const
            ).map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setFilter(pill.id)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  filter === pill.id
                    ? "bg-emerald-600 text-white"
                    : "border border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-700"
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </Card>

        {filteredReviews.length === 0 ? (
          <Card className="text-sm text-muted p-5 border-slate-800 bg-slate-900/60">
            {t("reviews.empty")}
          </Card>
        ) : (
          filteredReviews.map((r) => (
            <ReviewRow
              key={r.id}
              review={r}
              canRespond={Boolean(q.data?.canRespond)}
              restaurantId={vendor.restaurantId}
              restaurantName={vendor.selected?.restaurantName}
              onSaved={() => void qc.invalidateQueries({ queryKey: ["reviews"] })}
            />
          ))
        )}
      </div>
    </VendorShell>
  );
}

function ReviewRow({
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
  const t = useT();
  const [text, setText] = useState(review.response ?? "");
  const [selectedTone, setSelectedTone] = useState<SparkReplyTone>(
    review.rating >= 4 ? "WARM_GRATITUDE" : review.rating === 3 ? "INVITE_BACK" : "EMPATHETIC_QA",
  );
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  const detectedTopics = detectReviewTopics(review.body);

  return (
    <Card className="border-slate-800 bg-slate-900/70 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-md px-2 py-0.5 font-mono font-bold tabular ${
              review.rating >= 4
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                : review.rating === 3
                  ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                  : "bg-rose-500/15 text-rose-300 border border-rose-500/30"
            }`}
          >
            {review.rating} ★ / 5
          </span>
          {review.orderId ? (
            <span className="rounded border border-slate-800 bg-slate-950 px-2 py-0.5 text-[10px] font-mono text-slate-400 flex items-center gap-1">
              <UtensilsCrossed className="size-3 text-slate-500" /> Order #{review.orderId.slice(-6)}
            </span>
          ) : null}
          {detectedTopics.map((topic) => (
            <span
              key={topic}
              className="rounded border border-slate-800 bg-slate-950/90 px-2 py-0.5 text-[10px] font-mono text-slate-300"
            >
              {topic}
            </span>
          ))}
          {review.response ? (
            <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="size-3.5" /> Replied
            </span>
          ) : (
            <span className="text-[11px] font-mono text-amber-400">Needs Response</span>
          )}
        </div>
        <span className="text-slate-400 font-mono">
          {new Date(review.createdAt).toLocaleDateString("en-IN")}
        </span>
      </div>

      <p className="text-sm text-slate-100 leading-relaxed">{review.body}</p>

      {review.response ? (
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-xs text-slate-300 space-y-1">
          <div className="text-[10px] font-mono uppercase text-emerald-400 flex items-center gap-1.5">
            <MessageSquareHeart className="size-3.5" /> Official Restaurant Partner Response
          </div>
          <p>{review.response}</p>
        </div>
      ) : null}

      {canRespond ? (
        <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs text-amber-300 font-medium">
              <Sparkles className="size-3.5 text-amber-400" />
              <span>Spark AI Human-Style Review Response Assistant</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: "WARM_GRATITUDE", label: "Warm Chef Gratitude" },
                  { id: "EMPATHETIC_QA", label: "Empathetic Kitchen QA" },
                  { id: "INVITE_BACK", label: "Personal Invite Back" },
                ] as const
              ).map((toneOption) => (
                <button
                  key={toneOption.id}
                  type="button"
                  onClick={() => {
                    setSelectedTone(toneOption.id);
                    setText(
                      buildHumanStyleReply(
                        review.rating,
                        review.body,
                        restaurantName,
                        toneOption.id,
                      ),
                    );
                  }}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition ${
                    selectedTone === toneOption.id && text.trim().length > 0
                      ? "border border-amber-500/40 bg-amber-500/15 text-amber-300"
                      : "border border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <Sparkles className="inline mr-1 size-3 text-amber-400" />
                  {toneOption.label}
                </button>
              ))}
            </div>
          </div>

          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Draft a polite, empathetic response with Spark AI above or write your personal reply..."
            className="text-xs bg-slate-950 border-slate-800"
          />

          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-400">
              {savedMsg ? "Response published to customer review." : ""}
            </span>
            <Button
              size="sm"
              disabled={saving || !text.trim()}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
              onClick={() => {
                setSaving(true);
                setSavedMsg(false);
                void replyReview({
                  data: { restaurantId, reviewId: review.id, body: text },
                })
                  .then(() => {
                    setSavedMsg(true);
                    onSaved();
                  })
                  .finally(() => setSaving(false));
              }}
            >
              {saving ? "Publishing..." : t("reviews.respond")}
            </Button>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
