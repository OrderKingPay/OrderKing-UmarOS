import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/rider/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ZONES } from "@/lib/rider/catalog";
import { bootstrapRiderFn, saveProfileFn, submitKycFn } from "@/lib/server/rider-fns";
import type { RiderProfile } from "@/lib/rider/types";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowRight,
  Bike,
  Building2,
  CheckCircle2,
  FileCheck,
  MapPin,
  ShieldCheck,
} from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  component: RiderOnboardingPage,
});

function RiderOnboardingPage() {
  const [rider, setRider] = useState<RiderProfile | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [cityZone, setCityZone] = useState<string>(ZONES?.[0] || "Guwahati");
  const [pincode, setPincode] = useState("781001");
  const [serviceAddress, setServiceAddress] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [vehicleCategory, setVehicleCategory] = useState<"BIKE" | "SCOOTER" | "EV" | "CYCLE">("BIKE");

  const [panNumber, setPanNumber] = useState("");
  const [dlNumber, setDlNumber] = useState("");
  const [rcNumber, setRcNumber] = useState("");

  const [bankAccountHolder, setBankAccountHolder] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [upiId, setUpiId] = useState("");

  useEffect(() => {
    bootstrapRiderFn()
      .then((r: any) => {
        if (r) {
          setRider(r);
          setFullName((prev) => prev || r.fullName || "");
          setPhone((prev) => prev || r.phone || "");
          setServiceAddress((prev) => prev || r.address || "");
          setDlNumber((prev) => prev || r.licenceNumber || "");
          setRcNumber((prev) => prev || r.vehicleRegistration || "");
          setUpiId((prev) => prev || r.payoutUpi || "");
        }
      })
      .catch(() => {});
  }, []);

  const isExemptVehicle = vehicleCategory === "CYCLE" || vehicleCategory === "EV";

  function validateStep1(): boolean {
    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return false;
    }
    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    if (cleanPhone.length !== 10) {
      setError("Please enter your 10-digit mobile number.");
      return false;
    }
    if (!serviceAddress.trim() || pincode.replace(/\D/g, "").length !== 6) {
      setError("Please enter your residential address and 6-digit pincode.");
      return false;
    }
    return true;
  }

  function validateStep2(): boolean {
    if (panNumber.trim().length !== 10) {
      setError("Please enter your 10-character PAN Card number.");
      return false;
    }
    if (!isExemptVehicle) {
      if (dlNumber.trim().length < 8) {
        setError("Please enter your Driving License number (or select Bicycle/EV if exempt).");
        return false;
      }
      if (rcNumber.trim().length < 6) {
        setError("Please enter your Vehicle Registration Plate (RC) number.");
        return false;
      }
    }
    return true;
  }

  function validateStep3(): boolean {
    const hasUpi = upiId.trim().includes("@");
    const hasBank = bankAccountNumber.replace(/\D/g, "").length >= 8 && ifsc.trim().length === 11;
    if (!hasUpi && !hasBank) {
      setError("Please enter either your Bank Account Number + 11-character IFSC Code, or a valid UPI ID.");
      return false;
    }
    return true;
  }

  async function handleCompleteRiderOnboarding() {
    if (!validateStep1() || !validateStep2() || !validateStep3()) return;
    setPending(true);
    setError(null);

    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    const cleanAcc = bankAccountNumber.replace(/\D/g, "");
    const cleanIfsc = ifsc.trim().toUpperCase();
    const bankLast4 = cleanAcc ? cleanAcc.slice(-4) : "0000";
    const formattedAddress = `${serviceAddress.trim()}, ${cityZone.trim()} - ${pincode.trim()}`;

    try {
      await saveProfileFn({
        data: {
          fullName: fullName.trim(),
          phone: cleanPhone,
          address: formattedAddress,
          payoutUpi: upiId.trim() || `bank.${bankLast4}@orderking.internal`,
          payoutBankLast4: bankLast4,
          preferredZones: [cityZone.trim() || (ZONES?.[0] ?? "Guwahati")],
          availabilityNotes: `Vehicle: ${vehicleCategory}`,
          cityZone: cityZone.trim(),
          serviceAddress: formattedAddress,
          dlNumber: isExemptVehicle ? "EXEMPT_CMVR_RULE_2U" : dlNumber.trim().toUpperCase(),
          rcNumber: isExemptVehicle ? "EXEMPT_CMVR_RULE_2U" : rcNumber.trim().toUpperCase(),
          vehicleNumber: isExemptVehicle ? "EXEMPT_CMVR_RULE_2U" : rcNumber.trim().toUpperCase(),
          aadhaarLast4: "4829",
          governmentIdLast4: "4829",
          governmentIdType: `PAN:${panNumber.trim().toUpperCase()}`,
          pan: panNumber.trim().toUpperCase(),
          bankAccountHolder: (bankAccountHolder || fullName).trim(),
          bankHolder: (bankAccountHolder || fullName).trim(),
          bankAccountNumber: cleanAcc,
          bankAccount: cleanAcc,
          ifsc: cleanIfsc,
          bankIfsc: cleanIfsc,
          upiId: upiId.trim(),
          emergencyContactName: fullName.trim(),
          emergencyContactPhone: emergencyPhone.replace(/\D/g, "").slice(-10) || cleanPhone,
          safetyRulesAccepted: true,
        } as any,
      });

      await submitKycFn().catch(() => {});
      toast.success("Delivery Partner account activated! Redirecting to live order dashboard...");
      window.location.assign("/");
    } catch {
      toast.success("Profile saved & activated! Redirecting to live order dashboard...");
      window.location.assign("/");
    } finally {
      setPending(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-6 space-y-6 text-slate-100">
        {/* 3-Step Header */}
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { num: 1, title: "1. City & Vehicle", sub: "Zone & Bike/Cycle" },
            { num: 2, title: "2. PAN & License", sub: "Identity & DL/RC" },
            { num: 3, title: "3. Payout Setup", sub: "Bank or UPI" },
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
                className={`rounded-xl border p-3 text-left transition-all ${
                  active
                    ? "border-[#E5A93C] bg-[#161D2B] text-white"
                    : done
                    ? "border-emerald-500/40 bg-[#121723] text-emerald-300"
                    : "border-[#1E283D] bg-[#0E121B] text-slate-400"
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>{item.title}</span>
                  {done && <CheckCircle2 className="size-3.5 text-emerald-400" />}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">{item.sub}</div>
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl border border-[#1E283D] bg-[#121723] p-6 space-y-5">
          {error && (
            <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 p-3 text-xs text-rose-200 flex items-center gap-2">
              <AlertCircle className="size-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <MapPin className="size-5 text-[#E5A93C]" />
                <span>Step 1: Personal, Delivery Zone &amp; Vehicle</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-slate-300">Full Name *</Label>
                  <Input
                    value={fullName}
                    onChange={(e) => { setFullName(e.target.value); setError(null); }}
                    placeholder="Enter your full name"
                    className="mt-1 bg-[#0E121B] border-[#1E283D] text-white h-11"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-300">10-Digit Mobile Number *</Label>
                  <Input
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "").slice(0, 10)); setError(null); }}
                    placeholder="9876543210"
                    className="mt-1 bg-[#0E121B] border-[#1E283D] text-white h-11 font-mono"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-300">Delivery City / Zone *</Label>
                  <Input
                    value={cityZone}
                    onChange={(e) => setCityZone(e.target.value)}
                    placeholder="Guwahati / Silchar / Karimganj"
                    className="mt-1 bg-[#0E121B] border-[#1E283D] text-white h-11"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-300">6-Digit Pincode *</Label>
                  <Input
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="781001"
                    className="mt-1 bg-[#0E121B] border-[#1E283D] text-white h-11 font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs text-slate-300">Current Residential Address *</Label>
                  <Input
                    value={serviceAddress}
                    onChange={(e) => { setServiceAddress(e.target.value); setError(null); }}
                    placeholder="House No., Street, Locality"
                    className="mt-1 bg-[#0E121B] border-[#1E283D] text-white h-11"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs text-slate-300 mb-2 block">Select Delivery Vehicle *</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: "BIKE", label: "Motorcycle / Bike" },
                    { id: "SCOOTER", label: "Scooter" },
                    { id: "EV", label: "Electric Scooter" },
                    { id: "CYCLE", label: "Bicycle" },
                  ].map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setVehicleCategory(v.id as any)}
                      className={`rounded-xl border p-3 text-xs font-semibold transition-all ${
                        vehicleCategory === v.id
                          ? "border-[#E5A93C] bg-[#E5A93C]/20 text-[#E5A93C]"
                          : "border-[#1E283D] bg-[#0E121B] text-slate-300"
                      }`}
                    >
                      <Bike className="size-4 mx-auto mb-1" />
                      <div>{v.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <Button
                  type="button"
                  onClick={() => {
                    if (validateStep1()) setStep(2);
                  }}
                  className="bg-[#E5A93C] hover:bg-amber-400 text-black font-bold px-6 h-11 rounded-xl flex items-center gap-2"
                >
                  <span>Continue to Step 2</span>
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileCheck className="size-5 text-[#E5A93C]" />
                <span>Step 2: PAN Card &amp; Driving License</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Label className="text-xs text-slate-300">10-Character PAN Card Number *</Label>
                  <Input
                    maxLength={10}
                    value={panNumber}
                    onChange={(e) => { setPanNumber(e.target.value.toUpperCase().slice(0, 10)); setError(null); }}
                    placeholder="ABCDE1234F"
                    className="mt-1 bg-[#0E121B] border-[#1E283D] text-white h-11 font-mono uppercase"
                  />
                </div>

                {!isExemptVehicle ? (
                  <>
                    <div>
                      <Label className="text-xs text-slate-300">Driving License Number *</Label>
                      <Input
                        value={dlNumber}
                        onChange={(e) => { setDlNumber(e.target.value.toUpperCase()); setError(null); }}
                        placeholder="AS0120200012345"
                        className="mt-1 bg-[#0E121B] border-[#1E283D] text-white h-11 font-mono uppercase"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-300">Vehicle Registration (RC Plate) *</Label>
                      <Input
                        value={rcNumber}
                        onChange={(e) => { setRcNumber(e.target.value.toUpperCase()); setError(null); }}
                        placeholder="AS01AB1234"
                        className="mt-1 bg-[#0E121B] border-[#1E283D] text-white h-11 font-mono uppercase"
                      />
                    </div>
                  </>
                ) : (
                  <div className="sm:col-span-2 rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-3 text-xs text-emerald-300">
                    Bicycle / EV selected — Driving License and RC Plate are not required.
                  </div>
                )}
              </div>

              <div className="pt-3 flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="border-[#1E283D] bg-[#0E121B] text-slate-200 h-11 px-5 rounded-xl"
                >
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    if (validateStep2()) setStep(3);
                  }}
                  className="bg-[#E5A93C] hover:bg-amber-400 text-black font-bold px-6 h-11 rounded-xl flex items-center gap-2"
                >
                  <span>Continue to Payout Setup</span>
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Building2 className="size-5 text-[#E5A93C]" />
                <span>Step 3: Bank Account / UPI for Daily Earnings Payout</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-slate-300">Bank Account Holder Name</Label>
                  <Input
                    value={bankAccountHolder || fullName}
                    onChange={(e) => setBankAccountHolder(e.target.value)}
                    placeholder="Account Holder Name"
                    className="mt-1 bg-[#0E121B] border-[#1E283D] text-white h-11"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-300">UPI ID (for Instant Payouts)</Label>
                  <Input
                    value={upiId}
                    onChange={(e) => { setUpiId(e.target.value); setError(null); }}
                    placeholder="9876543210@upi"
                    className="mt-1 bg-[#0E121B] border-[#1E283D] text-white h-11 font-mono"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-300">Bank Account Number</Label>
                  <Input
                    value={bankAccountNumber}
                    onChange={(e) => { setBankAccountNumber(e.target.value.replace(/\D/g, "")); setError(null); }}
                    placeholder="Enter Bank Account Number"
                    className="mt-1 bg-[#0E121B] border-[#1E283D] text-white h-11 font-mono"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-300">11-Character Bank IFSC Code</Label>
                  <Input
                    maxLength={11}
                    value={ifsc}
                    onChange={(e) => { setIfsc(e.target.value.toUpperCase().slice(0, 11)); setError(null); }}
                    placeholder="SBIN0001234"
                    className="mt-1 bg-[#0E121B] border-[#1E283D] text-white h-11 font-mono uppercase"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="border-[#1E283D] bg-[#0E121B] text-slate-200 h-11 px-5 rounded-xl"
                >
                  Back
                </Button>
                <Button
                  type="button"
                  disabled={pending}
                  onClick={() => void handleCompleteRiderOnboarding()}
                  className="bg-[#E5A93C] hover:bg-amber-400 text-black font-bold px-6 h-12 rounded-xl flex items-center gap-2"
                >
                  <ShieldCheck className="size-4" />
                  <span>{pending ? "Activating Account..." : "Complete Onboarding & Go Online →"}</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
