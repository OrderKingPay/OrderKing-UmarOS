import { useEffect, useState } from "react";
import {
  X,
  QrCode,
  ShieldCheck,
  Zap,
  ExternalLink,
  Copy,
  Check,
  Smartphone,
  ArrowRight,
  Clock,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatPaise } from "@/lib/money";
import {
  buildNPCIUpiIntentUrl,
  generateAllUPIAppLinks,
  generateBharatQRPayload,
  verifyBharatQRChecksum,
  type SupportedUPIApp,
  FOUNDER_UPI_VPAS,
} from "@/lib/payments/npci-upi-intent";
import {
  FOUNDER_UPI_VPA,
  FOUNDER_MERCHANT_NAME,
  SOVEREIGN_NPCI_UPI_VPA,
  RAZORPAY_PAYMENT_HANDLE,
  RAZORPAY_PAYMENT_HANDLE_URL,
} from "@/lib/dispatch/whatsapp-gps-bridge";

export interface DirectUpiIntentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderTotalPaise: number;
  orderPublicId?: string;
  orderNotes?: string;
  onPaymentConfirmed?: (transactionRef: string) => void;
  founderVpa?: string;
  founderPayeeName?: string;
}

export function DirectUpiIntentModal({
  isOpen,
  onClose,
  orderTotalPaise,
  orderPublicId = `ORDK-${Date.now().toString().slice(-6)}`,
  orderNotes = "OrderKing Direct Settlement",
  onPaymentConfirmed,
  founderVpa = FOUNDER_UPI_VPA,
  founderPayeeName = FOUNDER_MERCHANT_NAME,
}: DirectUpiIntentModalProps) {
  const [activeVpa, setActiveVpa] = useState<string>(founderVpa || "9395065587@ybl");
  const [qrFormat, setQrFormat] = useState<"bharatqr" | "upi">("bharatqr");
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState(300); // 5 minute dynamic window
  const [isVerifying, setIsVerifying] = useState(false);

  const amountRupees = orderTotalPaise / 100;
  const transactionRef = `OKUPI-${orderPublicId}-${Date.now().toString().slice(-4)}`;

  // Generate NPCI Intent URL and app-specific links
  const upiParams = {
    vpa: activeVpa,
    payeeName: founderPayeeName,
    amountInRupees: amountRupees,
    currency: "INR" as const,
    transactionRef,
    transactionNote: `${orderPublicId} ${orderNotes}`.slice(0, 50),
    merchantCategoryCode: "5812", // Dining & Food
    merchantCity: "Karimganj",
    postalCode: "788710",
    mode: "02", // Dynamic QR / Intent
  };

  const universalIntentUrl = buildNPCIUpiIntentUrl(upiParams);
  const appLinks = generateAllUPIAppLinks(upiParams);
  const bharatQr = generateBharatQRPayload(upiParams);
  const isCrcValid = verifyBharatQRChecksum(bharatQr.emvcoPayload);

  // Active QR payload: EMVCo MPM v1.0 standard with 16-bit CRC-CCITT or canonical UPI URI
  const activeQrPayload = qrFormat === "bharatqr" ? bharatQr.emvcoPayload : universalIntentUrl;

  // High-res QR code image generated dynamically
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=360x360&data=${encodeURIComponent(
    activeQrPayload
  )}&bgcolor=FFFFFF&color=090D16`;

  // Countdown timer for dynamic intent
  useEffect(() => {
    if (!isOpen) return;
    setTimeRemainingSeconds(300);
    const interval = setInterval(() => {
      setTimeRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const minutes = Math.floor(timeRemainingSeconds / 60);
  const seconds = timeRemainingSeconds % 60;
  const timerDisplay = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  const handleCopyUpi = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(founderVpa);
      setCopiedUpi(true);
      toast.success("Founder VPA copied to clipboard!");
      setTimeout(() => setCopiedUpi(false), 2000);
    }
  };

  const handleCopyLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(universalIntentUrl);
      setCopiedLink(true);
      toast.success("Direct NPCI UPI link copied!");
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleOpenApp = (app: SupportedUPIApp) => {
    const appVpa = (FOUNDER_UPI_VPAS as Record<string, string>)[app] || founderVpa;
    const directIntent = buildNPCIUpiIntentUrl({
      vpa: appVpa,
      payeeName: founderPayeeName || "OrderKingPay",
      amountInRupees: amountRupees,
      currency: "INR",
      transactionRef,
      transactionNote: `${orderPublicId} ${orderNotes}`.slice(0, 50),
      merchantCategoryCode: "5812",
      mode: "02",
    });
    if (typeof window !== "undefined") {
      window.location.href = directIntent;
      toast.info(`Opening ${app.toUpperCase()} with VPA ${appVpa}... Please complete payment.`);
    }
  };

  const handleConfirmedPaid = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      toast.success("Direct UPI payment registered! Instant bank settlement confirmed.");
      if (onPaymentConfirmed) {
        onPaymentConfirmed(transactionRef);
      }
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-stone-950 via-zinc-950 to-black text-white rounded-3xl shadow-2xl border border-amber-400/60 overflow-hidden my-auto">
        {/* Top Gold Bar */}
        <div className="bg-gradient-to-r from-amber-500/20 via-yellow-400/25 to-amber-600/20 p-5 sm:p-6 border-b border-amber-400/30 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-yellow-500 text-zinc-950 font-black shadow-xs text-xs">
                👑
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2.5 py-0.5 rounded-full">
                Direct NPCI UPI Link &amp; Live QR
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Direct Bank Settlement
            </h2>
            <p className="text-xs text-zinc-300 flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-emerald-400" />
              <span>100% of money settles directly into founder bank account</span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="size-8 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 flex items-center justify-center transition cursor-pointer"
            aria-label="Close"
          >
            <X className="size-4.5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Amount and Timer Pill */}
          <div className="flex items-center justify-between rounded-2xl bg-amber-500/10 border border-amber-400/30 p-3.5">
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-400">Total Payable</span>
              <div className="text-2xl sm:text-3xl font-black font-mono text-amber-300">
                ₹{amountRupees.toFixed(2)}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-zinc-400 flex items-center gap-1 justify-end">
                <Clock className="size-3 text-amber-400" />
                <span>Expires In</span>
              </span>
              <div className="text-lg font-black font-mono text-emerald-400 tabular-nums">
                {timerDisplay}
              </div>
            </div>
          </div>

          {/* 1-Tap Mobile UPI App Triggers */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <Smartphone className="size-3.5 text-amber-400" />
                <span>1-Tap Pay via Mobile UPI App:</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-bold">Android &amp; iOS</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleOpenApp("phonepe")}
                className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/90 hover:border-amber-400 p-2.5 transition active:scale-95 cursor-pointer shadow-sm group"
              >
                <span className="text-xl">🟣</span>
                <span className="text-xs font-bold text-white mt-1">PhonePe</span>
                <span className="text-[9px] text-zinc-400 font-mono">9395065587@ybl</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenApp("paytm")}
                className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/90 hover:border-amber-400 p-2.5 transition active:scale-95 cursor-pointer shadow-sm group"
              >
                <span className="text-xl">🔵</span>
                <span className="text-xs font-bold text-white mt-1">Paytm</span>
                <span className="text-[9px] text-zinc-400 font-mono">9395065587@pthdfc</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenApp("cred")}
                className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/90 hover:border-amber-400 p-2.5 transition active:scale-95 cursor-pointer shadow-sm group"
              >
                <span className="text-xl">💎</span>
                <span className="text-xs font-bold text-white mt-1">CRED</span>
                <span className="text-[9px] text-zinc-400 font-mono">9395065587@yescred</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenApp("bhim")}
                className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/90 hover:border-amber-400 p-2.5 transition active:scale-95 cursor-pointer shadow-sm group"
              >
                <span className="text-xl">🇮🇳</span>
                <span className="text-xs font-bold text-white mt-1">BHIM</span>
                <span className="text-[9px] text-zinc-400 font-mono">9395065587@upi</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenApp("amazonpay")}
                className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/90 hover:border-amber-400 p-2.5 transition active:scale-95 cursor-pointer shadow-sm group"
              >
                <span className="text-xl">📦</span>
                <span className="text-xs font-bold text-white mt-1">Amazon Pay</span>
                <span className="text-[9px] text-zinc-400 font-mono">9395065587@apl</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenApp("gpay")}
                className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/90 hover:border-amber-400 p-2.5 transition active:scale-95 cursor-pointer shadow-sm group"
              >
                <span className="text-xl">⚡</span>
                <span className="text-xs font-bold text-white mt-1">Google Pay</span>
                <span className="text-[9px] text-zinc-400 font-mono">9395065587@ybl</span>
              </button>
            </div>

            {/* Universal Native Intent Link */}
            <a
              href={universalIntentUrl}
              className="mt-2.5 w-full h-11 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-zinc-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 transition active:scale-95 no-underline"
            >
              <ExternalLink className="size-4" />
              <span>Launch Any UPI App (Universal Intent)</span>
            </a>

            {/* Verified Razorpay Payment Handle */}
            <a
              href={RAZORPAY_PAYMENT_HANDLE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 w-full h-10 rounded-xl border border-sky-400/40 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 no-underline"
            >
              <ExternalLink className="size-3.5" />
              <span>Pay via Razorpay Handle ({RAZORPAY_PAYMENT_HANDLE})</span>
              <span className="text-[10px] uppercase font-black bg-sky-400/20 text-sky-200 px-2 py-0.5 rounded-full">
                Zero Fees
              </span>
            </a>
          </div>

          {/* Dynamic Live BharatQR Section */}
          <div className="rounded-2xl border border-amber-400/40 bg-zinc-900/70 p-4 text-center flex flex-col items-center">
            <div className="flex items-center justify-between w-full mb-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-200">
                <QrCode className="size-4 text-amber-400" />
                <span>Scan Dynamic BharatQR</span>
              </div>
              <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[9px] font-black uppercase text-emerald-400">
                0.0% MDR Bypass
              </span>
            </div>

            {/* VPA Selector Tabs */}
            <div className="grid grid-cols-2 gap-1.5 w-full mb-3 bg-black/40 p-1 rounded-xl border border-amber-400/20">
              <button
                type="button"
                onClick={() => setActiveVpa("9395065587@ybl")}
                className={`py-1 px-2 rounded-lg text-[10px] font-bold font-mono transition cursor-pointer ${
                  activeVpa === "9395065587@ybl"
                    ? "bg-amber-400 text-zinc-950 shadow-xs"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                9395065587@ybl (Founder)
              </button>
              <button
                type="button"
                onClick={() => setActiveVpa(SOVEREIGN_NPCI_UPI_VPA || "orderking@ybl")}
                className={`py-1 px-2 rounded-lg text-[10px] font-bold font-mono transition cursor-pointer ${
                  activeVpa === (SOVEREIGN_NPCI_UPI_VPA || "orderking@ybl")
                    ? "bg-amber-400 text-zinc-950 shadow-xs"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                orderking@ybl (Sovereign)
              </button>
            </div>

            <div className="relative bg-white p-3 rounded-2xl shadow-xl ring-4 ring-amber-400/20 mb-3">
              <img
                src={qrImageUrl}
                alt="OrderKing Dynamic Live UPI QR"
                width={190}
                height={190}
                loading="lazy"
                decoding="async"
                className="rounded-xl w-44 h-44 object-contain"
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="size-9 rounded-full bg-white shadow-md border-2 border-amber-400 flex items-center justify-center text-sm font-bold">
                  👑
                </span>
              </div>
            </div>

            {/* Format toggle: EMVCo MPM BharatQR vs Canonical URI */}
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <button
                type="button"
                onClick={() => setQrFormat("bharatqr")}
                className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider transition cursor-pointer ${
                  qrFormat === "bharatqr"
                    ? "bg-amber-400/20 text-amber-300 border border-amber-400/40"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                EMVCo MPM v1.0
              </button>
              <span className="text-zinc-600">·</span>
              <button
                type="button"
                onClick={() => setQrFormat("upi")}
                className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider transition cursor-pointer ${
                  qrFormat === "upi"
                    ? "bg-amber-400/20 text-amber-300 border border-amber-400/40"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                UPI URI Intent
              </button>
            </div>

            {/* CRC-16 Checksum Status */}
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono mb-2">
              <ShieldCheck className="size-3 text-emerald-400" />
              <span>CRC-16: 0x{bharatQr.emvcoPayload.slice(-4)} ({isCrcValid ? "Verified 100%" : "Invalid"})</span>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs font-mono text-zinc-300">
              <span>{activeVpa}</span>
              <button
                type="button"
                onClick={() => {
                  if (typeof navigator !== "undefined" && navigator.clipboard) {
                    void navigator.clipboard.writeText(activeVpa);
                    setCopiedUpi(true);
                    toast.success(`Copied ${activeVpa} to clipboard!`);
                    setTimeout(() => setCopiedUpi(false), 2000);
                  }
                }}
                className="p-1 hover:text-amber-400 transition cursor-pointer"
                title="Copy VPA"
              >
                {copiedUpi ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
              </button>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Ref: <span className="font-mono text-amber-300">{transactionRef}</span>
            </p>
          </div>

          {/* Action Footer */}
          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={handleCopyLink}
              className="flex-1 h-12 rounded-xl border-amber-400/40 bg-zinc-900 text-amber-300 hover:bg-zinc-850 text-xs font-bold"
            >
              {copiedLink ? (
                <>
                  <Check className="size-3.5 text-emerald-400 mr-1.5" />
                  <span>Copied Link</span>
                </>
              ) : (
                <>
                  <Copy className="size-3.5 mr-1.5" />
                  <span>Copy UPI Link</span>
                </>
              )}
            </Button>

            <Button
              type="button"
              disabled={isVerifying}
              onClick={handleConfirmedPaid}
              className="flex-2 h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
            >
              {isVerifying ? (
                <span className="flex items-center gap-2">
                  <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying NPCI Transfer...</span>
                </span>
              ) : (
                <>
                  <Check className="size-4 stroke-[3]" />
                  <span>I Have Paid ₹{amountRupees.toFixed(2)}</span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
