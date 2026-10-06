import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
  const [form, setForm] = useState({
    name: "",
    displayName: "",
    ownerName: "",
    phone: "",
    email: "",
    address: "",
    landmark: "",
    cuisine: "",
    diet: "NONVEG",
    description: "",
    gstin: "",
    fssaiNumber: "",
    pan: "",
    bankAccount: "",
    bankIfsc: "",
  });

  const r = restQ.data?.restaurant as Record<string, unknown> | undefined;
  
  // Strict geographic check simulated
  const serviceableCities = ["mumbai", "delhi", "bengaluru", "bangalore", "hyderabad"];
  function isServiceable(addr: string) {
    const lower = addr.toLowerCase();
    return serviceableCities.some(city => lower.includes(city));
  }

  async function handleNextStep() {
    setError(null);
    if (step === 1) {
      if (!form.name || !form.address || !form.phone) {
        setError("Please fill all mandatory basic fields.");
        return;
      }
      if (!isServiceable(form.address)) {
        setError("We are sorry! OrderKing does not service your area yet. Currently serviceable: Mumbai, Delhi, Bengaluru, Hyderabad.");
        return;
      }
      if (!vendor.restaurantId) {
        await createReal();
      }
      setStep(2);
    } else if (step === 2) {
      if (!form.fssaiNumber || !form.pan || !form.bankAccount || !form.bankIfsc) {
        setError("FSSAI, PAN, and Bank details are strictly mandatory for KYC.");
        return;
      }
      await saveMore();
      setStep(3);
    }
  }

  async function createReal() {
    setBusy(true);
    try {
      await createRestaurantDraft({
        data: {
          name: form.name,
          displayName: form.displayName || form.name,
          ownerName: form.ownerName,
          phone: form.phone,
          email: form.email,
          address: form.address,
          landmark: form.landmark,
          cuisine: form.cuisine,
          diet: form.diet,
          description: form.description,
        },
      });
      await qc.invalidateQueries();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
      throw e;
    } finally {
      setBusy(false);
    }
  }

  async function saveMore() {
    if (!vendor.restaurantId) return;
    setBusy(true);
    try {
      await updateRestaurantProfile({
        data: {
          restaurantId: vendor.restaurantId,
          gstin: form.gstin,
          fssaiNumber: form.fssaiNumber,
          pan: form.pan,
          bankAccount: form.bankAccount,
          bankIfsc: form.bankIfsc,
          cuisine: form.cuisine,
          description: form.description,
        },
      });
      await qc.invalidateQueries({ queryKey: ["restaurant"] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
      throw e;
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    if (!vendor.restaurantId) return;
    setBusy(true);
    setError(null);
    try {
      await submitForReview({ data: { restaurantId: vendor.restaurantId } });
      await qc.invalidateQueries();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not submit");
    } finally {
      setBusy(false);
    }
  }

  const isVerified = (r?.verification_status ?? vendor.selected?.verificationStatus) === "APPROVED";
  const isPending = (r?.verification_status ?? vendor.selected?.verificationStatus) === "PENDING_APPROVAL";

  if (isVerified || isPending) {
    return (
      <VendorShell title="Application Status" dataLabel={vendor.dataLabel} restaurantName={vendor.selected?.restaurantName}>
        <div className="space-y-4">
          <Card>
            <div className="text-xs uppercase tracking-wide text-muted">Status</div>
            <div className="font-display text-2xl">{isVerified ? "APPROVED" : "PENDING APPROVAL"}</div>
            <p className="mt-1 text-sm text-muted">
              {isVerified ? "Your restaurant is approved!" : "Your application is under review by the founder team."}
            </p>
          </Card>
        </div>
      </VendorShell>
    );
  }

  return (
    <VendorShell title={t("onboarding.title")} dataLabel={vendor.dataLabel} restaurantName={vendor.selected?.restaurantName}>
      <div className="space-y-6">
        <div className="flex gap-2">
           {[1, 2, 3].map(s => (
             <div key={s} className={`h-2 flex-1 rounded ${step >= s ? 'bg-primary' : 'bg-muted'}`} />
           ))}
        </div>

        {step === 1 && (
          <Card className="space-y-3">
            <h2 className="font-display text-xl">Step 1: Restaurant Details</h2>
            <p className="text-sm text-muted">Enter basic restaurant information and location.</p>
            <Field label="Restaurant Name *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <Field label="Owner Name" value={form.ownerName} onChange={(v) => setForm({ ...form, ownerName: v })} />
            <Field label="Phone *" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            <Field label="Full Address (include City) *" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
            <Field label="Cuisine" value={form.cuisine} onChange={(v) => setForm({ ...form, cuisine: v })} />
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <Button disabled={busy} onClick={() => void handleNextStep()}>Next: KYC Details</Button>
          </Card>
        )}

        {step === 2 && (
          <Card className="space-y-3">
            <h2 className="font-display text-xl">Step 2: Mandatory KYC</h2>
            <p className="text-sm text-muted">Please provide valid tax and bank information.</p>
            <Field label="FSSAI License Number *" value={form.fssaiNumber || String(r?.fssai_number ?? "")} onChange={(v) => setForm({ ...form, fssaiNumber: v })} />
            <Field label="PAN Card Number *" value={form.pan || String(r?.pan ?? "")} onChange={(v) => setForm({ ...form, pan: v })} />
            <Field label="GSTIN (Optional)" value={form.gstin || String(r?.gstin ?? "")} onChange={(v) => setForm({ ...form, gstin: v })} />
            <Field label="Bank Account Number *" value={form.bankAccount} onChange={(v) => setForm({ ...form, bankAccount: v })} />
            <Field label="Bank IFSC Code *" value={form.bankIfsc} onChange={(v) => setForm({ ...form, bankIfsc: v })} />
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
              <Button disabled={busy} onClick={() => void handleNextStep()}>Next: Document Upload</Button>
            </div>
          </Card>
        )}

        {step === 3 && vendor.restaurantId && (
          <div className="space-y-4">
             <Card>
               <h2 className="font-display text-xl">Step 3: Document Uploads</h2>
               <p className="text-sm text-muted">Upload photos of Menu, FSSAI, and PAN.</p>
             </Card>
             <DocumentUpload restaurantId={vendor.restaurantId} kind="FSSAI_DOC" label="FSSAI Certificate Image" />
             <DocumentUpload restaurantId={vendor.restaurantId} kind="PAN_DOC" label="PAN Card Image" />
             <DocumentUpload restaurantId={vendor.restaurantId} kind="MENU_IMAGES" label="Restaurant Menu Images" />
             {error ? <p className="text-sm text-danger">{error}</p> : null}
             <div className="flex gap-2">
               <Button variant="secondary" onClick={() => setStep(2)}>Back</Button>
               <Button disabled={busy || vendor.dataLabel === "SIMULATED"} onClick={() => void submit()}>Submit Application</Button>
             </div>
          </div>
        )}
      </div>
    </VendorShell>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function DocumentUpload({ restaurantId, kind, label }: { restaurantId: string, kind: string, label: string }) {
  const t = useT();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <Card className="space-y-2">
      <h3 className="font-medium">{label}</h3>
      <input
        type="file"
        accept="application/pdf,image/jpeg,image/png,image/webp"
        className="block w-full text-sm"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
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
            setMsg(`Uploaded (${res.storage}). Status ${res.verificationStatus}.`);
          } catch (err) {
            setMsg(err instanceof Error ? err.message : "Upload failed");
          }
        }}
      />
      {msg ? <p className="text-sm text-muted">{msg}</p> : null}
    </Card>
  );
}


