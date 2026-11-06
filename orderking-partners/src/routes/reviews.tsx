// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { VendorShell } from "@/components/vendor-shell";
import { Star, MessageSquare, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/reviews")({
  component: PartnerReviewsPage,
});

function PartnerReviewsPage() {
  const [reviews, setReviews] = useState([
    {
      id: "rev_1",
      orderCode: "OK-8941",
      customer: "Debashish Roy",
      rating: 5,
      comment: "Chicken Dum Biryani arrived piping hot within 22 minutes. Packaging was sealed properly.",
      reply: "Thank you Debashish! Glad you enjoyed the Assam spice blend.",
    },
    {
      id: "rev_2",
      orderCode: "OK-8912",
      customer: "Farhana Begum",
      rating: 4,
      comment: "Smoked Chicken Pizza cheese burst crust was great, please add extra oregano packets next time.",
      reply: "",
    },
  ]);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  function handleSaveReply(id: string) {
    const txt = (replyDrafts[id] || "").trim();
    if (!txt) return;
    setReviews(reviews.map((r) => (r.id === id ? { ...r, reply: txt } : r)));
    setReplyDrafts({ ...replyDrafts, [id]: "" });
  }

  return (
    <VendorShell title="Customer Ratings & Dish Reviews">
      <div className="mx-auto max-w-4xl py-4 space-y-4 text-slate-100">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <Star className="size-5 text-amber-400" />
              <span>Verified Doorstep-OTP Customer Reviews</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">Average Storefront Rating: 4.7 ★ (Verified Orders Only)</p>
          </div>
        </div>

        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-bold text-white">
                  {r.customer} <span className="font-mono text-xs text-slate-400">· #{r.orderCode}</span>
                </div>
                <span className="rounded-lg bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-300">
                  {r.rating}.0 ★
                </span>
              </div>
              <p className="text-xs text-slate-200">{r.comment}</p>
              {r.reply ? (
                <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 text-xs text-emerald-300">
                  <strong>Your Reply:</strong> {r.reply}
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={replyDrafts[r.id] || ""}
                    onChange={(e) => setReplyDrafts({ ...replyDrafts, [r.id]: e.target.value })}
                    placeholder="Write a public response to this customer..."
                    className="h-9 bg-slate-950 border-slate-800 text-white text-xs"
                  />
                  <Button
                    type="button"
                    onClick={() => handleSaveReply(r.id)}
                    className="h-9 px-4 bg-emerald-600 text-white text-xs font-bold rounded-xl shrink-0"
                  >
                    Reply
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </VendorShell>
  );
}
