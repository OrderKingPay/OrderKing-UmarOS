import { useState } from "react";
import { Star, Camera, ThumbsUp, ThumbsDown, X, Check, Heart, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export interface DishReviewModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  orderId?: string;
  restaurantName?: string;
  items?: Array<{ id: string; name: string }>;
  onSubmit?: (reviewData: any) => void;
}

export function DishReviewModal({
  isOpen = false,
  onClose,
  orderId = "OK-94281",
  restaurantName = "Royal Biryani House",
  items = [
    { id: "item-1", name: "Hyderabadi Chicken Dum Biryani" },
    { id: "item-2", name: "Butter Garlic Naan" },
  ],
  onSubmit,
}: DishReviewModalProps) {
  const [open, setOpen] = useState(isOpen);
  const [foodRating, setFoodRating] = useState<number>(5);
  const [deliveryRating, setDeliveryRating] = useState<number>(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dishOpinions, setDishOpinions] = useState<Record<string, "LIKE" | "DISLIKE">>({});
  const [reviewText, setReviewText] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const TAGS = [
    "🔥 Served Piping Hot",
    "✨ Exquisite Flavor",
    "📦 Spill-Proof Packaging",
    "🍗 Tender & Juicy Meat",
    "🌾 Authentic Aromatic Rice",
    "⚡ Lightning Quick Delivery",
    "💰 Great Value for Money",
  ];

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSimulatePhotoUpload = () => {
    // Add dummy photo preview
    if (photos.length >= 3) {
      toast.error("Maximum 3 photos allowed");
      return;
    }
    setPhotos((prev) => [
      ...prev,
      `https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=300&q=80`,
    ]);
    toast.success("Photo attached!");
  };

  const handleSubmit = () => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      toast.success("Review submitted! ₹25 Digital Gold reward added to your passbook.");
      onSubmit?.({
        orderId,
        foodRating,
        deliveryRating,
        selectedTags,
        dishOpinions,
        reviewText,
        photos,
      });
      setOpen(false);
      onClose?.();
    }, 800);
  };

  if (!open && !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-surface-2 px-5 py-4">
          <div>
            <h3 className="font-display text-base font-bold text-fg">Rate Your Food Experience</h3>
            <p className="text-xs text-muted">Order #{orderId} · {restaurantName}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onClose?.();
            }}
            className="rounded-full p-1.5 text-muted hover:bg-surface hover:text-fg transition"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs no-scrollbar">
          {/* Overall Food Rating */}
          <div className="text-center space-y-2">
            <label className="text-xs font-bold text-fg block">How was the food taste and quality?</label>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFoodRating(star)}
                  className="p-1 transition hover:scale-110"
                >
                  <Star
                    className={`size-8 ${
                      star <= foodRating
                        ? "fill-amber-400 text-amber-400 filter drop-shadow-sm"
                        : "text-muted/40"
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-[11px] font-semibold text-primary">
              {foodRating === 5 && "⭐ Exceptional! Worth ordering again"}
              {foodRating === 4 && "👍 Good taste and portion"}
              {foodRating === 3 && "😐 Average food"}
              {foodRating === 2 && "👎 Below expectations"}
              {foodRating === 1 && "⚠️ Poor quality"}
            </p>
          </div>

          {/* Dish-by-Dish Quick Feedback */}
          {items.length > 0 && (
            <div className="rounded-xl border border-border bg-surface-2/50 p-3.5 space-y-2.5">
              <label className="text-xs font-bold text-fg block">Dish-level recommendation:</label>
              {items.map((it) => (
                <div key={it.id} className="flex items-center justify-between rounded-lg bg-surface p-2 border border-border/50">
                  <span className="font-medium text-fg truncate pr-2">{it.name}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        setDishOpinions((prev) => ({
                          ...prev,
                          [it.id]: prev[it.id] === "LIKE" ? (undefined as any) : "LIKE",
                        }))
                      }
                      className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold transition ${
                        dishOpinions[it.id] === "LIKE"
                          ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40"
                          : "bg-surface-2 text-muted hover:text-fg"
                      }`}
                    >
                      <ThumbsUp className="size-3" /> Loved it
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setDishOpinions((prev) => ({
                          ...prev,
                          [it.id]: prev[it.id] === "DISLIKE" ? (undefined as any) : "DISLIKE",
                        }))
                      }
                      className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold transition ${
                        dishOpinions[it.id] === "DISLIKE"
                          ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/40"
                          : "bg-surface-2 text-muted hover:text-fg"
                      }`}
                    >
                      <ThumbsDown className="size-3" /> Could be better
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Experience Tags */}
          <div>
            <label className="text-xs font-bold text-fg block mb-2">What stood out to you?</label>
            <div className="flex flex-wrap gap-1.5">
              {TAGS.map((tag) => {
                const active = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                      active
                        ? "border-primary bg-primary text-primary-fg font-semibold shadow-xs"
                        : "border-border bg-surface-2 text-fg hover:border-primary/40"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detailed Review Text */}
          <div>
            <label className="text-xs font-bold text-fg block mb-1">Write your review</label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Tell fellow foodies what you enjoyed about the spices, aromas, texture, or delivery speed..."
              className="w-full min-h-20 rounded-xl border border-border bg-surface-2 p-3 text-xs focus:border-primary focus:outline-hidden"
            />
          </div>

          {/* Photo Upload Attachment */}
          <div>
            <label className="text-xs font-bold text-fg block mb-1">Add dish photos</label>
            <div className="flex items-center gap-2">
              {photos.map((src, idx) => (
                <div key={idx} className="relative size-16 rounded-lg border border-border overflow-hidden">
                  <img src={src} alt="" className="size-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotos((prev) => prev.filter((_, i) => i !== idx))}
                    className="absolute top-0 right-0 bg-black/70 p-0.5 text-white"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
              {photos.length < 3 && (
                <button
                  type="button"
                  onClick={handleSimulatePhotoUpload}
                  className="flex size-16 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface-2 text-muted hover:border-primary hover:text-primary transition"
                >
                  <Camera className="size-4" />
                  <span className="text-[10px] mt-0.5">Upload</span>
                </button>
              )}
            </div>
            <p className="text-[10px] text-muted mt-1">Get verified Foodie badge by sharing photos</p>
          </div>

          {/* Delivery Partner Rating */}
          <div className="flex items-center justify-between rounded-xl bg-surface-2 p-3">
            <div>
              <p className="font-bold text-fg">Rate Delivery Partner</p>
              <p className="text-[11px] text-muted">Prompt delivery, followed doorbell instructions</p>
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setDeliveryRating(s)}
                  className="p-0.5"
                >
                  <Star
                    className={`size-4 ${
                      s <= deliveryRating ? "fill-amber-400 text-amber-400" : "text-muted/40"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border bg-surface px-5 py-3.5 flex items-center justify-between">
          <span className="text-[11px] text-muted">Earns 24K Gold reward</span>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Posting..." : "Submit Review"}
          </Button>
        </div>
      </div>
    </div>
  );
}
