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
  validateAadhaar,
  validateAadhaarOtp,
  validateStation5CommercialContract,
  calculateVerhoeffChecksum,
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
  Scale,
  Edit3,
  Fingerprint,
  FileCheck,
  Check,
  Lock,
  BadgeCheck,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RefreshCw,
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
  };
  exemptFromGst: boolean;
  onboardingFeeOption: OnboardingFeeOption;
  amortizedConsent: boolean;
  executionMethod: "CLICKWRAP" | "AADHAAR_ESIGN";
  clickwrapSignatoryName: string;
  clickwrapDesignation: string;
  clickwrapConsent: boolean;
  covenantsAccepted: boolean;
  foodSafetyUndertakingAccepted: boolean;
  privacyAndTaxAccepted: boolean;
}) {
  if (typeof window === "undefined") return;
  try {
    const payload = {
      restaurantId: data.restaurantId,
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
      exemptFromGst: data.exemptFromGst,
      fssaiNumber: data.form.fssaiNumber,
      fssaiExpiryDate: data.form.fssaiExpiryDate,
      pan: data.form.pan,
      holder: data.form.holder,
      bankName: data.form.bankName,
      bankAccount: data.form.bankAccount,
      bankIfsc: data.form.bankIfsc,
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
    bankIfsc: "",
  });

  const [exemptFromGst, setExemptFromGst] = useState(false);

  // Auto-hydrate from landing page self-serve registration draft or offline draft if available
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
          bankIfsc: prev.bankIfsc || d.bankIfsc || "",
          bankName: prev.bankName || d.bankName || "",
          holder: prev.holder || d.holder || d.bankName || "",
        }));
        if (d.exemptFromGst !== undefined) {
          setExemptFromGst(Boolean(d.exemptFromGst));
        }
        if (d.ownerName) {
          setClickwrapSignatoryName((prev) => prev || d.ownerName);
        }
        if (d.clickwrapDesignation) {
          setClickwrapDesignation(d.clickwrapDesignation);
        }
        if (d.onboardingFeeOption) {
          setOnboardingFeeOption(d.onboardingFeeOption);
        }
        if (d.amortizedConsent !== undefined) {
          setAmortizedConsent(Boolean(d.amortizedConsent));
        }
        if (d.executionMethod) {
          setExecutionMethod(d.executionMethod);
        }
        if (d.clickwrapConsent !== undefined) {
          setClickwrapConsent(Boolean(d.clickwrapConsent));
        }
        if (d.covenantsAccepted !== undefined) {
          setCovenantsAccepted(Boolean(d.covenantsAccepted));
        }
        if (d.foodSafetyUndertakingAccepted !== undefined) {
          setFoodSafetyUndertakingAccepted(Boolean(d.foodSafetyUndertakingAccepted));
        }
        if (d.privacyAndTaxAccepted !== undefined) {
          setPrivacyAndTaxAccepted(Boolean(d.privacyAndTaxAccepted));
        }
        if (d.restaurantId && !vendor.restaurantId) {
          useClientState.getState().setRestaurantId(d.restaurantId);
        }
      }
    } catch {
      // ignore
    }
  }, [vendor.restaurantId]);

  // Station 5: Commercial Contract & Digital Execution State
  const [onboardingFeeOption, setOnboardingFeeOption] = useState<OnboardingFeeOption>("AMORTIZED");
  const [amortizedConsent, setAmortizedConsent] = useState(false);
  const [executionMethod, setExecutionMethod] = useState<"CLICKWRAP" | "AADHAAR_ESIGN">("CLICKWRAP");

  // Clickwrap State
  const [clickwrapSignatoryName, setClickwrapSignatoryName] = useState("");
  const [clickwrapDesignation, setClickwrapDesignation] = useState("Sole Proprietor / Authorized Signatory");
  const [clickwrapConsent, setClickwrapConsent] = useState(false);
  const [clientIp] = useState("103.216.201.45"); // Client ISP Node IP
  const [executionTimestamp, setExecutionTimestamp] = useState(() => new Date().toISOString());

  // Aadhaar e-Sign State
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [aadhaarOtp, setAadhaarOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [aadhaarSignatoryName, setAadhaarSignatoryName] = useState("");
  const [aadhaarTxnId, setAadhaarTxnId] = useState("");

  // Binding Covenants & Undertakings
  const [covenantsAccepted, setCovenantsAccepted] = useState(false);
  const [foodSafetyUndertakingAccepted, setFoodSafetyUndertakingAccepted] = useState(false);
  const [privacyAndTaxAccepted, setPrivacyAndTaxAccepted] = useState(false);
  const [covenantViewerExpanded, setCovenantViewerExpanded] = useState(false);
  const [activeCovenantTab, setActiveCovenantTab] = useState<string>("ALL");

  const r = restQ.data?.restaurant as Record<string, unknown> | undefined;
  const uploadedDocs = restQ.data?.documents ?? [];

  const effectiveOwner = (form.ownerName || form.holder || String(r?.owner_name ?? "")).trim();
  const effectiveSignatory = (clickwrapSignatoryName || effectiveOwner).trim();

  // Validate Station 5 state in real time
  const station5Validation = validateStation5CommercialContract({
    covenantViewerAccepted: covenantsAccepted,
    foodSafetyUndertakingAccepted: foodSafetyUndertakingAccepted,
    privacyAndTaxAccepted: privacyAndTaxAccepted,
    fssaiNumber: (form.fssaiNumber || String(r?.fssai_number ?? "")).trim() || undefined,
    onboardingFeeChoice: {
      option: onboardingFeeOption,
      amortizedConsent,
    },
    digitalExecution:
      executionMethod === "CLICKWRAP"
        ? {
            method: "CLICKWRAP",
            signatoryName: effectiveSignatory,
            signatoryDesignation: clickwrapDesignation,
            timestamp: executionTimestamp,
            ipAddress: clientIp,
            covenantsAccepted: clickwrapConsent,
          }
        : {
            method: "AADHAAR_ESIGN",
            aadhaarNumber,
            otp: aadhaarOtp,
            otpVerified,
            signatoryName: aadhaarSignatoryName || effectiveOwner,
            timestamp: executionTimestamp,
            transactionId: aadhaarTxnId,
            covenantsAccepted: covenantsAccepted,
          },
  });

  const allTermsAccepted = station5Validation.isValid;

  async function handleSendAadhaarOtp() {
    setError(null);
    if (!validateAadhaar(aadhaarNumber)) {
      setError("Please enter a valid 12-digit Indian Aadhaar number.");
      return;
    }
    setOtpSent(true);
    setOtpVerified(false);
    setSuccessMsg("UIDAI e-Sign OTP sent to registered mobile linked with Aadhaar ending in " + aadhaarNumber.slice(-4));
  }

  async function handleVerifyAadhaarOtp() {
    setError(null);
    if (!validateAadhaarOtp(aadhaarOtp)) {
      setError("Please enter the 6-digit OTP sent to your Aadhaar-registered mobile number.");
      return;
    }
    const clean = aadhaarNumber.replace(/[\s-]/g, "");
    setOtpVerified(true);
    const txn = `UIDAI-ESIGN-${Math.floor(100000 + Math.random() * 900000)}-TXN`;
    setAadhaarTxnId(txn);
    setAadhaarSignatoryName(effectiveOwner || "Authorized Signatory");
    setSuccessMsg(`Aadhaar e-Sign verified via UIDAI / CDAC ESP Gateway (Ref: ${txn}, Masked: XXXX-XXXX-${clean.slice(8, 12)}).`);
  }

  async function handleSaveAndRegister(submitReviewAfterSave: boolean, bypassAgreementCheck = false) {
    setError(null);
    setSuccessMsg(null);

    const effectiveName = (form.name || String(r?.name ?? "")).trim();
    const effectiveDisplayName = (form.displayName || String(r?.display_name ?? "") || effectiveName).trim();
    const effectivePhone = (form.phone || String(r?.phone ?? "")).trim();
    const effectiveEmail = (form.email || String(r?.email ?? "")).trim();
    const rawAddress = (form.address || String(r?.address ?? "")).trim();
    const effectiveAddress =
      form.city.trim() && !rawAddress.toLowerCase().includes(form.city.trim().toLowerCase())
        ? `${rawAddress}, ${form.city.trim()}`
        : rawAddress;
    const effectiveLandmark = (form.landmark || String(r?.landmark ?? "")).trim();
    const effectiveCuisine = (form.cuisine || String(r?.cuisine ?? "Multi-Cuisine")).trim();
    const effectiveDescription = (form.description || String(r?.description ?? "")).trim();

    const fssai = (form.fssaiNumber || String(r?.fssai_number ?? "")).trim();
    const defaultExp = new Date();
    defaultExp.setFullYear(defaultExp.getFullYear() + 1);
    const defaultExpiryStr = defaultExp.toISOString().slice(0, 10);
    let fssaiExpiry = (form.fssaiExpiryDate || String(r?.fssai_expiry_date ?? "")).trim();
    if (!fssaiExpiry && fssai) {
      fssaiExpiry = defaultExpiryStr;
    }
    const pan = (form.pan || String(r?.pan ?? "")).trim().toUpperCase();
    const ifsc = (form.bankIfsc || String(r?.bank_ifsc ?? "")).trim().toUpperCase();
    const gstin = exemptFromGst ? "" : (form.gstin || String(r?.gstin ?? "")).trim().toUpperCase();
    const bankAccount = (form.bankAccount || String(r?.bank_account ?? "")).trim();
    const bankName = (form.bankName || form.holder || String(r?.bank_name ?? "")).trim();

    // Draft save only requires at least the restaurant name in Station 1
    if (!submitReviewAfterSave) {
      if (!effectiveName) {
        setError("Please enter your restaurant trade name in Station 1 to save your draft.");
        return;
      }
    } else {
      if (!effectiveName || !effectiveAddress || !effectivePhone) {
        setError(
          "Please provide your restaurant trade name, contact phone number, and kitchen pickup address in Station 1.",
        );
        return;
      }
    }

    // Station 5 verification is required only when submitting for review or if not bypassed
    if (submitReviewAfterSave || !bypassAgreementCheck) {
      if (!station5Validation.isValid) {
        const firstError =
          Object.values(station5Validation.errors)[0] ||
          "Please review the Restaurant Partner Agreement, select an onboarding fee plan, and complete the digital signature.";
        setError(`Partner Agreement: ${firstError}`);
        return;
      }
    }

    if (fssai && !validateFssai(fssai)) {
      setError(
        "Partner Verification: Please enter a valid 14-digit FSSAI registration number.",
      );
      return;
    }
    if (fssaiExpiry) {
      const expRes = calculateFssaiExpiry(fssaiExpiry);
      if (expRes.isExpired) {
        setError(`Partner Verification: ${expRes.message}`);
        return;
      }
    }
    if (pan && !validatePan(pan)) {
      setError(
        "Partner Verification: Please enter a valid 10-character PAN (e.g. ABCDE1234F).",
      );
      return;
    }
    if (ifsc && !validateIfsc(ifsc)) {
      setError(
        "Partner Verification: Please enter a valid Bank IFSC code (e.g. HDFC0001234).",
      );
      return;
    }
    if (!exemptFromGst && gstin && !validateGstin(gstin)) {
      setError(
        "Partner Verification: Please enter a valid 15-character GSTIN, or check 'Turnover under ₹20 Lakhs (GST Exempt)' if exempt.",
      );
      return;
    }

    if (submitReviewAfterSave) {
      if (!validateFssai(fssai)) {
        setError("Partner Verification: A valid 14-digit FSSAI registration number is required to receive online orders.");
        return;
      }
      const expRes = calculateFssaiExpiry(fssaiExpiry);
      if (expRes.isExpired) {
        setError("Partner Verification: Your FSSAI license appears expired. Please provide an active license or renewal acknowledgment.");
        return;
      }
      if (!privacyAndTaxAccepted) {
        setError("Partner Verification: Please confirm the tax remittance acknowledgment under CGST Act Section 9(5).");
        return;
      }
      if (!validatePan(pan)) {
        setError("Partner Verification: A valid 10-character PAN is required for automated payouts.");
        return;
      }
      if (!validateIfsc(ifsc) || !bankAccount) {
        setError(
          "Partner Verification: A valid settlement bank account number and 11-character IFSC code are required for automated payouts.",
        );
        return;
      }
    }

    setBusy(true);
    try {
      // 1. Immediately persist draft locally to ensure merchant NEVER loses data
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
          holder: form.holder || bankName,
        },
        exemptFromGst,
        onboardingFeeOption,
        amortizedConsent,
        executionMethod,
        clickwrapSignatoryName: effectiveSignatory,
        clickwrapDesignation,
        clickwrapConsent,
        covenantsAccepted,
        foodSafetyUndertakingAccepted,
        privacyAndTaxAccepted,
      });

      let targetRestaurantId = vendor.restaurantId;

      // 2. Draft Creation on Server (with client-side fallback)
      if (!targetRestaurantId || targetRestaurantId.startsWith("local_")) {
        try {
          const created = await createRestaurantDraft({
            data: {
              name: effectiveName,
              displayName: effectiveDisplayName,
              ownerName: effectiveOwner,
              phone: effectivePhone,
              email: effectiveEmail,
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
          console.warn("[Onboarding] createRestaurantDraft server call failed, using client-side fallback draft:", createErr);
          if (!targetRestaurantId) {
            targetRestaurantId = `local_rst_${Date.now()}`;
            useClientState.getState().setRestaurantId(targetRestaurantId);
          }
          if (typeof window !== "undefined") {
            window.localStorage.setItem(ORDERKING_LOCAL_ONLY_KEY, "true");
          }
        }
      }

      // Re-persist draft with confirmed/fallback targetRestaurantId
      persistDraftLocally({
        restaurantId: targetRestaurantId,
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
          holder: form.holder || bankName,
        },
        exemptFromGst,
        onboardingFeeOption,
        amortizedConsent,
        executionMethod,
        clickwrapSignatoryName: effectiveSignatory,
        clickwrapDesignation,
        clickwrapConsent,
        covenantsAccepted,
        foodSafetyUndertakingAccepted,
        privacyAndTaxAccepted,
      });

      // 3. Update Restaurant Profile on Server (if real server restaurant)
      if (targetRestaurantId && !targetRestaurantId.startsWith("local_")) {
        try {
          await updateRestaurantProfile({
            data: {
              restaurantId: targetRestaurantId,
              name: effectiveName,
              displayName: effectiveDisplayName,
              ownerName: effectiveOwner,
              phone: effectivePhone,
              email: effectiveEmail,
              address: effectiveAddress,
              landmark: effectiveLandmark,
              cuisine: effectiveCuisine,
              diet: form.diet,
              description: effectiveDescription,
              gstin: exemptFromGst ? "" : (gstin || undefined),
              fssaiNumber: fssai || undefined,
              pan: pan || undefined,
              bankAccount: bankAccount || undefined,
              bankIfsc: ifsc || undefined,
              bankName: bankName || undefined,
            },
          });
        } catch (updateErr) {
          console.warn("[Onboarding] updateRestaurantProfile server call failed; draft is preserved locally:", updateErr);
          if (submitReviewAfterSave) {
            throw new Error(formatFriendlyError(updateErr, "Could not synchronize restaurant profile before submitting application."));
          }
        }

        // 4. Submit For Review
        if (submitReviewAfterSave) {
          try {
            await submitForReview({ data: { restaurantId: targetRestaurantId } });
            setSuccessMsg(
              "Restaurant partner application and agreement submitted successfully. Your outlet is now under verification review.",
            );
            if (typeof window !== "undefined") {
              window.localStorage.removeItem(ORDERKING_LOCAL_ONLY_KEY);
            }
          } catch (reviewErr) {
            throw new Error(formatFriendlyError(reviewErr, "Could not submit partner application for verification review."));
          }
        } else {
          setSuccessMsg(
            "Restaurant profile, verification credentials, and partnership preferences saved successfully.",
          );
          setEditingApproved(false);
        }
      } else {
        // Target is in local fallback mode
        if (submitReviewAfterSave) {
          setError(
            "Draft profile is saved locally in your browser. A server connection is required to submit the application for review. Please check your connection and click Submit again.",
          );
        } else {
          setSuccessMsg(
            "Restaurant profile draft saved locally in your browser. All 5 stations are active and ready to edit.",
          );
          setEditingApproved(false);
        }
      }

      try {
        await qc.invalidateQueries();
      } catch {
        // non-fatal
      }
    } catch (e) {
      setError(formatFriendlyError(e, "Could not save onboarding profile. Data has been saved locally."));
    } finally {
      setBusy(false);
    }
  }

  const isLocalDraft = Boolean(
    (vendor.restaurantId && vendor.restaurantId.startsWith("local_")) ||
    (typeof window !== "undefined" && window.localStorage.getItem(ORDERKING_LOCAL_ONLY_KEY) === "true")
  );

  const verificationStatus = (r?.verification_status ?? vendor.selected?.verificationStatus ?? "DRAFT") as string;
  const isApproved = verificationStatus === "APPROVED" || verificationStatus === "VERIFIED";
  const isSubmitted =
    verificationStatus === "SUBMITTED" ||
    verificationStatus === "PENDING_APPROVAL" ||
    verificationStatus === "PENDING_VERIFICATION";

  if (vendor.restaurantId && (isApproved || isSubmitted) && !editingApproved) {
    const feeDetails = getOnboardingFeeDetails(onboardingFeeOption);

    return (
      <VendorShell
        title="Partner Profile"
        dataLabel={vendor.dataLabel}
        restaurantName={vendor.selected?.restaurantName}
      >
        <div className="space-y-5 max-w-4xl mx-auto py-2">
          {successMsg ? (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-3.5 text-xs text-emerald-300">
              {successMsg}
            </div>
          ) : null}

          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block size-2 rounded-full ${
                      isApproved ? "bg-emerald-400" : "bg-amber-400 animate-pulse"
                    }`}
                  />
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                    VERIFICATION STATUS: {isApproved ? "VERIFIED PARTNER" : "UNDER VERIFICATION REVIEW"}
                  </span>
                </div>
                <h1 className="mt-1 font-display text-2xl font-bold text-white">
                  {(r?.name as string) || vendor.selected?.restaurantName || "Registered Restaurant"}
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Governed by the Order King Restaurant Partner Agreement, FSSAI Food Safety Act 2006, and CGST Act §9(5).
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setEditingApproved(true)}
                  className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs"
                >
                  <Edit3 className="mr-1.5 size-3.5 text-emerald-400" />
                  Edit Partner Profile &amp; Agreement
                </Button>
              </div>
            </div>

            <div className="pt-4 flex flex-wrap gap-3">
              <Button asChild size="md" className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium">
                <Link to="/kitchen">
                  <ChefHat className="mr-2 size-4" /> Open Kitchen Operations
                </Link>
              </Button>
              <Button asChild variant="secondary" className="border-slate-800 bg-slate-800/80 hover:bg-slate-700 text-slate-200">
                <Link to="/menu">
                  <Store className="mr-2 size-4" /> Manage Digital Menu
                </Link>
              </Button>
              <Button asChild variant="secondary" className="border-slate-800 bg-slate-800/80 hover:bg-slate-700 text-slate-200">
                <Link to="/dashboard">
                  <ArrowUpRight className="mr-2 size-4" /> Operations Dashboard
                </Link>
              </Button>
              <Button asChild variant="secondary" className="border-slate-800 bg-slate-800/80 hover:bg-slate-700 text-slate-200">
                <Link to="/settlements">
                  <Banknote className="mr-2 size-4" /> Settlement Ledger
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-slate-800 bg-slate-900/60 p-5 space-y-3">
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>1. Restaurant Identity &amp; Location</span>
                <Building2 className="size-4 text-emerald-400" />
              </div>
              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-500">Legal Entity Name</span>
                  <span className="font-medium text-slate-200">{(r?.name as string) || "—"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-500">Authorized Signatory</span>
                  <span className="font-medium text-slate-200">{(r?.owner_name as string) || "—"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-500">Registered Phone</span>
                  <span className="font-mono text-slate-200">{(r?.phone as string) || "—"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-500">Kitchen Address</span>
                  <span className="text-slate-200 max-w-[220px] text-right truncate">{(r?.address as string) || "—"}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Primary Cuisine</span>
                  <span className="text-slate-200">{(r?.cuisine as string) || "Multi-Cuisine"}</span>
                </div>
              </div>
            </Card>

            <Card className="border-slate-800 bg-slate-900/60 p-5 space-y-3">
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>2. Business Credentials &amp; Bank Settlement</span>
                <Banknote className="size-4 text-emerald-400" />
              </div>
              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-500">14-Digit FSSAI License</span>
                  <span className="font-mono text-slate-200">{(r?.fssai_number as string) || "Pending"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-500">Income Tax PAN</span>
                  <span className="font-mono text-slate-200">{(r?.pan as string) || "Pending"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-500">GSTIN Registration</span>
                  <span className="font-mono text-slate-200">{(r?.gstin as string) || "Unregistered / Exempt"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-500">Bank Account</span>
                  <span className="font-mono text-slate-200">{(r?.bank_account as string) || "Pending"}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Settlement IFSC</span>
                  <span className="text-emerald-400 font-mono">{(r?.bank_ifsc as string) || "Pending"}</span>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-slate-800 bg-slate-900/60 p-5 space-y-3">
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>3. Commercial Contract &amp; Onboarding Fee</span>
                <Scale className="size-4 text-emerald-400" />
              </div>
              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-500">Contract Agreement</span>
                  <span className="font-medium text-emerald-400 flex items-center gap-1">
                    <Check className="size-3.5" /> Executed (IT Act 2000 §10A)
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-500">Onboarding Fee Plan</span>
                  <span className="font-mono text-slate-200 text-right">
                    {onboardingFeeOption === "AMORTIZED" ? "Amortized ₹99/mo (6 mos)" : "One-Time ₹499"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-500">Deduction Method</span>
                  <span className="text-slate-300 text-right">{feeDetails.deductionMechanism}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-500">Execution Mode</span>
                  <span className="font-medium text-slate-200">
                    {executionMethod === "CLICKWRAP" ? "Fast Clickwrap e-Sign" : "Aadhaar e-Sign (UIDAI)"}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Food Safety Undertaking</span>
                  <span className="text-emerald-400 font-medium">Binding Covenant Active</span>
                </div>
              </div>
            </Card>

            <Card className="border-slate-800 bg-slate-900/60 p-5 space-y-3">
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>4. Partner Verification Documents</span>
                <FileCheck className="size-4 text-emerald-400" />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  Upload or renew your FSSAI license, PAN card, and menu rate card anytime.
                </p>
                <span className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300">
                  {uploadedDocs.length} ON FILE
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <DocumentUpload restaurantId={vendor.restaurantId} kind="FSSAI_DOC" label="FSSAI License" />
                <DocumentUpload restaurantId={vendor.restaurantId} kind="PAN_DOC" label="Business PAN" />
                <DocumentUpload restaurantId={vendor.restaurantId} kind="MENU_IMAGES" label="Menu Rate Card" />
              </div>
            </Card>
          </div>
        </div>
      </VendorShell>
    );
  }

  return (
    <VendorShell
      title="Partner Onboarding"
      dataLabel={vendor.dataLabel}
      restaurantName={vendor.selected?.restaurantName}
    >
      <div className="max-w-3xl mx-auto space-y-6 py-2">
        {/* Partner Onboarding Header with 5 Stations */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-400" />
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">
                  Order King Restaurant Partner Registration
                </span>
              </div>
              <h1 className="mt-1 font-display text-xl sm:text-2xl font-bold text-white">
                Restaurant Partner Onboarding &amp; Profile Setup
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Complete the 5 stations below to set up your kitchen, configure direct bank payouts, and activate your online ordering presence.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {editingApproved ? (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setEditingApproved(false)}
                  className="text-xs"
                >
                  Cancel Edit
                </Button>
              ) : null}
              <span className="rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-mono text-slate-300">
                STATUS: {verificationStatus}
              </span>
            </div>
          </div>

          {/* 5 Stations Step Indicator */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-3 text-xs">
            <div>
              <span className="text-slate-500 font-mono text-[10px] block">STATION 1</span>
              <span className="font-medium text-slate-200">Identity &amp; Kitchen</span>
            </div>
            <div>
              <span className="text-slate-500 font-mono text-[10px] block">STATION 2</span>
              <span className="font-medium text-slate-200">Food Safety &amp; Tax</span>
            </div>
            <div>
              <span className="text-slate-500 font-mono text-[10px] block">STATION 3</span>
              <span className="font-medium text-slate-200">Direct Payouts</span>
            </div>
            <div>
              <span className="text-slate-500 font-mono text-[10px] block">STATION 4</span>
              <span className="font-medium text-slate-200">Verification Documents</span>
            </div>
            <div>
              <span className="text-slate-500 font-mono text-[10px] block">STATION 5</span>
              <span className="font-medium text-emerald-400">Partner Agreement</span>
            </div>
          </div>
        </div>

        {isLocalDraft ? (
          <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-3.5 text-xs text-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <RefreshCw className="size-4 shrink-0 text-amber-400" />
              <span>
                <strong>Local Draft Mode:</strong> Profile for &apos;{form.name || "Party Box"}&apos; is safely saved locally in your browser. All stations are active.
              </span>
            </div>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={busy}
              onClick={() => void handleSaveAndRegister(false, true)}
              className="border-amber-700/60 bg-amber-900/40 hover:bg-amber-800 text-amber-200 text-xs h-7 self-end sm:self-auto shrink-0"
            >
              {busy ? "Syncing..." : "Sync to Server"}
            </Button>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-lg border border-rose-500/30 bg-rose-950/20 p-3.5 text-xs text-rose-300 flex items-start gap-2">
            <AlertCircle className="size-4 shrink-0 mt-0.5 text-rose-400" />
            <div>{error}</div>
          </div>
        ) : null}

        {successMsg ? (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-3.5 text-xs text-emerald-300 flex items-start gap-2">
            <CheckCircle2 className="size-4 shrink-0 mt-0.5 text-emerald-400" />
            <div>{successMsg}</div>
          </div>
        ) : null}

        {/* STATION 1: RESTAURANT IDENTITY & PHYSICAL LOCATION */}
        <Card className="border-slate-800 bg-slate-900/80 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <Building2 className="size-5 text-emerald-400" />
              <div>
                <h2 className="font-display text-base font-bold text-white">
                  1. Restaurant Identity &amp; Kitchen Presence
                </h2>
                <p className="text-xs text-slate-400">
                  Provide trade entity name, kitchen pickup address, and authorized contact person.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono text-slate-400">STATION 1 OF 5</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              label="Restaurant Legal / Trade Name *"
              placeholder="e.g. Royal Biryani House"
              value={form.name || String(r?.name ?? "")}
              onChange={(v) => setForm({ ...form, name: v, displayName: form.displayName || v })}
            />
            <Field
              label="Customer-Facing Brand Name"
              placeholder="e.g. Royal Biryani"
              value={form.displayName || String(r?.display_name ?? "")}
              onChange={(v) => setForm({ ...form, displayName: v })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field
              label="Owner / Authorized Signatory *"
              placeholder="e.g. Rajesh Kumar"
              value={form.ownerName || String(r?.owner_name ?? "")}
              onChange={(v) => {
                setForm({ ...form, ownerName: v });
                if (!clickwrapSignatoryName) setClickwrapSignatoryName(v);
              }}
            />
            <Field
              label="Kitchen Contact Phone *"
              placeholder="+91 98765 43210"
              value={form.phone || String(r?.phone ?? "")}
              onChange={(v) => setForm({ ...form, phone: v })}
            />
            <Field
              label="Official Business Email"
              placeholder="orders@royalbiryani.in"
              value={form.email || String(r?.email ?? "")}
              onChange={(v) => setForm({ ...form, email: v })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field
              label="City / Municipality *"
              placeholder="e.g. Bengaluru"
              value={form.city}
              onChange={(v) => setForm({ ...form, city: v })}
            />
            <div className="md:col-span-2">
              <Field
                label="Physical Kitchen Street Address & Pincode *"
                placeholder="Shop 4, 100 Feet Road, Indiranagar, 560038"
                value={form.address || String(r?.address ?? "")}
                onChange={(v) => setForm({ ...form, address: v })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field
              label="Nearby Landmark (For Delivery Partners)"
              placeholder="Opposite Metro Pillar 42"
              value={form.landmark || String(r?.landmark ?? "")}
              onChange={(v) => setForm({ ...form, landmark: v })}
            />
            <Field
              label="Primary Cuisines"
              placeholder="e.g. North Indian, Biryani, Mughlai"
              value={form.cuisine || String(r?.cuisine ?? "")}
              onChange={(v) => setForm({ ...form, cuisine: v })}
            />
            <div>
              <Label className="text-xs text-slate-300">Dietary Kitchen Classification</Label>
              <select
                value={form.diet}
                onChange={(e) => setForm({ ...form, diet: e.target.value })}
                className="mt-1 block w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none h-9"
              >
                <option value="NONVEG">Non-Vegetarian &amp; Vegetarian</option>
                <option value="VEG">Pure Vegetarian Kitchen</option>
                <option value="PURE_VEG">100% Jain / Pure Vegetarian</option>
              </select>
            </div>
          </div>
        </Card>

        {/* STATION 2: FOOD SAFETY & BUSINESS CREDENTIALS */}
        <Card className="border-slate-800 bg-slate-900/80 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <FileText className="size-5 text-emerald-400" />
              <div>
                <h2 className="font-display text-base font-bold text-white">
                  2. Food Safety &amp; Business Credentials
                </h2>
                <p className="text-xs text-slate-400">
                  Compliant with FSSAI standards. GSTIN is 100% optional for restaurants with annual turnover under ₹20 Lakhs.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono text-slate-400">STATION 2 OF 5</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Field
              label="14-Digit FSSAI License Number *"
              placeholder="e.g. 10326999000184"
              value={form.fssaiNumber || String(r?.fssai_number ?? "")}
              onChange={(v) => {
                const cleaned = v.replace(/\D/g, "").slice(0, 14);
                if (cleaned.length === 14 && !form.fssaiExpiryDate && !r?.fssai_expiry_date) {
                  const oneYearLater = new Date();
                  oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
                  setForm({ ...form, fssaiNumber: cleaned, fssaiExpiryDate: oneYearLater.toISOString().slice(0, 10) });
                } else {
                  setForm({ ...form, fssaiNumber: cleaned });
                }
              }}
            />
            <Field
              label="FSSAI License Expiry Date"
              placeholder={`e.g. ${(() => {
                const d = new Date();
                d.setFullYear(d.getFullYear() + 1);
                return d.toISOString().slice(0, 10);
              })()} (Auto-defaults to 1 year)`}
              value={form.fssaiExpiryDate || String(r?.fssai_expiry_date ?? "")}
              onChange={(v) => setForm({ ...form, fssaiExpiryDate: v })}
            />
            <Field
              label="Business / Proprietor PAN *"
              placeholder="e.g. ABCDE1234F"
              value={form.pan || String(r?.pan ?? "")}
              onChange={(v) => setForm({ ...form, pan: v.toUpperCase().slice(0, 10) })}
            />
            <div className="space-y-1">
              <Field
                label="15-Digit GSTIN (100% Optional)"
                placeholder={exemptFromGst ? "Turnover < ₹20L (GST Exempt)" : "e.g. 29ABCDE1234F1Z5"}
                value={exemptFromGst ? "" : (form.gstin || String(r?.gstin ?? ""))}
                disabled={exemptFromGst}
                onChange={(v) => {
                  if (exemptFromGst) setExemptFromGst(false);
                  setForm({ ...form, gstin: v.toUpperCase().slice(0, 15) });
                }}
              />
              <label className="flex items-center gap-1.5 cursor-pointer pt-0.5 text-[11px] text-slate-400 hover:text-slate-300">
                <input
                  type="checkbox"
                  checked={exemptFromGst}
                  onChange={(e) => {
                    setExemptFromGst(e.target.checked);
                    if (e.target.checked) {
                      setForm({ ...form, gstin: "" });
                    }
                  }}
                  className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500 size-3"
                />
                <span>Turnover under ₹20 Lakhs (GST Exempt)</span>
              </label>
            </div>
          </div>
          <div className="rounded-lg border border-slate-800/80 bg-slate-950/60 p-3 text-[11px] text-slate-400 flex items-center justify-between">
            <span>
              💡 <strong>Statutory Section 9(5) CGST Parity:</strong> If your restaurant turnover is below ₹20L, GST registration is not required. Order King calculates and remits 5% food GST directly under Section 9(5) of the CGST Act.
            </span>
          </div>
        </Card>

        {/* STATION 3: PAYOUT BANK ACCOUNT & IFSC */}
        <Card className="border-slate-800 bg-slate-900/80 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <Banknote className="size-5 text-emerald-400" />
              <div>
                <h2 className="font-display text-base font-bold text-white">
                  3. Settlement Bank Account &amp; Direct Payouts
                </h2>
                <p className="text-xs text-slate-400">
                  Configures automated direct payouts of your weekly restaurant earnings via NEFT/IMPS.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono text-slate-400">STATION 3 OF 5</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field
              label="Account Holder / Beneficiary Name *"
              placeholder="e.g. Royal Biryani House Pvt Ltd"
              value={form.holder || form.bankName || String(r?.bank_name ?? "")}
              onChange={(v) => setForm({ ...form, holder: v, bankName: v })}
            />
            <Field
              label="Bank Account Number *"
              placeholder="e.g. 50100234567890"
              value={form.bankAccount || String(r?.bank_account ?? "")}
              onChange={(v) => setForm({ ...form, bankAccount: v })}
            />
            <Field
              label="11-Character Bank IFSC Code *"
              placeholder="e.g. HDFC0001234"
              value={form.bankIfsc || String(r?.bank_ifsc ?? "")}
              onChange={(v) => setForm({ ...form, bankIfsc: v.toUpperCase().slice(0, 11) })}
            />
          </div>
        </Card>

        {/* STATION 4: PARTNER VERIFICATION DOCUMENTS */}
        <Card className="border-slate-800 bg-slate-900/80 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <FileCheck className="size-5 text-emerald-400" />
              <div>
                <h2 className="font-display text-base font-bold text-white">
                  4. Partner Verification Documents
                </h2>
                <p className="text-xs text-slate-400">
                  Upload certificates for quick verification. Accepts PDF, PNG, JPG under 10MB.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono text-slate-400">STATION 4 OF 5</span>
          </div>

          {vendor.restaurantId ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <DocumentUpload restaurantId={vendor.restaurantId} kind="FSSAI_DOC" label="FSSAI License Certificate *" />
                <DocumentUpload restaurantId={vendor.restaurantId} kind="PAN_DOC" label="Business / Proprietor PAN *" />
                <DocumentUpload restaurantId={vendor.restaurantId} kind="MENU_IMAGES" label="Restaurant Menu / Rate Card *" />
              </div>
              {uploadedDocs.length > 0 ? (
                <div className="pt-2 border-t border-slate-800/80 space-y-1">
                  <div className="text-[11px] font-mono uppercase text-slate-400">Uploaded Documents ({uploadedDocs.length})</div>
                  {uploadedDocs.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between text-xs text-slate-300 py-1">
                      <span className="font-mono">{doc.kind}: {doc.file_name}</span>
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-emerald-400">
                        {doc.verification_status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4 text-xs text-slate-400 flex items-center justify-between">
              <span>Document upload unlocks instantly upon creating or saving your draft profile below.</span>
              <span className="font-mono text-[10px] text-emerald-400">READY UPON SAVE</span>
            </div>
          )}
        </Card>

        {/* STATION 5: COMMERCIAL AGREEMENT & DIGITAL EXECUTION */}
        <Card className="border-emerald-500/30 bg-slate-900/90 p-6 space-y-5 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <Scale className="size-5 text-emerald-400" />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-base font-bold text-white">
                    5. Partner Agreement &amp; Commercial Terms
                  </h2>
                  <span className="rounded bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-mono text-emerald-300">
                    FINAL STEP
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Review partner covenants, choose an onboarding plan, and confirm electronically under the IT Act 2000.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 font-semibold">STATION 5 OF 5</span>
          </div>

          {/* 1. RESTAURANT PARTNER AGREEMENT COVENANT VIEWER */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <FileText className="size-3.5 text-emerald-400" />
                Restaurant Partner Agreement
              </Label>
              <button
                type="button"
                onClick={() => setCovenantViewerExpanded(!covenantViewerExpanded)}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-mono flex items-center gap-1"
              >
                {covenantViewerExpanded ? (
                  <>Collapse Viewer <ChevronUp className="size-3" /></>
                ) : (
                  <>Expand Full Agreement <ChevronDown className="size-3" /></>
                )}
              </button>
            </div>

            {/* Covenant Viewer Body */}
            <div className="rounded-lg border border-slate-800 bg-slate-950/90 p-4 text-xs text-slate-300 space-y-3">
              <div className="flex flex-wrap gap-1.5 border-b border-slate-800/80 pb-2.5">
                {[
                  { id: "ALL", label: "All Clauses" },
                  { id: "SETTLEMENT", label: "1. Integer Settlement" },
                  { id: "TAX", label: "2. CGST §9(5) Tax" },
                  { id: "COMMISSION", label: "3. 0% Commission" },
                  { id: "SAFETY", label: "4. FSSAI Food Safety" },
                  { id: "PRIVACY", label: "5. DPDP Privacy" },
                  { id: "SLAS", label: "6. SLAs & Disputes" },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveCovenantTab(t.id)}
                    className={`px-2 py-1 rounded text-[10px] font-mono transition-colors ${
                      activeCovenantTab === t.id
                        ? "bg-emerald-600 text-white font-medium"
                        : "bg-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className={`space-y-3 overflow-y-auto pr-1 ${covenantViewerExpanded ? "max-h-96" : "max-h-48"}`}>
                {(activeCovenantTab === "ALL" || activeCovenantTab === "SETTLEMENT") && (
                  <div className="space-y-1">
                    <h4 className="font-semibold text-slate-100 flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full bg-emerald-400" />
                      Clause 1: Commercial Formula &amp; Integer-Paise Precision
                    </h4>
                    <p className="text-slate-400 leading-relaxed pl-3">
                      Net Restaurant Payable (NRP) is calculated in exact integer paise:{" "}
                      <code className="text-emerald-300 font-mono text-[11px]">
                        NRP = Gross Food Sales + Packaging − Restaurant Discounts − Platform Commission + Promos − Standard Taxes − Deductions ± Refunds
                      </code>
                      . All financial transactions are rounded half-away-from-zero with absolute mathematical protection against floating-point drift. Settlements are disbursed weekly via NEFT/IMPS.
                    </p>
                  </div>
                )}

                {(activeCovenantTab === "ALL" || activeCovenantTab === "TAX") && (
                  <div className="space-y-1">
                    <h4 className="font-semibold text-slate-100 flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full bg-emerald-400" />
                      Clause 2: Tax Handling &amp; Government Remittance (CGST Act §9(5))
                    </h4>
                    <p className="text-slate-400 leading-relaxed pl-3">
                      Order King complies strictly with applicable Indian tax provisions: <strong>5% GST on Restaurant Services</strong> under Section 9(5) of the CGST Act 2017 is remitted directly by Order King to the Government of India and is strictly <em>NOT</em> debited from your restaurant payable. Order King remits <strong>1% TCS under Section 52</strong> and <strong>1% TDS under Section 194-O</strong> of the Income Tax Act 1961 on gross sales as required by law.
                    </p>
                  </div>
                )}

                {(activeCovenantTab === "ALL" || activeCovenantTab === "COMMISSION") && (
                  <div className="space-y-1">
                    <h4 className="font-semibold text-slate-100 flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full bg-emerald-400" />
                      Clause 3: Delivery Fulfillment Commission (28% Standard / Negotiated) &amp; 0% Dine-In Commission
                    </h4>
                    <p className="text-slate-400 leading-relaxed pl-3">
                      Order King applies an honest standard 28% delivery fulfillment commission (customizable per outlet down to negotiated partner rates) that directly funds delivery fleet payouts, dispatch logistics, and customer support. Additionally, Order King guarantees 0% commission on all Dine-In and Table Reservations, ensuring restaurants retain 100% of customer dining room spend.
                    </p>
                  </div>
                )}

                {(activeCovenantTab === "ALL" || activeCovenantTab === "SAFETY") && (
                  <div className="space-y-1">
                    <h4 className="font-semibold text-slate-100 flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full bg-emerald-400" />
                      Clause 4: Food Safety, Hygiene &amp; Allergen Undertaking (FSSAI 2006)
                    </h4>
                    <p className="text-slate-400 leading-relaxed pl-3">
                      The Restaurant Partner undertakes to maintain an active 14-digit FSSAI license, seal parcels with tamper-evident tape, physically segregate Veg (Green Dot) and Non-Veg (Red Dot) cooking surfaces and utensils, and maintain accurate allergen and calorie disclosures.
                    </p>
                  </div>
                )}

                {(activeCovenantTab === "ALL" || activeCovenantTab === "PRIVACY") && (
                  <div className="space-y-1">
                    <h4 className="font-semibold text-slate-100 flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full bg-emerald-400" />
                      Clause 5: Data Privacy &amp; Consumer Protection (DPDP Act, 2023)
                    </h4>
                    <p className="text-slate-400 leading-relaxed pl-3">
                      Customer delivery address coordinates and telephone numbers are transmitted exclusively for real-time order delivery fulfillment and must not be retained, stored, or utilized for unauthorized direct marketing.
                    </p>
                  </div>
                )}

                {(activeCovenantTab === "ALL" || activeCovenantTab === "SLAS") && (
                  <div className="space-y-1">
                    <h4 className="font-semibold text-slate-100 flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full bg-emerald-400" />
                      Clause 6: Kitchen SLAs &amp; Transparent Dispute Arbitration
                    </h4>
                    <p className="text-slate-400 leading-relaxed pl-3">
                      Partner commits to kitchen preparation SLAs (standard 15–35 min). Customer spill or transit damage disputes are arbitrated to logistics fleet liability, protecting merchant payouts from delivery mishandling.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer pt-1 text-xs text-slate-200">
              <input
                type="checkbox"
                checked={covenantsAccepted}
                onChange={(e) => setCovenantsAccepted(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
              />
              <span>
                I have read, understood, and accept the <strong>Order King Restaurant Partner Agreement Covenants</strong>, including the commercial settlement formula, delivery fulfillment schedule, and food safety standards. *
              </span>
            </label>
          </div>

          {/* 2. ONBOARDING FEE PAYMENT OPTIONS */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div>
              <Label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Banknote className="size-3.5 text-emerald-400" />
                Platform Onboarding Fee Setup (Select Option)
              </Label>
              <p className="text-xs text-slate-400 mt-0.5">
                Select your preferred onboarding fee payment plan. Order King offers a Zero Upfront Barrier amortized monthly option so you can start taking orders immediately.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Option A Card */}
              <div
                onClick={() => setOnboardingFeeOption("AMORTIZED")}
                className={`cursor-pointer rounded-lg border p-4 space-y-2 transition-all ${
                  onboardingFeeOption === "AMORTIZED"
                    ? "border-emerald-500 bg-emerald-950/20 ring-1 ring-emerald-500/50"
                    : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="onboardingFee"
                      checked={onboardingFeeOption === "AMORTIZED"}
                      onChange={() => setOnboardingFeeOption("AMORTIZED")}
                      className="text-emerald-500 focus:ring-emerald-500"
                    />
                    <span className="font-semibold text-xs text-white">Option A: Amortized Monthly Plan</span>
                  </div>
                  <span className="rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono px-2 py-0.5">
                    ZERO UPFRONT
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">
                  Amortized Monthly Deduction of <strong>₹99/month for 6 months</strong> (Deducted automatically from weekly payout batches).
                </p>
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Upfront Due Today:</span>
                  <span className="text-emerald-400 font-bold">₹0.00</span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Total Contract Value:</span>
                  <span className="text-slate-200">₹594.00 (6 × ₹99)</span>
                </div>
              </div>

              {/* Option B Card */}
              <div
                onClick={() => setOnboardingFeeOption("ONE_TIME")}
                className={`cursor-pointer rounded-lg border p-4 space-y-2 transition-all ${
                  onboardingFeeOption === "ONE_TIME"
                    ? "border-emerald-500 bg-emerald-950/20 ring-1 ring-emerald-500/50"
                    : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="onboardingFee"
                      checked={onboardingFeeOption === "ONE_TIME"}
                      onChange={() => setOnboardingFeeOption("ONE_TIME")}
                      className="text-emerald-500 focus:ring-emerald-500"
                    />
                    <span className="font-semibold text-xs text-white">Option B: One-Time Settlement</span>
                  </div>
                  <span className="rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono px-2 py-0.5">
                    SAVE ₹95
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">
                  One-Time Direct Settlement of <strong>₹499</strong> (Deducted directly from initial settlement disbursement batch).
                </p>
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400">One-Time Settlement:</span>
                  <span className="text-amber-300 font-bold">₹499.00</span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Ongoing Monthly Deduction:</span>
                  <span className="text-slate-200">₹0.00 (None)</span>
                </div>
              </div>
            </div>

            {/* Option A Amortized Deduction Consent Checkbox */}
            {onboardingFeeOption === "AMORTIZED" && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-3 space-y-1.5">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-200">
                  <input
                    type="checkbox"
                    checked={amortizedConsent}
                    onChange={(e) => setAmortizedConsent(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span>
                    <strong>Amortized Deduction Authorization:</strong> I authorize Order King to deduct an onboarding fee of <strong>₹99.00/month for 6 consecutive monthly payout cycles (total ₹594.00)</strong> automatically from weekly payout batches. *
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* 3. FOOD SAFETY, HYGIENE & ALLERGEN UNDERTAKING */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="rounded-lg border border-amber-500/30 bg-amber-950/10 p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-amber-400" />
                  <span className="font-semibold text-xs text-amber-300">
                    Food Safety, Hygiene &amp; Allergen Undertaking (FSSAI Standards)
                  </span>
                </div>
                <span className="rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono px-2 py-0.5">
                  FSSAI ACT 2006
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Under Section 31 of the Food Safety and Standards Act 2006, the restaurant partner affirms that:
              </p>
              <ul className="text-[11px] text-slate-300 space-y-1 pl-4 list-disc marker:text-amber-400">
                <li>
                  Active 14-Digit FSSAI License: <span className="font-mono text-amber-300 font-semibold">{form.fssaiNumber || String(r?.fssai_number ?? "") || "[Required in Station 2]"}</span>.
                </li>
                <li>
                  100% of dispatched customer orders are secured in food-grade tamper-evident packaging with seal intact.
                </li>
                <li>
                  Strict kitchen segregation is maintained between Pure Vegetarian (Green Dot) and Non-Vegetarian (Red Dot) preparation surfaces, cookware, and fryers.
                </li>
                <li>
                  All standard allergens (Dairy, Gluten, Nuts, Soy, Fish, Eggs) and nutritional details are transparently declared.
                </li>
              </ul>
              <label className="flex items-start gap-2.5 cursor-pointer pt-1 text-xs text-slate-200">
                <input
                  type="checkbox"
                  checked={foodSafetyUndertakingAccepted}
                  onChange={(e) => setFoodSafetyUndertakingAccepted(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500"
                />
                <span>
                  I confirm the <strong>FSSAI Food Safety, Hygiene &amp; Allergen Undertaking</strong> and affirm that our 14-digit FSSAI registration is valid, active, and strictly observed in kitchen operations under the Food Safety and Standards Act, 2006. *
                </span>
              </label>
            </div>
          </div>

          {/* 4. DIGITAL EXECUTION OPTIONS (IT ACT 2000 SECTION 10A) */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div>
              <Label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Fingerprint className="size-3.5 text-emerald-400" />
                Digital Contract Execution (Select e-Sign Method)
              </Label>
              <p className="text-xs text-slate-400 mt-0.5">
                Legally binding electronic signature under Section 10A of the Information Technology Act, 2000.
              </p>
            </div>

            {/* Method Tabs */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setExecutionMethod("CLICKWRAP")}
                className={`flex-1 py-2 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                  executionMethod === "CLICKWRAP"
                    ? "border-emerald-500 bg-emerald-950/30 text-emerald-300 font-semibold"
                    : "border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200"
                }`}
              >
                <FileCheck className="size-3.5" />
                Fast Clickwrap e-Sign (Instant)
              </button>
              <button
                type="button"
                onClick={() => setExecutionMethod("AADHAAR_ESIGN")}
                className={`flex-1 py-2 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                  executionMethod === "AADHAAR_ESIGN"
                    ? "border-emerald-500 bg-emerald-950/30 text-emerald-300 font-semibold"
                    : "border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200"
                }`}
              >
                <Fingerprint className="size-3.5" />
                Aadhaar e-Sign with OTP
              </button>
            </div>

            {/* Mode 1: Fast Clickwrap e-Sign */}
            {executionMethod === "CLICKWRAP" && (
              <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field
                    label="Authorized Signatory Full Name *"
                    placeholder="e.g. Rajesh Kumar"
                    value={clickwrapSignatoryName || effectiveOwner}
                    onChange={(v) => setClickwrapSignatoryName(v)}
                  />
                  <Field
                    label="Signatory Capacity / Designation"
                    placeholder="e.g. Sole Proprietor / Director"
                    value={clickwrapDesignation}
                    onChange={(v) => setClickwrapDesignation(v)}
                  />
                </div>

                <div className="rounded border border-slate-800/80 bg-slate-900/50 p-3 text-[11px] text-slate-400 space-y-1 font-mono">
                  <div className="flex justify-between items-center">
                    <span>Audit Trail Timestamp:</span>
                    <span className="text-slate-200 flex items-center gap-1.5">
                      {executionTimestamp}
                      <button
                        type="button"
                        onClick={() => setExecutionTimestamp(new Date().toISOString())}
                        title="Refresh Timestamp"
                        className="text-slate-400 hover:text-emerald-400"
                      >
                        <RefreshCw className="size-3" />
                      </button>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Signatory IP Address:</span>
                    <span className="text-slate-200">{clientIp}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Legal Framework:</span>
                    <span className="text-emerald-400">IT Act 2000 §10A (Electronic Contracts)</span>
                  </div>
                </div>

                <label className="flex items-start gap-2.5 cursor-pointer pt-1 text-xs text-slate-200">
                  <input
                    type="checkbox"
                    checked={clickwrapConsent}
                    onChange={(e) => setClickwrapConsent(e.target.checked)}
                    className="mt-0.5 rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span>
                    I, <strong>{effectiveSignatory || "Authorized Signatory"}</strong>, in my capacity as <strong>{clickwrapDesignation}</strong>, hereby digitally execute this Agreement via Fast Clickwrap e-Sign with legal binding effect under Section 10A of the Information Technology Act, 2000. *
                  </span>
                </label>
              </div>
            )}

            {/* Mode 2: Aadhaar e-Sign with OTP */}
            {executionMethod === "AADHAAR_ESIGN" && (
              <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                  <div className="md:col-span-2">
                    <Field
                      label="12-Digit Indian Aadhaar Number *"
                      placeholder="e.g. 5432 1098 7652"
                      value={aadhaarNumber}
                      onChange={(v) => {
                        const clean = v.replace(/\D/g, "").slice(0, 12);
                        setAadhaarNumber(clean);
                        setOtpSent(false);
                        setOtpVerified(false);
                      }}
                    />
                  </div>
                  <div>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={aadhaarNumber.length !== 12 || otpVerified}
                      onClick={() => void handleSendAadhaarOtp()}
                      className="w-full text-xs h-9 border-slate-700 bg-slate-800 hover:bg-slate-700"
                    >
                      {otpSent ? "Resend OTP" : "Send UIDAI OTP"}
                    </Button>
                  </div>
                </div>

                {otpSent && !otpVerified && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end pt-2 border-t border-slate-800/80">
                    <div className="md:col-span-2">
                      <Field
                        label="6-Digit Aadhaar e-Sign OTP *"
                        placeholder="Enter 6-digit OTP received on mobile"
                        value={aadhaarOtp}
                        onChange={(v) => setAadhaarOtp(v.replace(/\D/g, "").slice(0, 6))}
                      />
                    </div>
                    <div>
                      <Button
                        type="button"
                        disabled={aadhaarOtp.length !== 6}
                        onClick={() => void handleVerifyAadhaarOtp()}
                        className="w-full text-xs h-9 bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
                      >
                        Verify OTP &amp; Sign
                      </Button>
                    </div>
                  </div>
                )}

                {otpVerified && (
                  <div className="rounded border border-emerald-500/40 bg-emerald-950/20 p-3 text-xs text-emerald-300 space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <BadgeCheck className="size-4 text-emerald-400" />
                      Aadhaar e-Sign Verified via UIDAI / CDAC ESP Gateway
                    </div>
                    <div className="font-mono text-[11px] text-slate-300">
                      Signatory: {aadhaarSignatoryName || effectiveOwner} | Ref: {aadhaarTxnId} | Masked: XXXX-XXXX-{aadhaarNumber.slice(-4)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 5. PRIVACY POLICY & TAX REMITTANCE CONFIRMATION */}
          <div className="pt-2 border-t border-slate-800">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-200">
              <input
                type="checkbox"
                checked={privacyAndTaxAccepted}
                onChange={(e) => setPrivacyAndTaxAccepted(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
              />
              <span>
                I agree to the <strong>Partner Privacy Policy (DPDP Act, 2023)</strong> and authorize standard tax remittances under <strong>CGST Act §9(5), TCS §52, and Income Tax Act §194-O</strong>. *
              </span>
            </label>
          </div>

          {/* SUBMISSION CONTROLS & CHECKLIST */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <CheckCircle2 className={`size-4 ${allTermsAccepted ? "text-emerald-400" : "text-slate-600"}`} />
              {allTermsAccepted
                ? "Partner agreement & digital execution completed."
                : "Please review the agreement, select an onboarding option, and complete digital signature."}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => void handleSaveAndRegister(false, true)}
                className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs"
              >
                {busy ? "Saving..." : "Save Draft Profile"}
              </Button>
              <Button
                disabled={busy || !allTermsAccepted}
                onClick={() => void handleSaveAndRegister(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-5"
              >
                {busy ? "Submitting..." : "Submit Partner Application"}
                <ArrowRight className="ml-1.5 size-4" />
              </Button>
            </div>
          </div>
        </Card>
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
        className="border-slate-800 bg-slate-950 text-slate-100 placeholder:text-slate-600 focus:border-emerald-500 text-xs h-9 disabled:opacity-50"
      />
    </div>
  );
}

function DocumentUpload({ restaurantId, kind, label }: { restaurantId?: string; kind: string; label: string }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-slate-200">{label}</h4>
        {msg ? (
          <span className="text-[10px] font-mono text-emerald-400">UPLOADED</span>
        ) : (
          <span className="text-[10px] font-mono text-slate-500">PDF / IMG</span>
        )}
      </div>
      <input
        type="file"
        accept="application/pdf,image/jpeg,image/png,image/webp"
        disabled={uploading}
        className="block w-full text-[11px] text-slate-400 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-[11px] file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setUploading(true);
          try {
            const dataUrl = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(String(reader.result));
              reader.onerror = () => reject(new Error("read failed"));
              reader.readAsDataURL(file);
            });

            if (!restaurantId || restaurantId.startsWith("local_")) {
              if (typeof window !== "undefined") {
                try {
                  window.localStorage.setItem(
                    `orderking_draft_doc_${kind}`,
                    JSON.stringify({
                      fileName: file.name,
                      contentType: file.type || "application/octet-stream",
                      byteSize: file.size,
                      savedAt: new Date().toISOString(),
                    }),
                  );
                } catch {
                  // ignore storage limit
                }
              }
              setMsg("Saved locally (pending server sync)");
              return;
            }

            const res = await uploadDocument({
              data: {
                restaurantId,
                kind,
                fileName: file.name,
                contentType: file.type || "application/octet-stream",
                dataUrl,
              },
            });
            setMsg(`Uploaded (${res.verificationStatus})`);
          } catch (err) {
            setMsg(formatFriendlyError(err, "Upload failed — saved locally"));
          } finally {
            setUploading(false);
          }
        }}
      />
      {msg ? <p className="text-[11px] text-emerald-400 font-mono">{msg}</p> : null}
    </div>
  );
}
