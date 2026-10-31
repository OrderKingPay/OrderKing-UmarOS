import { useState, useRef } from "react";
import {
  X,
  QrCode,
  Camera,
  Upload,
  CheckCircle2,
  ShieldCheck,
  Zap,
  ArrowRight,
  Sparkles,
  Wallet,
  AtSign,
  Share2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatPaise } from "@/lib/money";
import {
  buildNPCIUpiIntentUrl,
  isValidVPA,
} from "@/lib/payments/npci-upi-intent";
import jsQR from "jsqr";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  walletBalancePaise: number;
  onDeductWallet?: (amountPaise: number, description: string) => boolean;
  orderAmountPaise?: number;
  merchantVpa?: "9395065587@ybl" | "9395065587@yescred" | string;
  merchantName?: string;
}

export function ScanQrModal({
  isOpen,
  onClose,
  walletBalancePaise,
  onDeductWallet,
  orderAmountPaise,
  merchantVpa = "9395065587@ybl",
  merchantName = "OrderKing Payments",
}: Props) {
  const [activeTab, setActiveTab] = useState<"scan" | "merchant_qr">("scan");
  const [selectedMerchantVpa, setSelectedMerchantVpa] = useState<string>(merchantVpa);
  const [mode, setMode] = useState<"camera" | "manual">("manual");
  const [payeeUpi, setPayeeUpi] = useState("");
  const [payeeName, setPayeeName] = useState("");
  const initialAmount = orderAmountPaise ? (orderAmountPaise / 100).toFixed(2) : "250";
  const [amountRupees, setAmountRupees] = useState<string>(initialAmount);
  const [note, setNote] = useState<string>("Payment");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<{
    txnId: string;
    amountPaise: number;
    payee: string;
    upiId: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, img.width, img.height);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code && code.data) {
          const raw = code.data.trim();
          if (raw.startsWith("upi://pay")) {
            try {
              const parsed = new URL(raw);
              const pa = parsed.searchParams.get("pa") || "";
              const pn = parsed.searchParams.get("pn") || "";
              const am = parsed.searchParams.get("am") || "";
              if (pa) {
                setPayeeUpi(pa);
                if (pn) setPayeeName(decodeURIComponent(pn));
                if (am) setAmountRupees(am);
                setMode("manual");
                toast.success(`Detected UPI QR: ${pn || pa}`);
                return;
              }
            } catch {
              // fallback to raw checking
            }
          }
          if (isValidVPA(raw)) {
            setPayeeUpi(raw);
            setMode("manual");
            toast.success(`Detected UPI ID: ${raw}`);
            return;
          }
          toast.error("QR Code does not contain a valid NPCI UPI intent.");
        } else {
          toast.error("No valid QR code detected in the uploaded image.");
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const cleanUpi = payeeUpi.trim();
  const amtNum = parseFloat(amountRupees);
  let validUpiIntentUri = "";
  if (isValidVPA(cleanUpi) && amtNum > 0) {
    try {
      validUpiIntentUri = buildNPCIUpiIntentUrl({
        vpa: cleanUpi,
        payeeName: payeeName || cleanUpi,
        amountInRupees: amtNum,
        transactionRef: `OKPAY-${Date.now()}`,
        transactionNote: note.trim() || "Payment via OrderKing KingPay",
      });
    } catch {
      validUpiIntentUri = "";
    }
  }

  const handlePay = () => {
    const amt = parseFloat(amountRupees);
    if (!amt || amt <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (!isValidVPA(cleanUpi)) {
      toast.error("Please enter a valid NPCI UPI ID (e.g. merchant@icici, user@okhdfcbank)");
      return;
    }
    const amountPaise = Math.round(amt * 100);
    if (amountPaise > walletBalancePaise) {
      toast.error(
        `Insufficient KingPay balance (${formatPaise(walletBalancePaise)}). Please add funds.`
      );
      return;
    }

    const recipient = payeeName || cleanUpi;
    if (validUpiIntentUri) {
      if (typeof window !== "undefined") {
        window.location.href = validUpiIntentUri;
      }
      toast.info(`Redirecting to UPI application to authorize payment to ${recipient}...`);
      onClose();
      return;
    }
    toast.error("Unable to generate verified NPCI intent for this address.");
    return;

  };

  const handleReset = () => {
    setPaymentSuccess(null);
    setPayeeUpi("");
    setPayeeName("");
    setAmountRupees("250");
    setMode("manual");
    onClose();
  };

  const dynamicOrderRupees = parseFloat(amountRupees) || (orderAmountPaise ? orderAmountPaise / 100 : 250);
  const merchantDynamicTxnRef = `OKORD${Date.now().toString(36).toUpperCase()}`;
  const merchantUpiIntentUri = buildNPCIUpiIntentUrl({
    vpa: selectedMerchantVpa,
    payeeName: merchantName,
    amountInRupees: dynamicOrderRupees,
    transactionRef: merchantDynamicTxnRef,
    transactionNote: `OrderKing Order Settlement ${merchantDynamicTxnRef}`,
  });
  const merchantQrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(
    merchantUpiIntentUri
  )}&bgcolor=FFFFFF&color=090D16`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white rounded-3xl shadow-2xl border border-amber-400/50 overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-[#2A1D07] p-5 sm:p-6 border-b border-amber-400/30 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="flex size-7 items-center justify-center rounded-lg bg-amber-400/20 text-amber-300 border border-amber-400/40">
                <QrCode className="size-4" />
              </span>
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-400">
                KingPay UPI
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Scan &amp; Pay Instant UPI
            </h2>
            <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-emerald-400 inline" />
              <span>Instant UPI Payment</span>
            </p>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="size-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center transition"
          >
            <X className="size-4.5" />
          </button>
        </div>

        {/* Top-Level Mode: Scan / Pay vs Merchant Receive QR */}
        <div className="px-5 pt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("scan")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
              activeTab === "scan"
                ? "bg-amber-400/20 text-amber-300 border-amber-400/50 shadow-sm"
                : "bg-slate-950/80 text-slate-400 border-slate-800 hover:text-white"
            }`}
          >
            <Camera className="size-3.5" />
            <span>Scan to Pay (Outward)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("merchant_qr")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
              activeTab === "merchant_qr"
                ? "bg-amber-400/20 text-amber-300 border-amber-400/50 shadow-sm"
                : "bg-slate-950/80 text-slate-400 border-slate-800 hover:text-white"
            }`}
          >
            <QrCode className="size-3.5" />
            <span>Merchant BharatQR (Inward)</span>
          </button>
        </div>

        {activeTab === "merchant_qr" ? (
          /* Merchant BharatQR Generator View */
          <div className="p-5 sm:p-6 space-y-4">
            <div className="rounded-2xl border border-amber-400/40 bg-black/60 p-5 text-center flex flex-col items-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  NPCI VPA COMPLIANT
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  Direct Pay
                </span>
              </div>

              {/* VPA Selector Switch */}
              <div className="flex gap-2 mb-4 w-full max-w-xs">
                {(["9395065587@ybl", "9395065587@yescred"] as const).map((vpaOpt) => (
                  <button
                    key={vpaOpt}
                    type="button"
                    onClick={() => setSelectedMerchantVpa(vpaOpt)}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-mono font-bold transition border ${
                      selectedMerchantVpa === vpaOpt
                        ? "bg-amber-400/25 border-amber-400 text-amber-300"
                        : "bg-slate-900 border-slate-700 text-slate-400 hover:text-white"
                    }`}
                  >
                    {vpaOpt}
                  </button>
                ))}
              </div>

              {/* QR Image */}
              <div className="bg-white p-3.5 rounded-2xl shadow-2xl ring-4 ring-amber-400/20 mb-3">
                <img
                  src={merchantQrImageUrl}
                  alt="Scan to Pay OrderKing UPI"
                  width={200}
                  height={200}
                  loading="lazy"
                  decoding="async"
                  className="rounded-xl w-44 h-44 object-contain"
                />
              </div>

              <p className="text-2xl font-black font-mono text-white mt-1">
                ₹{dynamicOrderRupees.toFixed(2)}
              </p>
              <p className="text-xs font-bold text-amber-300">{merchantName}</p>
              <p className="text-[11px] font-mono text-slate-400">{selectedMerchantVpa}</p>

              <div className="mt-4 flex gap-2 w-full max-w-xs">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (typeof navigator !== "undefined" && navigator.clipboard) {
                      void navigator.clipboard.writeText(merchantUpiIntentUri);
                      toast.success("Merchant UPI Intent URI copied!");
                    }
                  }}
                  className="flex-1 h-9 rounded-xl border-amber-400/40 text-amber-300 bg-slate-950 text-xs font-bold"
                >
                  Copy Intent
                </Button>
                <a
                  href={merchantUpiIntentUri}
                  className="flex-1 h-9 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 text-black text-xs font-black inline-flex items-center justify-center no-underline shadow-sm"
                >
                  Open UPI App
                </a>
              </div>
            </div>
          </div>
        ) : paymentSuccess ? (
          /* Payment Success Confirmation View */
          <div className="p-6 text-center space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex size-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border-2 border-emerald-400/50 mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="size-9" />
            </div>

            <div>
              <span className="text-xs uppercase tracking-widest font-black text-emerald-400">
                Payment Successful
              </span>
              <h3 className="text-3xl font-black text-white mt-1 font-mono">
                {formatPaise(paymentSuccess.amountPaise)}
              </h3>
              <p className="text-sm text-slate-300 mt-1">
                Paid to <strong className="text-amber-300">{paymentSuccess.payee}</strong>
              </p>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {paymentSuccess.upiId}
              </p>
            </div>

            <div className="bg-slate-900/90 rounded-2xl p-4 border border-amber-400/30 text-left space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Transaction Reference:</span>
                <span className="font-mono text-white font-bold">{paymentSuccess.txnId}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Bank Settlement UTR:</span>
                <span className="font-medium text-amber-300">Internal Ledger Clearance (Direct Vault)</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Payment Mode:</span>
                <span className="text-amber-400 font-bold">KingPay Wallet</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Convenience Fee:</span>
                <span className="text-emerald-400 font-bold">UPI Ready</span>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleReset}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-black font-black text-sm shadow-lg shadow-amber-500/20"
            >
              Done
            </Button>
          </div>
        ) : (
          <div className="p-5 sm:p-6 space-y-5">
            {/* Mode Switcher */}
            <div className="flex rounded-xl bg-slate-950 p-1 border border-white/10">
              <button
                type="button"
                onClick={() => setMode("camera")}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  mode === "camera"
                    ? "bg-amber-400/20 text-amber-300 border border-amber-400/40"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Camera className="size-3.5" />
                <span>Camera Scanner</span>
              </button>
              <button
                type="button"
                onClick={() => setMode("manual")}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  mode === "manual"
                    ? "bg-amber-400/20 text-amber-300 border border-amber-400/40"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <AtSign className="size-3.5" />
                <span>UPI ID / Mobile</span>
              </button>
            </div>

            {mode === "camera" ? (
              /* BharatQR Optical Viewfinder */
              <div className="space-y-4">
                <div className="relative aspect-square max-h-64 mx-auto w-full rounded-2xl overflow-hidden bg-black border-2 border-dashed border-amber-400/60 flex flex-col items-center justify-center p-4">
                  {/* Scanner Laser Animation */}
                  <div className="absolute inset-x-4 top-4 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_12px_rgba(245,158,11,0.9)] animate-pulse" />

                  {/* Corner Reticles */}
                  <div className="absolute top-3 left-3 size-6 border-t-2 border-l-2 border-amber-400 rounded-tl-lg" />
                  <div className="absolute top-3 right-3 size-6 border-t-2 border-r-2 border-amber-400 rounded-tr-lg" />
                  <div className="absolute bottom-3 left-3 size-6 border-b-2 border-l-2 border-amber-400 rounded-bl-lg" />
                  <div className="absolute bottom-3 right-3 size-6 border-b-2 border-r-2 border-amber-400 rounded-br-lg" />

                  <QrCode className="size-16 text-amber-400/40 mb-2 animate-pulse" />
                  <p className="text-xs font-bold text-slate-300 text-center">
                    Align any BharatQR / UPI QR within frame
                  </p>
                  <p className="text-[10px] text-slate-500 text-center mt-1">
                    Works with PhonePe, Paytm, GPay, BHIM &amp; All Bank QRs
                  </p>

                  <button
                    type="button"
                    onClick={() => setMode("manual")}
                    className="mt-3 text-xs bg-amber-400/20 text-amber-300 border border-amber-400/30 px-3 py-1.5 rounded-full hover:bg-amber-400/30 font-semibold flex items-center gap-1.5 transition"
                  >
                    <AtSign className="size-3" />
                    <span>Enter UPI ID / VPA Manually</span>
                  </button>
                </div>

                {/* Upload QR File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-11 rounded-xl border-amber-400/40 bg-slate-900 text-slate-200 hover:bg-slate-800 hover:text-white flex items-center justify-center gap-2 text-xs font-bold"
                >
                  <Upload className="size-4 text-amber-400" />
                  <span>Upload QR Code Image from Gallery</span>
                </Button>
              </div>
            ) : (
              /* Manual Input & Confirmation View */
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Payee Name or UPI ID / Mobile Number
                  </label>
                  <input
                    type="text"
                    value={payeeUpi}
                    onChange={(e) => setPayeeUpi(e.target.value)}
                    placeholder="e.g. merchant@upi, store@okhdfcbank"
                    className="w-full rounded-xl border border-amber-400/50 bg-slate-950 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                  {cleanUpi && !isValidVPA(cleanUpi) && (
                    <p className="text-xs text-rose-400 mt-1 font-semibold">
                      Please enter a valid NPCI UPI ID format (e.g. name@bank or store@paytm)
                    </p>
                  )}
                  {payeeName && isValidVPA(cleanUpi) && (
                    <p className="text-xs text-amber-300 mt-1 font-semibold flex items-center gap-1">
                      <ShieldCheck className="size-3.5 text-emerald-400" />
                      <span>Verified: {payeeName}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Amount to Pay (₹)
                  </label>
                  <div className="relative flex items-center rounded-xl border border-amber-400/60 bg-slate-950 p-2">
                    <span className="pl-2 text-xl font-black text-amber-400">₹</span>
                    <input
                      type="number"
                      min={1}
                      value={amountRupees}
                      onChange={(e) => setAmountRupees(e.target.value)}
                      placeholder="250"
                      className="w-full bg-transparent px-2 text-xl font-black text-white focus:outline-none"
                    />
                    <span className="pr-2 text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/15 border border-emerald-400/30 px-2 py-0.5 rounded-md">
                      Instant Transfer
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Add a Note (Optional)
                  </label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. Lunch, Coffee, Groceries"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Available Balance Indicator */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-400/30 text-xs">
                  <span className="text-amber-200">Paying from KingPay Wallet:</span>
                  <span className="font-mono font-bold text-amber-300">
                    {formatPaise(walletBalancePaise)}
                  </span>
                </div>

                {validUpiIntentUri && (
                  <a
                    href={validUpiIntentUri}
                    className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 border border-amber-400/50 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition no-underline shadow-sm"
                  >
                    <ExternalLink className="size-4" />
                    <span>Launch UPI App Intent (upi://pay)</span>
                  </a>
                )}

                <Button
                  type="button"
                  disabled={isProcessing || !isValidVPA(cleanUpi) || !amountRupees}
                  onClick={handlePay}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-black font-black text-sm shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2">
                      <span className="size-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      <span>Transacting Instant UPI...</span>
                    </span>
                  ) : (
                    <>
                      <Sparkles className="size-4" />
                      <span>
                        Pay ₹{Number(amountRupees || 0).toLocaleString("en-IN")} Instant
                      </span>
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
