import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Award,
  Check,
  Copy,
  Crown,
  ExternalLink,
  Gift,
  HelpCircle,
  IndianRupee,
  Layers,
  Printer,
  QrCode,
  Share2,
  Sparkles,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";

export interface VipAmbassadorPassProps {
  riderName?: string | null;
  riderId?: string | null;
  phone?: string | null;
  className?: string;
  compact?: boolean;
}

export function VipAmbassadorPass({
  riderName,
  riderId,
  phone,
  className = "",
  compact = false,
}: VipAmbassadorPassProps) {
  const [copied, setCopied] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"pass" | "calculator">("pass");

  const cleanName = (riderName?.trim() || "Delivery Partner").split(" ")[0];
  const cleanId = (riderId || "FLEET786").replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase();
  const referralCode = `OK-VIP-${cleanId}`;

  const landingUrl = `https://orderking.in/vip?ref=${encodeURIComponent(referralCode)}&ambassador=courier`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
    landingUrl,
  )}&color=0B0F19&bgcolor=FFFFFF`;

  const copyCode = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(referralCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // ignore
    }
  };

  const whatsappMessage = encodeURIComponent(
    `👑 Exclusive OrderKing VIP Invitation from ${cleanName}!\n\n` +
      `🎁 Get ₹100 OFF your direct restaurant order when you order through OrderKing direct:\n` +
      `🔗 Order Link: ${landingUrl}\n` +
      `🎟️ Use My Ambassador VIP Code: ${referralCode}\n\n` +
      `Enjoy fresh hot food delivered faster with zero extra platform markups!`,
  );
  const whatsappUrl = `https://wa.me/?text=${whatsappMessage}`;

  return (
    <>
      <div
        className={`relative overflow-hidden rounded-2xl border border-[#E5A93C]/40 bg-gradient-to-br from-[#0B0F19] via-[#0F172A] to-[#1E293B] p-5 shadow-2xl text-white ${className}`}
      >
        {/* Luxury Background Glow Highlights */}
        <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-[#E5A93C]/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-16 size-48 rounded-full bg-[#2563EB]/20 blur-3xl" />

        {/* Top Header & Elite Tier Badge */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 border-b border-[#E5A93C]/20 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#E5A93C] to-[#B37D20] text-black shadow-md shadow-[#E5A93C]/30">
              <Crown className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base font-bold tracking-wide text-[#E5A93C]">
                  OrderKing VIP Ambassador Pass
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full border border-[#E5A93C]/40 bg-[#E5A93C]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#E5A93C]">
                  <Sparkles className="size-3" /> Elite Tier
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Doorstep Customer Acquisition & Lifetime Micro-Royalty Protocol
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setModalOpen(true)}
              className="h-8 border-[#E5A93C]/50 bg-black/40 text-xs text-[#E5A93C] hover:bg-[#E5A93C]/20 hover:text-white"
            >
              <QrCode className="mr-1.5 size-3.5" />
              Digital Pass
            </Button>
          </div>
        </div>

        {/* Triple Incentive Value Proposition */}
        <div className="relative z-10 mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {/* Tile 1: Customer Discount */}
          <div className="rounded-xl border border-[#E5A93C]/25 bg-black/40 p-3 backdrop-blur-sm">
            <div className="flex items-center justify-between text-xs text-[#E5A93C]">
              <span className="font-semibold uppercase tracking-wider">Customer Gets</span>
              <Gift className="size-4 text-[#E5A93C]" />
            </div>
            <p className="mt-1 font-display text-2xl font-bold text-white">₹100 OFF</p>
            <p className="mt-0.5 text-[11px] leading-tight text-slate-300">
              Instant discount on their direct food order when scanning your VIP Pass.
            </p>
          </div>

          {/* Tile 2: Rider Instant Bonus */}
          <div className="rounded-xl border border-[#2563EB]/40 bg-[#2563EB]/15 p-3 backdrop-blur-sm">
            <div className="flex items-center justify-between text-xs text-sky-300">
              <span className="font-semibold uppercase tracking-wider">Instant Cash Bonus</span>
              <Zap className="size-4 text-sky-400" />
            </div>
            <p className="mt-1 font-display text-2xl font-bold text-sky-100">₹25 CASH</p>
            <p className="mt-0.5 text-[11px] leading-tight text-slate-300">
              Credited straight to your live ledger on that customer&apos;s very first order.
            </p>
          </div>

          {/* Tile 3: Lifetime Micro-Royalty */}
          <div className="rounded-xl border border-[#E5A93C]/40 bg-gradient-to-br from-[#E5A93C]/15 to-transparent p-3 backdrop-blur-sm">
            <div className="flex items-center justify-between text-xs text-[#E5A93C]">
              <span className="font-semibold uppercase tracking-wider">Lifetime Royalty</span>
              <TrendingUp className="size-4 text-[#E5A93C]" />
            </div>
            <p className="mt-1 font-display text-2xl font-bold text-[#E5A93C]">1% FOREVER</p>
            <p className="mt-0.5 text-[11px] leading-tight text-slate-300">
              Earn 1% micro-royalty on every subsequent order placed by that customer forever.
            </p>
          </div>
        </div>

        {/* Interactive VIP Code & Dynamic QR Section */}
        <div className="relative z-10 mt-4 flex flex-col gap-4 rounded-xl border border-[#E5A93C]/30 bg-[#0B0F19]/90 p-3.5 sm:flex-row sm:items-center">
          {/* Dynamic QR Box */}
          <div className="flex shrink-0 items-center justify-center rounded-xl bg-white p-2 shadow-lg shadow-black/60">
            <img
              src={qrCodeUrl}
              alt="OrderKing Ambassador VIP QR Code"
              className="size-24 rounded object-contain sm:size-28"
              loading="lazy"
            />
          </div>

          {/* Code & Quick Action Controls */}
          <div className="flex-1 space-y-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Your Personal VIP Ambassador Code
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="rounded-lg border border-[#E5A93C]/40 bg-black/60 px-3 py-1 font-mono text-base font-bold tracking-wider text-[#E5A93C] select-all shadow-inner">
                  {referralCode}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => void copyCode()}
                  className="h-8 border-[#E5A93C]/40 bg-[#E5A93C]/10 text-xs text-[#E5A93C] hover:bg-[#E5A93C]/20"
                >
                  {copied ? (
                    <>
                      <Check className="mr-1 size-3.5 text-emerald-400" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1 size-3.5" /> Copy Code
                    </>
                  )}
                </Button>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#2563EB] px-3 text-xs font-semibold text-white shadow hover:bg-[#1D4ED8]"
                >
                  <Share2 className="size-3.5" /> Share Pass
                </a>
              </div>
            </div>

            <p className="text-[11px] leading-relaxed text-slate-300">
              💡 <strong>Ambassador Protocol:</strong> Hand this pass to customers when handing
              over orders at their doorstep. Tell them: <em>&quot;Scan this VIP Pass for ₹100 off your next direct order!&quot;</em>
            </p>
          </div>
        </div>

        {/* Footer Guarantee */}
        <div className="relative z-10 mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
          <span>✓ Automated weekly Wednesday settlement for all referral bonuses & royalties.</span>
          <span className="text-[#E5A93C]">Positioned strictly as an elite earnings-booster tier.</span>
        </div>
      </div>

      {/* Modal: Fullscreen Digital Pass / Print Slip */}
      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border-2 border-[#E5A93C] bg-gradient-to-b from-[#0B0F19] via-[#0F172A] to-[#1E293B] p-6 shadow-2xl text-white">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="absolute right-4 top-4 rounded-full bg-white/10 p-1.5 text-slate-300 hover:bg-white/20 hover:text-white"
            >
              <X className="size-4" />
            </button>

            {/* Modal Header */}
            <div className="text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E5A93C] to-[#B37D20] text-black shadow-lg shadow-[#E5A93C]/40">
                <Crown className="size-7" />
              </div>
              <h4 className="mt-3 font-display text-xl font-bold tracking-wide text-[#E5A93C]">
                ORDERKING VIP PASS
              </h4>
              <p className="text-xs text-slate-300">
                Ambassador: <strong>{riderName || "Delivery Partner"}</strong> · ID: {cleanId}
              </p>
            </div>

            {/* QR Card Presentation */}
            <div className="my-5 rounded-xl border border-[#E5A93C]/50 bg-white p-5 text-center text-slate-900 shadow-xl">
              <p className="text-xs font-bold uppercase tracking-widest text-[#B37D20]">
                Scan For ₹100 Instant Discount
              </p>
              <div className="my-3 flex justify-center">
                <img
                  src={qrCodeUrl}
                  alt="OrderKing Ambassador VIP QR"
                  className="size-48 rounded-lg shadow-sm"
                />
              </div>
              <p className="text-[11px] font-semibold text-slate-600">
                Or visit <strong>orderking.in/vip</strong> & enter code:
              </p>
              <div className="mt-1 inline-block rounded-lg bg-slate-900 px-4 py-1.5 font-mono text-lg font-bold tracking-widest text-[#E5A93C]">
                {referralCode}
              </div>
            </div>

            {/* Courier Micro-Royalty Projections */}
            <div className="rounded-xl border border-[#2563EB]/40 bg-[#2563EB]/15 p-3 text-xs leading-relaxed text-slate-200">
              <strong className="text-sky-300">Passive Income Multiplier:</strong>
              <p className="mt-1 text-[11px]">
                • Hand passes to 20 customers/day → 100 recurring customers ordering 4x/month
                generates <strong>₹1,000+ monthly lifetime royalty</strong> plus <strong>₹2,500 instant cash bonuses</strong>!
              </p>
            </div>

            <div className="mt-5 flex gap-2">
              <Button
                type="button"
                className="flex-1 bg-[#2563EB] hover:bg-[#1D4ED8] text-white"
                onClick={() => {
                  if (typeof window !== "undefined") window.print();
                }}
              >
                <Printer className="mr-1.5 size-4" /> Print Handover Slips
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-[#E5A93C]/50 text-[#E5A93C] hover:bg-[#E5A93C]/20"
                onClick={() => setModalOpen(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
