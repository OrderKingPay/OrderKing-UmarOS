import { useState, useEffect } from "react";
import { 
  Gift, 
  Copy, 
  Check, 
  Sparkles, 
  MessageCircle,
  Share2
} from "lucide-react";
import { toast } from "sonner";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getReferralStats } from "@/lib/server/referrals";

interface WhatsAppGiftCardProps {
  className?: string;
  source?: string;
}

/**
 * Compact, attractive Gift-style Referral Widget
 * Designed to feel like sending a treat/gift voucher to friends on WhatsApp.
 */
export function WhatsAppViralBountiesWidget({ className = "", source = "general" }: WhatsAppGiftCardProps) {
  const { user } = useCurrentUserState();
  const [referralCode, setReferralCode] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (user?.id) {
      void getReferralStats()
        .then((s) => {
          // Use only the referral code returned by the authorized server.
          if (isMounted) setReferralCode(typeof s?.referralCode === "string" ? s.referralCode : "");
        })
        .catch(() => { if (isMounted) setReferralCode(""); });
    } else {
      setReferralCode("");
    }

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const originUrl = typeof window !== "undefined" ? window.location.origin : "https://www.orderkingpay.com";
  const shareUrl = `${originUrl}/?src=invite${referralCode ? `&ref=${encodeURIComponent(referralCode)}` : ""}`;

  // Attractive, natural gift message for WhatsApp
  const giftMessage = `🍲 Craving hot food? Order on OrderKing — Delivered fresh from authentic local kitchens! Use my link for 50% OFF (up to ₹100) on your first order: ${shareUrl}`;

  const handleWhatsAppShare = () => {
    const waUrl = `https://wa.me/?text=${encodeURIComponent(giftMessage)}`;
    window.open(waUrl, "_blank");
    toast.info("Opening WhatsApp to share the OrderKing link.");
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("OrderKing link copied to clipboard.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link.");
    }
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/90 via-orange-50/50 to-white p-4 sm:p-5 shadow-xs transition-all hover:shadow-md ${className}`}
    >
      {/* Decorative subtle background sparkle */}
      <div className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full bg-amber-200/30 blur-2xl" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Gift Graphic + Text */}
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="flex size-11 sm:size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 text-white shadow-md shadow-orange-500/20">
            <Gift className="size-6 text-white" />
          </div>

          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100/90 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-800">
                <Sparkles className="size-2.5 text-amber-600" />
                Invite friends
              </span>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                No cash reward
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-black text-gray-900 tracking-tight leading-snug">
              Share OrderKing with friends
            </h3>
            <p className="text-xs text-gray-600 line-clamp-2 max-w-md">
              Share a link to explore available OrderKing services. Referral cash and promotional credits are not active.
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0 sm:self-center">
          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] hover:bg-[#20be5b] active:scale-98 text-white px-4 py-2.5 text-xs sm:text-sm font-extrabold shadow-sm shadow-[#25D366]/25 transition cursor-pointer"
          >
            <MessageCircle className="size-4 fill-white" />
            <span>Share on WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={handleCopyLink}
            aria-label="Copy OrderKing link"
            title="Copy OrderKing link"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white hover:bg-gray-50 active:scale-98 text-gray-700 transition shadow-2xs cursor-pointer"
          >
            {copied ? (
              <Check className="size-4 text-emerald-600" />
            ) : (
              <Copy className="size-4 text-gray-600" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Named alias for cleaner readability in new screens
export const WhatsAppGiftCard = WhatsAppViralBountiesWidget;
