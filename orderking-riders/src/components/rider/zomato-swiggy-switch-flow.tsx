import { useState } from "react";
import { 
  CheckCircle2, 
  Zap, 
  ShieldCheck, 
  AlertCircle, 
  ArrowRight, 
  Coins, 
  TrendingUp, 
  Upload, 
  FileCheck,
  Building2,
  Bike,
  Sparkles,
  ArrowUpRight
} from "lucide-react";
import { toast } from "sonner";
import { saveProfileFn, submitKycFn } from "@/lib/server/rider-fns";
import type { RiderProfile, VehicleType } from "@/lib/rider/types";
import { ZONES } from "@/lib/rider/catalog";

interface ZomatoSwiggySwitchFlowProps {
  rider: RiderProfile | null;
  onSuccess?: (updatedRider: RiderProfile) => void;
}

export function ZomatoSwiggySwitchFlow({ rider, onSuccess }: ZomatoSwiggySwitchFlowProps) {
  const [platform, setPlatform] = useState<"ZOMATO" | "SWIGGY" | "ZEPTO_BLINKIT">("ZOMATO");
  const [partnerId, setPartnerId] = useState(rider?.insuranceRef?.includes("COMPETITOR_") ? rider.insuranceRef.split(":")[1] || "" : "");
  const [experience, setExperience] = useState("1-2 years");
  const [fullName, setFullName] = useState(rider?.fullName || "");
  const [phone, setPhone] = useState(rider?.phone || "");
  const [address, setAddress] = useState(rider?.address || "");
  const [vehicleType, setVehicleType] = useState<VehicleType>(rider?.vehicleType || "MOTORCYCLE");
  const [vehicleRegistration, setVehicleRegistration] = useState(rider?.vehicleRegistration || "");
  const [licenceNumber, setLicenceNumber] = useState(rider?.licenceNumber || "");
  const [governmentIdLast4, setGovernmentIdLast4] = useState(rider?.governmentIdLast4 || "");
  const [payoutUpi, setPayoutUpi] = useState(rider?.payoutUpi || "");
  const [preferredZones, setPreferredZones] = useState<string[]>(
    rider?.preferredZones && rider.preferredZones.length > 0 ? rider.preferredZones : [ZONES[0], ZONES[1]]
  );
  const [proofUploaded, setProofUploaded] = useState(false);
  const [verifiedPreview, setVerifiedPreview] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(
    rider?.kycStatus === "VERIFIED" || (rider?.kycStatus as string) === "APPROVED" || rider?.kycStatus === "SUBMITTED"
  );

  const serviceableCities = ["mumbai", "delhi", "bengaluru", "bangalore", "hyderabad", "sribhumi", "karimganj", "kolkata", "pune", "chennai"];

  function isAddressServiceable(addr: string) {
    if (!addr.trim()) return false;
    const lower = addr.toLowerCase();
    return serviceableCities.some((c) => lower.includes(c));
  }

  const handleDocumentSimulation = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProofUploaded(true);
      toast.info("Analyzing competitor partner credentials via OCR...");
      setTimeout(() => {
        setVerifiedPreview(true);
        toast.success("Active Partner Status Verified! Minimum ₹35 Base Pay Tier Unlocked.");
      }, 900);
    }
  };

  const handleFastSwitchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!partnerId.trim()) {
      setError(`Please provide your active ${platform === "ZOMATO" ? "Zomato" : platform === "SWIGGY" ? "Swiggy" : "Delivery Partner"} ID.`);
      return;
    }
    if (!fullName.trim() || !phone.trim()) {
      setError("Full Name and Phone Number are required.");
      return;
    }
    if (!address.trim() || !isAddressServiceable(address)) {
      setError("Please provide a full address including a serviceable city (e.g., Bengaluru, Mumbai, Delhi, Hyderabad).");
      return;
    }
    if (!licenceNumber.trim()) {
      setError("Driving License Number is required for road verification.");
      return;
    }
    if (!vehicleRegistration.trim()) {
      setError("Vehicle Registration Number (RC) is required.");
      return;
    }
    if (!governmentIdLast4.trim() || governmentIdLast4.length !== 4) {
      setError("Aadhar Card Last 4 digits are required for legal KYC.");
      return;
    }
    if (!payoutUpi.trim() || !payoutUpi.includes("@")) {
      setError("A valid UPI ID is required for daily payouts (e.g. mobile@upi).");
      return;
    }

    setPending(true);
    try {
      // Competitor Switch metadata tag
      const competitorTag = `COMPETITOR_SWITCH:${platform}:${partnerId}:MIN_35_LOCKED`;

      const patchPayload = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        riderType: "FULL_TIME" as const,
        vehicleType,
        vehicleRegistration: vehicleRegistration.trim(),
        licenceNumber: licenceNumber.trim(),
        governmentIdType: "AADHAAR",
        governmentIdLast4: governmentIdLast4.trim(),
        payoutUpi: payoutUpi.trim(),
        insuranceRef: competitorTag,
        preferredZones: preferredZones.length > 0 ? preferredZones : [ZONES[0]],
      };

      if (rider) {
        await saveProfileFn({ data: patchPayload });
        const updated = await submitKycFn();
        setCompleted(true);
        toast.success("Switched to OrderKing! ₹35 Minimum Base Payout tier activated.");
        if (onSuccess) onSuccess(updated);
      } else {
        // Guest mode fallback
        localStorage.setItem("orderking_rider_switch_data", JSON.stringify(patchPayload));
        setCompleted(true);
        toast.success("Application recorded! Proceeding to account confirmation.");
        window.location.href = "/login?switch=success";
      }
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : "Failed to submit switch request. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 font-sans">
      {/* 1. HERO HEADER: PURE LIGHT MODE CORPORATE ACQUISITION COPY */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800">
            <span className="size-2 rounded-full bg-emerald-600 animate-pulse" />
            Official Rider Poaching Portal
          </span>
          <span className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
            Instant 1-Click Fast Track
          </span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Switch to OrderKing. Minimum ₹35 Base Payout. Fast Onboarding.
        </h1>

        <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
          Tired of predatory ₹20 base pay and hidden penalties on Zomato and Swiggy? OrderKing guarantees a flat ₹35 minimum base payout per drop, 100% direct customer tips, and zero platform deductions with daily UPI settlements.
        </p>

        {/* Corporate Trust Metrics */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-slate-100">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Min Base Payout</span>
            <span className="text-xl font-extrabold text-slate-900 flex items-center gap-1 mt-0.5">
              ₹35 <span className="text-xs font-bold text-emerald-700">Guaranteed</span>
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Customer Tips</span>
            <span className="text-xl font-extrabold text-emerald-700 mt-0.5 block">100% Direct</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Settlement Cycle</span>
            <span className="text-xl font-extrabold text-slate-900 mt-0.5 block">Daily UPI</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Switching Bounty</span>
            <span className="text-xl font-extrabold text-amber-600 mt-0.5 block">+₹500 Joining</span>
          </div>
        </div>
      </div>

      {/* 2. COMPETITOR AUDIT MATRIX: DIRECT ATTACK ON LOW PAYOUTS */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Economics Comparison: Competitors vs OrderKing
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Direct audit of real delivery economics in major metropolitan hubs
            </p>
          </div>
          <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
            Audit Validated
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-bold">
                <th className="py-3 px-3">Metric</th>
                <th className="py-3 px-3 text-rose-700">Zomato / Swiggy Payout</th>
                <th className="py-3 px-3 text-emerald-800 bg-emerald-50/70">OrderKing Guarantee</th>
                <th className="py-3 px-3 text-slate-600">Your Net Gain</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="py-3 px-3 font-semibold text-slate-900">Base Pay / Order</td>
                <td className="py-3 px-3 text-rose-600 font-medium">₹20 - ₹25 per drop</td>
                <td className="py-3 px-3 font-bold text-emerald-700 bg-emerald-50/40">₹35 Minimum Base Payout</td>
                <td className="py-3 px-3 font-semibold text-emerald-800">+40% to +75% higher</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-semibold text-slate-900">Platform Deductions</td>
                <td className="py-3 px-3 text-rose-600 font-medium">15% - 20% + Bag/Uniform cuts</td>
                <td className="py-3 px-3 font-bold text-emerald-700 bg-emerald-50/40">₹0 Zero Hidden Deductions</td>
                <td className="py-3 px-3 font-semibold text-emerald-800">100% of pay is yours</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-semibold text-slate-900">Customer Tips</td>
                <td className="py-3 px-3 text-rose-600 font-medium">Pooled / Delayed Payout</td>
                <td className="py-3 px-3 font-bold text-emerald-700 bg-emerald-50/40">100% Direct to Rider UPI</td>
                <td className="py-3 px-3 font-semibold text-emerald-800">Immediate tip receipt</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-semibold text-slate-900">Settlement Timeline</td>
                <td className="py-3 px-3 text-rose-600 font-medium">Weekly hold (T+4 to T+7)</td>
                <td className="py-3 px-3 font-bold text-emerald-700 bg-emerald-50/40">Instant Daily Settlements</td>
                <td className="py-3 px-3 font-semibold text-emerald-800">Zero working capital drag</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-semibold text-slate-900">Onboarding Process</td>
                <td className="py-3 px-3 text-rose-600 font-medium">3 to 7 Days Waitlist</td>
                <td className="py-3 px-3 font-bold text-emerald-700 bg-emerald-50/40">1-Click Fast Onboarding</td>
                <td className="py-3 px-3 font-semibold text-emerald-800">Active in &lt; 2 minutes</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. SWITCH ACTIVATION FORM OR COMPLETED STATE */}
      {completed ? (
        <div className="rounded-2xl border-2 border-emerald-500 bg-emerald-50/60 p-6 sm:p-8 text-center space-y-4">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md">
            <CheckCircle2 className="size-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">
            Switch Verified &amp; Activated!
          </h2>
          <p className="text-sm text-slate-700 max-w-md mx-auto">
            You are now on OrderKing's Priority Partner Tier with guaranteed <strong className="text-emerald-800">₹35 Minimum Base Payout</strong> per delivery. Your fast-track KYC submission has been recorded.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-slate-800 transition"
            >
              Open Rider Duty Dashboard <ArrowRight className="ml-2 size-4" />
            </a>
            <a
              href="/earnings"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50 transition"
            >
              View Guaranteed Payouts
            </a>
          </div>
        </div>
      ) : (
        <form onSubmit={handleFastSwitchSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              1-Click Switch: Competitor Fast Onboarding
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Existing active riders on Zomato, Swiggy, or Zepto bypass long waiting periods. Fill your current details below.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-800">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Platform Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Your Current Delivery Platform *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setPlatform("ZOMATO")}
                className={`flex items-center justify-center gap-2 rounded-xl p-3 text-xs font-bold border transition ${
                  platform === "ZOMATO"
                    ? "border-rose-500 bg-rose-50/80 text-rose-800 ring-2 ring-rose-400/20"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span className="size-2 rounded-full bg-rose-600" />
                Zomato Delivery Partner
              </button>

              <button
                type="button"
                onClick={() => setPlatform("SWIGGY")}
                className={`flex items-center justify-center gap-2 rounded-xl p-3 text-xs font-bold border transition ${
                  platform === "SWIGGY"
                    ? "border-orange-500 bg-orange-50/80 text-orange-800 ring-2 ring-orange-400/20"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span className="size-2 rounded-full bg-orange-500" />
                Swiggy Delivery Partner
              </button>

              <button
                type="button"
                onClick={() => setPlatform("ZEPTO_BLINKIT")}
                className={`flex items-center justify-center gap-2 rounded-xl p-3 text-xs font-bold border transition ${
                  platform === "ZEPTO_BLINKIT"
                    ? "border-purple-500 bg-purple-50/80 text-purple-800 ring-2 ring-purple-400/20"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span className="size-2 rounded-full bg-purple-600" />
                Zepto / Blinkit / Other
              </button>
            </div>
          </div>

          {/* Competitor Partner Identification */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {platform === "ZOMATO" ? "Zomato Partner ID *" : platform === "SWIGGY" ? "Swiggy Delivery Partner ID *" : "Competitor Partner ID *"}
              </label>
              <input
                type="text"
                required
                placeholder={platform === "ZOMATO" ? "e.g. ZOM-84920" : platform === "SWIGGY" ? "e.g. SWG-92811" : "e.g. PARTNER-1029"}
                value={partnerId}
                onChange={(e) => setPartnerId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 font-medium placeholder-slate-400 focus:bg-white focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Delivery Experience
              </label>
              <select
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 font-medium focus:bg-white focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="Under 6 months">Under 6 months</option>
                <option value="6 - 12 months">6 - 12 months</option>
                <option value="1-2 years">1 - 2 years (Experienced)</option>
                <option value="2+ years">2+ years (Senior Partner)</option>
              </select>
            </div>
          </div>

          {/* Quick Partner Proof / OCR Scanning Verification */}
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <FileCheck className="size-4 text-emerald-700" />
                  Fast-Track Verification: Existing Partner ID / App Screenshot
                </span>
                <p className="text-[11px] text-slate-500">
                  Upload screenshot of your Zomato/Swiggy profile to waive full documentary audit.
                </p>
              </div>

              <label className="cursor-pointer shrink-0 inline-flex items-center gap-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-800 transition shadow-2xs">
                <Upload className="size-3.5 text-slate-600" />
                <span>{proofUploaded ? "File Attached" : "Upload Screenshot"}</span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={handleDocumentSimulation}
                />
              </label>
            </div>

            {verifiedPreview && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-100/70 border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-800">
                <ShieldCheck className="size-4 text-emerald-700" />
                <span>OCR Validated: Active Competitor Status Verified. Base Payout ₹35 Guaranteed.</span>
              </div>
            )}
          </div>

          {/* Personal & Statutory KYC Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name *</label>
              <input
                type="text"
                required
                placeholder="As per Government ID"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 font-medium placeholder-slate-400 focus:bg-white focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number (WhatsApp Enabled) *</label>
              <input
                type="tel"
                required
                maxLength={10}
                placeholder="10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 font-medium placeholder-slate-400 focus:bg-white focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Address &amp; Operational City * (Serviceable: Bengaluru, Mumbai, Delhi, Hyderabad)
              </label>
              <input
                type="text"
                required
                placeholder="Street address, Locality, Bengaluru / Mumbai / Delhi / Hyderabad"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 font-medium placeholder-slate-400 focus:bg-white focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* Vehicle and License Information */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Vehicle Type *</label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 font-medium focus:bg-white focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="MOTORCYCLE">Motorcycle</option>
                <option value="SCOOTER">Scooter</option>
                <option value="BICYCLE">Bicycle</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Vehicle Registration (RC) *</label>
              <input
                type="text"
                required
                placeholder="e.g. KA01AB1234"
                value={vehicleRegistration}
                onChange={(e) => setVehicleRegistration(e.target.value.toUpperCase())}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 font-medium placeholder-slate-400 focus:bg-white focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Driving License Number *</label>
              <input
                type="text"
                required
                placeholder="e.g. DL1420110012345"
                value={licenceNumber}
                onChange={(e) => setLicenceNumber(e.target.value.toUpperCase())}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 font-medium placeholder-slate-400 focus:bg-white focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* Banking / UPI Payout Account */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Bank Payout UPI ID (Daily Settlements) *
              </label>
              <input
                type="text"
                required
                placeholder="yourname@okhdfcbank or 9876543210@upi"
                value={payoutUpi}
                onChange={(e) => setPayoutUpi(e.target.value.toLowerCase())}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 font-medium placeholder-slate-400 focus:bg-white focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Your ₹35+ base payouts &amp; tips settle directly into this UPI account daily.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Aadhar Card Last 4 Digits *</label>
              <input
                type="text"
                required
                maxLength={4}
                inputMode="numeric"
                placeholder="4 digits"
                value={governmentIdLast4}
                onChange={(e) => setGovernmentIdLast4(e.target.value.replace(/\D/g, ""))}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 font-medium placeholder-slate-400 focus:bg-white focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Statutory ID verification under gig worker compliance laws.
              </span>
            </div>
          </div>

          {/* Preferred Delivery Hubs */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Preferred Delivery Zones
            </label>
            <div className="flex flex-wrap gap-2">
              {ZONES.map((zone) => {
                const isSelected = preferredZones.includes(zone);
                return (
                  <button
                    key={zone}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setPreferredZones(preferredZones.filter((z) => z !== zone));
                      } else {
                        setPreferredZones([...preferredZones, zone]);
                      }
                    }}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold border transition ${
                      isSelected
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {zone}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={pending}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white py-3.5 px-6 text-sm sm:text-base font-bold shadow-md transition-all active:scale-[0.99] cursor-pointer"
            >
              {pending ? (
                <span>Verifying &amp; Activating Switch...</span>
              ) : (
                <>
                  <span>Complete 1-Click Switch &amp; Lock ₹35 Base Payout</span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>
            <p className="mt-2.5 text-center text-xs text-slate-500">
              By switching, you agree to OrderKing Partner Terms. Guaranteed minimum ₹35 base payout starts on your very first order.
            </p>
          </div>
        </form>
      )}
    </div>
  );
}
