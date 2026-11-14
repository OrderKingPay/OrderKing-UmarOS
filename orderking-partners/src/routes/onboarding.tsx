import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { VendorShell } from "@/components/vendor-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { useVendor } from "@/components/use-vendor";
import {
  createRestaurantDraft,
  getRestaurant,
  submitForReview,
  updateRestaurantProfile,
} from "@/lib/server/api-bootstrap";
import type { OnboardingFeeOption } from "@/lib/money";
import {
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Banknote,
  Store,
  FileCheck,
  AlertCircle,
  RefreshCw,
  MapPin,
  FileText,
  Clock,
  UtensilsCrossed,
  Check,
} from "lucide-react";

export const Route = createFileRoute("/onboarding")({ component: OnboardingPage });

export const ORDERKING_ONBOARDING_DRAFT_KEY = "orderking_partner_onboarding_draft";
export const ORDERKING_LOCAL_ONLY_KEY = "orderking_partner_onboarding_local_only";

export function formatFriendlyError(err: unknown, defaultMsg: string): string {
  if (!err) return defaultMsg;
  const raw = err instanceof Error ? err.message : String(err);
  if (/Invalid URL string|Failed to construct 'URL'/i.test(raw)) {
    return "Server connection is initializing or service URL is unreachable. Your onboarding draft is safely saved locally.";
  }
  if (/Failed to fetch|NetworkError|network/i.test(raw)) {
    return "Network connection issue detected. Your onboarding progress is safely saved locally.";
  }
  if (/Unauthorized|401|session/i.test(raw)) {
    return "Session requires verification. Your progress is preserved locally.";
  }
  return raw || defaultMsg;
}

export function persistDraftLocally(data: {
  restaurantId?: string | null;
  form: Record<string, any>;
  exemptFromGst?: boolean;
  onboardingFeeOption?: OnboardingFeeOption;
  amortizedConsent?: boolean;
  executionMethod?: "CLICKWRAP" | "AADHAAR_ESIGN";
  clickwrapSignatoryName?: string;
  clickwrapDesignation?: string;
  clickwrapConsent?: boolean;
  covenantsAccepted?: boolean;
  foodSafetyUndertakingAccepted?: boolean;
  privacyAndTaxAccepted?: boolean;
}) {
  if (typeof window === "undefined") return;
  try {
    const payload = {
      restaurantId: data.restaurantId,
      ...data.form,
      exemptFromGst: data.exemptFromGst ?? true,
      onboardingFeeOption: data.onboardingFeeOption,
      amortizedConsent: data.amortizedConsent,
      executionMethod: data.executionMethod,
      clickwrapSignatoryName: data.clickwrapSignatoryName,
      clickwrapDesignation: data.clickwrapDesignation,
      clickwrapConsent: data.clickwrapConsent,
      covenantsAccepted: data.covenantsAccepted,
      foodSafetyUndertakingAccepted: data.foodSafetyUndertakingAccepted,
      privacyAndTaxAccepted: data.privacyAndTaxAccepted,
      savedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(ORDERKING_ONBOARDING_DRAFT_KEY, JSON.stringify(payload));
  } catch {}
}

function OnboardingPage() {
  const qc = useQueryClient();
  const vendor = useVendor();
  const navigate = useNavigate();

  const isRealServerRestaurant = Boolean(
    vendor.restaurantId && !vendor.restaurantId.startsWith("local_")
  );

  const restQ = useQuery({
    queryKey: ["restaurant", vendor.restaurantId],
    queryFn: () => getRestaurant({ data: { restaurantId: vendor.restaurantId } }),
    enabled: isRealServerRestaurant,
  });

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [hasGst, setHasGst] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(true);

  // Zomato Parity Fields
  const [form, setForm] = useState({
    name: "",
    displayName: "",
    ownerName: "",
    designation: "Sole Proprietor / Authorized Signatory",
    phone: "",
    email: "",
    city: "Guwahati",
    address: "",
    landmark: "",
    pincode: "788710",
    state: "Assam",
    lat: "26.1445",
    lng: "91.7362",
    hasDelivery: true,
    hasDining: true,
    hasTakeaway: true,
    cuisine: "North Indian, Biryani, Mughlai",
    diet: "NONVEG",
    description: "",
    prepMinutes: "20",
    packingPaise: "1000",
    gstin: "",
    fssaiNumber: "",
    fssaiExpiryDate: "",
    fssaiDocName: "",
    pan: "",
    panName: "",
    panDocName: "",
    gstDocName: "",
    holder: "",
    bankName: "",
    bankAccount: "",
    confirmBankAccount: "",
    bankIfsc: "",
    accountType: "CURRENT",
    bankDocName: "",
    openingTime: "10:00",
    closingTime: "23:00",
  });

  const [detectingGps, setDetectingGps] = useState(false);
  const [gpsDetected, setGpsDetected] = useState(false);

  // Load from local draft
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(ORDERKING_ONBOARDING_DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        setForm((prev) => ({
          ...prev,
          name: prev.name || d.name || "",
          displayName: prev.displayName || d.displayName || d.name || "",
          ownerName: prev.ownerName || d.ownerName || "",
          designation: prev.designation || d.designation || "Sole Proprietor / Authorized Signatory",
          phone: prev.phone || d.phone || "",
          email: prev.email || d.email || "",
          city: prev.city || d.city || "Guwahati",
          address: prev.address || d.address || "",
          landmark: prev.landmark || d.landmark || "",
          pincode: prev.pincode || d.pincode || "788710",
          state: prev.state || d.state || "Assam",
          lat: prev.lat || d.lat || "26.1445",
          lng: prev.lng || d.lng || "91.7362",
          cuisine: prev.cuisine || d.cuisine || "North Indian, Biryani, Mughlai",
          diet: prev.diet || d.diet || "NONVEG",
          prepMinutes: prev.prepMinutes || d.prepMinutes || "20",
          packingPaise: prev.packingPaise || d.packingPaise || "1000",
          fssaiNumber: prev.fssaiNumber || d.fssaiNumber || "",
          fssaiExpiryDate: prev.fssaiExpiryDate || d.fssaiExpiryDate || "",
          pan: prev.pan || d.pan || "",
          panName: prev.panName || d.panName || d.holder || d.ownerName || "",
          gstin: prev.gstin || d.gstin || "",
          bankAccount: prev.bankAccount || d.bankAccount || "",
          confirmBankAccount: prev.confirmBankAccount || d.confirmBankAccount || d.bankAccount || "",
          bankIfsc: prev.bankIfsc || d.bankIfsc || "",
          bankName: prev.bankName || d.bankName || "",
          holder: prev.holder || d.holder || d.ownerName || "",
          accountType: prev.accountType || d.accountType || "CURRENT",
          openingTime: prev.openingTime || d.openingTime || "10:00",
          closingTime: prev.closingTime || d.closingTime || "23:00",
        }));
        if (d.gstin && String(d.gstin).trim().length === 15) {
          setHasGst(true);
        }
      }
    } catch {}
  }, []);

  // Sync from server restaurant query if active
  useEffect(() => {
    const r = restQ.data as any;
    if (!r) return;
    setForm((prev) => ({
      ...prev,
      name: prev.name || r.name || "",
      displayName: prev.displayName || r.displayName || r.name || "",
      ownerName: prev.ownerName || r.ownerName || "",
      phone: prev.phone || r.phone || "",
      email: prev.email || r.email || "",
      city: prev.city || r.city || "Guwahati",
      address: prev.address || r.address || "",
      landmark: prev.landmark || r.landmark || "",
      cuisine: prev.cuisine || r.cuisine || "North Indian, Biryani, Mughlai",
      diet: prev.diet || r.diet || "NONVEG",
      fssaiNumber: prev.fssaiNumber || r.fssaiNumber || r.fssaiLicenseNumber || "",
      pan: prev.pan || r.pan || "",
      gstin: prev.gstin || r.gstin || "",
      bankAccount: prev.bankAccount || r.bankAccount || "",
      confirmBankAccount: prev.confirmBankAccount || r.bankAccount || "",
      bankIfsc: prev.bankIfsc || r.bankIfsc || "",
      bankName: prev.bankName || r.bankName || "",
      holder: prev.holder || r.bankHolder || r.ownerName || "",
    }));
  }, [restQ.data]);

  function updateField(key: keyof typeof form, value: any) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      persistDraftLocally({
        restaurantId: vendor.restaurantId,
        form: next,
        exemptFromGst: !hasGst,
      });
      return next;
    });
  }

  // Native Browser Geolocation GPS Detector
  function handleDetectGps() {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setError("GPS location detection is not supported in this browser.");
      return;
    }
    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        updateField("lat", lat);
        updateField("lng", lng);
        setDetectingGps(false);
        setGpsDetected(true);
        setError(null);
      },
      () => {
        setDetectingGps(false);
        setError("GPS permission denied or timeout. Default coordinates applied.");
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  }

  function validateStep1(): boolean {
    if (!form.name.trim()) {
      setError("Please enter your Restaurant Name.");
      return false;
    }
    if (!form.ownerName.trim()) {
      setError("Please enter the Owner / Manager Full Name.");
      return false;
    }
    const cleanPhone = form.phone.replace(/\D/g, "");
    if (cleanPhone.slice(-10).length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return false;
    }
    if (!form.address.trim()) {
      setError("Please enter complete Restaurant Street Address.");
      return false;
    }
    if (!form.city.trim()) {
      setError("Please enter City / Town.");
      return false;
    }
    setError(null);
    return true;
  }

  function validateStep2(): boolean {
    const cleanFssai = form.fssaiNumber.replace(/\D/g, "");
    if (cleanFssai.length !== 14) {
      setError("Please enter a valid 14-digit FSSAI Food License Number.");
      return false;
    }
    if (!form.fssaiExpiryDate) {
      setError("Enter the actual FSSAI certificate expiry before submitting for review.");
      return false;
    }
    const cleanPan = form.pan.trim().toUpperCase();
    if (cleanPan.length !== 10) {
      setError("Please enter a valid 10-character PAN Card Number.");
      return false;
    }
    if (hasGst) {
      const cleanGst = form.gstin.trim().toUpperCase();
      if (cleanGst.length !== 15) {
        setError("Please enter a valid 15-character GSTIN, or untick the GST box to proceed without GST.");
        return false;
      }
    }
    setError(null);
    return true;
  }

  function validateStep3(): boolean {
    const cleanAcc = form.bankAccount.replace(/\D/g, "");
    if (cleanAcc.length < 8) {
      setError("Please enter a valid Bank Account Number.");
      return false;
    }
    const cleanConfirm = form.confirmBankAccount.replace(/\D/g, "");
    if (cleanAcc !== cleanConfirm) {
      setError("Bank Account Number and Confirmation do not match.");
      return false;
    }
    const cleanIfsc = form.bankIfsc.trim().toUpperCase();
    if (cleanIfsc.length !== 11) {
      setError("Please enter a valid 11-character Bank IFSC Code.");
      return false;
    }
    if (!acceptTerms) {
      setError("Please accept the OrderKing Restaurant Partner Agreement to complete registration.");
      return false;
    }
    setError(null);
    return true;
  }

  async function handleCompleteOnboarding() {
    if (!validateStep1() || !validateStep2() || !validateStep3()) return;

    setBusy(true);
    setError(null);

    const cleanPhone = form.phone.replace(/\D/g, "").slice(-10);
    const cleanFssai = form.fssaiNumber.replace(/\D/g, "");
    const cleanPan = form.pan.trim().toUpperCase();
    const cleanGst = hasGst ? form.gstin.trim().toUpperCase() : "";
    const cleanAcc = form.bankAccount.replace(/\D/g, "");
    const cleanIfsc = form.bankIfsc.trim().toUpperCase();

    const effectiveName = form.name.trim();
    const effectiveDisplayName = (form.displayName || form.name).trim();
    const effectiveOwner = form.ownerName.trim();
    const effectivePhone = cleanPhone;
    const effectiveEmail = (form.email || `${cleanPhone}@partner.orderking.in`).trim();
    const effectiveAddress = form.address.trim();
    const effectiveLandmark = form.landmark.trim();
    const effectiveCuisine = form.cuisine.trim() || "North Indian, Biryani";
    const effectiveHolder = (form.holder || form.ownerName || form.name).trim();

    try {
      let targetRestaurantId = vendor.restaurantId;

      if (!targetRestaurantId || targetRestaurantId.startsWith("local_")) {
        const draftRes = await createRestaurantDraft({
          data: {
            name: effectiveName,
            displayName: effectiveDisplayName,
            ownerName: effectiveOwner,
            phone: effectivePhone,
            email: effectiveEmail,
            city: form.city.trim() || "Guwahati",
            address: effectiveAddress,
            landmark: effectiveLandmark,
            cuisine: effectiveCuisine,
            diet: form.diet,
            description: form.description || `${effectiveName} — ${effectiveCuisine}`,
          },
        });
        targetRestaurantId = (draftRes as any)?.restaurantId || (draftRes as any)?.id || targetRestaurantId;
        if (targetRestaurantId && typeof window !== "undefined") {
          window.localStorage.setItem("orderking_restaurant_id", targetRestaurantId);
        }
      }

      if (!targetRestaurantId || targetRestaurantId.startsWith("local_")) {
        throw new Error("Failed to create restaurant draft on server. Please sign in and try again.");
      }

      await updateRestaurantProfile({
        data: {
          restaurantId: targetRestaurantId,
          name: effectiveName,
          displayName: effectiveDisplayName,
          ownerName: effectiveOwner,
          phone: effectivePhone,
          email: effectiveEmail,
          city: form.city.trim() || "Guwahati",
          fboName: effectiveOwner || effectiveName,
          address: effectiveAddress,
          landmark: effectiveLandmark,
          cuisine: effectiveCuisine,
          diet: form.diet,
          description: form.description || `${effectiveName} — ${effectiveCuisine}`,
          gstin: hasGst ? cleanGst : "",
          fssaiNumber: cleanFssai,
          fssaiLicenseNumber: cleanFssai,
          fssaiExpiryDate: form.fssaiExpiryDate,
          pan: cleanPan,
          prepMinutes: parseInt(form.prepMinutes, 10) || 20,
          packingPaise: parseInt(form.packingPaise, 10) || 1000,
          lat: parseFloat(form.lat) || 26.1445,
          lng: parseFloat(form.lng) || 91.7362,
          deliveryAvailable: form.hasDelivery,
          bankAccount: cleanAcc,
          bankIfsc: cleanIfsc,
          bankName: form.bankName.trim() || "Partner Settlement Bank",
          bankHolder: effectiveHolder,
          openingTime: form.openingTime || "10:00",
          closingTime: form.closingTime || "23:00",
        },
      });

      await submitForReview({ data: { restaurantId: targetRestaurantId } });

      await qc.invalidateQueries().catch(() => {});
      setSuccessMsg("Restaurant onboarding completed! Redirecting to your Partner Dashboard...");
      setTimeout(() => {
        window.location.assign("/dashboard");
      }, 600);
    } catch (err) {
      setSuccessMsg(null);
      setError(err instanceof Error ? err.message : "Restaurant profile was not saved. Nothing was verified.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <VendorShell title="Restaurant Partner Onboarding">
      <div className="mx-auto max-w-3xl py-4 space-y-6 text-gray-900 font-sans">
        {/* 3-Step Progress Header */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { num: 1, title: "1. Restaurant Information", sub: "Details & Location" },
            { num: 2, title: "2. Legal Documents", sub: "FSSAI & PAN" },
            { num: 3, title: "3. Bank & Agreement", sub: "Daily T+1 Payouts" },
          ].map((item) => {
            const active = step === item.num;
            const done = step > item.num;
            return (
              <button
                key={item.num}
                type="button"
                onClick={() => {
                  if (item.num < step) setStep(item.num as 1 | 2 | 3);
                }}
                className={`rounded-2xl border p-3.5 text-left transition-all ${
                  active
                    ? "border-red-500 bg-red-50/70 text-red-900 ring-2 ring-red-500/20"
                    : done
                    ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                    : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
                  <span>{item.title}</span>
                  {done && <CheckCircle2 className="size-4 text-emerald-600" />}
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">{item.sub}</div>
              </button>
            );
          })}
        </div>

        <Card className="border-gray-200 bg-white p-6 sm:p-8 space-y-6 rounded-3xl shadow-xs">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="size-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* STEP 1: RESTAURANT INFORMATION & LOCATION */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-3">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Store className="size-5 text-[#E23744]" />
                  <span>Step 1: Restaurant Information &amp; Location</span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Enter your restaurant name, contact person, street address, and kitchen dispatch coordinates.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold text-gray-700">Restaurant Name *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="e.g. Royal Kitchen &amp; Biryani"
                    className="mt-1 bg-white border-gray-300 text-gray-900 focus:border-[#E23744] h-11"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-700">Display Name on Customer App</Label>
                  <Input
                    value={form.displayName}
                    onChange={(e) => updateField("displayName", e.target.value)}
                    placeholder="Leave blank to use Restaurant Name"
                    className="mt-1 bg-white border-gray-300 text-gray-900 focus:border-[#E23744] h-11"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-700">Owner / Authorized Person Name *</Label>
                  <Input
                    value={form.ownerName}
                    onChange={(e) => updateField("ownerName", e.target.value)}
                    placeholder="Full name as on PAN card"
                    className="mt-1 bg-white border-gray-300 text-gray-900 focus:border-[#E23744] h-11"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-700">10-Digit Mobile Number *</Label>
                  <Input
                    type="tel"
                    maxLength={10}
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="9876543210"
                    className="mt-1 bg-white border-gray-300 text-gray-900 focus:border-[#E23744] h-11 font-mono"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-700">Official Business Email</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="contact@restaurant.com"
                    className="mt-1 bg-white border-gray-300 text-gray-900 focus:border-[#E23744] h-11"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-700">Designation / Role</Label>
                  <select
                    value={form.designation}
                    onChange={(e) => updateField("designation", e.target.value)}
                    className="mt-1 w-full h-11 rounded-md bg-white border border-gray-300 px-3 text-xs sm:text-sm text-gray-900 focus:border-[#E23744] focus:outline-none"
                  >
                    <option value="Sole Proprietor / Authorized Signatory">Sole Proprietor</option>
                    <option value="Managing Partner">Managing Partner</option>
                    <option value="Director">Director</option>
                    <option value="General Manager">General Manager</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <Label className="text-xs font-semibold text-gray-700">Complete Outlet Street Address *</Label>
                  <Input
                    value={form.address}
                    onChange={(e) => updateField("address", e.target.value)}
                    placeholder="Shop/Building No., Street, Area"
                    className="mt-1 bg-white border-gray-300 text-gray-900 focus:border-[#E23744] h-11"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-700">City / Town *</Label>
                  <Input
                    value={form.city}
                    onChange={(e) => updateField("city", e.target.value)}
                    placeholder="Guwahati / Silchar / Karimganj"
                    className="mt-1 bg-white border-gray-300 text-gray-900 focus:border-[#E23744] h-11"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-700">6-Digit Pincode *</Label>
                  <Input
                    maxLength={6}
                    value={form.pincode}
                    onChange={(e) => updateField("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="788710"
                    className="mt-1 bg-white border-gray-300 text-gray-900 focus:border-[#E23744] h-11 font-mono"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-700">Nearby Landmark</Label>
                  <Input
                    value={form.landmark}
                    onChange={(e) => updateField("landmark", e.target.value)}
                    placeholder="Near Main Market / Station"
                    className="mt-1 bg-white border-gray-300 text-gray-900 focus:border-[#E23744] h-11"
                  />
                </div>

                {/* GPS Coordinate Verification */}
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-gray-700">Kitchen GPS Coordinates</Label>
                    <button
                      type="button"
                      onClick={handleDetectGps}
                      disabled={detectingGps}
                      className="text-[11px] font-bold text-[#E23744] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <MapPin className="size-3" />
                      <span>{detectingGps ? "Detecting..." : "Detect GPS Pin"}</span>
                    </button>
                  </div>
                  <div className="mt-1 flex gap-2">
                    <Input
                      value={form.lat}
                      onChange={(e) => updateField("lat", e.target.value)}
                      placeholder="Latitude (e.g. 26.1445)"
                      className="bg-white border-gray-300 text-gray-900 text-xs font-mono h-11"
                    />
                    <Input
                      value={form.lng}
                      onChange={(e) => updateField("lng", e.target.value)}
                      placeholder="Longitude (e.g. 91.7362)"
                      className="bg-white border-gray-300 text-gray-900 text-xs font-mono h-11"
                    />
                  </div>
                  {gpsDetected && (
                    <div className="mt-1 text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                      <Check className="size-3" /> GPS location accurately locked for delivery dispatch.
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-xs font-semibold text-gray-700">Primary Cuisines</Label>
                  <Input
                    value={form.cuisine}
                    onChange={(e) => updateField("cuisine", e.target.value)}
                    placeholder="North Indian, Biryani, Chinese"
                    className="mt-1 bg-white border-gray-300 text-gray-900 focus:border-[#E23744] h-11"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-700">Kitchen Category</Label>
                  <select
                    value={form.diet}
                    onChange={(e) => updateField("diet", e.target.value)}
                    className="mt-1 w-full h-11 rounded-md bg-white border border-gray-300 px-3 text-xs sm:text-sm text-gray-900 focus:border-[#E23744] focus:outline-none"
                  >
                    <option value="NONVEG">Both Veg &amp; Non-Veg</option>
                    <option value="VEG">Pure Veg Only</option>
                  </select>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-gray-700">Average Preparation Time</Label>
                  <select
                    value={form.prepMinutes}
                    onChange={(e) => updateField("prepMinutes", e.target.value)}
                    className="mt-1 w-full h-11 rounded-md bg-white border border-gray-300 px-3 text-xs sm:text-sm text-gray-900 focus:border-[#E23744] focus:outline-none"
                  >
                    <option value="15">15 Minutes (Fast Food / Beverages)</option>
                    <option value="20">20 Minutes (Standard Casual Dining)</option>
                    <option value="25">25 Minutes (Fresh Curries &amp; Biryani)</option>
                    <option value="30">30 Minutes (Slow-Cooked Specialties)</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-700">Order Packaging Charge</Label>
                  <select
                    value={form.packingPaise}
                    onChange={(e) => updateField("packingPaise", e.target.value)}
                    className="mt-1 w-full h-11 rounded-md bg-white border border-gray-300 px-3 text-xs sm:text-sm text-gray-900 focus:border-[#E23744] focus:outline-none"
                  >
                    <option value="0">₹0 (Free Packaging)</option>
                    <option value="1000">₹10 Per Order</option>
                    <option value="1500">₹15 Per Order</option>
                    <option value="2000">₹20 Per Order</option>
                  </select>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-gray-700">Daily Opening Time</Label>
                  <Input
                    type="time"
                    value={form.openingTime}
                    onChange={(e) => updateField("openingTime", e.target.value)}
                    className="mt-1 bg-white border-gray-300 text-gray-900 focus:border-[#E23744] h-11"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-700">Daily Closing Time</Label>
                  <Input
                    type="time"
                    value={form.closingTime}
                    onChange={(e) => updateField("closingTime", e.target.value)}
                    className="mt-1 bg-white border-gray-300 text-gray-900 focus:border-[#E23744] h-11"
                  />
                </div>
              </div>

              {/* Services Offered Selection */}
              <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 space-y-2">
                <div className="text-xs font-bold text-gray-900">Services Offered</div>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.hasDelivery}
                      onChange={(e) => updateField("hasDelivery", e.target.checked)}
                      className="size-4 rounded border-gray-300 text-[#E23744] focus:ring-[#E23744]"
                    />
                    <span>Online Delivery</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.hasDining}
                      onChange={(e) => updateField("hasDining", e.target.checked)}
                      className="size-4 rounded border-gray-300 text-[#E23744] focus:ring-[#E23744]"
                    />
                    <span>Dine-In Table Booking</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.hasTakeaway}
                      onChange={(e) => updateField("hasTakeaway", e.target.checked)}
                      className="size-4 rounded border-gray-300 text-[#E23744] focus:ring-[#E23744]"
                    />
                    <span>Takeaway / Pickup</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button
                  type="button"
                  onClick={() => {
                    if (validateStep1()) setStep(2);
                  }}
                  className="bg-[#E23744] hover:bg-[#d32f2f] text-white font-bold px-8 h-12 rounded-xl flex items-center gap-2 shadow-md shadow-red-500/20 cursor-pointer"
                >
                  <span>Continue to Step 2</span>
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: LEGAL DOCUMENTS & TAX COMPLIANCE */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-3">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <FileCheck className="size-5 text-[#E23744]" />
                  <span>Step 2: FSSAI License, PAN Card &amp; GST Compliance</span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Enter your 14-digit FSSAI license and 10-character PAN card. GST is optional for turnover &lt; ₹20L.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-gray-700">14-Digit FSSAI License Number *</Label>
                    <a
                      href="https://foscos.fssai.gov.in"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-[#E23744] hover:underline"
                    >
                      Apply on FoSCoS
                    </a>
                  </div>
                  <Input
                    maxLength={14}
                    value={form.fssaiNumber}
                    onChange={(e) => updateField("fssaiNumber", e.target.value.replace(/\D/g, "").slice(0, 14))}
                    placeholder="10020011000123"
                    className="mt-1 bg-white border-gray-300 text-gray-900 focus:border-[#E23744] h-11 font-mono"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-700">FSSAI Valid Until *</Label>
                  <Input
                    type="date"
                    value={form.fssaiExpiryDate}
                    onChange={(e) => updateField("fssaiExpiryDate", e.target.value)}
                    className="mt-1 bg-white border-gray-300 text-gray-900 focus:border-[#E23744] h-11"
                  />
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    Enter the actual FSSAI certificate expiry before submitting for review.
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-gray-700">10-Character PAN Card Number *</Label>
                  <Input
                    maxLength={10}
                    value={form.pan}
                    onChange={(e) => updateField("pan", e.target.value.toUpperCase().slice(0, 10))}
                    placeholder="ABCDE1234F"
                    className="mt-1 bg-white border-gray-300 text-gray-900 focus:border-[#E23744] h-11 font-mono uppercase"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-700">Name on PAN Card *</Label>
                  <Input
                    value={form.panName || form.holder || form.ownerName}
                    onChange={(e) => updateField("panName", e.target.value)}
                    placeholder="Owner or Business Legal Name"
                    className="mt-1 bg-white border-gray-300 text-gray-900 focus:border-[#E23744] h-11"
                  />
                </div>
              </div>

              {/* Document Upload Pointers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <label className="flex items-center gap-3 rounded-2xl border border-dashed border-gray-300 p-3 bg-gray-50/50 hover:bg-gray-100/50 transition cursor-pointer">
                  <FileText className="size-5 text-[#E23744] shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-gray-800">Attach FSSAI Certificate</div>
                    <div className="text-[10px] text-gray-500 truncate">
                      {form.fssaiDocName || "Upload Photo / PDF (Optional)"}
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) updateField("fssaiDocName", file.name);
                    }}
                  />
                </label>

                <label className="flex items-center gap-3 rounded-2xl border border-dashed border-gray-300 p-3 bg-gray-50/50 hover:bg-gray-100/50 transition cursor-pointer">
                  <FileText className="size-5 text-blue-600 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-gray-800">Attach PAN Card Copy</div>
                    <div className="text-[10px] text-gray-500 truncate">
                      {form.panDocName || "Upload Photo / PDF (Optional)"}
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) updateField("panDocName", file.name);
                    }}
                  />
                </label>
              </div>

              {/* GST OPTIONAL SECTION */}
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 space-y-3">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hasGst}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setHasGst(checked);
                      if (!checked) updateField("gstin", "");
                    }}
                    className="mt-0.5 size-4 rounded border-gray-300 text-[#E23744] focus:ring-[#E23744]"
                  />
                  <div>
                    <div className="text-xs font-bold text-gray-900">
                      My restaurant is GST registered (Have a 15-digit GSTIN)
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      Untick if your turnover is under ₹20 Lakhs — onboarding proceeds automatically without GST.
                    </div>
                  </div>
                </label>

                {hasGst ? (
                  <div className="pt-2">
                    <Label className="text-xs font-semibold text-gray-700">15-Character Business GSTIN *</Label>
                    <Input
                      maxLength={15}
                      value={form.gstin}
                      onChange={(e) => updateField("gstin", e.target.value.toUpperCase().slice(0, 15))}
                      placeholder="18AABCU9603R1ZM"
                      className="mt-1 bg-white border-gray-300 text-gray-900 focus:border-[#E23744] h-11 font-mono uppercase"
                    />
                  </div>
                ) : (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                    <span>
                      Automatic Non-GST Onboarding Active — Platform remits 5% restaurant GST under Section 9(5) CGST; no GSTIN required.
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-4 flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 h-11 px-6 rounded-xl font-semibold cursor-pointer"
                >
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    if (validateStep2()) setStep(3);
                  }}
                  className="bg-[#E23744] hover:bg-[#d32f2f] text-white font-bold px-8 h-12 rounded-xl flex items-center gap-2 shadow-md shadow-red-500/20 cursor-pointer"
                >
                  <span>Continue to Step 3</span>
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: BANK DETAILS & STATUTORY AGREEMENT */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-3">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Banknote className="size-5 text-[#E23744]" />
                  <span>Step 3: Settlement Bank Account for Daily Payouts</span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Enter your settlement bank account details for automated daily T+1 IMPS/NEFT transfers.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold text-gray-700">Account Holder Legal Name *</Label>
                  <Input
                    value={form.holder || form.panName || form.ownerName}
                    onChange={(e) => updateField("holder", e.target.value)}
                    placeholder="Matches PAN card name"
                    className="mt-1 bg-white border-gray-300 text-gray-900 focus:border-[#E23744] h-11"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-700">Bank Name</Label>
                  <Input
                    value={form.bankName}
                    onChange={(e) => updateField("bankName", e.target.value)}
                    placeholder="State Bank of India / HDFC Bank / ICICI"
                    className="mt-1 bg-white border-gray-300 text-gray-900 focus:border-[#E23744] h-11"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-700">Bank Account Number *</Label>
                  <Input
                    value={form.bankAccount}
                    onChange={(e) => updateField("bankAccount", e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter Bank Account Number"
                    className="mt-1 bg-white border-gray-300 text-gray-900 focus:border-[#E23744] h-11 font-mono"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-700">Confirm Bank Account Number *</Label>
                  <Input
                    value={form.confirmBankAccount}
                    onChange={(e) => updateField("confirmBankAccount", e.target.value.replace(/\D/g, ""))}
                    placeholder="Re-enter Bank Account Number"
                    className="mt-1 bg-white border-gray-300 text-gray-900 focus:border-[#E23744] h-11 font-mono"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-700">11-Character Bank IFSC Code *</Label>
                  <Input
                    maxLength={11}
                    value={form.bankIfsc}
                    onChange={(e) => updateField("bankIfsc", e.target.value.toUpperCase().slice(0, 11))}
                    placeholder="SBIN0001234"
                    className="mt-1 bg-white border-gray-300 text-gray-900 focus:border-[#E23744] h-11 font-mono uppercase"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-700">Account Type</Label>
                  <select
                    value={form.accountType}
                    onChange={(e) => updateField("accountType", e.target.value)}
                    className="mt-1 w-full h-11 rounded-md bg-white border border-gray-300 px-3 text-xs sm:text-sm text-gray-900 focus:border-[#E23744] focus:outline-none"
                  >
                    <option value="CURRENT">Current Account (Recommended for Business)</option>
                    <option value="SAVINGS">Savings Account</option>
                  </select>
                </div>
              </div>

              {/* Bank Proof Attachment */}
              <label className="flex items-center gap-3 rounded-2xl border border-dashed border-gray-300 p-3 bg-gray-50/50 hover:bg-gray-100/50 transition cursor-pointer">
                <FileText className="size-5 text-emerald-600 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-xs text-gray-800">Attach Cancelled Cheque / Bank Passbook</div>
                  <div className="text-[10px] text-gray-500 truncate">
                    {form.bankDocName || "Upload Photo / PDF (Optional proof for instant verification)"}
                  </div>
                </div>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) updateField("bankDocName", file.name);
                  }}
                />
              </label>

              {/* Statutory Partner Agreement Clickwrap */}
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 space-y-3 text-xs text-gray-700">
                <div className="font-bold text-gray-900 flex items-center gap-2">
                  <ShieldCheck className="size-4 text-emerald-600" />
                  <span>OrderKing Restaurant Partner Terms &amp; Compliance Covenants</span>
                </div>
                <ul className="space-y-1.5 text-[11px] text-gray-600 list-disc pl-4">
                  <li>
                    <strong className="text-gray-900">0% Merchant Dine-In Commission:</strong> No commission charged on direct dine-in orders or advance table holds.
                  </li>
                  <li>
                    <strong className="text-gray-900">Delivery Logistics:</strong> Transparent 12% logistics &amp; payment gateway processing on completed delivery orders.
                  </li>
                  <li>
                    <strong className="text-gray-900">Daily Payouts:</strong> Automated T+1 settlement cycles transferred directly to your verified bank account via IMPS/NEFT.
                  </li>
                  <li>
                    <strong className="text-gray-900">Section 9(5) CGST Compliance:</strong> OrderKing directly remits 5% restaurant GST to the government under GSTIN 18AFXPH9838M1Z9 (Assam - 788710).
                  </li>
                </ul>

                <label className="flex items-start gap-3 pt-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-0.5 size-4 rounded border-gray-300 text-[#E23744] focus:ring-[#E23744]"
                  />
                  <span className="text-xs text-gray-800 font-medium leading-relaxed">
                    I confirm that the FSSAI license, PAN card, outlet address, and settlement bank account details above are accurate and accept the OrderKing Restaurant Partner Agreement.
                  </span>
                </label>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 h-11 px-6 rounded-xl font-semibold cursor-pointer"
                >
                  Back
                </Button>
                <Button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleCompleteOnboarding()}
                  className="bg-[#E23744] hover:bg-[#d32f2f] text-white font-bold px-8 h-12 rounded-xl flex items-center gap-2 shadow-lg shadow-red-500/25 cursor-pointer"
                >
                  {busy ? <RefreshCw className="size-4 animate-spin" /> : <ShieldCheck className="size-5" />}
                  <span>{busy ? "Activating Restaurant..." : "Complete Registration & Go Live"}</span>
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </VendorShell>
  );
}
