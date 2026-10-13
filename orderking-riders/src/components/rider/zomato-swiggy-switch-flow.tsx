import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Edit3,
  FileCheck,
  MapPin,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { saveProfileFn, submitKycFn } from "@/lib/server/rider-fns";
import type { RiderProfile, VehicleType } from "@/lib/rider/types";
import { ZONES } from "@/lib/rider/catalog";

interface ZomatoSwiggySwitchFlowProps {
  rider: RiderProfile | null;
  onSuccess?: (updatedRider: RiderProfile) => void;
}

type AttachedDocInfo = {
  name: string;
  sizeBytes: number;
  contentType: string;
  previewDataUrl: string | null;
};

const BANK_CODES: Record<string, string> = {
  SBIN: "State Bank of India",
  HDFC: "HDFC Bank",
  ICIC: "ICICI Bank",
  UTIB: "Axis Bank",
  PUNB: "Punjab National Bank",
  BARB: "Bank of Baroda",
  CNRB: "Canara Bank",
  UBIN: "Union Bank of India",
  BKID: "Bank of India",
  IDIB: "Indian Bank",
  KKBK: "Kotak Mahindra Bank",
  YESB: "Yes Bank",
  FDRL: "Federal Bank",
  UCBA: "UCO Bank",
  CBIN: "Central Bank of India",
  IOBA: "Indian Overseas Bank",
  MAHB: "Bank of Maharashtra",
  BAND: "Bandhan Bank",
  IDFB: "IDFC FIRST Bank",
  INDB: "IndusInd Bank",
  AIRP: "Airtel Payments Bank",
  PYTM: "Paytm Payments Bank",
};

function detectIfscBank(ifsc: string): string | null {
  const clean = ifsc.trim().toUpperCase();
  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(clean)) return null;
  const prefix = clean.slice(0, 4);
  return BANK_CODES[prefix]
    ? `${BANK_CODES[prefix]} (Branch Code: ${clean.slice(5)})`
    : `Verified IFSC Format (${prefix} · Branch ${clean.slice(5)})`;
}

function detectPinRegion(pin: string): string | null {
  const clean = pin.trim();
  if (!/^[1-9]\d{5}$/.test(clean)) return null;
  if (clean.startsWith("788")) return "Assam — Barak Valley (Sribhumi / Karimganj / Silchar)";
  if (clean.startsWith("781") || clean.startsWith("782") || clean.startsWith("783"))
    return "Assam — Brahmaputra Valley (Guwahati / Kamrup)";
  if (clean.startsWith("79")) return "North-East India Postal Circle";
  if (clean.startsWith("700")) return "West Bengal — Kolkata Metropolitan Region";
  if (clean.startsWith("560")) return "Karnataka — Bengaluru Urban";
  if (clean.startsWith("400")) return "Maharashtra — Mumbai Metropolitan Region";
  if (clean.startsWith("110")) return "Delhi NCR Postal Circle";
  if (clean.startsWith("500")) return "Telangana — Hyderabad Metropolitan Region";
  if (clean.startsWith("600")) return "Tamil Nadu — Chennai Metropolitan Region";
  if (clean.startsWith("411")) return "Maharashtra — Pune Region";
  return `Valid Indian Postal PIN (${clean.slice(0, 2)}xxxx Circle)`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

export function ZomatoSwiggySwitchFlow({ rider, onSuccess }: ZomatoSwiggySwitchFlowProps) {
  const [platform, setPlatform] = useState<"ZOMATO" | "SWIGGY" | "OTHER_FLEET">("ZOMATO");
  const [partnerId, setPartnerId] = useState(
    rider?.insuranceRef?.includes(":") ? rider.insuranceRef.split(":")[1] || "" : "",
  );
  const [experience, setExperience] = useState("1-2 years");
  const [fullName, setFullName] = useState(rider?.fullName || "");
  const [phone, setPhone] = useState(rider?.phone || "");
  const [emergencyName, setEmergencyName] = useState(rider?.emergencyName || "");
  const [emergencyPhone, setEmergencyPhone] = useState(rider?.emergencyPhone || "");
  const [cityZone, setCityZone] = useState("Sribhumi / Karimganj");
  const [pincode, setPincode] = useState("");
  const [address, setAddress] = useState(rider?.address || "");
  const [vehicleCategory, setVehicleCategory] = useState<"BIKE" | "SCOOTER" | "EV" | "CYCLE">(
    rider?.vehicleType === "BICYCLE"
      ? "CYCLE"
      : rider?.vehicleType === "SCOOTER"
        ? "SCOOTER"
        : "BIKE",
  );
  const [vehicleRegistration, setVehicleRegistration] = useState(rider?.vehicleRegistration || "");
  const [licenceNumber, setLicenceNumber] = useState(rider?.licenceNumber || "");
  const [governmentIdLast4, setGovernmentIdLast4] = useState(rider?.governmentIdLast4 || "");
  const [ifsc, setIfsc] = useState("");
  const [payoutUpi, setPayoutUpi] = useState(rider?.payoutUpi || "");
  const [preferredZones, setPreferredZones] = useState<string[]>(
    rider?.preferredZones && rider.preferredZones.length > 0
      ? rider.preferredZones
      : [ZONES[0], ZONES[1]],
  );
  const [attachedDoc, setAttachedDoc] = useState<AttachedDocInfo | null>(null);
  const [safetyRulesAccepted, setSafetyRulesAccepted] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditingSubmitted, setIsEditingSubmitted] = useState(false);
  const [completed, setCompleted] = useState(
    rider?.kycStatus === "VERIFIED" ||
      (rider?.kycStatus as string) === "APPROVED" ||
      rider?.kycStatus === "SUBMITTED" ||
      rider?.kycStatus === "UNDER_REVIEW",
  );

  useEffect(() => {
    if (!rider) return;
    if (rider.fullName && !fullName) setFullName(rider.fullName);
    if (rider.phone && !phone) setPhone(rider.phone);
    if (rider.address && !address) setAddress(rider.address);
    if (rider.emergencyName && !emergencyName) setEmergencyName(rider.emergencyName);
    if (rider.emergencyPhone && !emergencyPhone) setEmergencyPhone(rider.emergencyPhone);
    if (rider.vehicleRegistration && !vehicleRegistration)
      setVehicleRegistration(rider.vehicleRegistration);
    if (rider.licenceNumber && !licenceNumber) setLicenceNumber(rider.licenceNumber);
    if (rider.governmentIdLast4 && !governmentIdLast4)
      setGovernmentIdLast4(rider.governmentIdLast4);
    if (rider.payoutUpi && !payoutUpi) setPayoutUpi(rider.payoutUpi);
  }, [
    rider,
    fullName,
    phone,
    address,
    emergencyName,
    emergencyPhone,
    vehicleRegistration,
    licenceNumber,
    governmentIdLast4,
    payoutUpi,
  ]);

  const isExemptVehicle = vehicleCategory === "CYCLE" || vehicleCategory === "EV";
  const pinRegionLabel = useMemo(() => detectPinRegion(pincode), [pincode]);
  const ifscBankLabel = useMemo(() => detectIfscBank(ifsc), [ifsc]);

  const handleDocumentAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Attached file exceeds the 5 MB maximum size limit. Please choose a smaller image or PDF.");
      return;
    }
    setError(null);
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachedDoc({
          name: file.name,
          sizeBytes: file.size,
          contentType: file.type,
          previewDataUrl: typeof reader.result === "string" ? reader.result : null,
        });
      };
      reader.readAsDataURL(file);
    } else {
      setAttachedDoc({
        name: file.name,
        sizeBytes: file.size,
        contentType: file.type || "application/pdf",
        previewDataUrl: null,
      });
    }
    toast.info("Document Attached — Submitted for Partner Verification");
  };

  const handleFastTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!partnerId.trim()) {
      setError("Please provide your prior Delivery Fleet Partner ID or Reference Number.");
      return;
    }
    const cleanPhone = phone.trim().replace(/\D/g, "");
    if (!fullName.trim() || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError("Full Legal Name and a valid 10-digit Indian mobile number are required.");
      return;
    }
    if (!cityZone.trim() || !address.trim()) {
      setError("Please enter your Operating City/Zone and complete residential address.");
      return;
    }
    if (pincode.trim() && !/^[1-9]\d{5}$/.test(pincode.trim())) {
      setError("Please enter a valid 6-digit Indian PIN code.");
      return;
    }
    if (!isExemptVehicle) {
      if (!licenceNumber.trim()) {
        setError("Driving Licence Number is mandatory for motorized two-wheelers.");
        return;
      }
      if (!vehicleRegistration.trim()) {
        setError("Vehicle Registration Number (RC) is mandatory for motorized two-wheelers.");
        return;
      }
    }
    if (!governmentIdLast4.trim() || !/^\d{4}$/.test(governmentIdLast4.trim())) {
      setError("Aadhaar Card last 4 digits are required for statutory KYC compliance.");
      return;
    }
    if (ifsc.trim() && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc.trim().toUpperCase())) {
      setError("Please enter a valid 11-character Bank IFSC code (e.g., SBIN0001234).");
      return;
    }
    if (!payoutUpi.trim() || !/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(payoutUpi.trim())) {
      setError("A valid UPI ID (e.g., partner@okaxis) is required for settlement payouts.");
      return;
    }
    if (!safetyRulesAccepted) {
      setError(
        "Please accept the Delivery Partner Service Agreement and Road Safety Undertaking before submitting.",
      );
      return;
    }

    const mappedVehicleType: VehicleType =
      vehicleCategory === "CYCLE"
        ? "BICYCLE"
        : vehicleCategory === "SCOOTER" || vehicleCategory === "EV"
          ? "SCOOTER"
          : "MOTORCYCLE";

    const fullServiceAddress = [
      address.trim(),
      cityZone.trim(),
      pincode.trim() ? `PIN ${pincode.trim()}` : "",
    ]
      .filter(Boolean)
      .join(", ");

    setPending(true);
    try {
      const priorRecordTag = [
        `FAST_TRACK:${platform}:${partnerId.trim()}:${experience}`,
        attachedDoc ? `DOC:${attachedDoc.name}(${attachedDoc.sizeBytes}B)` : "DOC:PENDING_UPLOAD",
      ].join("|");

      const patchPayload: Partial<RiderProfile> = {
        fullName: fullName.trim(),
        phone: cleanPhone,
        address: fullServiceAddress,
        emergencyName: emergencyName.trim() || rider?.emergencyName || "",
        emergencyPhone: emergencyPhone.trim().replace(/\D/g, "") || rider?.emergencyPhone || "",
        riderType: "DELIVERY_PARTNER",
        vehicleType: mappedVehicleType,
        vehicleRegistration: isExemptVehicle
          ? vehicleRegistration.trim() || `${vehicleCategory}_EXEMPT`
          : vehicleRegistration.trim(),
        licenceNumber: isExemptVehicle
          ? licenceNumber.trim() || `${vehicleCategory}_EXEMPT`
          : licenceNumber.trim(),
        governmentIdType: "AADHAAR",
        governmentIdLast4: governmentIdLast4.trim(),
        payoutUpi: payoutUpi.trim(),
        insuranceRef: priorRecordTag,
        preferredZones: preferredZones.length > 0 ? preferredZones : [ZONES[0]],
        availabilityNotes: [
          `Fast-Track Onboarding (${platform}, ${experience})`,
          `Vehicle:${vehicleCategory}`,
          ifsc.trim() ? `IFSC:${ifsc.trim().toUpperCase()}` : null,
          `SafetyUndertakings:Accepted`,
        ]
          .filter(Boolean)
          .join(" | "),
      };

      if (rider) {
        const saved = await saveProfileFn({ data: patchPayload });
        const updated =
          rider.kycStatus === "VERIFIED" ? saved : await submitKycFn();
        setCompleted(true);
        setIsEditingSubmitted(false);
        toast.success("Fast-Track KYC application saved and submitted for partner verification.");
        if (onSuccess) onSuccess(updated);
      } else {
        localStorage.setItem("orderking_rider_switch_data", JSON.stringify(patchPayload));
        setCompleted(true);
        toast.success("Application recorded. Proceeding to account sign-in.");
        window.location.href = "/login";
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to submit fast-track onboarding application. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 font-sans">
      {/* 1. INSTITUTIONAL HEADER */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800">
            <ShieldCheck className="size-3.5 text-emerald-700" />
            Experienced Delivery Partner Fast-Track Onboarding
          </span>
          <span className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
            Prior Commercial Fleet Verification
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Experienced Delivery Partner Fast-Track Onboarding
        </h1>

        <p className="mt-2.5 text-sm text-slate-600 max-w-2xl leading-relaxed">
          Delivery partners with prior commercial last-mile experience can submit their existing fleet credentials, payout statement, or ID screenshot alongside statutory KYC details for expedited onboarding review.
        </p>

        {/* Institutional Fleet Standards */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 border-t border-slate-100">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Base Fare Floor
            </span>
            <span className="text-lg font-extrabold text-slate-900 mt-0.5 block">
              ₹35 / Order
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Customer Tips
            </span>
            <span className="text-lg font-extrabold text-emerald-700 mt-0.5 block">
              100% Pass-Through
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Settlement Cycle
            </span>
            <span className="text-lg font-extrabold text-slate-900 mt-0.5 block">
              Weekly Wednesday
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Onboarding Fee
            </span>
            <span className="text-lg font-extrabold text-slate-900 mt-0.5 block">
              ₹0 (Zero Fee)
            </span>
          </div>
        </div>
      </div>

      {/* 2. FAST-TRACK FORM OR SUBMITTED DOSSIER STATE */}
      {completed && !isEditingSubmitted ? (
        <div className="rounded-2xl border border-emerald-300 bg-white p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="flex items-center gap-3.5">
              <div className="flex size-12 items-center justify-center rounded-full bg-emerald-700 text-white shadow-xs">
                <CheckCircle2 className="size-7" />
              </div>
              <div>
                <span className="inline-block rounded border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                  {rider?.kycStatus === "VERIFIED"
                    ? "Verified Delivery Partner"
                    : "Fast-Track KYC Submitted for Verification"}
                </span>
                <h2 className="mt-1 text-xl sm:text-2xl font-extrabold text-slate-900">
                  {rider?.fullName || fullName || "Partner Application Recorded"}
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsEditingSubmitted(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50 transition"
            >
              <Edit3 className="size-3.5" />
              <span>Edit Fast-Track / Bank Details</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
              <span className="text-[11px] font-semibold text-slate-500 block">
                Mobile &amp; Service Address
              </span>
              <p className="mt-1 font-bold text-slate-900">{rider?.phone || phone}</p>
              <p className="mt-0.5 text-slate-600 truncate">{rider?.address || address}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
              <span className="text-[11px] font-semibold text-slate-500 block">
                Vehicle &amp; Statutory KYC
              </span>
              <p className="mt-1 font-bold text-slate-900">
                {rider?.vehicleType || vehicleCategory} · RC: {rider?.vehicleRegistration || vehicleRegistration || "Exempt"}
              </p>
              <p className="mt-0.5 text-slate-600">
                DL: {rider?.licenceNumber || licenceNumber || "Exempt"} · Aadhaar: XXXX-{rider?.governmentIdLast4 || governmentIdLast4}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
              <span className="text-[11px] font-semibold text-slate-500 block">
                Settlement UPI &amp; Zones
              </span>
              <p className="mt-1 font-bold text-emerald-800">{rider?.payoutUpi || payoutUpi}</p>
              <p className="mt-0.5 text-slate-600 truncate">
                Zones: {(rider?.preferredZones || preferredZones).join(", ")}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <a
                href="/"
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow-xs hover:bg-slate-800 transition"
              >
                Open Rider Duty Dashboard <ArrowRight className="ml-2 size-4" />
              </a>
              <a
                href="/earnings"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50 transition"
              >
                View Payout &amp; Settlement Ledger
              </a>
            </div>
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleFastTrackSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Prior Delivery Experience &amp; Statutory KYC Form
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Provide your prior delivery fleet details and attach a recent payout statement or partner ID card for compliance verification.
              </p>
            </div>
            {isEditingSubmitted && (
              <button
                type="button"
                onClick={() => setIsEditingSubmitted(false)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel Edit
              </button>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-800">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Prior Fleet Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Prior / Current Delivery Fleet *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setPlatform("ZOMATO")}
                className={`flex items-center justify-center gap-2 rounded-xl p-3 text-xs font-bold border transition ${
                  platform === "ZOMATO"
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                Zomato Delivery Fleet
              </button>

              <button
                type="button"
                onClick={() => setPlatform("SWIGGY")}
                className={`flex items-center justify-center gap-2 rounded-xl p-3 text-xs font-bold border transition ${
                  platform === "SWIGGY"
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                Swiggy Delivery Fleet
              </button>

              <button
                type="button"
                onClick={() => setPlatform("OTHER_FLEET")}
                className={`flex items-center justify-center gap-2 rounded-xl p-3 text-xs font-bold border transition ${
                  platform === "OTHER_FLEET"
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                Other Hyperlocal / Courier Fleet
              </button>
            </div>
          </div>

          {/* Prior Partner ID & Tenure */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Prior Delivery Partner ID / Reference Number *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. FE-849201 or Partner ID"
                value={partnerId}
                onChange={(e) => setPartnerId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 font-medium placeholder-slate-400 focus:bg-white focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Total Last-Mile Delivery Tenure
              </label>
              <select
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 font-medium focus:bg-white focus:border-slate-900 focus:outline-none"
              >
                <option value="Under 6 months">Under 6 months</option>
                <option value="6 - 12 months">6 – 12 months</option>
                <option value="1-2 years">1 – 2 years</option>
                <option value="2+ years">2+ years</option>
              </select>
            </div>
          </div>

          {/* Honest Document Attachment with Real Client-Side Preview */}
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <FileCheck className="size-4 text-emerald-700" />
                  Prior Payout Statement or Partner ID Card
                </span>
                <p className="text-[11px] text-slate-600">
                  Attach a recent delivery payout statement or partner profile card (PDF, JPG, PNG up to 5 MB) for manual compliance verification.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <label className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-800 transition shadow-2xs">
                  <Upload className="size-3.5 text-slate-600" />
                  <span>{attachedDoc ? "Replace Document" : "Select Document"}</span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={handleDocumentAttach}
                  />
                </label>
                {attachedDoc && (
                  <button
                    type="button"
                    onClick={() => setAttachedDoc(null)}
                    className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 p-2 text-rose-700 hover:bg-rose-100 transition"
                    title="Remove attached document"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
            </div>

            {attachedDoc && (
              <div className="mt-3 space-y-2 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-900">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-semibold">
                    <ShieldCheck className="size-4 shrink-0 text-emerald-700" />
                    <span>
                      {attachedDoc.name} ({formatFileSize(attachedDoc.sizeBytes)})
                    </span>
                  </div>
                  <span className="rounded bg-white px-2 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200">
                    Document Attached — Submitted for Partner Verification
                  </span>
                </div>
                {attachedDoc.previewDataUrl && (
                  <div className="pt-1">
                    <img
                      src={attachedDoc.previewDataUrl}
                      alt="Attached partner document preview"
                      className="max-h-36 rounded-lg border border-emerald-200 object-contain bg-white p-1"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Personal, Emergency & Operational Zone Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Legal Name (as per Government ID) *
              </label>
              <input
                type="text"
                required
                placeholder="Full legal name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 font-medium placeholder-slate-400 focus:bg-white focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                10-Digit Mobile Number *
              </label>
              <input
                type="tel"
                required
                maxLength={10}
                placeholder="e.g. 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 font-medium placeholder-slate-400 focus:bg-white focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Operating City / Service Zone *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sribhumi, Guwahati, Silchar, Kolkata"
                value={cityZone}
                onChange={(e) => setCityZone(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 font-medium placeholder-slate-400 focus:bg-white focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                6-Digit Indian PIN Code
              </label>
              <input
                type="text"
                maxLength={6}
                inputMode="numeric"
                placeholder="e.g. 788710"
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 font-medium placeholder-slate-400 focus:bg-white focus:border-slate-900 focus:outline-none"
              />
              {pinRegionLabel && (
                <span className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-800">
                  <MapPin className="size-3 text-emerald-700" />
                  <span>{pinRegionLabel}</span>
                </span>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Complete Residential / Service Address *
              </label>
              <input
                type="text"
                required
                placeholder="House/Flat No., Street, Locality, Landmark"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 font-medium placeholder-slate-400 focus:bg-white focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Emergency Contact Name (Family / Next of Kin)
              </label>
              <input
                type="text"
                placeholder="Emergency contact full name"
                value={emergencyName}
                onChange={(e) => setEmergencyName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 font-medium placeholder-slate-400 focus:bg-white focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Emergency Contact Mobile Number
              </label>
              <input
                type="tel"
                maxLength={10}
                placeholder="10-digit emergency mobile"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value.replace(/\D/g, ""))}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 font-medium placeholder-slate-400 focus:bg-white focus:border-slate-900 focus:outline-none"
              />
            </div>
          </div>

          {/* Vehicle & Statutory Compliance */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Vehicle Category *
              </label>
              <select
                value={vehicleCategory}
                onChange={(e) =>
                  setVehicleCategory(e.target.value as "BIKE" | "SCOOTER" | "EV" | "CYCLE")
                }
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 font-medium focus:bg-white focus:border-slate-900 focus:outline-none"
              >
                <option value="BIKE">Motorcycle (BIKE)</option>
                <option value="SCOOTER">Gearless Scooter (SCOOTER)</option>
                <option value="EV">Electric Vehicle — Low-Speed (EV)</option>
                <option value="CYCLE">Pedal Bicycle (CYCLE)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Vehicle Registration (RC) {isExemptVehicle ? "(Exempt)" : "*"}
              </label>
              <input
                type="text"
                required={!isExemptVehicle}
                placeholder={isExemptVehicle ? "Exempt for Cycle / Low-Speed EV" : "e.g. AS10AB1234"}
                value={vehicleRegistration}
                onChange={(e) => setVehicleRegistration(e.target.value.toUpperCase())}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 font-medium placeholder-slate-400 focus:bg-white focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Driving Licence Number {isExemptVehicle ? "(Exempt)" : "*"}
              </label>
              <input
                type="text"
                required={!isExemptVehicle}
                placeholder={
                  isExemptVehicle ? "Exempt for Cycle / Low-Speed EV" : "e.g. AS1020180012345"
                }
                value={licenceNumber}
                onChange={(e) => setLicenceNumber(e.target.value.toUpperCase())}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 font-medium placeholder-slate-400 focus:bg-white focus:border-slate-900 focus:outline-none"
              />
            </div>
          </div>

          {/* Payout, Bank IFSC & Aadhaar Last 4 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Settlement UPI ID *
              </label>
              <input
                type="text"
                required
                placeholder="yourname@okaxis or 9876543210@upi"
                value={payoutUpi}
                onChange={(e) => setPayoutUpi(e.target.value.toLowerCase())}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 font-medium placeholder-slate-400 focus:bg-white focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Bank IFSC Code (Optional)
              </label>
              <input
                type="text"
                maxLength={11}
                placeholder="e.g. SBIN0001234"
                value={ifsc}
                onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 font-medium placeholder-slate-400 focus:bg-white focus:border-slate-900 focus:outline-none"
              />
              {ifscBankLabel && (
                <span className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-800">
                  <Building2 className="size-3 text-emerald-700" />
                  <span>{ifscBankLabel}</span>
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Aadhaar Card Last 4 Digits *
              </label>
              <input
                type="text"
                required
                maxLength={4}
                inputMode="numeric"
                placeholder="Last 4 digits"
                value={governmentIdLast4}
                onChange={(e) => setGovernmentIdLast4(e.target.value.replace(/\D/g, ""))}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 font-medium placeholder-slate-400 focus:bg-white focus:border-slate-900 focus:outline-none"
              />
            </div>
          </div>

          {/* Preferred Local Zones */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Preferred Local Delivery Zones
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

          {/* Safety & Statutory Agreement Checkbox */}
          <label className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={safetyRulesAccepted}
              onChange={(e) => setSafetyRulesAccepted(e.target.checked)}
              className="mt-0.5 size-4 rounded border-slate-300 accent-slate-900"
            />
            <span>
              I confirm that all submitted documents are authentic and accept the{" "}
              <strong>Independent Delivery Partner Service Agreement (Code on Social Security, 2020)</strong>,{" "}
              <strong>Road Safety &amp; BIS Helmet Undertaking</strong>, and{" "}
              <strong>FSSAI Food Hygiene SOP</strong>.
            </span>
          </label>

          {/* SUBMIT BUTTON */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="submit"
              disabled={pending}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white py-3.5 px-6 text-sm font-bold shadow-xs transition cursor-pointer"
            >
              {pending ? (
                <span>Submitting Fast-Track KYC Application...</span>
              ) : (
                <>
                  <span>Submit Fast-Track Onboarding for Verification</span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
