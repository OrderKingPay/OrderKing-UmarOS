import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { VendorShell } from "@/components/vendor-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { useVendor } from "@/components/use-vendor";
import { useClientState } from "@/lib/client-state";
import {
  createRestaurantDraft,
  getRestaurant,
  submitForReview,
  updateRestaurantProfile,
  uploadDocument,
} from "@/lib/server/api-bootstrap";
import {
  validateFssai,
  validateGstin,
  validateIfsc,
  validatePan,
  validateStation5CommercialContract,
  calculateFssaiExpiry,
} from "@/lib/merchant-kyc";
import {
  ONBOARDING_FEE_CONFIG,
  getOnboardingFeeDetails,
  type OnboardingFeeOption,
} from "@/lib/money";
import {
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Banknote,
  Building2,
  ChefHat,
  ArrowUpRight,
  FileText,
  Store,
  Edit3,
  Check,
  BadgeCheck,
  AlertCircle,
  RefreshCw,
  Clock,
  MapPin,
  CreditCard,
} from "lucide-react";

export const Route = createFileRoute("/onboarding")({ component: OnboardingPage });

export const ORDERKING_ONBOARDING_DRAFT_KEY = "orderking_partner_onboarding_draft";
export const ORDERKING_LOCAL_ONLY_KEY = "orderking_partner_onboarding_local_only";

export function formatFriendlyError(err: unknown, defaultMsg: string): string {
  if (!err) return defaultMsg;
  const raw = err instanceof Error ? err.message : String(err);
  if (/invalid url/i.test(raw)) {
    return "Server connection is initializing or service URL is unreachable. Your restaurant draft has been safely saved locally in your browser so you can continue.";
  }
  if (/failed to fetch|networkerror|load failed/i.test(raw)) {
    return "Network connection issue. Your draft has been safely saved locally and will sync when reconnected.";
  }
  if (/unauthorized/i.test(raw)) {
    return "Session requires verification. Your draft is preserved locally. Please sign in or refresh.";
  }
  if (/forbidden/i.test(raw)) {
    return "Draft sync is pending with the server. Your changes are safely preserved locally.";
  }
  return raw || defaultMsg;
}

export function persistDraftLocally(data: {
  restaurantId?: string | null;
  form: {
    name: string;
    displayName: string;
    ownerName: string;
    phone: string;
    email: string;
    city: string;
    address: string;
    landmark: string;
    cuisine: string;
    diet: string;
    description: string;
    gstin: string;
    fssaiNumber: string;
    fssaiExpiryDate: string;
    pan: string;
    holder: string;
    bankName: string;
    bankAccount: string;
    bankIfsc: string;
    openingTime?: string;
    closingTime?: string;
    dishName?: string;
    dishDiet?: string;
    dishPrice?: string;
  };
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
      restaurantId: data.restaurantId || null,
      name: data.form.name,
      displayName: data.form.displayName,
      ownerName: data.form.ownerName,
      phone: data.form.phone,
      email: data.form.email,
      city: data.form.city,
      address: data.form.address,
      landmark: data.form.landmark,
      cuisine: data.form.cuisine,
      diet: data.form.diet,
      description: data.form.description,
      gstin: data.form.gstin,
      fssaiNumber: data.form.fssaiNumber,
      fssaiExpiryDate: data.form.fssaiExpiryDate,
      pan: data.form.pan,
      holder: data.form.holder,
      bankName: data.form.bankName,
      bankAccount: data.form.bankAccount,
      bankIfsc: data.form.bankIfsc,
      openingTime: data.form.openingTime || "10:00",
      closingTime: data.form.closingTime || "23:00",
      dishName: data.form.dishName || "",
      dishDiet: data.form.dishDiet || "NONVEG",
      dishPrice: data.form.dishPrice || "",
      exemptFromGst: Boolean(data.exemptFromGst),
      onboardingFeeOption: data.onboardingFeeOption || "AMORTIZED",
      amortizedConsent: data.amortizedConsent !== false,
      executionMethod: data.executionMethod || "CLICKWRAP",
      clickwrapSignatoryName: data.clickwrapSignatoryName || data.form.ownerName || data.form.name,
      clickwrapDesignation: data.clickwrapDesignation || "Sole Proprietor / Authorized Signatory",
      clickwrapConsent: data.clickwrapConsent !== false,
      covenantsAccepted: data.covenantsAccepted !== false,
      foodSafetyUndertakingAccepted: data.foodSafetyUndertakingAccepted !== false,
      privacyAndTaxAccepted: data.privacyAndTaxAccepted !== false,
      savedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(ORDERKING_ONBOARDING_DRAFT_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn("[Onboarding] Could not persist draft to localStorage:", err);
  }
}

function OnboardingPage() {
  const qc = useQueryClient();
  const vendor = useVendor();

  const isRealServerRestaurant = Boolean(
    vendor.restaurantId && !vendor.restaurantId.startsWith("local_")
  );

  const restQ = useQuery({
    queryKey: ["restaurant", vendor.restaurantId],
    queryFn: () => getRestaurant({ data: { restaurantId: vendor.restaurantId } }),
    enabled: isRealServerRestaurant,
  });

  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [editingApproved, setEditingApproved] = useState(false);

  const [form, setForm] = useState({
    name: "",
    displayName: "",
    ownerName: "",
    phone: "",
    email: "",
    city: "",
    address: "",
    landmark: "",
    cuisine: "North Indian, Biryani",
    diet: "NONVEG",
    description: "",
    gstin: "",
    fssaiNumber: "",
    fssaiExpiryDate: "",
    pan: "",
    holder: "",
    bankName: "",
    bankAccount: "",
    confirmBankAccount: "",
    bankIfsc: "",
    openingTime: "10:00",
    closingTime: "23:00",
    dishName: "",
    dishDiet: "NONVEG",
    dishPrice: "",
  });

  const [exemptFromGst, setExemptFromGst] = useState(false);
  const [partnerTermsAccepted, setPartnerTermsAccepted] = useState(true);

  // Auto-hydrate draft
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
          city: prev.city || d.city || "",
          address: prev.address || d.address || "",
          landmark: prev.landmark || d.landmark || "",
          cuisine: prev.cuisine || d.cuisine || "North Indian, Biryani",
          diet: prev.diet || d.diet || "NONVEG",
          description: prev.description || d.description || "",
          fssaiNumber: prev.fssaiNumber || d.fssaiNumber || "",
          fssaiExpiryDate: prev.fssaiExpiryDate || d.fssaiExpiryDate || "",
          pan: prev.pan || d.pan || "",
          gstin: prev.gstin || d.gstin || "",
          bankAccount: prev.bankAccount || d.bankAccount || "",
          confirmBankAccount: prev.confirmBankAccount || d.bankAccount || "",
          bankIfsc: prev.bankIfsc || d.bankIfsc || "",
          bankName: prev.bankName || d.bankName || "",
          holder: prev.holder || d.holder || d.ownerName || "",
          openingTime: prev.openingTime || d.openingTime || "10:00",
          closingTime: prev.closingTime || d.closingTime || "23:00",
          dishName: prev.dishName || d.dishName || "",
          dishDiet: d.dishDiet || prev.dishDiet || "NONVEG",
          dishPrice: prev.dishPrice || d.dishPrice || "",
        }));
        if (d.exemptFromGst !== undefined) {
          setExemptFromGst(Boolean(d.exemptFromGst));
        }
        if (d.restaurantId && !vendor.restaurantId) {
          useClientState.getState().setRestaurantId(d.restaurantId);
        }
      }
    } catch {
      // ignore
    }
  }, [vendor.restaurantId]);

  const r = restQ.data?.restaurant as Record<string, unknown> | undefined;
  const effectiveOwner = (form.ownerName || form.holder || String(r?.owner_name ?? "")).trim();
  const effectiveSignatory = (effectiveOwner || form.displayName || form.name || "Authorized Signatory").trim();

  const isLocalDraft = Boolean(
    typeof window !== "undefined" &&
    (window.localStorage.getItem(ORDERKING_LOCAL_ONLY_KEY) === "true" ||
      (vendor.restaurantId && vendor.restaurantId.startsWith("local_")))
  );

  const verificationStatus = ((r?.verification_status ?? r?.verificationStatus ?? "DRAFT") as string).toUpperCase();
  const isApproved = verificationStatus === "APPROVED" || verificationStatus === "ACTIVE";
  const isSubmitted =
    verificationStatus === "PENDING" ||
    verificationStatus === "PENDING_APPROVAL" ||
    verificationStatus === "PENDING_VERIFICATION" ||
    verificationStatus === "UNDER_REVIEW";

  async function handleSaveAndRegister(submitReviewAfterSave = false, silent = false) {
    if (!silent) {
      setError(null);
      setSuccessMsg(null);
    }

    const effectiveName = (form.name || String(r?.name ?? "")).trim();
    const effectiveDisplayName = (form.displayName || effectiveName || String(r?.display_name ?? "")).trim();
    const effectivePhone = (form.phone || String(r?.phone ?? "")).trim();
    const effectiveEmail = (form.email || String(r?.email ?? "")).trim();
    const effectiveAddress = (form.address || String(r?.address ?? "")).trim();
    const effectiveLandmark = (form.landmark || String(r?.landmark ?? "")).trim();
    const effectiveCuisine = (form.cuisine || String(r?.cuisine ?? "")).trim();
    const effectiveDescription = (form.description || String(r?.description ?? "")).trim();
    const fssai = (form.fssaiNumber || String(r?.fssai_number ?? "")).trim().replace(/D/g, "");
    const fssaiExpiry = (form.fssaiExpiryDate || String(r?.fssai_expiry_date ?? "")).trim();
    const pan = (form.pan || String(r?.pan ?? "")).trim().toUpperCase();
    const gstin = (form.gstin || String(r?.gstin ?? "")).trim().toUpperCase();
    const bankAccount = (form.bankAccount || String(r?.bank_account ?? "")).trim();
    const ifsc = (form.bankIfsc || String(r?.bank_ifsc ?? "")).trim().toUpperCase();
    const bankName = (form.bankName || String(r?.bank_name ?? "")).trim();

    if (!effectiveName) {
      setError("Please enter your restaurant legal or trade name.");
      setActiveStep(1);
      return;
    }
    if (!effectivePhone) {
      setError("Please enter a valid kitchen contact mobile number.");
      setActiveStep(1);
      return;
    }
    if (!effectiveAddress) {
      setError("Please enter the complete physical kitchen address with PIN code.");
      setActiveStep(1);
      return;
    }

    if (submitReviewAfterSave) {
      if (!fssaiExpiry) {
        setError("Enter the actual FSSAI certificate expiry before submitting for review.");
        setActiveStep(3);
        return;
      }
      if (!validateFssai(fssai)) {
        setError("Partner Verification: A valid 14-digit FSSAI registration number is required to receive online orders.");
        setActiveStep(3);
        return;
      }
      const expRes = calculateFssaiExpiry(fssaiExpiry);
      if (expRes.isExpired) {
        setError("Partner Verification: Your FSSAI license appears expired. Please provide an active license or renewal acknowledgment.");
        setActiveStep(3);
        return;
      }
      if (!validatePan(pan)) {
        setError("Partner Verification: A valid 10-character PAN is required for automated payouts.");
        setActiveStep(3);
        return;
      }
      if (!validateIfsc(ifsc) || !bankAccount) {
        setError(
          "Partner Verification: A valid settlement bank account number and 11-character IFSC code are required for automated payouts."
        );
        setActiveStep(4);
        return;
      }
      if (!partnerTermsAccepted) {
        setError("Please accept the OrderKing Restaurant Partner Terms & Food Safety Declaration.");
        setActiveStep(5);
        return;
      }
    }

    setBusy(true);
    try {
      persistDraftLocally({
        restaurantId: vendor.restaurantId,
        form: {
          ...form,
          name: effectiveName,
          displayName: effectiveDisplayName,
          ownerName: effectiveOwner,
          phone: effectivePhone,
          email: effectiveEmail,
          city: form.city,
          address: effectiveAddress,
          landmark: effectiveLandmark,
          cuisine: effectiveCuisine,
          diet: form.diet,
          description: effectiveDescription,
          fssaiNumber: fssai,
          fssaiExpiryDate: fssaiExpiry,
          pan,
          gstin: exemptFromGst ? "" : gstin,
          bankAccount,
          bankIfsc: ifsc,
          bankName,
          holder: form.holder || bankName || effectiveOwner,
          openingTime: form.openingTime,
          closingTime: form.closingTime,
          dishName: form.dishName,
          dishDiet: form.dishDiet,
          dishPrice: form.dishPrice,
        },
        exemptFromGst,
        onboardingFeeOption: "AMORTIZED",
        amortizedConsent: true,
        executionMethod: "CLICKWRAP",
        clickwrapSignatoryName: effectiveSignatory,
        clickwrapDesignation: "Sole Proprietor / Authorized Signatory",
        clickwrapConsent: true,
        covenantsAccepted: true,
        foodSafetyUndertakingAccepted: true,
        privacyAndTaxAccepted: true,
      });

      let targetRestaurantId = vendor.restaurantId;

      if (!targetRestaurantId || targetRestaurantId.startsWith("local_")) {
        try {
          const created = await createRestaurantDraft({
            data: {
              name: effectiveName,
              displayName: effectiveDisplayName,
              ownerName: effectiveOwner,
              phone: effectivePhone,
              email: effectiveEmail,
              city: form.city || undefined,
              address: effectiveAddress,
              landmark: effectiveLandmark,
              cuisine: effectiveCuisine,
              diet: form.diet,
              description: effectiveDescription,
            },
          });
          if (created?.restaurantId) {
            targetRestaurantId = created.restaurantId;
            useClientState.getState().setRestaurantId(targetRestaurantId);
            if (typeof window !== "undefined") {
              window.localStorage.removeItem(ORDERKING_LOCAL_ONLY_KEY);
            }
          }
        } catch (createErr) {
          console.warn("[Onboarding] createRestaurantDraft fallback:", createErr);
          if (!targetRestaurantId) {
            targetRestaurantId = `local_rst_${Date.now()}`;
            useClientState.getState().setRestaurantId(targetRestaurantId);
          }
        }
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
            city: form.city || undefined,
            fboName: effectiveOwner || effectiveName,
            address: effectiveAddress,
            landmark: effectiveLandmark,
            cuisine: effectiveCuisine,
            diet: form.diet,
            description: effectiveDescription,
            gstin: exemptFromGst ? "" : (gstin || undefined),
            fssaiNumber: fssai || undefined,
            fssaiLicenseNumber: fssai || undefined,
            fssaiExpiryDate: fssaiExpiry || undefined,
            pan: pan || undefined,
            bankAccount: bankAccount || undefined,
            bankIfsc: ifsc || undefined,
            bankName: bankName || undefined,
            bankHolder: form.holder || bankName || effectiveOwner,
            openingTime: form.openingTime || undefined,
            closingTime: form.closingTime || undefined,
          },
        });

        if (submitReviewAfterSave) {
          await submitForReview({ data: { restaurantId: targetRestaurantId } });
          setSuccessMsg(
            "Restaurant application submitted successfully! Your restaurant profile is created and ready for operations."
          );
          await qc.invalidateQueries({ queryKey: ["restaurant"] });
        } else if (!silent) {
          setSuccessMsg("Restaurant profile details saved successfully.");
        }
      } else {
        if (!silent) {
          setSuccessMsg("Restaurant details saved to local draft.");
        }
      }
    } catch (err) {
      setError(formatFriendlyError(err, "Failed to save restaurant details."));
    } finally {
      setBusy(false);
    }
  }

  // If already onboarded/under review and not editing
  if (vendor.restaurantId && (isApproved || isSubmitted) && !editingApproved) {
    return (
      <VendorShell
        title="Partner Profile"
        dataLabel={vendor.dataLabel}
        restaurantName={vendor.selected?.restaurantName}
      >
        <div className="space-y-5 max-w-4xl mx-auto py-4">
          {successMsg && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block size-2 rounded-full ${
                      isApproved ? "bg-emerald-400" : "bg-amber-400 animate-pulse"
                    }`}
                  />
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    STATUS: {isApproved ? "VERIFIED PARTNER" : "UNDER VERIFICATION REVIEW"}
                  </span>
                </div>
                <h1 className="mt-1 font-display text-2xl font-bold text-white">
                  {(r?.name as string) || vendor.selected?.restaurantName || "Registered Restaurant"}
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  OrderKing Restaurant Partner · FSSAI Food Safety Compliant &amp; CGST §9(5) Tax Remittance Ready
                </p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setEditingApproved(true);
                  setActiveStep(1);
                }}
                className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs shrink-0"
              >
                <Edit3 className="mr-1.5 size-3.5 text-emerald-400" />
                Edit Restaurant Profile
              </Button>
            </div>

            {/* Quick Action Navigation Buttons */}
            <div className="pt-5 flex flex-wrap gap-3">
              <Button asChild size="md" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-950/50">
                <Link to="/kitchen">
                  <ChefHat className="mr-2 size-4" /> Open Kitchen Display (KDS)
                </Link>
              </Button>
              <Button asChild variant="secondary" className="border-slate-800 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl">
                <Link to="/menu">
                  <Store className="mr-2 size-4" /> Manage Digital Menu
                </Link>
              </Button>
              <Button asChild variant="secondary" className="border-slate-800 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl">
                <Link to="/dashboard">
                  <ArrowUpRight className="mr-2 size-4" /> Operations Dashboard
                </Link>
              </Button>
              <Button asChild variant="secondary" className="border-slate-800 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl">
                <Link to="/settlements">
                  <Banknote className="mr-2 size-4" /> Settlement Ledger
                </Link>
              </Button>
            </div>
          </div>

          {/* Partner Information Dossier */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-slate-800 bg-slate-900/60 p-5 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                1. Restaurant Identity &amp; Location
              </span>
              <p className="text-sm font-bold text-white">{(r?.name as string) || form.name}</p>
              <p className="text-xs text-slate-400">{(r?.address as string) || form.address}</p>
              <p className="text-xs text-slate-400">Phone: {(r?.phone as string) || form.phone}</p>
            </Card>

            <Card className="border-slate-800 bg-slate-900/60 p-5 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                2. Statutory Food Safety &amp; Tax
              </span>
              <p className="text-sm font-bold text-emerald-400">
                FSSAI: {(r?.fssai_number as string) || form.fssaiNumber}
              </p>
              <p className="text-xs text-slate-400">
                PAN: {(r?.pan as string) || form.pan}
              </p>
              <p className="text-xs text-slate-400">
                GSTIN: {(r?.gstin as string) || form.gstin || "Exempt (< ₹20L)"}
              </p>
            </Card>

            <Card className="border-slate-800 bg-slate-900/60 p-5 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                3. Direct Bank Settlement
              </span>
              <p className="text-sm font-bold text-white">
                Account: {r?.bank_account ? `•••• ${String(r.bank_account).slice(-4)}` : form.bankAccount ? `•••• ${form.bankAccount.slice(-4)}` : "Recorded"}
              </p>
              <p className="text-xs text-slate-400">
                IFSC: {(r?.bank_ifsc as string) || form.bankIfsc}
              </p>
              <p className="text-xs text-slate-400">
                Holder: {(r?.bank_holder as string) || form.holder || form.ownerName}
              </p>
            </Card>
          </div>
        </div>
      </VendorShell>
    );
  }

  // Active Onboarding Wizard
  return (
    <VendorShell
      title="Restaurant Partner Onboarding"
      dataLabel={vendor.dataLabel}
      restaurantName={vendor.selected?.restaurantName}
    >
      <div className="max-w-3xl mx-auto space-y-6 py-4">
        {/* Step Indicator Header */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  OrderKing Restaurant Partner Platform
                </span>
              </div>
              <h1 className="mt-1 font-display text-xl sm:text-2xl font-bold text-white">
                Register Your Restaurant
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Complete your restaurant profile to receive online delivery orders and automated bank payouts.
              </p>
            </div>
            {editingApproved && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setEditingApproved(false)}
                className="text-xs self-start sm:self-auto"
              >
                Cancel Edit
              </Button>
            )}
          </div>

          {/* Interactive Step Navigator */}
          <div className="flex items-center justify-between gap-1 overflow-x-auto pt-4 text-xs">
            {[
              { num: 1, label: "Restaurant Info" },
              { num: 2, label: "Timings & Menu" },
              { num: 3, label: "FSSAI & PAN" },
              { num: 4, label: "Bank Payouts" },
              { num: 5, label: "Review & Launch" },
            ].map((s) => (
              <button
                key={s.num}
                type="button"
                onClick={() => setActiveStep(s.num as any)}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition shrink-0 ${
                  activeStep === s.num
                    ? "bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 shadow-sm"
                    : activeStep > s.num
                    ? "text-slate-300 hover:text-white"
                    : "text-slate-500 hover:text-slate-400"
                }`}
              >
                <span
                  className={`flex size-5 items-center justify-center rounded-full text-[10px] font-bold ${
                    activeStep === s.num
                      ? "bg-emerald-500 text-black"
                      : activeStep > s.num
                      ? "bg-slate-700 text-slate-200"
                      : "bg-slate-800 text-slate-500"
                  }`}
                >
                  {s.num}
                </span>
                <span className="hidden sm:inline">{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-4 text-xs text-rose-300 flex items-start gap-2.5">
            <AlertCircle className="size-4 shrink-0 mt-0.5 text-rose-400" />
            <div>{error}</div>
          </div>
        )}

        {successMsg && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 text-xs text-emerald-300 flex items-start gap-2.5">
            <CheckCircle2 className="size-4 shrink-0 mt-0.5 text-emerald-400" />
            <div>{successMsg}</div>
          </div>
        )}

        {/* STEP 1: RESTAURANT INFORMATION */}
        {activeStep === 1 && (
          <Card className="border-slate-800 bg-slate-900/90 p-6 sm:p-8 space-y-5 rounded-2xl shadow-xl">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
                <Building2 className="size-5 text-emerald-400" />
                Step 1: Restaurant Information &amp; Address
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Enter your restaurant details as they should appear to customers and on your tax invoice.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field
                label="Restaurant Legal / Trade Name *"
                placeholder="e.g. Royal Biryani House"
                value={form.name}
                onChange={(v) => setForm({ ...form, name: v, displayName: form.displayName || v })}
              />
              <Field
                label="Brand Display Name (shown to customers) *"
                placeholder="e.g. Royal Biryani"
                value={form.displayName}
                onChange={(v) => setForm({ ...form, displayName: v })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field
                label="Owner / Contact Person Full Name *"
                placeholder="e.g. Rajesh Kumar"
                value={form.ownerName}
                onChange={(v) => setForm({ ...form, ownerName: v, holder: form.holder || v })}
              />
              <Field
                label="Kitchen Contact Phone Number *"
                placeholder="e.g. 9876543210"
                value={form.phone}
                onChange={(v) => setForm({ ...form, phone: v })}
              />
              <Field
                label="Official Business Email"
                placeholder="e.g. orders@royalbiryani.in"
                value={form.email}
                onChange={(v) => setForm({ ...form, email: v })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field
                label="City / Region *"
                placeholder="e.g. Bengaluru / Guwahati / Silchar"
                value={form.city}
                onChange={(v) => setForm({ ...form, city: v })}
              />
              <div className="md:col-span-2">
                <Field
                  label="Complete Kitchen Address with PIN Code *"
                  placeholder="e.g. Shop 4, Ground Floor, Station Road, 788710"
                  value={form.address}
                  onChange={(v) => setForm({ ...form, address: v })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field
                label="Nearby Landmark"
                placeholder="e.g. Opposite City Hospital"
                value={form.landmark}
                onChange={(v) => setForm({ ...form, landmark: v })}
              />
              <Field
                label="Primary Cuisines *"
                placeholder="e.g. Biryani, North Indian, Mughlai"
                value={form.cuisine}
                onChange={(v) => setForm({ ...form, cuisine: v })}
              />
              <div>
                <Label className="text-xs text-slate-300">Dietary Classification</Label>
                <select
                  value={form.diet}
                  onChange={(e) => setForm({ ...form, diet: e.target.value })}
                  className="mt-1 block w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none h-10"
                >
                  <option value="NONVEG">Non-Vegetarian &amp; Vegetarian</option>
                  <option value="VEG">Pure Vegetarian Kitchen</option>
                  <option value="PURE_VEG">100% Jain / Pure Vegetarian</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <Button
                onClick={() => {
                  if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
                    setError("Please complete Restaurant Name, Contact Phone, and Kitchen Address.");
                    return;
                  }
                  setError(null);
                  setActiveStep(2);
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl px-6"
              >
                Next: Timings &amp; Starter Menu →
              </Button>
            </div>
          </Card>
        )}

        {/* STEP 2: TIMINGS & STARTER DISH */}
        {activeStep === 2 && (
          <Card className="border-slate-800 bg-slate-900/90 p-6 sm:p-8 space-y-5 rounded-2xl shadow-xl">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
                <Clock className="size-5 text-emerald-400" />
                Step 2: Operating Hours &amp; First Dish
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Configure your daily operational kitchen timings and add your first starter dish.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-slate-300">Daily Opening Time (24h) *</Label>
                <Input
                  type="time"
                  value={form.openingTime}
                  onChange={(e) => setForm({ ...form, openingTime: e.target.value })}
                  className="mt-1 border-slate-800 bg-slate-950 text-slate-100 focus:border-emerald-500 text-xs h-10 rounded-xl"
                />
              </div>
              <div>
                <Label className="text-xs text-slate-300">Daily Closing Time (24h) *</Label>
                <Input
                  type="time"
                  value={form.closingTime}
                  onChange={(e) => setForm({ ...form, closingTime: e.target.value })}
                  className="mt-1 border-slate-800 bg-slate-950 text-slate-100 focus:border-emerald-500 text-xs h-10 rounded-xl"
                />
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block">
                Add Your Signature Starter Dish (Optional)
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Field
                  label="Dish Name"
                  placeholder="e.g. Chicken Dum Biryani"
                  value={form.dishName}
                  onChange={(v) => setForm({ ...form, dishName: v })}
                />
                <Field
                  label="Price in ₹"
                  placeholder="e.g. 249"
                  value={form.dishPrice}
                  onChange={(v) => setForm({ ...form, dishPrice: v.replace(/D/g, "") })}
                />
                <div>
                  <Label className="text-xs text-slate-300">Food Type</Label>
                  <select
                    value={form.dishDiet}
                    onChange={(e) => setForm({ ...form, dishDiet: e.target.value })}
                    className="mt-1 block w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none h-10"
                  >
                    <option value="NONVEG">Non-Veg</option>
                    <option value="VEG">Veg</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-between gap-3">
              <Button
                variant="outline"
                onClick={() => setActiveStep(1)}
                className="border-slate-700 text-slate-300 rounded-xl"
              >
                ← Back
              </Button>
              <Button
                onClick={() => {
                  setError(null);
                  setActiveStep(3);
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl px-6"
              >
                Next: FSSAI &amp; PAN Details →
              </Button>
            </div>
          </Card>
        )}

        {/* STEP 3: FSSAI & PAN STATUTORY DETAILS */}
        {activeStep === 3 && (
          <Card className="border-slate-800 bg-slate-900/90 p-6 sm:p-8 space-y-5 rounded-2xl shadow-xl">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
                <FileText className="size-5 text-emerald-400" />
                Step 3: Statutory KYC &amp; Food Safety
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Under FSSAI food regulations, a valid 14-digit food license and PAN card are required to sell food online.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field
                label="14-Digit FSSAI Registration / License Number *"
                placeholder="e.g. 10326999000184"
                value={form.fssaiNumber}
                onChange={(v) => {
                  const cleaned = v.replace(/D/g, "").slice(0, 14);
                  setForm({ ...form, fssaiNumber: cleaned });
                }}
              />
              <Field
                label="FSSAI Certificate Expiry Date (YYYY-MM-DD) *"
                placeholder="e.g. 2027-12-31"
                value={form.fssaiExpiryDate}
                onChange={(v) => setForm({ ...form, fssaiExpiryDate: v })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field
                label="PAN Card Number (Proprietor or Business) *"
                placeholder="e.g. ABCDE1234F"
                value={form.pan}
                onChange={(v) => setForm({ ...form, pan: v.toUpperCase().slice(0, 10) })}
              />
              <div className="space-y-2">
                <Field
                  label="GSTIN (Optional if turnover < ₹20 Lakhs)"
                  placeholder="e.g. 18AAAAA0000A1Z5"
                  disabled={exemptFromGst}
                  value={exemptFromGst ? "" : form.gstin}
                  onChange={(v) => setForm({ ...form, gstin: v.toUpperCase() })}
                />
                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={exemptFromGst}
                    onChange={(e) => setExemptFromGst(e.target.checked)}
                    className="rounded border-slate-800 bg-slate-950 text-emerald-500 focus:ring-emerald-500 size-4"
                  />
                  <span>My restaurant annual turnover is under ₹20 Lakhs (GST Exempt)</span>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-between gap-3">
              <Button
                variant="outline"
                onClick={() => setActiveStep(2)}
                className="border-slate-700 text-slate-300 rounded-xl"
              >
                ← Back
              </Button>
              <Button
                onClick={() => {
                  if (!form.fssaiNumber.trim() || form.fssaiNumber.trim().length !== 14) {
                    setError("Please enter a valid 14-digit FSSAI food license number.");
                    return;
                  }
                  if (!form.fssaiExpiryDate.trim()) {
                    setError("Enter the actual FSSAI certificate expiry before submitting for review.");
                    return;
                  }
                  if (!form.pan.trim() || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(form.pan.trim())) {
                    setError("Please enter a valid 10-character PAN Card Number.");
                    return;
                  }
                  setError(null);
                  setActiveStep(4);
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl px-6"
              >
                Next: Bank Payouts →
              </Button>
            </div>
          </Card>
        )}

        {/* STEP 4: BANK ACCOUNT DETAILS */}
        {activeStep === 4 && (
          <Card className="border-slate-800 bg-slate-900/90 p-6 sm:p-8 space-y-5 rounded-2xl shadow-xl">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
                <CreditCard className="size-5 text-emerald-400" />
                Step 4: Bank Details for Settlements
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Your online customer orders are settled directly into this bank account on a regular schedule.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field
                label="Bank Account Number *"
                placeholder="Enter 9 to 18 digit account number"
                value={form.bankAccount}
                onChange={(v) => setForm({ ...form, bankAccount: v.replace(/D/g, "") })}
              />
              <Field
                label="Re-Enter Bank Account Number *"
                placeholder="Confirm account number"
                value={form.confirmBankAccount}
                onChange={(v) => setForm({ ...form, confirmBankAccount: v.replace(/D/g, "") })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field
                label="Bank IFSC Code *"
                placeholder="e.g. SBIN0001234 / HDFC0001234"
                value={form.bankIfsc}
                onChange={(v) => setForm({ ...form, bankIfsc: v.toUpperCase().slice(0, 11) })}
              />
              <Field
                label="Account Holder Name *"
                placeholder="Name as registered with bank"
                value={form.holder || form.ownerName}
                onChange={(v) => setForm({ ...form, holder: v })}
              />
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-between gap-3">
              <Button
                variant="outline"
                onClick={() => setActiveStep(3)}
                className="border-slate-700 text-slate-300 rounded-xl"
              >
                ← Back
              </Button>
              <Button
                onClick={() => {
                  if (!form.bankAccount.trim() || form.bankAccount.trim().length < 9) {
                    setError("Please enter a valid Bank Account Number (minimum 9 digits).");
                    return;
                  }
                  if (form.confirmBankAccount.trim() && form.bankAccount.trim() !== form.confirmBankAccount.trim()) {
                    setError("Bank Account Number and Confirmation Number do not match.");
                    return;
                  }
                  if (!form.bankIfsc.trim() || !validateIfsc(form.bankIfsc.trim())) {
                    setError("Please enter a valid 11-character Bank IFSC code (e.g. SBIN0001234).");
                    return;
                  }
                  setError(null);
                  setActiveStep(5);
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl px-6"
              >
                Next: Review &amp; Launch →
              </Button>
            </div>
          </Card>
        )}

        {/* STEP 5: REVIEW, TERMS & INSTANT LAUNCH */}
        {activeStep === 5 && (
          <Card className="border-slate-800 bg-slate-900/90 p-6 sm:p-8 space-y-6 rounded-2xl shadow-xl">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="size-5 text-emerald-400" />
                Step 5: Review &amp; Activate Restaurant
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Please review your restaurant profile before submitting for live activation.
              </p>
            </div>

            {/* Dossier Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Restaurant Profile
                </span>
                <p className="font-bold text-white text-sm">{form.name}</p>
                <p className="text-slate-400">{form.address}, {form.city}</p>
                <p className="text-slate-400">Phone: {form.phone}</p>
                <p className="text-emerald-400">Hours: {form.openingTime} - {form.closingTime}</p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Food Safety &amp; Tax
                </span>
                <p className="font-bold text-emerald-400 text-sm">FSSAI: {form.fssaiNumber}</p>
                <p className="text-slate-400">Valid Till: {form.fssaiExpiryDate}</p>
                <p className="text-slate-400">PAN: {form.pan}</p>
                <p className="text-slate-400">GST: {exemptFromGst ? "Exempt (< ₹20L)" : form.gstin || "Not provided"}</p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Payout Settlements
                </span>
                <p className="font-bold text-white text-sm">A/C: •••• {form.bankAccount ? form.bankAccount.slice(-4) : "----"}</p>
                <p className="text-slate-400">IFSC: {form.bankIfsc}</p>
                <p className="text-slate-400">Holder: {form.holder || form.ownerName}</p>
                <p className="text-emerald-400 font-medium">Weekly Direct Deposit</p>
              </div>
            </div>

            {/* 1-Click Clean Partner Agreement Checkbox */}
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-4 space-y-2">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={partnerTermsAccepted}
                  onChange={(e) => setPartnerTermsAccepted(e.target.checked)}
                  className="mt-0.5 size-5 rounded border-emerald-500 bg-slate-950 text-emerald-500 focus:ring-emerald-500 shrink-0 cursor-pointer"
                />
                <div className="space-y-1">
                  <span className="text-xs sm:text-sm font-bold text-white block leading-snug">
                    I agree to the OrderKing Partner Terms, FSSAI Food Safety Declaration, and Merchant Agreement *
                  </span>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    By checking this box, I confirm that our 14-digit FSSAI registration is valid and active under the Food Safety and Standards Act 2006, accept the weekly commercial settlement terms, agree to the Partner Privacy Policy (DPDP Act 2023) and statutory tax remittances (CGST §9(5)).
                  </p>
                </div>
              </label>
            </div>

            {/* Submission Actions */}
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <Button
                variant="outline"
                onClick={() => setActiveStep(4)}
                className="border-slate-700 text-slate-300 rounded-xl w-full sm:w-auto"
              >
                ← Back
              </Button>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <Button
                  variant="secondary"
                  disabled={busy}
                  onClick={() => void handleSaveAndRegister(false)}
                  className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs rounded-xl"
                >
                  {busy ? "Saving..." : "Save Draft"}
                </Button>
                <Button
                  disabled={busy || !partnerTermsAccepted}
                  onClick={() => void handleSaveAndRegister(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm px-7 py-2.5 rounded-xl shadow-lg shadow-emerald-900/30"
                >
                  {busy ? "Activating..." : "Submit & Activate Restaurant →"}
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </VendorShell>
  );
}

function Field({
  label,
  value,
  placeholder,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  disabled?: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-slate-300">{label}</Label>
      <Input
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="border-slate-800 bg-slate-950 text-slate-100 placeholder:text-slate-600 focus:border-emerald-500 text-xs h-10 rounded-xl disabled:opacity-50"
      />
    </div>
  );
}
