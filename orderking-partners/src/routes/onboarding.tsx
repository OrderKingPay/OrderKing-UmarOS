import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { VendorShell } from "@/components/vendor-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { useT } from "@/components/use-t";
import { useVendor } from "@/components/use-vendor";
import {
  createRestaurantDraft,
  getRestaurant,
  submitForReview,
  updateRestaurantProfile,
  uploadDocument,
} from "@/lib/server/api-bootstrap";
import {
  ShieldCheck,
  Zap,
  ArrowRight,
  CheckCircle2,
  Clock,
  Banknote,
  Building2,
  ChefHat,
  ArrowUpRight,
  FileText,
  Store,
} from "lucide-react";

export const Route = createFileRoute("/onboarding")({ component: OnboardingPage });

function OnboardingPage() {
  const t = useT();
  const nav = useNavigate();
  const qc = useQueryClient();
  const vendor = useVendor();

  const restQ = useQuery({
    queryKey: ["restaurant", vendor.restaurantId],
    queryFn: () => getRestaurant({ data: { restaurantId: vendor.restaurantId } }),
    enabled: Boolean(vendor.restaurantId),
  });

  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    displayName: "",
    ownerName: "",
    phone: "",
    email: "",
    address: "",
    landmark: "",
    cuisine: "Multi-Cuisine",
    diet: "NONVEG",
    description: "",
    gstin: "",
    fssaiNumber: "",
    pan: "",
    bankAccount: "",
    bankIfsc: "",
  });

  const r = restQ.data?.restaurant as Record<string, unknown> | undefined;

  async function handleDeployStep1() {
    setError(null);
    if (!form.name.trim() || !form.address.trim() || !form.phone.trim()) {
      setError("Restaurant name, phone number, and physical address are required for deployment.");
      return;
    }

    if (!vendor.restaurantId) {
      setBusy(true);
      try {
        await createRestaurantDraft({
          data: {
            name: form.name.trim(),
            displayName: form.displayName.trim() || form.name.trim(),
            ownerName: form.ownerName.trim(),
            phone: form.phone.trim(),
            email: form.email.trim(),
            address: form.address.trim(),
            landmark: form.landmark.trim(),
            cuisine: form.cuisine.trim(),
            diet: form.diet,
            description: form.description.trim(),
          },
        });
        await qc.invalidateQueries();
        setSuccessMsg("Restaurant deployed in under 60 seconds! Commercial terms: ₹0.00 setup fees locked.");
        setStep(2);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Deployment failed");
      } finally {
        setBusy(false);
      }
    } else {
      setStep(2);
    }
  }

  async function handleSaveStep2(skip = false) {
    setError(null);
    if (skip) {
      setStep(3);
      return;
    }

    if (!vendor.restaurantId) {
      setStep(3);
      return;
    }

    setBusy(true);
    try {
      await updateRestaurantProfile({
        data: {
          restaurantId: vendor.restaurantId,
          gstin: form.gstin.trim(),
          fssaiNumber: form.fssaiNumber.trim(),
          pan: form.pan.trim(),
          bankAccount: form.bankAccount.trim(),
          bankIfsc: form.bankIfsc.trim().toUpperCase(),
          cuisine: form.cuisine.trim(),
          description: form.description.trim(),
        },
      });
      await qc.invalidateQueries({ queryKey: ["restaurant"] });
      setSuccessMsg("Direct settlement and regulatory KYC saved.");
      setStep(3);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save settlement details");
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmitReview() {
    if (!vendor.restaurantId) return;
    setBusy(true);
    setError(null);
    try {
      await submitForReview({ data: { restaurantId: vendor.restaurantId } });
      await qc.invalidateQueries();
      setSuccessMsg("Application submitted for fast-track activation.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not submit application");
    } finally {
      setBusy(false);
    }
  }

  const verificationStatus = (r?.verification_status ?? vendor.selected?.verificationStatus ?? "DRAFT") as string;
  const isApproved = verificationStatus === "APPROVED";
  const isSubmitted = verificationStatus === "SUBMITTED" || verificationStatus === "PENDING_APPROVAL";

  // If the restaurant already exists and is in review or approved, show the pure enterprise operational console
  if (vendor.restaurantId && (isApproved || isSubmitted)) {
    return (
      <VendorShell title="Merchant Operational Console" dataLabel={vendor.dataLabel} restaurantName={vendor.selected?.restaurantName}>
        <div className="space-y-5 max-w-4xl mx-auto py-2">
          {/* Institutional Header Banner */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`inline-block size-2 rounded-full ${isApproved ? "bg-emerald-400" : "bg-amber-400 animate-pulse"}`} />
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                    ACQUISITION STATUS: {isApproved ? "PRODUCTION APPROVED" : "FAST-TRACK VERIFICATION ACTIVE"}
                  </span>
                </div>
                <h1 className="mt-1 font-display text-2xl font-bold text-white">
                  {(r?.name as string) || vendor.selected?.restaurantName || "Your Restaurant"}
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Commercial Guarantee: Zero Setup Fees. Zero Hidden Charges. Live in 60 Seconds.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-mono font-semibold text-emerald-400">
                  ₹0.00 SETUP FEE
                </span>
                <span className="rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-mono text-slate-300">
                  DIRECT BANK SETTLEMENT
                </span>
              </div>
            </div>

            {/* Operational Quick-Launch Bar */}
            <div className="pt-4 flex flex-wrap gap-3">
              <Button asChild size="md" className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-md shadow-emerald-950">
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
                  <ArrowUpRight className="mr-2 size-4" /> Live Dashboard
                </Link>
              </Button>
              <Button asChild variant="secondary" className="border-slate-800 bg-slate-800/80 hover:bg-slate-700 text-slate-200">
                <Link to="/settlements">
                  <Banknote className="mr-2 size-4" /> Settlement Ledger
                </Link>
              </Button>
            </div>
          </div>

          {/* Operational Metrics & Registered Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-slate-800 bg-slate-900/60 p-5 space-y-3">
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Restaurant Identity</span>
                <Building2 className="size-4 text-emerald-400" />
              </div>
              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-500">Legal Name</span>
                  <span className="font-medium text-slate-200">{(r?.name as string) || "—"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-500">Phone</span>
                  <span className="font-mono text-slate-200">{(r?.phone as string) || "—"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-500">Address</span>
                  <span className="text-slate-200 max-w-[200px] text-right truncate">{(r?.address as string) || "—"}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Cuisine</span>
                  <span className="text-slate-200">{(r?.cuisine as string) || "Multi-Cuisine"}</span>
                </div>
              </div>
            </Card>

            <Card className="border-slate-800 bg-slate-900/60 p-5 space-y-3">
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Settlement & Regulatory KYC</span>
                <Banknote className="size-4 text-emerald-400" />
              </div>
              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-500">FSSAI License</span>
                  <span className="font-mono text-slate-200">{(r?.fssai_number as string) || "Pending Upload"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-500">PAN Card</span>
                  <span className="font-mono text-slate-200">{(r?.pan as string) || "Pending Upload"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-500">Settlement Route</span>
                  <span className="text-emerald-400 font-mono">Direct Automated IMPS/NEFT</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Gateway Charges</span>
                  <span className="font-mono font-bold text-emerald-400">₹0.00 (Zero Surcharge)</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Document Section */}
          <Card className="border-slate-800 bg-slate-900/60 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-200">Operational Document Vault</h3>
                <p className="text-xs text-slate-400">Keep regulatory compliance active for unrestricted settlement dispatch.</p>
              </div>
              <span className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-300">
                SECURE VAULT
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <DocumentUpload restaurantId={vendor.restaurantId} kind="FSSAI_DOC" label="FSSAI Certificate" />
              <DocumentUpload restaurantId={vendor.restaurantId} kind="PAN_DOC" label="PAN Document" />
              <DocumentUpload restaurantId={vendor.restaurantId} kind="MENU_IMAGES" label="Menu Catalogue / Card" />
            </div>
          </Card>
        </div>
      </VendorShell>
    );
  }

  // Active Onboarding Flow
  return (
    <VendorShell title="Zero-Fee Merchant Acquisition" dataLabel={vendor.dataLabel} restaurantName={vendor.selected?.restaurantName}>
      <div className="max-w-3xl mx-auto space-y-6 py-2">
        {/* Weaponized Zero-Fee Acquisition Protocol Banner */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-block size-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  Direct Merchant Acquisition Protocol
                </span>
              </div>
              <h1 className="mt-1 font-display text-xl sm:text-2xl font-bold text-white">
                Zero Setup Fees. Zero Hidden Charges. Live in 60 Seconds.
              </h1>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-mono font-bold text-emerald-400">
                ₹0 SETUP FEE
              </span>
              <span className="rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-mono text-slate-300">
                NO GATEWAY BARRIERS
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 text-xs">
            <div>
              <span className="text-slate-500 font-mono text-[10px] block">COMMERCIAL LEVY</span>
              <span className="font-semibold text-emerald-400">₹0.00 Waived</span>
            </div>
            <div>
              <span className="text-slate-500 font-mono text-[10px] block">GATEWAY FRICTION</span>
              <span className="font-medium text-slate-200">Stripped / Bypassed</span>
            </div>
            <div>
              <span className="text-slate-500 font-mono text-[10px] block">DEPLOYMENT SLA</span>
              <span className="font-medium text-amber-400">&le; 60 Seconds</span>
            </div>
            <div>
              <span className="text-slate-500 font-mono text-[10px] block">SETTLEMENT CYCLE</span>
              <span className="font-medium text-slate-200">Direct Bank Deposit</span>
            </div>
          </div>
        </div>

        {/* Step Progression Bar */}
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex-1 space-y-1">
            <div className={`h-1.5 rounded-full ${step >= 1 ? "bg-emerald-500" : "bg-slate-800"}`} />
            <span className="text-[10px] font-mono uppercase text-slate-400">1. Instant Deployment</span>
          </div>
          <div className="flex-1 space-y-1">
            <div className={`h-1.5 rounded-full ${step >= 2 ? "bg-emerald-500" : "bg-slate-800"}`} />
            <span className="text-[10px] font-mono uppercase text-slate-400">2. Direct Settlement</span>
          </div>
          <div className="flex-1 space-y-1">
            <div className={`h-1.5 rounded-full ${step >= 3 ? "bg-emerald-500" : "bg-slate-800"}`} />
            <span className="text-[10px] font-mono uppercase text-slate-400">3. Kitchen Launch</span>
          </div>
        </div>

        {error ? (
          <div className="rounded-lg border border-rose-500/30 bg-rose-950/20 p-3 text-xs text-rose-300">
            {error}
          </div>
        ) : null}

        {successMsg ? (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-3 text-xs text-emerald-300">
            {successMsg}
          </div>
        ) : null}

        {/* STEP 1: RESTAURANT IDENTITY & DEPLOYMENT (Under 60 Seconds) */}
        {step === 1 && (
          <Card className="border-slate-800 bg-slate-900/80 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="font-display text-lg font-bold text-white">Step 1: Restaurant Deployment</h2>
                <p className="text-xs text-slate-400">Enter essential storefront details to deploy live in sixty seconds.</p>
              </div>
              <span className="text-xs font-mono text-emerald-400">SLA: 60s</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field
                label="Restaurant Name *"
                placeholder="e.g. Royal Biryani House"
                value={form.name}
                onChange={(v) => setForm({ ...form, name: v, displayName: form.displayName || v })}
              />
              <Field
                label="Brand / Display Name"
                placeholder="e.g. Royal Biryani"
                value={form.displayName}
                onChange={(v) => setForm({ ...form, displayName: v })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field
                label="Direct Phone Number *"
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={(v) => setForm({ ...form, phone: v })}
              />
              <Field
                label="Owner / Contact Name"
                placeholder="e.g. Rajesh Kumar"
                value={form.ownerName}
                onChange={(v) => setForm({ ...form, ownerName: v })}
              />
            </div>

            <Field
              label="Physical Kitchen Address (City, Pincode) *"
              placeholder="Shop 4, MG Road, Indiranagar, Bengaluru, 560038"
              value={form.address}
              onChange={(v) => setForm({ ...form, address: v })}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field
                label="Primary Cuisine"
                placeholder="e.g. Biryani, North Indian, Pizza, Chinese"
                value={form.cuisine}
                onChange={(v) => setForm({ ...form, cuisine: v })}
              />
              <div>
                <Label className="text-xs text-slate-300">Food Classification</Label>
                <select
                  value={form.diet}
                  onChange={(e) => setForm({ ...form, diet: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="NONVEG">Non-Vegetarian & Vegetarian</option>
                  <option value="VEG">Pure Vegetarian</option>
                  <option value="PURE_VEG">100% Jain / Pure Veg</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-800">
              <span className="text-[11px] text-slate-400 font-mono">
                Setup Fee: ₹0.00 • No credit card required
              </span>
              <Button
                disabled={busy}
                onClick={() => void handleDeployStep1()}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-md shadow-emerald-950 h-10 px-5"
              >
                {busy ? "Deploying Kitchen..." : "Deploy Restaurant (Live in 60s)"}
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </div>
          </Card>
        )}

        {/* STEP 2: DIRECT SETTLEMENT & REGULATORY KYC (Frictionless) */}
        {step === 2 && (
          <Card className="border-slate-800 bg-slate-900/80 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="font-display text-lg font-bold text-white">Step 2: Direct Settlement & KYC</h2>
                <p className="text-xs text-slate-400">
                  Zero gateway middlemen. Payouts arrive directly via automated NEFT/IMPS.
                </p>
              </div>
              <span className="text-xs font-mono text-emerald-400">DIRECT ACH</span>
            </div>

            <div className="rounded-lg border border-emerald-500/20 bg-emerald-950/10 p-3 text-xs text-slate-300">
              <span className="font-semibold text-emerald-400">Frictionless Payout Guarantee:</span> OrderKing bypasses complex third-party payment gateway merchant integrations. You can fill your bank details now, or skip and provide them before your first weekly settlement.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field
                label="FSSAI License Number"
                placeholder="14-digit registration number"
                value={form.fssaiNumber || String(r?.fssai_number ?? "")}
                onChange={(v) => setForm({ ...form, fssaiNumber: v })}
              />
              <Field
                label="PAN Number (Restaurant / Proprietor)"
                placeholder="e.g. ABCDE1234F"
                value={form.pan || String(r?.pan ?? "")}
                onChange={(v) => setForm({ ...form, pan: v.toUpperCase() })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field
                label="Settlement Bank Account Number"
                placeholder="e.g. 50100234567890"
                value={form.bankAccount}
                onChange={(v) => setForm({ ...form, bankAccount: v })}
              />
              <Field
                label="Bank IFSC Code"
                placeholder="e.g. HDFC0001234"
                value={form.bankIfsc}
                onChange={(v) => setForm({ ...form, bankIfsc: v.toUpperCase() })}
              />
            </div>

            <Field
              label="GSTIN (Optional — If Registered)"
              placeholder="e.g. 29ABCDE1234F1Z5"
              value={form.gstin || String(r?.gstin ?? "")}
              onChange={(v) => setForm({ ...form, gstin: v.toUpperCase() })}
            />

            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800">
              <Button
                variant="secondary"
                onClick={() => setStep(1)}
                className="border-slate-800 bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Back
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() => void handleSaveStep2(true)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Complete Later (Skip to Launch)
                </Button>
                <Button
                  disabled={busy}
                  onClick={() => void handleSaveStep2(false)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-md shadow-emerald-950"
                >
                  {busy ? "Saving KYC..." : "Save & Continue to Documents"}
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* STEP 3: DOCUMENT VERIFICATION & OPERATIONS LAUNCH */}
        {step === 3 && vendor.restaurantId && (
          <div className="space-y-4">
            <Card className="border-slate-800 bg-slate-900/80 p-6 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h2 className="font-display text-lg font-bold text-white">Step 3: Document Vault & Kitchen Launch</h2>
                  <p className="text-xs text-slate-400">
                    Upload your digital menu and statutory proofs. You can begin configuring items immediately.
                  </p>
                </div>
                <span className="text-xs font-mono text-emerald-400">READY</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                <DocumentUpload restaurantId={vendor.restaurantId} kind="FSSAI_DOC" label="FSSAI Certificate" />
                <DocumentUpload restaurantId={vendor.restaurantId} kind="PAN_DOC" label="PAN Card" />
                <DocumentUpload restaurantId={vendor.restaurantId} kind="MENU_IMAGES" label="Restaurant Menu Card" />
              </div>
            </Card>

            <Card className="border-slate-800 bg-slate-900/80 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-100">Ready for Live Kitchen Operations</h3>
                <p className="text-xs text-slate-400">
                  Your restaurant draft is active. Zero setup fees applied.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setStep(2)}
                  className="border-slate-800 bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Back
                </Button>
                <Button
                  disabled={busy || vendor.dataLabel === "SIMULATED"}
                  onClick={() => void handleSubmitReview()}
                  className="border-emerald-500/30 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/40"
                >
                  {busy ? "Submitting..." : "Submit For Admin Review"}
                </Button>
                <Button asChild className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-md shadow-emerald-950">
                  <Link to="/kitchen">
                    Launch Kitchen Display <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
              </div>
            </Card>
          </div>
        )}
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
          <span className="text-[10px] font-mono text-slate-500">OPTIONAL</span>
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
            setMsg(`Recorded locally (${res.verificationStatus})`);
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
