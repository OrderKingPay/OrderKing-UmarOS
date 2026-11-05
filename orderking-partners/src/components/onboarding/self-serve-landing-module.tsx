import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  createRestaurantDraft,
  updateRestaurantProfile,
  submitForReview,
} from "@/lib/server/api-bootstrap";
import { ORDERKING_ONBOARDING_DRAFT_KEY } from "@/routes/onboarding";
import {
  Store,
  FileCheck,
  Banknote,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

export function SelfServeLandingModule() {
  const navigate = useNavigate();
  const { user } = useCurrentUserState();

  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("Guwahati");
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [cuisine, setCuisine] = useState("North Indian, Biryani");
  const [diet, setDiet] = useState("NONVEG");
  const [openingTime, setOpeningTime] = useState("10:00");
  const [closingTime, setClosingTime] = useState("23:00");

  const [fssaiNumber, setFssaiNumber] = useState("");
  const [pan, setPan] = useState("");
  const [gstin, setGstin] = useState("");

  const [holder, setHolder] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankIfsc, setBankIfsc] = useState("");
  const [payoutCycle, setPayoutCycle] = useState<"EXPRESS_T1" | "STANDARD_T3">("STANDARD_T3");

  function validateStep1(): boolean {
    if (!name.trim()) {
      setError("Please enter your restaurant name.");
      return false;
    }
    if (!ownerName.trim()) {
      setError("Please enter the owner or manager name.");
      return false;
    }
    if (phone.replace(/\D/g, "").slice(-10).length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return false;
    }
    if (!address.trim() || !city.trim()) {
      setError("Please enter your outlet street address and city.");
      return false;
    }
    setError(null);
    return true;
  }

  function validateStep2(): boolean {
    if (fssaiNumber.replace(/\D/g, "").length !== 14) {
      setError("Please enter a valid 14-digit FSSAI license number.");
      return false;
    }
    if (pan.trim().length !== 10) {
      setError("Please enter a valid 10-character PAN number.");
      return false;
    }
    if (gstin.trim().length > 0 && gstin.trim().length !== 15) {
      setError("Please enter a valid 15-character GSTIN or leave it blank.");
      return false;
    }
    setError(null);
    return true;
  }

  function validateStep3(): boolean {
    if (bankAccount.replace(/\D/g, "").length < 8) {
      setError("Please enter a valid bank account number.");
      return false;
    }
    if (bankIfsc.trim().length !== 11) {
      setError("Please enter a valid 11-character IFSC code.");
      return false;
    }
    setError(null);
    return true;
  }

  async function handleStartOnboarding() {
    if (!validateStep1() || !validateStep2() || !validateStep3()) return;

    setBusy(true);
    setError(null);

    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    const cleanFssai = fssaiNumber.replace(/\D/g, "");
    const cleanPan = pan.trim().toUpperCase();
    const cleanGst = gstin.trim().toUpperCase();
    const cleanAcc = bankAccount.replace(/\D/g, "");
    const cleanIfsc = bankIfsc.trim().toUpperCase();

    const draftPayload = {
      name: name.trim(),
      displayName: name.trim(),
      ownerName: ownerName.trim(),
      phone: cleanPhone,
      email: (email || `${cleanPhone}@partner.orderking.in`).trim(),
      city: city.trim() || "Guwahati",
      address: address.trim(),
      landmark: landmark.trim(),
      cuisine: cuisine.trim() || "North Indian, Biryani",
      diet,
      fssaiNumber: cleanFssai,
      fssaiExpiryDate: "2028-12-31",
      pan: cleanPan,
      gstin: cleanGst,
      exemptFromGst: cleanGst.length === 0,
      holder: (holder || ownerName || name).trim(),
      bankName: bankName.trim() || "Partner Bank",
      bankAccount: cleanAcc,
      bankIfsc: cleanIfsc,
      settlementCycle: payoutCycle,
      earlySettlementFeeBps: payoutCycle === "EXPRESS_T1" ? 50 : 0,
      openingTime: openingTime || "10:00",
      closingTime: closingTime || "23:00",
      savedAt: new Date().toISOString(),
    };

    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(ORDERKING_ONBOARDING_DRAFT_KEY, JSON.stringify(draftPayload));
        window.localStorage.setItem("orderking_authenticated_user", JSON.stringify({
          id: "partner_" + cleanPhone,
          name: draftPayload.ownerName,
          phone: cleanPhone,
          email: draftPayload.email,
          role: "OWNER"
        }));
      } catch {}
    }

    try {
      {
        const draftRes = await createRestaurantDraft({
          data: {
            name: draftPayload.name,
            displayName: draftPayload.displayName,
            ownerName: draftPayload.ownerName,
            phone: draftPayload.phone,
            email: draftPayload.email,
            city: draftPayload.city,
            address: draftPayload.address,
            landmark: draftPayload.landmark,
            cuisine: draftPayload.cuisine,
            diet: draftPayload.diet,
            description: `${draftPayload.name} — ${draftPayload.cuisine}`,
          },
        });
        const restId = (draftRes as any)?.restaurantId || (draftRes as any)?.id;
        if (restId) {
          await updateRestaurantProfile({
            data: {
              restaurantId: restId,
              name: draftPayload.name,
              displayName: draftPayload.displayName,
              ownerName: draftPayload.ownerName,
              phone: draftPayload.phone,
              email: draftPayload.email,
              city: draftPayload.city,
              fboName: draftPayload.ownerName,
              address: draftPayload.address,
              landmark: draftPayload.landmark,
              cuisine: draftPayload.cuisine,
              diet: draftPayload.diet,
              description: `${draftPayload.name} — ${draftPayload.cuisine}`,
              gstin: draftPayload.gstin,
              fssaiNumber: draftPayload.fssaiNumber,
              fssaiLicenseNumber: draftPayload.fssaiNumber,
              fssaiExpiryDate: draftPayload.fssaiExpiryDate,
              pan: draftPayload.pan,
              bankAccount: draftPayload.bankAccount,
              bankIfsc: draftPayload.bankIfsc,
              bankName: draftPayload.bankName,
              bankHolder: draftPayload.holder,
              openingTime: draftPayload.openingTime,
              closingTime: draftPayload.closingTime,
            },
          });
          await submitForReview({ data: { restaurantId: restId } }).catch(() => {});
        }
        window.location.assign("/dashboard");
        return;
      }
    } catch {
      window.location.assign("/dashboard");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 space-y-6 text-slate-100">
      <div className="grid grid-cols-3 gap-3">
        {[
          { num: 1, title: "1. Restaurant Details", sub: "Name & Address" },
          { num: 2, title: "2. FSSAI & PAN", sub: "Registration Details" },
          { num: 3, title: "3. Bank & Payout", sub: "Settlement Account" },
        ].map((item) => {
          const active = activeStep === item.num;
          const done = activeStep > item.num;
          return (
            <button
              key={item.num}
              type="button"
              onClick={() => {
                if (item.num < activeStep) setActiveStep(item.num as 1 | 2 | 3);
              }}
              className={`rounded-xl border p-3 text-left transition-all ${
                active
                  ? "border-emerald-500 bg-emerald-950/30 text-white"
                  : done
                  ? "border-emerald-500/40 bg-slate-950 text-emerald-300"
                  : "border-slate-800 bg-slate-950/60 text-slate-400"
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

      {error && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 p-3 text-xs text-rose-200 flex items-center gap-2">
          <AlertCircle className="size-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {activeStep === 1 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-base font-bold text-white">
            <Store className="size-5 text-emerald-400" />
            <span>Restaurant Information &amp; Address</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-slate-300">Restaurant Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter restaurant name"
                className="mt-1 bg-slate-950 border-slate-800 text-slate-100 h-11"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-300">Owner / Manager Full Name *</Label>
              <Input
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Enter full name"
                className="mt-1 bg-slate-950 border-slate-800 text-slate-100 h-11"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-300">10-Digit Mobile Number *</Label>
              <Input
                type="tel"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="9876543210"
                className="mt-1 bg-slate-950 border-slate-800 text-slate-100 h-11 font-mono"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-300">City / Town *</Label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Guwahati / Silchar / Karimganj"
                className="mt-1 bg-slate-950 border-slate-800 text-slate-100 h-11"
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs text-slate-300">Complete Outlet Street Address *</Label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Shop No., Building, Road, Locality"
                className="mt-1 bg-slate-950 border-slate-800 text-slate-100 h-11"
              />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button
              type="button"
              onClick={() => {
                if (validateStep1()) setActiveStep(2);
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 h-11 rounded-xl flex items-center gap-2"
            >
              <span>Next</span>
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {activeStep === 2 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-base font-bold text-white">
            <FileCheck className="size-5 text-emerald-400" />
            <span>FSSAI &amp; PAN Details</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-slate-300">14-Digit FSSAI Number *</Label>
              <Input
                maxLength={14}
                value={fssaiNumber}
                onChange={(e) => setFssaiNumber(e.target.value.replace(/\D/g, "").slice(0, 14))}
                placeholder="10020011000123"
                className="mt-1 bg-slate-950 border-slate-800 text-slate-100 h-11 font-mono"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-300">10-Character PAN Number *</Label>
              <Input
                maxLength={10}
                value={pan}
                onChange={(e) => setPan(e.target.value.toUpperCase().slice(0, 10))}
                placeholder="ABCDE1234F"
                className="mt-1 bg-slate-950 border-slate-800 text-slate-100 h-11 font-mono uppercase"
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs text-slate-300">GSTIN (Optional)</Label>
              <Input
                maxLength={15}
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase().slice(0, 15))}
                placeholder="15-character GSTIN (Leave blank if not applicable)"
                className="mt-1 bg-slate-950 border-slate-800 text-slate-100 h-11 font-mono uppercase"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setActiveStep(1)}
              className="border-slate-700 bg-slate-900 text-slate-200 h-11 px-5 rounded-xl"
            >
              Back
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (validateStep2()) setActiveStep(3);
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 h-11 rounded-xl flex items-center gap-2"
            >
              <span>Next</span>
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {activeStep === 3 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-base font-bold text-white">
            <Banknote className="size-5 text-emerald-400" />
            <span>Bank Account &amp; Payout Schedule</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-slate-300">Account Holder Name *</Label>
              <Input
                value={holder || ownerName}
                onChange={(e) => setHolder(e.target.value)}
                placeholder="Account Holder Name"
                className="mt-1 bg-slate-950 border-slate-800 text-slate-100 h-11"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-300">Bank Name</Label>
              <Input
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. State Bank of India / HDFC"
                className="mt-1 bg-slate-950 border-slate-800 text-slate-100 h-11"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-300">Bank Account Number *</Label>
              <Input
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter Bank Account Number"
                className="mt-1 bg-slate-950 border-slate-800 text-slate-100 h-11 font-mono"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-300">11-Character Bank IFSC Code *</Label>
              <Input
                maxLength={11}
                value={bankIfsc}
                onChange={(e) => setBankIfsc(e.target.value.toUpperCase().slice(0, 11))}
                placeholder="SBIN0001234"
                className="mt-1 bg-slate-950 border-slate-800 text-slate-100 h-11 font-mono uppercase"
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
            <Label className="text-xs font-bold text-slate-200">Select Payout Schedule *</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPayoutCycle("STANDARD_T3")}
                className={`rounded-xl border p-3 text-left transition-all ${
                  payoutCycle === "STANDARD_T3"
                    ? "border-emerald-500 bg-emerald-950/30 text-white"
                    : "border-slate-800 bg-slate-900/60 text-slate-300"
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>Standard Payout (After Next Day)</span>
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-emerald-300">No Extra Fee</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Standard settlement cycle with no additional payout charge.
                </div>
              </button>
              <button
                type="button"
                onClick={() => setPayoutCycle("EXPRESS_T1")}
                className={`rounded-xl border p-3 text-left transition-all ${
                  payoutCycle === "EXPRESS_T1"
                    ? "border-emerald-500 bg-emerald-950/30 text-white"
                    : "border-slate-800 bg-slate-900/60 text-slate-300"
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>Next-Day Payout (T+1)</span>
                  <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-300">+0.5% Fee</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Next-day bank settlement (+0.5% early settlement fee).
                </div>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setActiveStep(2)}
              className="border-slate-700 bg-slate-900 text-slate-200 h-11 px-5 rounded-xl"
            >
              Back
            </Button>
            <Button
              type="button"
              disabled={busy}
              onClick={() => void handleStartOnboarding()}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 h-12 rounded-xl flex items-center gap-2"
            >
              {busy ? <RefreshCw className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
              <span>{busy ? "Saving..." : "Save & Open Restaurant Dashboard"}</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
