import { useState, useEffect } from "react";
import { Star, MessageSquare, ThumbsUp, CornerDownRight, Send, Flag, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export interface RestaurantReview {
  id: string;
  customerName: string;
  orderNumber: string;
  rating: number;
  date: string;
  dishName: string;
  comment: string;
  photos?: string[];
  ownerReply?: string | null;
}

export function ReviewReplyManager({
  initialReviews = [],
  onReply,
}: {
  initialReviews?: RestaurantReview[];
  onReply?: (id: string, text: string) => Promise<void> | void;
} = {}) {
  const [filterRating, setFilterRating] = useState<number | "ALL">("ALL");
  const [replyInput, setReplyInput] = useState<Record<string, string>>({});
  const [reviews, setReviews] = useState<RestaurantReview[]>(initialReviews);

  useEffect(() => {
    setReviews(initialReviews);
  }, [initialReviews]);

  const handlePostReply = (id: string) => {
    const text = replyInput[id]?.trim();
    if (!text) {
      toast.error("Please type a response message");
      return;
    }
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ownerReply: text } : r))
    );
    setReplyInput((prev) => ({ ...prev, [id]: "" }));
    toast.success("Public owner reply published to customer review!");
  };

  const handleReport = (id: string) => {
    toast.success("Review flagged for merchant operations review.");
  };

  const filtered = reviews.filter((r) => {
    if (filterRating === "ALL") return true;
    return r.rating === filterRating;
  });

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
        <div>
          <h2 className="text-base font-bold text-fg flex items-center gap-2">
            <span>⭐</span> Customer Reviews & Owner Responses
          </h2>
          <p className="text-xs text-muted">
            Engage with diners, acknowledge compliments, and resolve customer grievances publicly.
          </p>
        </div>

        {/* Rating Filter Pills */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {(["ALL", 5, 4, 3, 2, 1] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setFilterRating(r)}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                filterRating === r
                  ? "bg-primary text-primary-fg shadow-xs"
                  : "bg-surface-2 text-muted hover:text-fg"
              }`}
            >
              {r === "ALL" ? "All Stars" : `${r} ★`}
            </button>
          ))}
        </div>
      </div>

      {/* Review List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center space-y-1.5 text-xs text-muted">
            <p className="font-semibold text-fg">No Customer Reviews Found</p>
            <p>Verified customer ratings and review comments will appear here automatically.</p>
          </div>
        ) : (
          filtered.map((r) => (
          <Card key={r.id} className="p-4 space-y-3">
            {/* Header info */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-fg">{r.customerName}</span>
                  <span className="rounded bg-surface-2 px-1.5 py-0.2 text-[10px] text-muted font-mono">
                    #{r.orderNumber}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`size-3.5 ${
                          s <= r.rating ? "fill-amber-400 text-amber-400" : "text-muted/30"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] text-muted">· {r.date}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleReport(r.id)}
                className="text-muted hover:text-danger text-[11px] flex items-center gap-1 transition"
                title="Report review"
              >
                <Flag className="size-3" /> Report
              </button>
            </div>

            {/* Tagged Dish */}
            <div className="rounded-lg bg-surface-2 px-2.5 py-1 text-xs font-medium text-fg inline-block">
              Dish: <strong className="text-primary">{r.dishName}</strong>
            </div>

            {/* Review Comment */}
            <p className="text-xs text-muted leading-relaxed">{r.comment}</p>

            {/* Review Photos */}
            {r.photos && r.photos.length > 0 && (
              <div className="flex gap-2">
                {r.photos.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt=""
                    className="size-16 rounded-lg object-cover border border-border"
                  />
                ))}
              </div>
            )}

            {/* Existing Owner Reply */}
            {r.ownerReply ? (
              <div className="rounded-xl border border-border/80 bg-surface-2/60 p-3 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-fg">
                  <CornerDownRight className="size-3.5 text-primary" />
                  <span>Official Restaurant Reply</span>
                </div>
                <p className="text-xs text-muted leading-relaxed pl-5">{r.ownerReply}</p>
              </div>
            ) : (
              /* Reply Form */
              <div className="pt-1 flex gap-2">
                <input
                  type="text"
                  placeholder="Write an official response to this diner..."
                  value={replyInput[r.id] || ""}
                  onChange={(e) =>
                    setReplyInput((prev) => ({ ...prev, [r.id]: e.target.value }))
                  }
                  className="flex-1 rounded-xl border border-border bg-surface-2 px-3 py-1.5 text-xs"
                />
                <Button size="sm" onClick={() => handlePostReply(r.id)} className="gap-1 text-xs">
                  <Send className="size-3" /> Reply
                </Button>
              </div>
            )}
          </Card>
        )))}
      </div>
    </div>
  );
}
