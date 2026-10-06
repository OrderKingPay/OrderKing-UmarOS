import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/rider/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardMeta, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { errorMessage } from "@/lib/client/errors";
import { useI18n } from "@/lib/rider/i18n-context";
import { ZONES } from "@/lib/rider/catalog";
import { bootstrapRiderFn, saveProfileFn, submitKycFn } from "@/lib/server/rider-fns";
import type { RiderProfile, RiderType, VehicleType } from "@/lib/rider/types";
import { useEffect, useState, type ComponentProps } from "react";

export const Route = createFileRoute("/onboarding")({ component: Page });

function Page() {
  const { t } = useI18n();
  const [rider, setRider] = useState<RiderProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    void bootstrapRiderFn()
      .then(setRider)
      .catch((e) => setError(errorMessage(e, t("connectionLostBody"))));
  }, [t]);

  async function save(patch: Partial<RiderProfile>) {
    setPending(true);
    try {
      const next = await saveProfileFn({ data: patch });
      setRider(next);
      setError(null);
    } catch (e) {
      setError(errorMessage(e, t("actionNotConfirmed")));
      throw e;
    } finally {
      setPending(false);
    }
  }

  const serviceableCities = ["mumbai", "delhi", "bengaluru", "bangalore", "hyderabad"];
  function isServiceable(addr: string) {
    const lower = addr.toLowerCase();
    return serviceableCities.some(city => lower.includes(city));
  }

  async function handleNextStep() {
    setError(null);
    if (!rider) return;

    if (step === 1) {
      if (!rider.fullName || !rider.phone || !rider.address || !rider.dateOfBirth) {
         setError("Please fill all basic details including Full Name, Phone, Address, and DOB.");
         return;
      }
      if (!isServiceable(rider.address)) {
         setError("We currently do not onboard riders in your area. Serviceable areas: Mumbai, Delhi, Bengaluru, Hyderabad.");
         return;
      }
      await save({ fullName: rider.fullName, phone: rider.phone, address: rider.address, dateOfBirth: rider.dateOfBirth });
      setStep(2);
    } else if (step === 2) {
      if (!rider.licenceNumber || !rider.vehicleRegistration || !rider.governmentIdLast4) {
         setError("Driving License, Vehicle RC, and Aadhar details are strictly mandatory for KYC.");
         return;
      }
      await save({ licenceNumber: rider.licenceNumber, vehicleRegistration: rider.vehicleRegistration, governmentIdLast4: rider.governmentIdLast4 });
      setStep(3);
    }
  }

  async function submit() {
    if (!rider?.payoutUpi) {
       setError("Bank/UPI details are required before final submission.");
       return;
    }
    setPending(true);
    setError(null);
    try {
      await save({ payoutUpi: rider.payoutUpi });
      setRider(await submitKycFn());
    } catch (e) {
      setError(errorMessage(e, t("actionNotConfirmed")));
    } finally {
      setPending(false);
    }
  }

  if (!rider) {
    return (
      <AppShell>
        <p className="text-sm text-muted-foreground">{error ?? "…"}</p>
      </AppShell>
    );
  }

  const isVerified = rider.kycStatus === "VERIFIED" || rider.kycStatus === "APPROVED";
  const isWaiting = rider.kycStatus === "PENDING_APPROVAL" || rider.kycStatus === "SUBMITTED" || rider.kycStatus === "VERIFYING";

  if (isVerified || isWaiting) {
    return (
      <AppShell>
        <div className="space-y-4">
          <Card className="space-y-3">
             <CardTitle>Application Status</CardTitle>
             <div className="text-3xl font-display">{isVerified ? "APPROVED" : "PENDING APPROVAL"}</div>
             <p className="text-sm text-muted-foreground">
               {isVerified 
                 ? "You are approved and ready to ride!" 
                 : "Your application is currently under review. We will notify you once approved."}
             </p>
          </Card>
        </div>
      </AppShell>
    );
  }

  const field = (key: keyof RiderProfile, label: string, extra: Partial<ComponentProps<typeof Input>> = {}) => (
    <div>
      <Label>{label}</Label>
      <Input
        className="mt-1"
        value={String(rider[key] ?? "")}
        onChange={(e) => setRider({ ...rider, [key]: e.target.value })}
        {...extra}
      />
    </div>
  );

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl">Rider Onboarding</h1>
        </div>
        <div className="flex gap-2">
           {[1, 2, 3].map(s => (
             <div key={s} className={`h-2 flex-1 rounded ${step >= s ? 'bg-primary' : 'bg-muted'}`} />
           ))}
        </div>
        {error ? <p className="text-sm text-destructive font-medium">{error}</p> : null}

        {step === 1 && (
          <Card className="space-y-3">
            <CardTitle>Step 1: Personal Details</CardTitle>
            <p className="text-xs text-muted-foreground">We need some basic details to get you started.</p>
            {field("fullName", t("name"))}
            {field("phone", t("phone"), { inputMode: "tel" })}
            {field("email", t("email"), { type: "email" })}
            {field("address", "Full Address (must include City) *")}
            {field("dateOfBirth", t("dob"), { type: "date" })}
            {field("emergencyName", t("emergencyContact"))}
            {field("emergencyPhone", "Emergency Phone", { inputMode: "tel" })}
            <Button className="w-full mt-4" disabled={pending} onClick={() => void handleNextStep()}>Next: Vehicle & KYC</Button>
          </Card>
        )}

        {step === 2 && (
          <Card className="space-y-3">
            <CardTitle>Step 2: Legal KYC & Vehicle</CardTitle>
            <p className="text-xs text-muted-foreground">All fields below are mandatory as per Zomato-level regulations.</p>
            <Label>{t("vehicleType")}</Label>
            <select
              className="h-11 w-full rounded-md border border-border bg-surface px-3"
              value={rider.vehicleType}
              onChange={(e) => {
                const vehicleType = e.target.value as VehicleType;
                setRider({ ...rider, vehicleType });
              }}
            >
              <option value="MOTORCYCLE">Motorcycle</option>
              <option value="SCOOTER">Scooter</option>
              <option value="BICYCLE">Bicycle</option>
            </select>
            {field("licenceNumber", "Driving License Number *")}
            {field("vehicleRegistration", "Vehicle RC Number *")}
            {field("governmentIdLast4", "Aadhar Card Number (Last 4) *", { maxLength: 4, inputMode: "numeric" })}
            {field("insuranceRef", t("insurance"))}
            
            <div className="flex gap-2 mt-4">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
              <Button className="flex-1" disabled={pending} onClick={() => void handleNextStep()}>Next: Bank Details</Button>
            </div>
          </Card>
        )}

        {step === 3 && (
          <Card className="space-y-3">
            <CardTitle>Step 3: Bank & Zones</CardTitle>
            {field("payoutUpi", "Bank Account / UPI ID *")}
            <Label>{t("zones")}</Label>
            <div className="flex flex-wrap gap-2">
              {ZONES.map((z) => {
                const on = rider.preferredZones.includes(z);
                return (
                  <button
                    key={z}
                    type="button"
                    className={`min-h-11 rounded-full px-3 text-sm ${on ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                    onClick={() => {
                      const preferredZones = on
                        ? rider.preferredZones.filter((x) => x !== z)
                        : [...rider.preferredZones, z];
                      setRider({ ...rider, preferredZones });
                    }}
                  >
                    {z}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>Back</Button>
              <Button className="flex-1" disabled={pending} onClick={() => void submit()}>Submit Application</Button>
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
