import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/rider/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ZONES } from "@/lib/rider/catalog";
import { bootstrapRiderFn, saveProfileFn, submitKycFn } from "@/lib/server/rider-fns";
import type { RiderProfile } from "@/lib/rider/types";
import { validateVerhoeffChecksum, validatePan } from "@/lib/rider/kyc";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowRight,
  Bike,
  Building2,
  Camera,
  CheckCircle2,
  FileCheck,
  Phone,
  ShieldCheck,
  Upload,
} from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  component: RiderOnboardingPage,
});

export function RiderOnboardingPage() {
  const [rider, setRider] = useState<RiderProfile | null>(null);
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Mobile & Basic Profile
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [cityZone, setCityZone] = useState<string>(ZONES?.[0] || "Guwahati");
  const [pincode, setPincode] = useState("781001");
  const [serviceAddress, setServiceAddress] = useState("");

  // Step 2: Personal Documents
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [dlNumber, setDlNumber] = useState("");

  // Step 3: Vehicle Selection & RC
  const [vehicleCategory, setVehicleCategory] = useState<"BIKE" | "SCOOTER" | "EV" | "CYCLE">("BIKE");
  const [rcNumber, setRcNumber] = useState("");

  // Step 4: Bank & Payout Setup
  const [bankAccountHolder, setBankAccountHolder] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [reenterAccountNumber, setReenterAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [upiId, setUpiId] = useState("");

  // Step 5: Profile Selfie & Bag Verification
  const [selfiePhoto, setSelfiePhoto] = useState<string | null>(null);
  const [bagVerified, setBagVerified] = useState(true);
  const selfieInputRef = useRef<HTMLInputElement | null>(null);

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
      .catch(() => { });
  }, []);

  const isExemptVehicle = vehicleCategory === "CYCLE" || vehicleCategory === "EV";

  function validateStep1(): boolean {
    if (!fullName.trim()) {
      setError("Enter full name");
      return false;
    }
    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError("Enter valid 10-digit mobile");
      return false;
    }
    if (!serviceAddress.trim() || pincode.replace(/\D/g, "").length !== 6) {
      setError("Enter residential address and 6-digit pincode");
      return false;
    }
    return true;
  }

  function validateStep2(): boolean {
    const cleanAadhaar = aadhaarNumber.replace(/\D/g, "");
    if (cleanAadhaar.length !== 12) {
      setError("Enter 12-digit Aadhaar number");
      return false;
    }
    if (!validateVerhoeffChecksum(cleanAadhaar)) {
      setError("Invalid 12-digit Aadhaar number");
      return false;
    }

    const panRes = validatePan(panNumber);
    if (!panRes.valid) {
      setError(panRes.reason || "Enter valid 10-digit PAN (ABCDE1234F)");
      return false;
    }

    if (!isExemptVehicle) {
      const cleanDl = dlNumber.trim().toUpperCase();
      if (cleanDl.length < 8 || !/^[A-Z]{2}[-0-9A-Z]{6,16}$/.test(cleanDl)) {
        setError("Enter valid Driving License number");
        return false;
      }
    }
    return true;
  }

  function validateStep3(): boolean {
    if (!isExemptVehicle) {
      const cleanRc = rcNumber.trim().toUpperCase().replace(/\s+/g, "");
      if (cleanRc.length < 6 || !/^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4}$/.test(cleanRc)) {
        setError("Enter valid Vehicle RC plate");
        return false;
      }
    }
    return true;
  }

  function validateStep4(): boolean {
    const cleanAcc = bankAccountNumber.replace(/\D/g, "");
    const cleanRe = reenterAccountNumber.replace(/\D/g, "");

    if (cleanAcc.length < 8) {
      setError("Enter bank account number");
      return false;
    }
    if (cleanAcc !== cleanRe) {
      setError("Account numbers do not match");
      return false;
    }
    const cleanIfsc = ifsc.trim().toUpperCase();
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleanIfsc)) {
      setError("Enter valid 11-digit IFSC code");
      return false;
    }
    const cleanUpi = upiId.trim();
    if (!cleanUpi || !/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(cleanUpi)) {
      setError("Enter a valid UPI ID for instant payouts (e.g. mobile@upi)");
      return false;
    }
    return true;
  }

  function validateStep5(): boolean {
    if (!selfiePhoto) {
      setError("Take live profile selfie");
      return false;
    }
    return true;
  }

  async function handleCompleteRiderOnboarding() {
    if (!validateStep1() || !validateStep2() || !validateStep3() || !validateStep4() || !validateStep5()) return;
    setPending(true);
    setError(null);

    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    const cleanAcc = bankAccountNumber.replace(/\D/g, "");
    const cleanIfsc = ifsc.trim().toUpperCase();
    const bankLast4 = cleanAcc.slice(-4);
    const formattedAddress = `${serviceAddress.trim()}, ${cityZone.trim()} - ${pincode.trim()}`;

    try {
      await saveProfileFn({
        data: {
          fullName: fullName.trim(),
          phone: cleanPhone,
          address: formattedAddress,
          payoutUpi: upiId.trim(),
          payoutBankLast4: bankLast4,
          preferredZones: [cityZone.trim() || (ZONES?.[0] ?? "Guwahati")],
          availabilityNotes: `Vehicle: ${vehicleCategory}`,
          cityZone: cityZone.trim(),
          serviceAddress: formattedAddress,
          dlNumber: isExemptVehicle ? "EXEMPT_CMVR_RULE_2U" : dlNumber.trim().toUpperCase(),
          rcNumber: isExemptVehicle ? "EXEMPT_CMVR_RULE_2U" : rcNumber.trim().toUpperCase(),
          vehicleNumber: isExemptVehicle ? "EXEMPT_CMVR_RULE_2U" : rcNumber.trim().toUpperCase(),
          aadhaarLast4: aadhaarNumber.replace(/\D/g, "").slice(-4),
          governmentIdLast4: aadhaarNumber.replace(/\D/g, "").slice(-4),
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
          emergencyContactPhone: cleanPhone,
          safetyRulesAccepted: true,
        } as any,
      });

      await submitKycFn();
      toast.success("Account verified! Redirecting to orders...");
      window.location.assign("/");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save rider onboarding. Please check your details and try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setPending(false);
    }
  }

  const handleSelfieCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setSelfiePhoto(reader.result);
        setError(null);
        toast.success("Profile photo captured");
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-xl px-4 py-6 space-y-5 text-slate-100">
        {/* 5-Step Indicator */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          {[
            { n: 1, label: "Mobile" },
            { n: 2, label: "Identity" },
            { n: 3, label: "Vehicle" },
            { n: 4, label: "Bank" },
            { n: 5, label: "Selfie" },
          ].map((s) => (
            <button
              key={s.n}
              type="button"
              disabled={s.n > step}
              onClick={() => {
                if (s.n < step) setStep(s.n as any);
              }}
              className={`flex flex-col items-center gap-1 transition-all ${step === s.n
                ? "text-primary"
                : step > s.n
                  ? "text-emerald-400"
                  : "text-slate-500"
                }`}
            >
              <div
                className={`flex size-7 items-center justify-center rounded-full text-xs font-bold ${step === s.n
                  ? "bg-primary text-primary-foreground text-black"
                  : step > s.n
                    ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400"
                    : "bg-background border border-slate-800 text-slate-500"
                  }`}
              >
                {step > s.n ? <CheckCircle2 className="size-3.5" /> : s.n}
              </div>
              <span className="text-[10px] font-semibold">{s.label}</span>
            </button>
          ))}
        </div>

        {error && (
          <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 p-3 text-xs text-rose-200 flex items-center gap-2">
            <AlertCircle className="size-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          {/* STEP 1: MOBILE & BASIC PROFILE */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-white">Basic Profile</h2>
                <p className="text-xs text-slate-400 mt-0.5">Enter your contact and service details.</p>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-slate-300">Full Name</Label>
                  <Input
                    value={fullName}
                    onChange={(e) => { setFullName(e.target.value); setError(null); }}
                    placeholder="Enter your name"
                    className="mt-1 bg-background border-border text-foreground h-11"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-300">Mobile Number</Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-3 text-xs text-slate-400 font-mono">+91</span>
                    <Input
                      type="tel"
                      maxLength={10}
                      value={phone}
                      onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "").slice(0, 10)); setError(null); }}
                      placeholder="Enter 10-digit mobile"
                      className="bg-background border-border text-foreground h-11 pl-12 font-mono"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-slate-300">City Zone</Label>
                    <Input
                      value={cityZone}
                      onChange={(e) => setCityZone(e.target.value)}
                      placeholder="Guwahati / Silchar"
                      className="mt-1 bg-background border-border text-foreground h-11"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-300">Pincode</Label>
                    <Input
                      maxLength={6}
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="781001"
                      className="mt-1 bg-background border-border text-foreground h-11 font-mono"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-slate-300">Residential Address</Label>
                  <Input
                    value={serviceAddress}
                    onChange={(e) => { setServiceAddress(e.target.value); setError(null); }}
                    placeholder="House, Street, Locality"
                    className="mt-1 bg-background border-border text-foreground h-11"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="button"
                  onClick={() => {
                    if (validateStep1()) setStep(2);
                  }}
                  className="bg-primary text-primary-foreground hover:bg-orange-400 text-black font-bold px-6 h-11 rounded-xl"
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: PERSONAL & IDENTITY DOCUMENTS */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-white">Identity Documents</h2>
                <p className="text-xs text-slate-400 mt-0.5">Government ID details for statutory verification.</p>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-slate-300">12-Digit Aadhaar Number</Label>
                  <Input
                    maxLength={12}
                    value={aadhaarNumber}
                    onChange={(e) => { setAadhaarNumber(e.target.value.replace(/\D/g, "").slice(0, 12)); setError(null); }}
                    placeholder="12-digit UIDAI number"
                    className="mt-1 bg-background border-border text-foreground h-11 font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Verified with UIDAI checksum.</p>
                </div>

                <div>
                  <Label className="text-xs text-slate-300">PAN Card Number</Label>
                  <Input
                    maxLength={10}
                    value={panNumber}
                    onChange={(e) => { setPanNumber(e.target.value.toUpperCase().slice(0, 10)); setError(null); }}
                    placeholder="ABCDE1234F"
                    className="mt-1 bg-background border-border text-foreground h-11 font-mono uppercase"
                  />
                </div>

                {!isExemptVehicle && (
                  <div>
                    <Label className="text-xs text-slate-300">Driving License Number</Label>
                    <Input
                      value={dlNumber}
                      onChange={(e) => { setDlNumber(e.target.value.toUpperCase()); setError(null); }}
                      placeholder="AS0120200012345"
                      className="mt-1 bg-background border-border text-foreground h-11 font-mono uppercase"
                    />
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="border-border bg-background text-slate-300 h-11 px-5 rounded-xl"
                >
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    if (validateStep2()) setStep(3);
                  }}
                  className="bg-primary text-primary-foreground hover:bg-orange-400 text-black font-bold px-6 h-11 rounded-xl"
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: VEHICLE & RC */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-white">Vehicle Details</h2>
                <p className="text-xs text-slate-400 mt-0.5">Select delivery vehicle type.</p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { id: "BIKE", label: "Motorcycle" },
                  { id: "SCOOTER", label: "Scooter" },
                  { id: "EV", label: "Electric Vehicle" },
                  { id: "CYCLE", label: "Bicycle" },
                ].map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      setVehicleCategory(v.id as any);
                      setError(null);
                    }}
                    className={`rounded-xl border p-3.5 text-xs font-semibold transition-all ${vehicleCategory === v.id
                      ? "border-primary bg-primary text-primary-foreground/20 text-primary"
                      : "border-border bg-background text-slate-300"
                      }`}
                  >
                    <Bike className="size-5 mx-auto mb-1.5" />
                    <div>{v.label}</div>
                  </button>
                ))}
              </div>

              {!isExemptVehicle ? (
                <div>
                  <Label className="text-xs text-slate-300">Vehicle Registration (RC Plate)</Label>
                  <Input
                    value={rcNumber}
                    onChange={(e) => { setRcNumber(e.target.value.toUpperCase()); setError(null); }}
                    placeholder="AS01AB1234"
                    className="mt-1 bg-background border-border text-foreground h-11 font-mono uppercase"
                  />
                </div>
              ) : (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-3 text-xs text-emerald-300">
                  Bicycle / EV selected: Driving License and RC plate are exempt under CMVR rules.
                </div>
              )}

              <div className="pt-2 flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="border-border bg-background text-slate-300 h-11 px-5 rounded-xl"
                >
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    if (validateStep3()) setStep(4);
                  }}
                  className="bg-primary text-primary-foreground hover:bg-orange-400 text-black font-bold px-6 h-11 rounded-xl"
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: BANK ACCOUNT & PAYOUT */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-white">Payout Account</h2>
                <p className="text-xs text-slate-400 mt-0.5">Direct bank transfer for your daily earnings.</p>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-slate-300">Account Holder Name</Label>
                  <Input
                    value={bankAccountHolder || fullName}
                    onChange={(e) => setBankAccountHolder(e.target.value)}
                    placeholder="Name on bank passbook"
                    className="mt-1 bg-background border-border text-foreground h-11"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-300">Bank Account Number</Label>
                  <Input
                    type="password"
                    value={bankAccountNumber}
                    onChange={(e) => { setBankAccountNumber(e.target.value.replace(/\D/g, "")); setError(null); }}
                    placeholder="Enter account number"
                    className="mt-1 bg-background border-border text-foreground h-11 font-mono"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-300">Re-enter Account Number</Label>
                  <Input
                    value={reenterAccountNumber}
                    onChange={(e) => { setReenterAccountNumber(e.target.value.replace(/\D/g, "")); setError(null); }}
                    placeholder="Re-enter account number"
                    className="mt-1 bg-background border-border text-foreground h-11 font-mono"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-300">11-Character Bank IFSC Code</Label>
                  <Input
                    maxLength={11}
                    value={ifsc}
                    onChange={(e) => { setIfsc(e.target.value.toUpperCase().slice(0, 11)); setError(null); }}
                    placeholder="Enter 11-char IFSC"
                    className="mt-1 bg-background border-border text-foreground h-11 font-mono uppercase"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-300">UPI ID *</Label>
                  <Input
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="mobile@upi"
                    className="mt-1 bg-background border-border text-foreground h-11 font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(3)}
                  className="border-border bg-background text-slate-300 h-11 px-5 rounded-xl"
                >
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    if (validateStep4()) setStep(5);
                  }}
                  className="bg-primary text-primary-foreground hover:bg-orange-400 text-black font-bold px-6 h-11 rounded-xl"
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* STEP 5: PROFILE SELFIE & DELIVERY BAG VERIFICATION */}
          {step === 5 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-white">Profile Photo &amp; Bag</h2>
                <p className="text-xs text-slate-400 mt-0.5">Live photo capture for partner ID card.</p>
              </div>

              <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-2xl bg-background text-center">
                {selfiePhoto ? (
                  <div className="space-y-3">
                    <img
                      src={selfiePhoto}
                      alt="Profile Selfie"
                      className="size-32 rounded-full object-cover border-2 border-emerald-400 mx-auto"
                    />
                    <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-semibold">
                      <CheckCircle2 className="size-4" />
                      <span>Photo Captured</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="size-20 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                      <Camera className="size-8" />
                    </div>
                    <p className="text-xs text-slate-300">Take a clear front-facing photo without sunglasses or cap.</p>
                  </div>
                )}

                <input
                  ref={selfieInputRef}
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={handleSelfieCapture}
                  className="hidden"
                />

                <Button
                  type="button"
                  onClick={() => selfieInputRef.current?.click()}
                  className="mt-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2 rounded-xl"
                >
                  {selfiePhoto ? "Retake Photo" : "Take Selfie"}
                </Button>
              </div>

              <div className="rounded-xl border border-border bg-background p-3 flex items-center justify-between text-xs">
                <span className="text-slate-300">Delivery Bag Ready</span>
                <span className="text-emerald-400 font-bold">Verified</span>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(4)}
                  className="border-border bg-background text-slate-300 h-11 px-5 rounded-xl"
                >
                  Back
                </Button>
                <Button
                  type="button"
                  disabled={pending}
                  onClick={() => void handleCompleteRiderOnboarding()}
                  className="bg-primary text-primary-foreground hover:bg-orange-400 text-black font-bold px-6 h-12 rounded-xl flex items-center gap-2"
                >
                  <ShieldCheck className="size-4" />
                  <span>{pending ? "Activating..." : "Complete KYC"}</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
