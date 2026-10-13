import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
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
  uploadDocument,
} from "@/lib/server/api-bootstrap";
import {
  validateFssai,
  validateGstin,
  validateIfsc,
  validatePan,
} from "@/lib/merchant-kyc";
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
} from "lucide-react";

export const Route = createFileRoute("/onboarding")({ component: OnboardingPage });

function OnboardingPage() {
  const qc = useQueryClient();
  const vendor = useVendor();

  const restQ = useQuery({
    queryKey: ["restaurant", vendor.restaurantId],
    queryFn: () => getRestaurant({ data: { restaurantId: vendor.restaurantId } }),
    enabled: Boolean(vendor.restaurantId),
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
    pan: "",
    holder: "",
    bankName: "",
    bankAccount: "",
    bankIfsc: "",
    seedSim: false,
  });

  const [agreements, setAgreements] = useState({
    commercialTerms: false,
    fssaiUndertaking: false,
    privacyAndTax: false,
  });

  const r = restQ.data?.restaurant as Record<string, unknown> | undefined;
  const uploadedDocs = restQ.data?.documents ?? [];
  const allTermsAccepted =
    agreements.commercialTerms && agreements.fssaiUndertaking && agreements.privacyAndTax;

  async function handleSaveAndRegister(submitReviewAfterSave: boolean, bypassAgreementCheck = false) {
    setError(null);
    setSuccessMsg(null);

    const effectiveName = (form.name || String(r?.name ?? "")).trim();
    const effectiveDisplayName = (form.displayName || String(r?.display_name ?? "") || effectiveName).trim();
    const effectiveOwner = (form.ownerName || form.holder || String(r?.owner_name ?? "")).trim();
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
    const pan = (form.pan || String(r?.pan ?? "")).trim().toUpperCase();
    const ifsc = (form.bankIfsc || String(r?.bank_ifsc ?? "")).trim().toUpperCase();
    const gstin = (form.gstin || String(r?.gstin ?? "")).trim().toUpperCase();
    const bankAccount = (form.bankAccount || String(r?.bank_account ?? "")).trim();
    const bankName = (form.bankName || form.holder || String(r?.bank_name ?? "")).trim();

    if (!effectiveName || !effectiveAddress || !effectivePhone) {
      setError(
        "Section 1 Incomplete: Restaurant legal name, contact phone number, and physical kitchen address are required.",
      );
      return;
    }

    if (!bypassAgreementCheck && !allTermsAccepted) {
      setError(
        "Section 4 Incomplete: Please review and accept the Restaurant Partner Commercial Agreement, FSSAI Undertaking, and Privacy/Tax Policy before saving.",
      );
      return;
    }

    if (fssai && !validateFssai(fssai)) {
      setError(
        "Statutory Verification Failed: Invalid 14-digit FSSAI registration number. Must follow the 14-digit FoSCoS state & license structure.",
      );
      return;
    }
    if (pan && !validatePan(pan)) {
      setError(
        "Statutory Verification Failed: Invalid PAN format. Must be 10 alphanumeric characters (e.g. ABCDE1234F).",
      );
      return;
    }
    if (ifsc && !validateIfsc(ifsc)) {
      setError(
        "Statutory Verification Failed: Invalid Bank IFSC code. Must be 4 letters + '0' + 6 alphanumeric characters (e.g. HDFC0001234).",
      );
      return;
    }
    if (gstin && !validateGstin(gstin)) {
      setError(
        "Statutory Verification Failed: Invalid GSTIN format. Must be 15 statutory characters with valid state code.",
      );
      return;
    }

    if (submitReviewAfterSave) {
      if (!validateFssai(fssai)) {
        setError("Verification Submission Blocked: A valid 14-digit FSSAI registration number is mandatory.");
        return;
      }
      if (!validatePan(pan)) {
        setError("Verification Submission Blocked: A valid 10-character PAN is mandatory.");
        return;
      }
      if (!validateIfsc(ifsc) || !bankAccount) {
        setError(
          "Verification Submission Blocked: A valid settlement bank account number and 11-character IFSC code are mandatory.",
        );
        return;
      }
    }

    setBusy(true);
    try {
      let targetRestaurantId = vendor.restaurantId;

      if (!targetRestaurantId) {
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
        targetRestaurantId = created.restaurantId;
      }

      if (targetRestaurantId) {
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
            gstin: gstin || undefined,
            fssaiNumber: fssai || undefined,
            pan: pan || undefined,
            bankAccount: bankAccount || undefined,
            bankIfsc: ifsc || undefined,
            bankName: bankName || undefined,
          },
        });

        if (submitReviewAfterSave) {
          await submitForReview({ data: { restaurantId: targetRestaurantId } });
          setSuccessMsg(
            "Restaurant Partner KYC application submitted for statutory verification. Your outlet status is now PENDING_VERIFICATION.",
          );
        } else {
          setSuccessMsg("Restaurant profile, statutory KYC details, and bank settlement credentials saved.");
          setEditingApproved(false);
        }
      }

      await qc.invalidateQueries();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save onboarding profile");
    } finally {
      setBusy(false);
    }
  }

  const verificationStatus = (r?.verification_status ?? vendor.selected?.verificationStatus ?? "DRAFT") as string;
  const isApproved = verificationStatus === "APPROVED" || verificationStatus === "VERIFIED";
  const isSubmitted =
    verificationStatus === "SUBMITTED" ||
    verificationStatus === "PENDING_APPROVAL" ||
    verificationStatus === "PENDING_VERIFICATION";

  if (vendor.restaurantId && (isApproved || isSubmitted) && !editingApproved) {
    return (
      <VendorShell
        title="Restaurant Partner KYC & Profile"
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
                    VERIFICATION STATUS: {isApproved ? "VERIFIED PARTNER" : "PENDING STATUTORY REVIEW"}
                  </span>
                </div>
                <h1 className="mt-1 font-display text-2xl font-bold text-white">
                  {(r?.name as string) || vendor.selected?.restaurantName || "Registered Restaurant"}
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Governed by the OrderKing Restaurant Partner Agreement, FSSAI Food Safety Act 2006, and CGST Act §9(5).
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
                  Edit KYC / Bank Details
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
                <span>2. Statutory KYC &amp; Bank Settlement</span>
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

          <Card className="border-slate-800 bg-slate-900/60 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-200">Statutory Document Vault</h3>
                <p className="text-xs text-slate-400">
                  Upload or renew your FSSAI license, PAN card, and menu rate card anytime.
                </p>
              </div>
              <span className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300">
                {uploadedDocs.length} ON FILE
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <DocumentUpload restaurantId={vendor.restaurantId} kind="FSSAI_DOC" label="FSSAI License Certificate" />
              <DocumentUpload restaurantId={vendor.restaurantId} kind="PAN_DOC" label="Business / Proprietor PAN" />
              <DocumentUpload restaurantId={vendor.restaurantId} kind="MENU_IMAGES" label="Printed Menu / Rate Card" />
            </div>
            {uploadedDocs.length > 0 ? (
              <div className="pt-3 border-t border-slate-800/80 space-y-1.5">
                <div className="text-[11px] font-mono uppercase text-slate-400">Uploaded Compliance Records</div>
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
          </Card>
        </div>
      </VendorShell>
    );
  }

  return (
    <VendorShell
      title="Restaurant Partner Onboarding & KYC"
      dataLabel={vendor.dataLabel}
      restaurantName={vendor.selected?.restaurantName}
    >
      <div className="max-w-3xl mx-auto space-y-6 py-2">
        {/* Institutional Header */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-400" />
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">
                  OrderKing Restaurant Partner Self-Service Empanelment
                </span>
              </div>
              <h1 className="mt-1 font-display text-xl sm:text-2xl font-bold text-white">
                Restaurant Partner Onboarding &amp; Statutory KYC
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Complete or update all 4 sections below to register your outlet, verify food safety credentials, and configure NEFT/IMPS settlements.
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

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 text-xs">
            <div>
              <span className="text-slate-500 font-mono text-[10px] block">SECTION 1</span>
              <span className="font-medium text-slate-200">Identity &amp; Address</span>
            </div>
            <div>
              <span className="text-slate-500 font-mono text-[10px] block">SECTION 2</span>
              <span className="font-medium text-slate-200">FSSAI, GSTIN &amp; PAN</span>
            </div>
            <div>
              <span className="text-slate-500 font-mono text-[10px] block">SECTION 3</span>
              <span className="font-medium text-slate-200">Bank Account &amp; IFSC</span>
            </div>
            <div>
              <span className="text-slate-500 font-mono text-[10px] block">SECTION 4</span>
              <span className="font-medium text-emerald-400">Partner Agreement</span>
            </div>
          </div>
        </div>

        {error ? (
          <div className="rounded-lg border border-rose-500/30 bg-rose-950/20 p-3.5 text-xs text-rose-300">
            {error}
          </div>
        ) : null}

        {successMsg ? (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-3.5 text-xs text-emerald-300">
            {successMsg}
          </div>
        ) : null}

        {/* SECTION 1: RESTAURANT IDENTITY & ADDRESS */}
        <Card className="border-slate-800 bg-slate-900/80 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <Building2 className="size-5 text-emerald-400" />
              <div>
                <h2 className="font-display text-base font-bold text-white">
                  1. Restaurant Identity &amp; Physical Address
                </h2>
                <p className="text-xs text-slate-400">
                  Provide your trade name, primary cuisine, and verifiable kitchen pickup location.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono text-slate-400">SECTION 1 OF 4</span>
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
              onChange={(v) => setForm({ ...form, ownerName: v })}
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

          <div className="pt-2 border-t border-slate-800/80">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={form.seedSim}
                onChange={(e) => setForm({ ...form, seedSim: e.target.checked })}
                className="mt-0.5 rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
              />
              <div>
                <span className="font-medium text-slate-200">
                  Load sample menu items for initial setup testing (Optional)
                </span>
                <p className="text-[11px] text-slate-400">
                  Leave unchecked to start with a blank menu catalogue and add your own dishes directly.
                </p>
              </div>
            </label>
          </div>
        </Card>

        {/* SECTION 2: STATUTORY FOOD SAFETY & TAX CREDENTIALS */}
        <Card className="border-slate-800 bg-slate-900/80 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <FileText className="size-5 text-emerald-400" />
              <div>
                <h2 className="font-display text-base font-bold text-white">
                  2. Statutory Food Safety &amp; Tax Credentials
                </h2>
                <p className="text-xs text-slate-400">
                  Mandatory under the Food Safety and Standards Act, 2006 (FoSCoS) and Income Tax Act Section 194-O.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono text-slate-400">SECTION 2 OF 4</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field
              label="14-Digit FSSAI License Number *"
              placeholder="e.g. 11223344556677"
              value={form.fssaiNumber || String(r?.fssai_number ?? "")}
              onChange={(v) => setForm({ ...form, fssaiNumber: v.replace(/\D/g, "").slice(0, 14) })}
            />
            <Field
              label="Business / Proprietor PAN *"
              placeholder="e.g. ABCDE1234F"
              value={form.pan || String(r?.pan ?? "")}
              onChange={(v) => setForm({ ...form, pan: v.toUpperCase().slice(0, 10) })}
            />
            <Field
              label="15-Digit GSTIN (If GST Registered)"
              placeholder="e.g. 29ABCDE1234F1Z5"
              value={form.gstin || String(r?.gstin ?? "")}
              onChange={(v) => setForm({ ...form, gstin: v.toUpperCase().slice(0, 15) })}
            />
          </div>

          {vendor.restaurantId ? (
            <div className="pt-2 space-y-2 border-t border-slate-800/80">
              <div className="text-xs font-semibold text-slate-300">
                Upload Supporting Statutory Documents (PDF / JPG / PNG)
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <DocumentUpload restaurantId={vendor.restaurantId} kind="FSSAI_DOC" label="FSSAI License Copy" />
                <DocumentUpload restaurantId={vendor.restaurantId} kind="PAN_DOC" label="PAN Card Copy" />
                <DocumentUpload restaurantId={vendor.restaurantId} kind="MENU_IMAGES" label="Restaurant Rate Card" />
              </div>
            </div>
          ) : null}
        </Card>

        {/* SECTION 3: PAYOUT BANK ACCOUNT & IFSC */}
        <Card className="border-slate-800 bg-slate-900/80 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <Banknote className="size-5 text-emerald-400" />
              <div>
                <h2 className="font-display text-base font-bold text-white">
                  3. Payout Bank Account &amp; IFSC
                </h2>
                <p className="text-xs text-slate-400">
                  Used for automated weekly NEFT/IMPS settlement transfers of net restaurant payables.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono text-slate-400">SECTION 3 OF 4</span>
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

        {/* SECTION 4: MANDATORY RESTAURANT PARTNER AGREEMENT, FOOD SAFETY UNDERTAKING & PRIVACY POLICY */}
        <Card className="border-slate-800 bg-slate-900/80 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <Scale className="size-5 text-emerald-400" />
              <div>
                <h2 className="font-display text-base font-bold text-white">
                  4. Mandatory Restaurant Partner Agreement, Food Safety Undertaking &amp; Privacy Policy
                </h2>
                <p className="text-xs text-slate-400">
                  Please review the binding statutory and commercial covenants before submitting your onboarding form.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono text-slate-400">SECTION 4 OF 4</span>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950/90 p-3.5 text-xs text-slate-300 space-y-2 max-h-48 overflow-y-auto">
            <p className="font-semibold text-white">
              Summary of Key Covenants (OrderKing Restaurant Partner Terms):
            </p>
            <p>
              <strong>1. Commercial Formula &amp; Integer-Paise Accounting:</strong> Net Restaurant Payable is computed in exact integer paise as:{" "}
              <em>Food Value + Packaging Charges − Restaurant-Funded Discount − Platform Commission + Platform-Funded Promo − Refund Adjustments</em>.
            </p>
            <p>
              <strong>2. Statutory Tax Compliance:</strong> OrderKing collects and remits 5% GST on restaurant services notified under Section 9(5) of the CGST Act, 2017 (where applicable), deducts 1% TDS under Section 194-O of the Income Tax Act, 1961, and collects 1% TCS under Section 52 of the CGST Act. Quarterly Form 16A / GSTR-8 statements are reconciled against your registered PAN and GSTIN.
            </p>
            <p>
              <strong>3. FSSAI Hygiene &amp; Allergen Undertaking:</strong> The Restaurant Partner warrants that it holds an active 14-digit FSSAI license, uses food-grade tamper-evident packaging, strictly separates Vegetarian (Green Dot) and Non-Vegetarian (Brown/Red Dot) preparation surfaces, and accurately discloses allergens and nutritional details.
            </p>
            <p>
              <strong>4. Data Protection (DPDP Act, 2023 &amp; IT Act, 2000):</strong> Customer delivery coordinates and phone numbers are shared strictly for order fulfillment and may not be retained or used for unsolicited marketing.
            </p>
          </div>

          <div className="space-y-3 pt-1">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-200">
              <input
                type="checkbox"
                checked={agreements.commercialTerms}
                onChange={(e) => setAgreements({ ...agreements, commercialTerms: e.target.checked })}
                className="mt-0.5 rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
              />
              <span>
                I have read and accept the <strong>OrderKing Restaurant Partner Commercial Agreement</strong>, including the platform commission structure, order preparation SLAs, and refund attribution rules. *
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-200">
              <input
                type="checkbox"
                checked={agreements.fssaiUndertaking}
                onChange={(e) => setAgreements({ ...agreements, fssaiUndertaking: e.target.checked })}
                className="mt-0.5 rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
              />
              <span>
                I execute the <strong>FSSAI Food Safety, Hygiene &amp; Allergen Undertaking</strong> and confirm that our 14-digit FSSAI registration is valid and active under the Food Safety and Standards Act, 2006. *
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-200">
              <input
                type="checkbox"
                checked={agreements.privacyAndTax}
                onChange={(e) => setAgreements({ ...agreements, privacyAndTax: e.target.checked })}
                className="mt-0.5 rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500"
              />
              <span>
                I agree to the <strong>Merchant Privacy Policy (DPDP Act, 2023)</strong> and authorize statutory tax deductions and remittances under <strong>CGST Act §9(5), TCS §52, and Income Tax Act §194-O</strong>. *
              </span>
            </label>
          </div>

          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <CheckCircle2 className={`size-4 ${allTermsAccepted ? "text-emerald-400" : "text-slate-600"}`} />
              {allTermsAccepted
                ? "All mandatory statutory & commercial undertakings accepted."
                : "Accept all 3 statutory checkboxes above to enable submission."}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                variant="secondary"
                disabled={busy || !allTermsAccepted}
                onClick={() => void handleSaveAndRegister(false)}
                className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs"
              >
                {busy ? "Saving..." : "Save KYC Profile"}
              </Button>
              <Button
                disabled={busy || !allTermsAccepted}
                onClick={() => void handleSaveAndRegister(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-5"
              >
                {busy ? "Submitting KYC..." : "Submit Restaurant Partner KYC"}
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
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-slate-300">{label}</Label>
      <Input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="border-slate-800 bg-slate-950 text-slate-100 placeholder:text-slate-600 focus:border-emerald-500 text-xs h-9"
      />
    </div>
  );
}

function DocumentUpload({ restaurantId, kind, label }: { restaurantId: string; kind: string; label: string }) {
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
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(new Error("read failed"));
            reader.readAsDataURL(file);
          });
          try {
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
            setMsg(err instanceof Error ? err.message : "Upload failed");
          } finally {
            setUploading(false);
          }
        }}
      />
      {msg ? <p className="text-[11px] text-emerald-400 font-mono">{msg}</p> : null}
    </div>
  );
}
