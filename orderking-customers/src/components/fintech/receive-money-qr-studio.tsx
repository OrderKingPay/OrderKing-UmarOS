import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { toast } from "sonner";
import {
  Check,
  Copy,
  Download,
  Gift,
  PartyPopper,
  Share2,
  ShieldCheck,
  Sparkles,
  Volume2,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export type LuxuryTheme =
  | "royal_gold"
  | "shagun_red"
  | "celebration"
  | "festive_diya"
  | "titanium_platinum"
  | "cozy_cafe";

type Props = {
  defaultUpiId?: string;
  defaultName?: string;
  onClose?: () => void;
  isModal?: boolean;
};

const LUXURY_THEMES: Array<{
  id: LuxuryTheme;
  name: string;
  icon: string;
  cardBg: string;
  borderClass: string;
  accentText: string;
  badgeBg: string;
  textColor: string;
  tagline: string;
}> = [
  {
    id: "royal_gold",
    name: "24K Royal Gold",
    icon: "👑",
    cardBg: "bg-gradient-to-b from-[#1C1504] via-[#2A1F07] to-[#120D02]",
    borderClass: "border-2 border-amber-400/90 shadow-[0_12px_40px_rgba(245,158,11,0.35)]",
    accentText: "text-amber-400",
    badgeBg: "bg-amber-400/20 text-amber-300 border-amber-400/40",
    textColor: "text-amber-100",
    tagline: "✨ Royal 24K Gold Sovereign Edition",
  },
  {
    id: "shagun_red",
    name: "Shagun & Wedding",
    icon: "🧧",
    cardBg: "bg-gradient-to-b from-[#2B080C] via-[#3D0C12] to-[#1A0407]",
    borderClass: "border-2 border-rose-400/90 shadow-[0_12px_40px_rgba(244,63,94,0.35)]",
    accentText: "text-rose-400",
    badgeBg: "bg-rose-400/20 text-rose-200 border-rose-400/40",
    textColor: "text-rose-100",
    tagline: "🧧 Auspicious Shagun & Blessed Wishes",
  },
  {
    id: "celebration",
    name: "Birthday Party",
    icon: "🎂",
    cardBg: "bg-gradient-to-b from-[#1E112A] via-[#2D1A3E] to-[#130B1C]",
    borderClass: "border-2 border-purple-400/90 shadow-[0_12px_40px_rgba(192,132,252,0.35)]",
    accentText: "text-purple-300",
    badgeBg: "bg-purple-400/20 text-purple-200 border-purple-400/40",
    textColor: "text-purple-100",
    tagline: "🎉 Celebrate & Spread Pure Happiness",
  },
  {
    id: "festive_diya",
    name: "Festive Light",
    icon: "🪔",
    cardBg: "bg-gradient-to-b from-[#081C1E] via-[#0E2C2E] to-[#041112]",
    borderClass: "border-2 border-cyan-400/90 shadow-[0_12px_40px_rgba(34,211,238,0.35)]",
    accentText: "text-cyan-300",
    badgeBg: "bg-cyan-400/20 text-cyan-200 border-cyan-400/40",
    textColor: "text-cyan-100",
    tagline: "🪔 Festival of Joy & Divine Prosperity",
  },
  {
    id: "titanium_platinum",
    name: "Titanium Platinum",
    icon: "💎",
    cardBg: "bg-gradient-to-b from-[#111827] via-[#1F2937] to-[#0F172A]",
    borderClass: "border-2 border-slate-300/90 shadow-[0_12px_40px_rgba(255,255,255,0.15)]",
    accentText: "text-slate-200",
    badgeBg: "bg-slate-300/20 text-slate-100 border-slate-300/40",
    textColor: "text-slate-100",
    tagline: "💎 Ultra-Clean Platinum Precision",
  },
  {
    id: "cozy_cafe",
    name: "Cafe & Bistro",
    icon: "☕",
    cardBg: "bg-gradient-to-b from-[#24140D] via-[#351E14] to-[#170D08]",
    borderClass: "border-2 border-orange-400/90 shadow-[0_12px_40px_rgba(251,146,60,0.35)]",
    accentText: "text-orange-300",
    badgeBg: "bg-orange-400/20 text-orange-200 border-orange-400/40",
    textColor: "text-orange-100",
    tagline: "☕ Chai, Treats & Friendly Moments",
  },
];

const NOTE_PRESETS = [
  { label: "🎁 Birthday Gift", text: "Wishing you a magical and blessed birthday! 🎂" },
  { label: "🧧 Wedding Shagun", text: "Auspicious wedding shagun & prayers for your new journey! 💍" },
  { label: "✨ Festive Shagun", text: "Heartfelt festive greetings & blessings to you and family! 🪔" },
  { label: "🍲 Food & Dinner Split", text: "For our delicious dinner & feast! 🍲" },
  { label: "☕ Chai Treat", text: "Chai and snacks treat on me! ☕" },
  { label: "🏡 Rent & Dues", text: "Monthly rental & maintenance payment 🏡" },
  { label: "💼 Professional Fee", text: "Payment for consultation & services rendered" },
];

const QUICK_AMOUNTS = ["100", "250", "500", "1000", "2100", "5000"];

export function ReceiveMoneyQrStudio({
  defaultUpiId = "orderking.pay@okaxis",
  defaultName = "OrderKing Sovereign Merchant",
  onClose,
  isModal = false,
}: Props) {
  const [upiId] = useState(defaultUpiId);
  const [payeeName, setPayeeName] = useState(defaultName);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [selectedTheme, setSelectedTheme] = useState<LuxuryTheme>("royal_gold");
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const activeTheme = LUXURY_THEMES.find((t) => t.id === selectedTheme) || LUXURY_THEMES[0];

  // Build standard NPCI UPI payment string
  const generateUpiUri = () => {
    const params = new URLSearchParams();
    params.set("pa", upiId);
    params.set("pn", payeeName.trim() || "OrderKing User");
    params.set("cu", "INR");
    if (amount.trim() && !isNaN(Number(amount)) && Number(amount) > 0) {
      params.set("am", Number(amount).toFixed(2));
    }
    if (note.trim()) {
      params.set("tn", note.trim());
    }
    return `upi://pay?${params.toString()}`;
  };

  // Generate QR Code on change
  useEffect(() => {
    const uri = generateUpiUri();
    QRCode.toDataURL(uri, {
      width: 480,
      margin: 1.5,
      color: {
        dark: "#0F172A",
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "H",
    })
      .then((url) => {
        setQrDataUrl(url);
      })
      .catch((err) => {
        console.error("QR Code generation error:", err);
      });
  }, [upiId, payeeName, amount, note]);

  // Copy UPI ID
  const handleCopyUpi = () => {
    if (typeof window !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(upiId);
      setCopiedUpi(true);
      toast.success("UPI ID copied to clipboard!");
      setTimeout(() => setCopiedUpi(false), 2000);
    }
  };

  // Copy Payment Link
  const handleCopyLink = () => {
    const uri = generateUpiUri();
    if (typeof window !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(uri);
      setCopiedLink(true);
      toast.success("UPI Payment Link copied!");
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Share to WhatsApp
  const handleShareWhatsApp = () => {
    const amtText = amount ? `₹${amount}` : "payment";
    const noteText = note ? `\nPurpose: "${note}"` : "";
    const msg = encodeURIComponent(
      `Hello! Please pay ${amtText} directly via KingPay or any UPI App (GPay, PhonePe, Paytm): \n${generateUpiUri()}${noteText}\n\n0% convenience fee with KingPay!`
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  // Download High-Res QR Poster
  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    const cleanAmt = amount ? `-${amount}` : "";
    a.download = `KingPay-QR-${cleanAmt}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("High-Resolution QR Poster downloaded!");
  };

  // Play Simulated Audio Soundbox Chime
  const handleTestSoundbox = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        const amtText = amount ? `₹${amount}` : "payment";
        const utterance = new SpeechSynthesisUtterance(`KingPay: ${amtText} payment received with zero fees!`);
        utterance.rate = 1.0;
        utterance.pitch = 1.2;
        window.speechSynthesis.speak(utterance);
        toast.success("🔊 Soundbox Audio Chime Triggered!");
      } catch {
        toast.info("Soundbox audio played.");
      }
    }
  };

  return (
    <div className={`space-y-6 ${isModal ? "p-4 sm:p-6" : ""}`}>
      {/* Header bar if modal */}
      {isModal && (
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">📲</span>
            <div>
              <h2 className="font-display font-black text-base sm:text-lg text-fg">
                Receive Money &amp; Custom QR
              </h2>
              <p className="text-[11px] text-muted">
                Compatible with all UPI Apps · 0% Fee · Instant Settlement
              </p>
            </div>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-muted hover:bg-surface-2 transition"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
          )}
        </div>
      )}

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: THE LUXURY STYLED QR CARD */}
        <div className="lg:col-span-6 flex flex-col items-center">
          <div
            className={`w-full max-w-sm rounded-[2.5rem] p-6 text-center transition-all duration-300 relative overflow-hidden ${activeTheme.cardBg} ${activeTheme.borderClass}`}
          >
            {/* Background Glow Effect */}
            <div className="absolute -top-16 -right-16 size-48 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-16 -left-16 size-48 rounded-full bg-white/10 blur-3xl" />

            {/* Top Brand & Tagline */}
            <div className="relative z-10 space-y-1 mb-4">
              <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold border backdrop-blur-md shadow-xs mx-auto">
                <span>{activeTheme.icon}</span>
                <span className={activeTheme.accentText}>{activeTheme.tagline}</span>
              </div>
              <h3 className="font-display text-xl font-black text-white tracking-tight">
                King<span className="text-amber-400">Pay</span> Sovereign QR
              </h3>
              <p className="text-xs text-white/80 font-medium">
                {payeeName || "OrderKing User"}
              </p>
              <div className="flex items-center justify-center gap-1 text-[11px] font-mono text-white/70">
                <span>{upiId}</span>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="p-1 hover:text-white transition"
                  title="Copy UPI ID"
                >
                  {copiedUpi ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                </button>
              </div>
            </div>

            {/* THE QR CODE CANVAS CONTAINER */}
            <div className="relative z-10 mx-auto size-64 sm:size-72 rounded-3xl bg-white p-4 shadow-2xl ring-4 ring-white/20 flex flex-col items-center justify-center">
              {qrDataUrl ? (
                <img loading="lazy"                   src={qrDataUrl}
                  alt="KingPay Universal UPI QR"
                  className="size-full object-contain rounded-xl"
                />
              ) : (
                <div className="size-full flex items-center justify-center text-xs text-slate-500">
                  Generating High-Res QR...
                </div>
              )}

              {/* Center Logo Overlay inside QR */}
              <div className="absolute size-10 rounded-full bg-white p-1 shadow-md border-2 border-amber-400 flex items-center justify-center pointer-events-none">
                <span className="text-lg">👑</span>
              </div>
            </div>

            {/* Amount & Custom Note Display on Card */}
            <div className="relative z-10 mt-4 space-y-1">
              {amount ? (
                <div className="font-mono text-2xl font-black text-white tracking-tight flex items-center justify-center gap-1">
                  <span className="text-amber-400 text-xl">₹</span>
                  <span>{Number(amount).toLocaleString("en-IN")}.00</span>
                </div>
              ) : (
                <div className="text-xs text-white/70 italic">
                  Payer enters any amount
                </div>
              )}

              {note && (
                <p className="text-xs text-white/90 bg-white/10 rounded-xl px-3 py-1.5 backdrop-blur-md mx-auto max-w-xs border border-white/10 font-medium">
                  "{note}"
                </p>
              )}
            </div>

            {/* Accepted Payment Apps Banner */}
            <div className="relative z-10 mt-5 pt-3 border-t border-white/15 flex flex-col items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold tracking-widest text-white/70">
                Scan with any app
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-black text-white/90">
                <span className="bg-white/15 px-2 py-0.5 rounded-md border border-white/10">GPay</span>
                <span className="bg-white/15 px-2 py-0.5 rounded-md border border-white/10">PhonePe</span>
                <span className="bg-white/15 px-2 py-0.5 rounded-md border border-white/10">Paytm</span>
                <span className="bg-white/15 px-2 py-0.5 rounded-md border border-white/10">BHIM</span>
                <span className="bg-white/15 px-2 py-0.5 rounded-md border border-white/10">Cred</span>
                <span className="bg-white/15 px-2 py-0.5 rounded-md border border-white/10">Any Bank</span>
              </div>
            </div>
          </div>

          {/* Action Buttons under the card */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4 w-full max-w-sm">
            <Button
              type="button"
              variant="secondary"
              onClick={handleDownloadQr}
              className="flex-1 text-xs font-bold py-2 flex items-center justify-center gap-1.5"
            >
              <Download className="size-3.5" />
              <span>Download QR</span>
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleShareWhatsApp}
              className="flex-1 text-xs font-bold py-2 bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] border border-[#25D366]/40 flex items-center justify-center gap-1.5"
            >
              <Share2 className="size-3.5" />
              <span>WhatsApp</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleTestSoundbox}
              className="text-xs font-semibold py-2 px-3 flex items-center gap-1"
              title="Test Soundbox Audio"
            >
              <Volume2 className="size-3.5 text-amber-500" />
              <span>Soundbox</span>
            </Button>
          </div>
        </div>

        {/* RIGHT COLUMN: CUSTOMIZATION CONTROLS */}
        <div className="lg:col-span-6 space-y-5">
          {/* 1. Select Luxury / Gifting Style */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-muted mb-2">
              🎨 1. Choose Luxury &amp; Gifting Style
            </label>
            <div className="grid grid-cols-3 gap-2">
              {LUXURY_THEMES.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setSelectedTheme(theme.id)}
                  className={`rounded-2xl p-2.5 text-left border transition-all duration-200 flex flex-col justify-between ${
                    selectedTheme === theme.id
                      ? "border-amber-500 bg-amber-500/15 ring-2 ring-amber-400/40 shadow-sm"
                      : "border-border bg-surface hover:bg-surface-2"
                  }`}
                >
                  <span className="text-xl">{theme.icon}</span>
                  <div className="mt-1">
                    <span className="block text-xs font-bold text-fg leading-tight">
                      {theme.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Amount Setup (Optional or Fixed) */}
          <div className="rounded-2xl border border-border bg-surface p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-muted">
                💰 2. Set Amount (Optional)
              </label>
              {amount && (
                <button
                  type="button"
                  onClick={() => setAmount("")}
                  className="text-[11px] text-rose-500 hover:underline font-bold"
                >
                  Clear Amount
                </button>
              )}
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-black text-muted">
                ₹
              </span>
              <input
                type="number"
                placeholder="Leave blank for open amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-border bg-bg pl-8 pr-4 py-2.5 text-sm font-mono font-bold text-fg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Quick Amount Chips */}
            <div className="flex flex-wrap gap-1.5">
              {QUICK_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmount(amt)}
                  className={`rounded-full px-3 py-1 text-xs font-bold font-mono transition ${
                    amount === amt
                      ? "bg-primary text-white"
                      : "bg-surface-2 text-fg hover:bg-surface-3"
                  }`}
                >
                  ₹{amt}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Customizable Notes & Gifting Messages */}
          <div className="rounded-2xl border border-border bg-surface p-4 space-y-3">
            <label className="block text-xs font-black uppercase tracking-wider text-muted">
              ✍️ 3. Payment Purpose / Gifting Note
            </label>
            <input
              type="text"
              placeholder="e.g. Birthday Shagun, Dinner Split, Rent"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-xl border border-border bg-bg px-3.5 py-2.5 text-xs text-fg focus:outline-none focus:ring-2 focus:ring-primary font-medium"
            />

            {/* Note Presets */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-muted tracking-wider">
                Popular Occasion Presets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {NOTE_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setNote(preset.text)}
                    className="rounded-lg bg-surface-2 hover:bg-surface-3 border border-border/80 px-2.5 py-1 text-[11px] font-medium text-fg transition"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Display Name / Business Name */}
          <div className="rounded-2xl border border-border bg-surface p-4 space-y-2">
            <label className="block text-xs font-black uppercase tracking-wider text-muted">
              🏷️ 4. Payee Display Name
            </label>
            <input
              type="text"
              placeholder="Your Name or Shop Name"
              value={payeeName}
              onChange={(e) => setPayeeName(e.target.value)}
              className="w-full rounded-xl border border-border bg-bg px-3.5 py-2 text-xs text-fg focus:outline-none focus:ring-2 focus:ring-primary font-bold"
            />
          </div>

          {/* 5. Benefits Guarantee Pill */}
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-800 dark:text-emerald-200 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldCheck className="size-4 text-emerald-600" />
              <span>Why Everyone Prefers KingPay Sovereign QR</span>
            </div>
            <p className="text-[11px] text-muted leading-relaxed">
              • 0% convenience fee for payer &amp; receiver<br />
              • Instant bank settlement in 2 seconds<br />
              • 24K pure digital gold cashback awarded on every payment
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
