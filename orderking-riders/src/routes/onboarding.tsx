import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/rider/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { errorMessage } from "@/lib/client/errors";
import { useI18n } from "@/lib/rider/i18n-context";
import { ZONES } from "@/lib/rider/catalog";
import { bootstrapRiderFn, saveProfileFn, submitKycFn } from "@/lib/server/rider-fns";
import type { RiderProfile, VehicleType } from "@/lib/rider/types";
import { useEffect, useState, type ComponentProps } from "react";
import { ZomatoSwiggySwitchFlow } from "@/components/rider/zomato-swiggy-switch-flow";
import { ArrowRight, CheckCircle2, ShieldCheck, Zap } from "lucide-react";

export const Route = createFileRoute("/onboarding")({ component: Page });

function Page() {
  const { t } = useI18n();
  const [rider, setRider] = useState<RiderProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [step, setStep] = useState(1);
  const [flowMode, setFlowMode] = useState<"switch" | "standard">("switch");

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

  const serviceableCities = ["mumbai", "delhi", "bengaluru", "bangalore", "hyderabad", "sribhumi", "karimganj"];
  function isServiceable(addr: string) {
    const lower = addr.toLowerCase();
    return serviceableCities.some((city) => lower.includes(city));
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
      await save({
        fullName: rider.fullName,
        phone: rider.phone,
        address: rider.address,
        dateOfBirth: rider.dateOfBirth,
      });
      setStep(2);
    } else if (step === 2) {
      if (!rider.licenceNumber || !rider.vehicleRegistration || !rider.governmentIdLast4) {
        setError("Driving License, Vehicle RC, and Aadhar details are strictly mandatory for KYC.");
        return;
      }
      await save({
        licenceNumber: rider.licenceNumber,
        vehicleRegistration: rider.vehicleRegistration,
        governmentIdLast4: rider.governmentIdLast4,
      });
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

  const isVerified = rider?.kycStatus === "VERIFIED" || (rider?.kycStatus as string) === "APPROVED";
  const isWaiting =
    (rider?.kycStatus as string) === "PENDING_APPROVAL" ||
    rider?.kycStatus === "SUBMITTED" ||
    (rider?.kycStatus as string) === "VERIFYING";

  if (isVerified || isWaiting) {
    return (
      <AppShell>
        <div className="max-w-3xl mx-auto space-y-6 pt-2 font-sans">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="size-7" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {isVerified ? "Approved Partner" : "Priority Application In Review"}
                </span>
                <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
                  {isVerified ? "Ready to Ride & Earn" : "Application Submitted"}
                </h1>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-900">Guaranteed Tier Locked:</span>
                  <p className="text-lg font-extrabold text-slate-900">Minimum ₹35 Base Payout per Drop</p>
                </div>
                <span className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white">
                  Active
                </span>
              </div>
              <p className="mt-2 text-xs text-emerald-950 font-medium">
                You are registered on the high-payout OrderKing partner network. 100% of customer tips and instant daily UPI settlements apply.
              </p>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <a
                href="/"
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800 transition"
              >
                Go to Duty Dashboard <ArrowRight className="ml-2 size-4" />
              </a>
              <a
                href="/earnings"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50 transition"
              >
                View Earnings &amp; Incentives
              </a>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  const field = (
    key: keyof RiderProfile,
    label: string,
    extra: Partial<ComponentProps<typeof Input>> = {}
  ) => (
    <div>
      <Label className="text-xs font-semibold text-slate-700">{label}</Label>
      <Input
        className="mt-1 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:bg-white"
        value={String(rider?.[key] ?? "")}
        onChange={(e) => rider && setRider({ ...rider, [key]: e.target.value })}
        {...extra}
      />
    </div>
  );

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6 pt-2 font-sans">
        {/* TOP TAB CONTROLLER: ZOMATO/SWIGGY 1-CLICK SWITCH VS STANDARD */}
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-amber-100 text-amber-900 font-bold">
              ⚡
            </span>
            <div>
              <p className="text-xs font-bold text-slate-900">Delivery Partner Fast-Track Onboarding</p>
              <p className="text-[11px] text-slate-500">Switch from competitors or register as a fresh partner</p>
            </div>
          </div>

          <div className="flex w-full sm:w-auto rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => setFlowMode("switch")}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                flowMode === "switch"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Zap className="size-3.5 text-amber-400" />
              <span>Zomato/Swiggy 1-Click Switch</span>
              <span className="rounded bg-emerald-500 text-[10px] text-white px-1.5 py-0.2">
                Min ₹35
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFlowMode("standard")}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition ${
                flowMode === "standard"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Standard KYC Application
            </button>
          </div>
        </div>

        {/* MODE A: ZOMATO/SWIGGY 1-CLICK SWITCH (DEFAULT & FEATURED) */}
        {flowMode === "switch" ? (
          <ZomatoSwiggySwitchFlow rider={rider} onSuccess={(updated) => setRider(updated)} />
        ) : (
          /* MODE B: STANDARD STEP-BY-STEP FLOW */
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h1 className="text-xl font-extrabold text-slate-900">Standard Fresh Onboarding</h1>
                <p className="text-xs text-slate-500 mt-0.5">Complete all 3 verification steps to activate your rider ID</p>
              </div>
              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                Step {step} of 3
              </span>
            </div>

            <div className="flex gap-2">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-2 flex-1 rounded-full ${
                    step >= s ? "bg-slate-900" : "bg-slate-100"
                  }`}
                />
              ))}
            </div>

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
                {error}
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Step 1: Personal Details
                </h2>
                {field("fullName", t("name"))}
                {field("phone", t("phone"), { inputMode: "tel" })}
                {field("email", t("email"), { type: "email" })}
                {field("address", "Full Address (must include City: Mumbai, Delhi, Bengaluru, Hyderabad) *")}
                {field("dateOfBirth", t("dob"), { type: "date" })}
                {field("emergencyName", t("emergencyContact"))}
                {field("emergencyPhone", "Emergency Phone", { inputMode: "tel" })}
                <Button
                  className="w-full mt-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-3 font-bold"
                  disabled={pending}
                  onClick={() => void handleNextStep()}
                >
                  Next: Vehicle &amp; KYC
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Step 2: Legal KYC &amp; Vehicle
                </h2>
                <div>
                  <Label className="text-xs font-semibold text-slate-700">{t("vehicleType")}</Label>
                  <select
                    className="mt-1 h-11 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm text-slate-900 font-medium focus:bg-white"
                    value={rider?.vehicleType || "MOTORCYCLE"}
                    onChange={(e) => {
                      const vehicleType = e.target.value as VehicleType;
                      if (rider) setRider({ ...rider, vehicleType });
                    }}
                  >
                    <option value="MOTORCYCLE">Motorcycle</option>
                    <option value="SCOOTER">Scooter</option>
                    <option value="BICYCLE">Bicycle</option>
                  </select>
                </div>
                {field("licenceNumber", "Driving License Number *")}
                {field("vehicleRegistration", "Vehicle RC Number *")}
                {field("governmentIdLast4", "Aadhar Card Number (Last 4) *", {
                  maxLength: 4,
                  inputMode: "numeric",
                })}
                {field("insuranceRef", t("insurance"))}

                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl border-slate-300"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </Button>
                  <Button
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold"
                    disabled={pending}
                    onClick={() => void handleNextStep()}
                  >
                    Next: Bank Details
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Step 3: Bank &amp; Operational Zones
                </h2>
                {field("payoutUpi", "Bank Account / UPI ID *")}
                <div>
                  <Label className="text-xs font-semibold text-slate-700">{t("zones")}</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {ZONES.map((z) => {
                      const on = rider?.preferredZones?.includes(z) ?? false;
                      return (
                        <button
                          key={z}
                          type="button"
                          className={`rounded-full px-3.5 py-1.5 text-xs font-semibold border transition ${
                            on
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                          onClick={() => {
                            if (!rider) return;
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
                </div>

                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl border-slate-300"
                    onClick={() => setStep(2)}
                  >
                    Back
                  </Button>
                  <Button
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold"
                    disabled={pending}
                    onClick={() => void submit()}
                  >
                    Submit Application
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
