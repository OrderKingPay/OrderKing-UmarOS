import { useState } from "react";
import { Share2, Copy, Check, Sparkles, Users, Gift, Flame, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface WhatsAppShareProps {
  variant: "restaurant" | "checkout" | "compact";
  restaurantName?: string;
  restaurantSlug?: string;
  cuisine?: string;
  orderTotalPaise?: number;
  referralCode?: string;
  className?: string;
}

export function WhatsAppShare({
  variant,
  restaurantName,
  restaurantSlug,
  cuisine,
  orderTotalPaise,
  referralCode = "KING500",
  className = "",
}: WhatsAppShareProps) {
  const [copied, setCopied] = useState(false);

  const getShareData = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://orderking.app";
    
    if (variant === "restaurant") {
      const restName = restaurantName || "OrderKing Partner Kitchen";
      const restUrl = restaurantSlug ? `${origin}/r/${restaurantSlug}?ref=${referralCode}` : `${origin}?ref=${referralCode}`;
      const message = `🔥 Check out *${restName}*${cuisine ? ` (${cuisine})` : ""} on OrderKing!\n\nOrder with my VIP invite link to get flat ₹500 bonus cash on your first order: ${restUrl}\n\nFast delivery, genuine food, zero surge! 🚀`;
      return {
        title: `Order from ${restName} on OrderKing`,
        text: message,
        url: restUrl,
      };
    }

    if (variant === "checkout") {
      const totalRupees = orderTotalPaise ? (orderTotalPaise / 100).toFixed(0) : "500";
      const checkoutUrl = `${origin}/earn?ref=${referralCode}`;
      const message = `👑 I just placed a delicious food order worth ₹${totalRupees} on OrderKing!\n\nUse my invite link to get an instant ₹500 welcome credit for your next meal: ${checkoutUrl}\n\nClaim your ₹500 food cash before the daily pool runs out! 🍔🍕`;
      return {
        title: "OrderKing ₹500 Welcome Bonus",
        text: message,
        url: checkoutUrl,
      };
    }

    // Default compact
    const defaultUrl = `${origin}?ref=${referralCode}`;
    const defaultMsg = `👑 Get ₹500 free food cash on OrderKing! Use my link to claim your bonus now: ${defaultUrl}`;
    return {
      title: "OrderKing VIP Invite",
      text: defaultMsg,
      url: defaultUrl,
    };
  };

  const handleWhatsAppDeepLink = () => {
    const { text } = getShareData();
    const encoded = encodeURIComponent(text);
    const waUrl = `https://wa.me/?text=${encoded}`;
    
    // Try opening WhatsApp deep link
    window.open(waUrl, "_blank", "noopener,noreferrer");
    toast.success("WhatsApp opened! Send to your friends or group to unlock ₹500.");
  };

  const handleCopyLink = () => {
    const { url } = getShareData();
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Invite link copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleNativeShare = async () => {
    const shareData = getShareData();
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        toast.success("Shared successfully!");
      } catch (err: any) {
        if (err.name !== "AbortError") {
          handleWhatsAppDeepLink();
        }
      }
    } else {
      handleWhatsAppDeepLink();
    }
  };

  if (variant === "restaurant") {
    return (
      <div className={`relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-surface to-zinc-950 p-4 shadow-md ${className}`}>
        {/* Ambient glow */}
        <div className="absolute -right-8 -top-8 size-28 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-ping" />
                WhatsApp Group Order
              </span>
              <span className="text-[11px] font-medium text-muted">
                • Refer &amp; Get ₹500
              </span>
            </div>
            <h3 className="font-display font-bold text-sm text-foreground flex items-center gap-1.5">
              <span>Share {restaurantName ? `"${restaurantName}"` : "this menu"} on WhatsApp</span>
              <Sparkles className="size-3.5 text-amber-400" />
            </h3>
            <p className="text-xs text-muted max-w-md">
              Send this menu to your WhatsApp group. Friends get <strong className="text-foreground">₹500 OFF</strong> on their first feast, and you earn <strong className="text-emerald-400">₹500 KingPay Cash</strong>!
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleWhatsAppDeepLink}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-900/30 transition hover:from-emerald-500 hover:to-green-500 active:scale-95 cursor-pointer"
            >
              <svg className="size-4 fill-current" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.888 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.004c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <span>Share on WhatsApp</span>
            </button>
            <button
              type="button"
              onClick={handleCopyLink}
              title="Copy Invite Link"
              className="flex items-center justify-center size-9 rounded-xl border border-border bg-surface hover:bg-surface-2 transition text-muted hover:text-foreground active:scale-95 cursor-pointer"
            >
              {copied ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (variant === "checkout") {
    return (
      <div className={`relative overflow-hidden rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-950/30 via-surface to-zinc-950 p-4 shadow-lg ${className}`}>
        {/* Glow */}
        <div className="absolute -left-10 -bottom-10 size-32 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 text-sm">
                🎁
              </span>
              <div>
                <h3 className="font-display font-bold text-sm text-foreground">
                  Viral Reward: Unlock ₹500 on this Order
                </h3>
                <p className="text-[11px] text-muted">
                  Share OrderKing with a friend on WhatsApp before placing order
                </p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
              Active Multiplier
            </span>
          </div>

          <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🛵</span>
              <p className="text-xs text-zinc-300">
                Your friend gets <strong className="text-emerald-400">₹500 welcome credit</strong>. You earn <strong className="text-amber-400">₹500 instant KingPay cash</strong> on their first meal!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleWhatsAppDeepLink}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 px-4 py-3 text-xs font-bold text-white shadow-md hover:from-emerald-500 hover:to-green-500 active:scale-95 transition cursor-pointer"
            >
              <svg className="size-4 fill-current" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.888 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.004c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <span>Share Order Link on WhatsApp</span>
            </button>
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-surface px-3 py-3 text-xs font-semibold text-zinc-300 hover:text-white transition active:scale-95 cursor-pointer"
            >
              {copied ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
              <span className="hidden sm:inline">Copy Link</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Compact fallback
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={handleWhatsAppDeepLink}
        className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 transition"
      >
        <Share2 className="size-3.5" />
        <span>WhatsApp Share</span>
      </button>
      <button
        type="button"
        onClick={handleCopyLink}
        className="rounded-lg border border-border p-1.5 text-xs text-muted hover:text-foreground"
      >
        {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
      </button>
    </div>
  );
}
