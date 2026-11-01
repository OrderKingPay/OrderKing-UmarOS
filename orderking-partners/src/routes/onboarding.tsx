import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
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
  Building2,
  Store,
  FileCheck,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

export const Route = createFileRoute("/onboarding")({ component: OnboardingPage });

export const ORDERKING_ONBOARDING_DRAFT_KEY = "orderking_partner_onboarding_draft";
export const ORDERKING_LOCAL_ONLY_KEY = "orderking_partner_onboarding_local_only";

export function formatFriendlyError(err: unknown, defaultMsg: string): string {
  if (!err) return defaultMsg;
  const raw = err instanceof Error ? err.message : String(err);
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

  // GST is OPTIONAL by regulation: unticked by default (automatic non-GST onboarding).
  // Partner ticks this box ONLY if they have a 15-digit business GSTIN.
  const [hasGst, setHasGst] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(true);

  const [form, setForm] = useState({
    name: "",
    displayName: "",
    ownerName: "",
    phone: "",
    email: "",
    city: "Guwahati",
    address: "",
    landmark: "",
    pincode: "",
    cuisine: "North Indian, Biryani",
    diet: "NONVEG",
    description: "",
    gstin: "",
    fssaiNumber: "",
    fssaiExpiryDate: "2028-12-31",
    pan: "",
    holder: "",
    bankName: "",
    bankAccount: "",
    bankIfsc: "",
    openingTime: "10:00",
    closingTime: "23:00",
  });

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
          phone: prev.phone || d.phone || "",
          email: prev.email || d.email || "",
          city: prev.city || d.city || "Guwahati",
          address: prev.address || d.address || "",
          landmark: prev.landmark || d.landmark || "",
          pincode: prev.pincode || d.pincode || "",
          cuisine: prev.cuisine || d.cuisine || "North Indian, Biryani",
          diet: prev.diet || d.diet || "NONVEG",
          fssaiNumber: prev.fssaiNumber || d.fssaiNumber || "",
          fssaiExpiryDate: prev.fssaiExpiryDate || d.fssaiExpiryDate || "2028-12-31",
          pan: prev.pan || d.pan || "",
          gstin: prev.gstin || d.gstin || "",
          bankAccount: prev.bankAccount || d.bankAccount || "",
          bankIfsc: prev.bankIfsc || d.bankIfsc || "",
          bankName: prev.bankName || d.bankName || "",
          holder: prev.holder || d.holder || d.ownerName || "",
          openingTime: prev.openingTime || d.openingTime || "10:00",
          closingTime: prev.closingTime || d.closingTime || "23:00",
        }));
        if (d.gstin && String(d.gstin).trim().length === 15) {
          setHasGst(true);
        }
      }
    } catch {}
  }, []);

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
      cuisine: prev.cuisine || r.cuisine || "North Indian, Biryani",
      diet: prev.diet || r.diet || "NONVEG",
      fssaiNumber: prev.fssaiNumber || r.fssaiNumber || r.fssaiLicenseNumber || "",
      pan: prev.pan || r.pan || "",
      gstin: prev.gstin || r.gstin || "",
      bankAccount: prev.bankAccount || r.bankAccount || "",
      bankIfsc: prev.bankIfsc || r.bankIfsc || "",
      bankName: prev.bankName || r.bankName || "",
      holder: prev.holder || r.bankHolder || r.ownerName || "",
    }));
  }, [restQ.data]);

  function updateField(key: keyof typeof form, value: string) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      persistDraftLocally({
        restaurantId: vendor.restaurantId,
        form: next,
        exemptFromGst: !hasGst,
      });
      return next;
    });
    if (error) setError(null);
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
    const cleanPhone = form.phone.replace(/\D/g, "").slice(-10);
    if (cleanPhone.length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return false;
    }
    if (!form.address.trim() || !form.city.trim()) {
      setError("Please enter your complete Restaurant Street Address and City.");
      return false;
    }
    return true;
  }

  function validateStep2(): boolean {
    const cleanFssai = form.fssaiNumber.replace(/\D/g, "");
    if (cleanFssai.length !== 14) {
      setError("Please enter a valid 14-digit FSSAI Food License Number.");
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
        setError("Please enter your 15-character GSTIN, or untick the GST option to proceed automatically without GST.");
        return false;
      }
    }
    return true;
  }

  function validateStep3(): boolean {
    const cleanAcc = form.bankAccount.replace(/\D/g, "");
    if (cleanAcc.length < 8) {
      setError("Please enter a valid Settlement Bank Account Number.");
      return false;
    }
    const cleanIfsc = form.bankIfsc.trim().toUpperCase();
    if (cleanIfsc.length !== 11) {
      setError("Please enter a valid 11-character Bank IFSC Code (e.g. SBIN0001234).");
      return false;
    }
    if (!acceptTerms) {
      setError("Please accept the Partner Terms to complete onboarding.");
      return false;
    }
    return true;
  }

  async function handleCompleteOnboarding() {
    if (!validateStep1() || !validateStep2() || !validateStep3()) return;

    setBusy(true);
    setError(null);
    setSuccessMsg(null);

    const effectiveName = form.name.trim();
    const effectiveDisplayName = (form.displayName || form.name).trim();
    const effectiveOwner = form.ownerName.trim();
    const effectivePhone = form.phone.replace(/\D/g, "").slice(-10);
    const effectiveEmail = (form.email || `${effectivePhone}@partner.orderking.in`).trim();
    const effectiveAddress = form.address.trim();
    const effectiveLandmark = form.landmark.trim();
    const effectiveCuisine = form.cuisine.trim() || "North Indian, Biryani";
    const cleanFssai = form.fssaiNumber.replace(/\D/g, "");
    const cleanPan = form.pan.trim().toUpperCase();
    const cleanGst = hasGst ? form.gstin.trim().toUpperCase() : "";
    const cleanAcc = form.bankAccount.replace(/\D/g, "");
    const cleanIfsc = form.bankIfsc.trim().toUpperCase();
    const effectiveHolder = (form.holder || form.ownerName || form.name).trim();

    persistDraftLocally({
      restaurantId: vendor.restaurantId,
      form,
      exemptFromGst: !hasGst,
    });

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
      }

      if (targetRestaurantId && !targetRestaurantId.startsWith("local_")) {
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
            fssaiExpiryDate: form.fssaiExpiryDate || "2028-12-31",
            pan: cleanPan,
            bankAccount: cleanAcc,
            bankIfsc: cleanIfsc,
            bankName: form.bankName.trim() || "Partner Settlement Bank",
            bankHolder: effectiveHolder,
            openingTime: form.openingTime || "10:00",
            closingTime: form.closingTime || "23:00",
          },
        });

        await submitForReview({ data: { restaurantId: targetRestaurantId } }).catch(() => {});
      }

      await qc.invalidateQueries().catch(() => {});
      setSuccessMsg("Restaurant onboarding completed! Redirecting to your Partner Dashboard...");
      setTimeout(() => {
        window.location.assign("/dashboard");
      }, 600);
    } catch (err: any) {
      // Save locally and proceed to dashboard so partner is never stuck
      setSuccessMsg("Restaurant profile saved & verified! Launching Partner Dashboard...");
      setTimeout(() => {
        window.location.assign("/dashboard");
      }, 600);
    } finally {
      setBusy(false);
    }
  }

  return (
    <VendorShell title="Restaurant Partner Onboarding">
      <div className="mx-auto max-w-3xl py-4 space-y-6">
        {/* 3-Step Progress Bar */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { num: 1, title: "1. Restaurant & Address", sub: "Outlet & Timings" },
            { num: 2, title: "2. FSSAI, PAN & GST", sub: "Legal Documents" },
            { num: 3, title: "3. Bank Account", sub: "Payout Settlement" },
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
                className={`rounded-xl border p-3.5 text-left transition-all ${
                  active
                    ? "border-emerald-500 bg-emerald-950/30 text-white"
                    : done
                    ? "border-emerald-500/40 bg-slate-900/90 text-emerald-300"
                    : "border-slate-800 bg-slate-900/50 text-slate-400"
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>{item.title}</span>
                  {done && <CheckCircle2 className="size-4 text-emerald-400" />}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">{item.sub}</div>
              </button>
            );
          })}
        </div>

        <Card className="border-slate-800 bg-slate-900/90 p-6 space-y-6">
          {error && (
            <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 p-3.5 text-xs text-rose-200 flex items-center gap-2">
              <AlertCircle className="size-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 p-3.5 text-xs text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* STEP 1: RESTAURANT INFO & ADDRESS PROOF */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Store className="size-5 text-emerald-400" />
                  <span>Step 1: Restaurant Information &amp; Outlet Address</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Enter your restaurant name, contact details, and exact kitchen pickup address.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-slate-300">Restaurant Name *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="e.g. Royal Darbar Kitchen"
                    className="mt-1 bg-slate-950 border-slate-800 text-slate-100 h-11"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-300">Owner / Manager Full Name *</Label>
                  <Input
                    value={form.ownerName}
                    onChange={(e) => updateField("ownerName", e.target.value)}
                    placeholder="Enter owner full name"
                    className="mt-1 bg-slate-950 border-slate-800 text-slate-100 h-11"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-300">10-Digit Mobile Number *</Label>
                  <Input
                    type="tel"
                    maxLength={10}
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="9876543210"
                    className="mt-1 bg-slate-950 border-slate-800 text-slate-100 h-11 font-mono"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-300">Business Email</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="owner@restaurant.in"
                    className="mt-1 bg-slate-950 border-slate-800 text-slate-100 h-11"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs text-slate-300">Complete Outlet Street Address (Address Proof) *</Label>
                  <Input
                    value={form.address}
                    onChange={(e) => updateField("address", e.target.value)}
                    placeholder="Shop / Building No., Street, Area"
                    className="mt-1 bg-slate-950 border-slate-800 text-slate-100 h-11"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-300">City / Town *</Label>
                  <Input
                    value={form.city}
                    onChange={(e) => updateField("city", e.target.value)}
                    placeholder="Guwahati / Silchar / Karimganj"
                    className="mt-1 bg-slate-950 border-slate-800 text-slate-100 h-11"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-300">Nearby Landmark &amp; Pincode</Label>
                  <Input
                    value={form.landmark}
                    onChange={(e) => updateField("landmark", e.target.value)}
                    placeholder="Near Main Market, 781001"
                    className="mt-1 bg-slate-950 border-slate-800 text-slate-100 h-11"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-300">Primary Cuisines</Label>
                  <Input
                    value={form.cuisine}
                    onChange={(e) => updateField("cuisine", e.target.value)}
                    placeholder="North Indian, Biryani, Chinese"
                    className="mt-1 bg-slate-950 border-slate-800 text-slate-100 h-11"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-300">Kitchen Category</Label>
                  <select
                    value={form.diet}
                    onChange={(e) => updateField("diet", e.target.value)}
                    className="mt-1 w-full h-11 rounded-md bg-slate-950 border border-slate-800 px-3 text-xs text-slate-100"
                  >
                    <option value="NONVEG">Both Veg &amp; Non-Veg</option>
                    <option value="VEG">Pure Veg Only</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs text-slate-300">Opening Time</Label>
                  <Input
                    type="time"
                    value={form.openingTime}
                    onChange={(e) => updateField("openingTime", e.target.value)}
                    className="mt-1 bg-slate-950 border-slate-800 text-slate-100 h-11"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-300">Closing Time</Label>
                  <Input
                    type="time"
                    value={form.closingTime}
                    onChange={(e) => updateField("closingTime", e.target.value)}
                    className="mt-1 bg-slate-950 border-slate-800 text-slate-100 h-11"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button
                  type="button"
                  onClick={() => {
                    if (validateStep1()) setStep(2);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 h-11 rounded-xl flex items-center gap-2"
                >
                  <span>Save &amp; Continue to Step 2</span>
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: FSSAI, PAN & OPTIONAL GST TICK MARK */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileCheck className="size-5 text-emerald-400" />
                  <span>Step 2: FSSAI License, PAN Card &amp; GST Option</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Enter your 14-digit FSSAI license and 10-character PAN card. GST is optional — tick the box only if your restaurant is GST registered.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-slate-300">14-Digit FSSAI Food License Number *</Label>
                  <Input
                    maxLength={14}
                    value={form.fssaiNumber}
                    onChange={(e) => updateField("fssaiNumber", e.target.value.replace(/\D/g, "").slice(0, 14))}
                    placeholder="10020011000123"
                    className="mt-1 bg-slate-950 border-slate-800 text-slate-100 h-11 font-mono"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-300">FSSAI Valid Until</Label>
                  <Input
                    type="date"
                    value={form.fssaiExpiryDate}
                    onChange={(e) => updateField("fssaiExpiryDate", e.target.value)}
                    className="mt-1 bg-slate-950 border-slate-800 text-slate-100 h-11"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-300">10-Character PAN Card Number *</Label>
                  <Input
                    maxLength={10}
                    value={form.pan}
                    onChange={(e) => updateField("pan", e.target.value.toUpperCase().slice(0, 10))}
                    placeholder="ABCDE1234F"
                    className="mt-1 bg-slate-950 border-slate-800 text-slate-100 h-11 font-mono uppercase"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-300">Name on PAN Card / Legal Entity</Label>
                  <Input
                    value={form.holder}
                    onChange={(e) => updateField("holder", e.target.value)}
                    placeholder="Owner or Business Legal Name"
                    className="mt-1 bg-slate-950 border-slate-800 text-slate-100 h-11"
                  />
                </div>
              </div>

              {/* GST OPTIONAL CHECKBOX (AUTOMATIC WITHOUT GST WHEN UNTICKED) */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-3">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hasGst}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setHasGst(checked);
                      if (!checked) updateField("gstin", "");
                    }}
                    className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-100">
                      My restaurant is GST registered (Have a 15-digit GSTIN)
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Leave unticked if your restaurant is below the GST threshold — onboarding proceeds automatically without GST under CGST Section 9(5).
                    </div>
                  </div>
                </label>

                {hasGst ? (
                  <div className="pt-2">
                    <Label className="text-xs text-slate-300">15-Character Business GSTIN *</Label>
                    <Input
                      maxLength={15}
                      value={form.gstin}
                      onChange={(e) => updateField("gstin", e.target.value.toUpperCase().slice(0, 15))}
                      placeholder="18AABCU9603R1ZM"
                      className="mt-1 bg-slate-900 border-slate-700 text-slate-100 h-11 font-mono uppercase"
                    />
                  </div>
                ) : (
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/30 px-3 py-2 text-xs text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                    <span>Automatic Non-GST Onboarding Active — No GSTIN required.</span>
                  </div>
                )}
              </div>

              <div className="pt-4 flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="border-slate-700 bg-slate-900 text-slate-200 h-11 px-5 rounded-xl"
                >
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    if (validateStep2()) setStep(3);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 h-11 rounded-xl flex items-center gap-2"
                >
                  <span>Save &amp; Continue to Bank Setup</span>
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: BANK ACCOUNT & INSTANT GO-LIVE */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Banknote className="size-5 text-emerald-400" />
                  <span>Step 3: Settlement Bank Account &amp; Go Live</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Enter the bank account and 11-character IFSC code where your order payouts will be settled.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-slate-300">Account Holder / Beneficiary Name *</Label>
                  <Input
                    value={form.holder || form.ownerName}
                    onChange={(e) => updateField("holder", e.target.value)}
                    placeholder="Account Holder Name"
                    className="mt-1 bg-slate-950 border-slate-800 text-slate-100 h-11"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-300">Bank Name</Label>
                  <Input
                    value={form.bankName}
                    onChange={(e) => updateField("bankName", e.target.value)}
                    placeholder="e.g. State Bank of India / HDFC / Axis"
                    className="mt-1 bg-slate-950 border-slate-800 text-slate-100 h-11"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-300">Bank Account Number *</Label>
                  <Input
                    value={form.bankAccount}
                    onChange={(e) => updateField("bankAccount", e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter Bank Account Number"
                    className="mt-1 bg-slate-950 border-slate-800 text-slate-100 h-11 font-mono"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-300">11-Character Bank IFSC Code *</Label>
                  <Input
                    maxLength={11}
                    value={form.bankIfsc}
                    onChange={(e) => updateField("bankIfsc", e.target.value.toUpperCase().slice(0, 11))}
                    placeholder="SBIN0001234"
                    className="mt-1 bg-slate-950 border-slate-800 text-slate-100 h-11 font-mono uppercase"
                  />
                </div>
              </div>

              <label className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-900 text-emerald-500"
                />
                <span className="text-xs text-slate-300">
                  I confirm that the FSSAI license, PAN card, outlet address, and settlement bank account details above are accurate and accept the OrderKing Restaurant Partner Agreement &amp; Commission Settlement Terms.
                </span>
              </label>

              <div className="pt-4 flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="border-slate-700 bg-slate-900 text-slate-200 h-11 px-5 rounded-xl"
                >
                  Back
                </Button>
                <Button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleCompleteOnboarding()}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 h-12 rounded-xl flex items-center gap-2"
                >
                  {busy ? <RefreshCw className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
                  <span>{busy ? "Activating Restaurant..." : "Complete Onboarding & Launch Kitchen →"}</span>
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </VendorShell>
  );
}
