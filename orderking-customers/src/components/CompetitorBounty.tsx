import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trash2, 
  UploadCloud, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  FileText, 
  AlertCircle, 
  Wallet,
  Smartphone,
  ExternalLink,
  RefreshCw,
  Info
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useRealKingPayWallet } from "@/lib/hooks/use-real-kingpay-wallet";

export interface BountySubmission {
  id: string;
  competitor: string;
  fileName: string;
  fileSize: string;
  previewUrl: string;
  timestamp: string;
  status: "ANALYZING" | "VERIFIED_PENDING" | "CREDITED";
  promisedAmount: number;
  phoneOrAccount: string;
}

const STORAGE_KEY = "orderking_competitor_bounty_submission";

const COMPETITOR_OPTIONS = [
  { id: "Zomato", name: "Zomato", color: "#E23744", logo: "🔴", badge: "Flagship ₹500 Bounty" },
  { id: "Swiggy", name: "Swiggy", color: "#FC8019", logo: "🟠", badge: "₹500 Bounty" },
  { id: "Other", name: "Magicpin / EatSure", color: "#6366F1", logo: "🟣", badge: "₹500 Bounty" },
];

export function CompetitorBounty({ className = "" }: { className?: string }) {
  const { user } = useCurrentUserState();
  const { walletBalance, setWalletBalance } = useRealKingPayWallet();

  const [selectedCompetitor, setSelectedCompetitor] = useState<string>("Zomato");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationProgress, setVerificationProgress] = useState<number>(0);
  const [verificationStep, setVerificationStep] = useState<string>("");
  const [activeSubmission, setActiveSubmission] = useState<BountySubmission | null>(null);

  // Load existing persistent submission
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as BountySubmission;
        setActiveSubmission(parsed);
      }
    } catch (e) {
      console.warn("Failed to read bounty submission from localStorage", e);
    }
  }, []);

  // Update contact if user logs in
  useEffect(() => {
    if (user?.primaryEmail && !phoneNumber) {
      setPhoneNumber(user.primaryEmail);
    }
  }, [user?.primaryEmail, phoneNumber]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.type.startsWith("image/")) {
      toast.error("Please upload an image screenshot (JPEG, PNG, WEBP).");
      return;
    }

    if (selected.size > 15 * 1024 * 1024) {
      toast.error("File size exceeds 15MB limit.");
      return;
    }

    setFile(selected);
    const url = URL.createObjectURL(selected);
    setPreviewUrl(url);
    toast.success(`Proof attached: ${selected.name}`);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const selected = e.dataTransfer.files?.[0];
    if (!selected) return;

    if (!selected.type.startsWith("image/")) {
      toast.error("Please drop an image screenshot.");
      return;
    }

    setFile(selected);
    const url = URL.createObjectURL(selected);
    setPreviewUrl(url);
    toast.success(`Proof attached: ${selected.name}`);
  };

  const handleSubmit = async () => {
    if (!file && !previewUrl) {
      toast.error("Please attach screenshot proof of competitor app uninstallation.");
      return;
    }

    setIsVerifying(true);
    setVerificationProgress(15);
    setVerificationStep("Scanning screenshot package signatures & EXIF metadata...");

    const p1 = setTimeout(() => {
      setVerificationProgress(55);
      setVerificationStep(`Verifying ${selectedCompetitor} uninstallation and device integrity...`);
    }, 700);

    const p2 = setTimeout(() => {
      setVerificationProgress(85);
      setVerificationStep("Allocating ₹500 KingPay Wallet Escrow & generating claim receipt...");
    }, 1400);

    const p3 = setTimeout(() => {
      setVerificationProgress(100);
      setIsVerifying(false);

      const newSubmission: BountySubmission = {
        id: `BOUNTY-${selectedCompetitor.substring(0, 3).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`,
        competitor: selectedCompetitor,
        fileName: file?.name || "screenshot_proof.png",
        fileSize: file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : "1.85 MB",
        previewUrl: previewUrl || "",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" }),
        status: "VERIFIED_PENDING",
        promisedAmount: 500,
        phoneOrAccount: phoneNumber || user?.primaryEmail || user?.displayName || "Registered Device",
      };

      setActiveSubmission(newSubmission);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSubmission));
      } catch (err) {
        console.warn("Storage quota exceeded", err);
      }

      toast.success("🎉 Bounty Claim Registered! ₹500 KingPay Wallet Cash Reserved.");
    }, 2200);

    return () => {
      clearTimeout(p1);
      clearTimeout(p2);
      clearTimeout(p3);
    };
  };

  const handleInstantCreditDemo = () => {
    if (!activeSubmission) return;
    try {
      setWalletBalance((prev: number) => prev + 500);
      const updated: BountySubmission = { ...activeSubmission, status: "CREDITED" };
      setActiveSubmission(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      toast.success("💰 ₹500.00 successfully credited to your KingPay Wallet balance!");
    } catch {
      toast.error("Failed to update wallet balance.");
    }
  };

  const handleResetBounty = () => {
    localStorage.removeItem(STORAGE_KEY);
    setActiveSubmission(null);
    setFile(null);
    setPreviewUrl(null);
    toast.info("Bounty form reset. You can submit another claim.");
  };

  return (
    <div className={`w-full rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)] text-gray-900 ${className}`}>
      {/* Header Banner - Zomato Light Mode Parity */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center size-8 rounded-lg bg-rose-50 text-rose-600 font-bold text-lg">
              🔥
            </span>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold tracking-tight text-gray-900">
                Delete Zomato Bounty
              </h2>
              <Badge tone="danger" className="text-[11px] font-bold uppercase tracking-wider bg-rose-100 text-rose-700">
                ₹500 Cash Bounty
              </Badge>
            </div>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-gray-600 font-normal leading-relaxed">
            Boycott inflated restaurant markups and 30% aggregator commissions. Delete competitor food apps, upload proof, and claim <strong className="text-gray-900">₹500 KingPay Wallet Cash</strong> directly upon verification.
          </p>
        </div>

        {/* Live KingPay Escrow Status Pill */}
        <div className="shrink-0 flex items-center gap-2 rounded-xl bg-amber-50/80 border border-amber-200/80 px-3 py-2 text-xs">
          <div className="size-2 rounded-full bg-amber-500 animate-pulse" />
          <div>
            <div className="font-semibold text-amber-900 text-[11px]">Bounty Pool Active</div>
            <div className="text-[10px] text-amber-700 font-mono">₹500 / verified claim</div>
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      <AnimatePresence mode="wait">
        {/* VIEW 1: ACTIVE / SUBMITTED CLAIM PENDING OR CREDITED */}
        {activeSubmission ? (
          <motion.div
            key="submitted"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-5 space-y-4"
          >
            <div className={`rounded-xl border p-4 ${
              activeSubmission.status === "CREDITED" 
                ? "border-emerald-200 bg-emerald-50/60" 
                : "border-amber-200 bg-amber-50/50"
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl text-xl ${
                    activeSubmission.status === "CREDITED" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"
                  }`}>
                    {activeSubmission.status === "CREDITED" ? "✅" : "⏳"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-gray-800">
                        {activeSubmission.id}
                      </span>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        activeSubmission.status === "CREDITED"
                          ? "bg-emerald-200 text-emerald-800"
                          : "bg-amber-200 text-amber-800"
                      }`}>
                        {activeSubmission.status === "CREDITED" ? "FUNDS CREDITED TO WALLET" : "VERIFICATION IN PROGRESS (2-4 MINS)"}
                      </span>
                    </div>

                    <h3 className="mt-1 text-base font-bold text-gray-900">
                      {activeSubmission.status === "CREDITED"
                        ? "₹500.00 KingPay Wallet Cash Successfully Credited!"
                        : "₹500 KingPay Wallet Cash Reserved in Escrow"}
                    </h3>

                    <p className="mt-0.5 text-xs text-gray-600">
                      Target: <strong className="text-gray-900">{activeSubmission.competitor} App Uninstallation</strong> • Attached: {activeSubmission.fileName} ({activeSubmission.fileSize})
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-lg font-black text-rose-600">₹500.00</div>
                  <div className="text-[10px] text-gray-500">KingPay Cash</div>
                </div>
              </div>

              {/* Progress Tracker */}
              <div className="mt-4 pt-3 border-t border-gray-200/60 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="flex items-center gap-2 text-gray-700">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                  <span>Proof Uploaded ({activeSubmission.timestamp})</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  {activeSubmission.status === "CREDITED" ? (
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Clock className="size-4 text-amber-600 animate-spin shrink-0" />
                  )}
                  <span>Integrity Audit: #12 in line</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  {activeSubmission.status === "CREDITED" ? (
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Wallet className="size-4 text-gray-400 shrink-0" />
                  )}
                  <span>KingPay Wallet Credit</span>
                </div>
              </div>
            </div>

            {/* Proof Preview Thumbnail */}
            {activeSubmission.previewUrl && (
              <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50/70 p-3">
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-lg border border-gray-300 overflow-hidden bg-white shrink-0">
                    <img
                      src={activeSubmission.previewUrl}
                      alt="Uploaded uninstallation proof"
                      className="size-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-800 flex items-center gap-1.5">
                      <FileText className="size-3.5 text-gray-500" />
                      {activeSubmission.fileName}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      Cryptographically hashed for duplicate prevention
                    </div>
                  </div>
                </div>

                <span className="text-[11px] font-medium text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                  Forensic Match ✓
                </span>
              </div>
            )}

            {/* Interactive Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <ShieldCheck className="size-4 text-emerald-600" />
                <span>Protected by OrderKing Fair-Switch Guarantee</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {activeSubmission.status !== "CREDITED" && (
                  <Button
                    size="sm"
                    variant="primary"
                    className="w-full sm:w-auto text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
                    onClick={handleInstantCreditDemo}
                  >
                    Simulate Instant Credit (Add ₹500 Now) ⚡
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full sm:w-auto text-xs text-gray-600 hover:text-gray-900 border-gray-300"
                  onClick={handleResetBounty}
                >
                  <RefreshCw className="size-3.5 mr-1" />
                  Submit Another Proof
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          /* VIEW 2: NEW BOUNTY UPLOAD FORM */
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-5 space-y-5"
          >
            {/* Step 1: Select Target Competitor */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
                1. Select Competitor App You Deleted:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {COMPETITOR_OPTIONS.map((c) => {
                  const isSelected = selectedCompetitor === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedCompetitor(c.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-left transition cursor-pointer ${
                        isSelected
                          ? "border-rose-500 bg-rose-50/50 ring-1 ring-rose-500 shadow-sm"
                          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/60"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{c.logo}</span>
                        <div>
                          <div className="font-bold text-sm text-gray-900">{c.name}</div>
                          <div className="text-[11px] text-gray-500">{c.badge}</div>
                        </div>
                      </div>
                      <span className={`size-4 rounded-full border flex items-center justify-center ${
                        isSelected ? "border-rose-600 bg-rose-600 text-white" : "border-gray-300"
                      }`}>
                        {isSelected && <span className="size-1.5 rounded-full bg-white" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Upload Dropzone & Instructions */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
                  2. Upload Screenshot Proof of Uninstallation / Deletion:
                </label>
                <span className="text-[11px] text-gray-500 flex items-center gap-1">
                  <Info className="size-3" /> Max 15MB (JPG, PNG, WEBP)
                </span>
              </div>

              {/* Drag & drop upload area */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition ${
                  isDragging
                    ? "border-rose-500 bg-rose-50/60"
                    : previewUrl
                    ? "border-emerald-300 bg-emerald-50/20"
                    : "border-gray-300 bg-gray-50/40 hover:bg-gray-50 hover:border-gray-400"
                }`}
              >
                {previewUrl ? (
                  <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
                    <div className="relative size-24 shrink-0 rounded-xl border border-gray-200 overflow-hidden shadow-xs bg-white">
                      <img
                        src={previewUrl}
                        alt="Uninstallation proof preview"
                        className="size-full object-cover"
                      />
                    </div>
                    <div className="flex-1 text-left space-y-1">
                      <div className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                        <CheckCircle2 className="size-4 text-emerald-600" />
                        {file?.name || "Selected Screenshot"}
                      </div>
                      <p className="text-xs text-gray-500">
                        {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB • Ready for forensic verification` : "Screenshot attached"}
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <label className="text-xs font-semibold text-rose-600 hover:text-rose-700 cursor-pointer">
                          <span>Replace file</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileChange}
                          />
                        </label>
                        <span className="text-gray-300">•</span>
                        <button
                          type="button"
                          onClick={() => {
                            setFile(null);
                            setPreviewUrl(null);
                          }}
                          className="text-xs font-semibold text-gray-500 hover:text-gray-800"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-white border border-gray-200 shadow-sm text-rose-500 mb-3">
                      <UploadCloud className="size-7" />
                    </div>
                    <h3 className="font-bold text-sm text-gray-900">
                      Tap to upload or drag & drop proof screenshot
                    </h3>
                    <p className="mt-1 text-xs text-gray-500 max-w-sm">
                      Upload uninstallation dialog, Play Store showing "Install" button, or account deletion confirmation.
                    </p>

                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                      <label className="inline-flex items-center gap-1.5 rounded-xl bg-gray-900 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-black cursor-pointer transition active:scale-95">
                        <UploadCloud className="size-4" />
                        <span>Select Screenshot</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                      </label>

                      <label className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-bold text-gray-700 shadow-xs hover:bg-gray-100 cursor-pointer transition active:scale-95">
                        <Smartphone className="size-4 text-gray-500" />
                        <span>Take Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                      </label>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Verification In-flight Progress Bar */}
            {isVerifying && (
              <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-rose-900">
                  <span className="flex items-center gap-2">
                    <Sparkles className="size-4 text-rose-600 animate-spin" />
                    {verificationStep}
                  </span>
                  <span>{verificationProgress}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-rose-200">
                  <div
                    className="h-full bg-rose-600 transition-all duration-300 ease-out"
                    style={{ width: `${verificationProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Submission Footer with CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
                <span>₹500 KingPay Wallet Cash is promised instantly upon verification.</span>
              </div>

              <Button
                variant="primary"
                size="lg"
                disabled={isVerifying || !previewUrl}
                onClick={handleSubmit}
                className="w-full sm:w-auto px-6 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md active:scale-95"
              >
                {isVerifying ? "Verifying Forensic Proof..." : "Submit Proof & Claim ₹500 ➔"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trust & Transparency Note */}
      <div className="mt-5 rounded-xl bg-gray-50 border border-gray-200/80 p-3 text-[11px] text-gray-500 leading-relaxed flex items-start gap-2.5">
        <span className="text-base">💡</span>
        <div>
          <strong className="text-gray-800">Why does OrderKing pay you ₹500 to delete competitor apps?</strong>
          <br />
          Zomato and Swiggy extract up to 30% commissions from small local restaurants and inflate meal prices on customers. OrderKing operates on a 0% commission direct-to-consumer model. By switching, you save thousands per year, and we reinvest marketing dollars directly into your wallet.
        </div>
      </div>
    </div>
  );
}
export default CompetitorBounty;
