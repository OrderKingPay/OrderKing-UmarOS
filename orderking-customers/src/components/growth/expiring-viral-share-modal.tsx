import { useState } from "react";
import { Share2, Check, Copy, MessageCircle, Clock, Sparkles, X, Gift } from "lucide-react";
import { createExpiringViralShare, GIFT_REWARD_RUPEES, GIFT_VALIDITY_DAYS } from "@/lib/growth/expiring-referral-gift";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

interface ExpiringViralShareModalProps {
  open: boolean;
  onClose: () => void;
}

export function ExpiringViralShareModal({ open, onClose }: ExpiringViralShareModalProps) {
  const { user } = useCurrentUserState();
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const referralCode = user?.id ? user.id.slice(0, 8).toUpperCase() : "KING50";
  const shareData = createExpiringViralShare(referralCode);

  const handleCopy = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(shareData.deepLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // fallback
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `OrderKing ₹${GIFT_REWARD_RUPEES} Gift`,
          text: shareData.shareText,
          url: shareData.deepLink,
        });
      } catch {
        // user dismissed or canceled
      }
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Share & Earn Gift"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl border border-amber-200/80 p-5 text-gray-900">
        {/* Top Gold Shimmer Bar */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-3.5 right-3.5 flex size-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition"
        >
          <X className="size-4" />
        </button>

        {/* Header Badge */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 shadow-md">
            <Gift className="size-5" />
          </div>
          <div>
            <span className="flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-amber-700">
              <Sparkles className="size-3 text-amber-500" />
              100% Guaranteed Reward
            </span>
            <h3 className="text-base font-black text-gray-900 leading-tight">
              Gift ₹{GIFT_REWARD_RUPEES} to Friends
            </h3>
          </div>
        </div>

        <p className="text-xs text-gray-600 leading-relaxed mb-4">
          Send your invite link to friends. When they order, they get ₹{GIFT_REWARD_RUPEES} off, and you receive ₹{GIFT_REWARD_RUPEES} in your Crown Wallet!
        </p>

        {/* 7-Day Expiry Notice (Founder Protection) */}
        <div className="flex items-center gap-2.5 rounded-2xl bg-amber-50/80 border border-amber-200 p-3 mb-4">
          <Clock className="size-4 shrink-0 text-amber-700" />
          <p className="text-[11px] font-bold text-amber-950 leading-snug">
            ⚠️ <span className="underline">Strict {GIFT_VALIDITY_DAYS}-Day Validity</span>: Unclaimed or unused gifts automatically expire after {GIFT_VALIDITY_DAYS} days.
          </p>
        </div>

        {/* Deep Link Display & Copy */}
        <div className="flex items-center gap-1.5 rounded-2xl bg-gray-50 border border-gray-200 p-1.5 mb-4">
          <input
            type="text"
            readOnly
            value={shareData.deepLink}
            className="w-full bg-transparent px-2 text-xs font-mono font-medium text-gray-700 select-all outline-none truncate"
          />
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 shrink-0 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 text-xs font-bold transition active:scale-95 shadow-xs"
          >
            {copied ? (
              <>
                <Check className="size-3.5 text-emerald-400" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="size-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {/* WhatsApp Direct Share */}
          <a
            href={shareData.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm py-3 px-4 shadow-lg shadow-emerald-600/25 transition active:scale-98 no-underline"
          >
            <MessageCircle className="size-4 shrink-0" />
            <span>Share via WhatsApp (Instant)</span>
          </a>

          {/* Native Mobile Share */}
          {shareData.canNativeShare && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold text-xs py-2.5 px-4 transition active:scale-98"
            >
              <Share2 className="size-4 shrink-0 text-gray-600" />
              <span>More Share Options</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
