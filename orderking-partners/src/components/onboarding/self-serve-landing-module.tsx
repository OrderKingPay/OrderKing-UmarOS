import { useState, useEffect } from "react";
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
  const [fssaiExpiryDate, setFssaiExpiryDate] = useState("");
  const [pan, setPan] = useState("");
  const [hasGst, setHasGst] = useState(false);
  const [gstin, setGstin] = useState("");

  const [holder, setHolder] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankIfsc, setBankIfsc] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(ORDERKING_ONBOARDING_DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d.name) setName(d.name);
        if (d.ownerName) setOwnerName(d.ownerName);
        if (d.phone) setPhone(d.phone);
        if (d.email) setEmail(d.email);
        if (d.city) setCity(d.city);
        if (d.address) setAddress(d.address);
        if (d.landmark) setLandmark(d.landmark);
        if (d.cuisine) setCuisine(d.cuisine);
        if (d.diet) setDiet(d.diet);
        if (d.fssaiNumber) setFssaiNumber(d.fssaiNumber);
        if (d.fssaiExpiryDate) setFssaiExpiryDate(d.fssaiExpiryDate);
        if (d.pan) setPan(d.pan);
        if (d.gstin) {
          setGstin(d.gstin);
          setHasGst(true);
        }
        if (d.bankAccount) setBankAccount(d.bankAccount);
        if (d.bankIfsc) setBankIfsc(d.bankIfsc);
        if (d.bankName) setBankName(d.bankName);
        if (d.holder) setHolder(d.holder);
      }
    } catch { }
  }, []);

  function validateStep1(): boolean {
    if (!name.trim()) {
      setError("Please enter your Restaurant Name.");
      return false;
    }
    if (!ownerName.trim()) {
      setError("Please enter the Owner / Manager Full Name.");
      return false;
    }
    if (phone.replace(/\D/g, "").slice(-10).length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return false;
    }
    if (!address.trim() || !city.trim()) {
      setError("Please enter your complete Restaurant Street Address and City.");
      return false;
    }
    setError(null);
    return true;
  }

  function validateStep2(): boolean {
    if (fssaiNumber.replace(/\D/g, "").length !== 14) {
      setError("Please enter a valid 14-digit FSSAI Food License Number.");
      return false;
    }
    if (!fssaiExpiryDate) {
      setError("Enter the actual FSSAI certificate expiry before submitting.");
      return false;
    }
    if (pan.trim().length !== 10) {
      setError("Please enter a valid 10-character PAN Card Number.");
      return false;
    }
    if (hasGst && gstin.trim().length !== 15) {
      setError("Please enter your 15-character GSTIN, or untick the GST box to proceed automatically without GST.");
      return false;
    }
    setError(null);
    return true;
  }

  function validateStep3(): boolean {
    if (bankAccount.replace(/\D/g, "").length < 8) {
      setError("Please enter a valid Settlement Bank Account Number.");
      return false;
    }
    if (bankIfsc.trim().length !== 11) {
      setError("Please enter a valid 11-character Bank IFSC Code.");
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
    const cleanGst = hasGst ? gstin.trim().toUpperCase() : "";
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
      fssaiExpiryDate,
      pan: cleanPan,
      gstin: cleanGst,
      exemptFromGst: !hasGst,
      holder: (holder || ownerName || name).trim(),
      bankName: bankName.trim() || "Partner Settlement Bank",
      bankAccount: cleanAcc,
      bankIfsc: cleanIfsc,
      openingTime: openingTime || "10:00",
      closingTime: closingTime || "23:00",
      savedAt: new Date().toISOString(),
    };

    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(ORDERKING_ONBOARDING_DRAFT_KEY, JSON.stringify(draftPayload));
      } catch { }
    }

    try {
      if (user) {
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
        if (!restId || String(restId).startsWith("local_")) {
          throw new Error("Failed to create restaurant draft on server.");
        }
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
        await submitForReview({ data: { restaurantId: restId } });
        window.location.assign("/dashboard");
        return;
      }
      navigate({
        to: "/login",
        search: {
          mode: "up",
          phone: cleanPhone,
          name: (ownerName || name).trim(),
        } as any,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save restaurant onboarding. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 space-y-6 text-gray-900 shadow-xl">
      <div className="border-b border-gray-100 pb-4">
        <h2 className="text-xl sm:text-2xl font-black text-gray-900">
          Register your restaurant on OrderKing
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Complete these 3 simple steps to list your kitchen and begin receiving online food orders.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { num: 1, title: "1. Restaurant Details", sub: "Name & Location" },
          { num: 2, title: "2. Legal Documents", sub: "FSSAI & PAN" },
          { num: 3, title: "3. Bank Details", sub: "Daily Payouts" },
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
              className={`rounded-2xl border p-3.5 text-left transition-all ${active
                ? "border-red-500 bg-red-50/70 text-red-900 ring-2 ring-red-500/20"
                : done
                  ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                  : "border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100/70"
                }`}
            >
              <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
                <span>{item.title}</span>
                {done && <CheckCircle2 className="size-4 text-emerald-600" />}
              </div>
              <div className="text-[11px] text-gray-500 mt-0.5">{item.sub}</div>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 flex items-center gap-2.5">
          <AlertCircle className="size-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {activeStep === 1 && (
        <div className="space-y-5">
          <div className="flex items-center gap-2 text-base font-bold text-gray-900 border-b border-gray-100 pb-2">
            <Store className="size-5 text-[#E23744]" />
            <span>Step 1: Restaurant Details &amp; Address</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold text-gray-700">Restaurant Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Karimganj Kitchen"
                className="mt-1 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-[#E23744] h-11"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-gray-700">Owner / Manager Full Name *</Label>
              <Input
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Enter full name"
                className="mt-1 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-[#E23744] h-11"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-gray-700">10-Digit Mobile Number *</Label>
              <Input
                type="tel"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="Enter 10-digit mobile"
                className="mt-1 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-[#E23744] h-11 font-mono"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-gray-700">City / Town *</Label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Guwahati / Silchar / Karimganj"
                className="mt-1 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-[#E23744] h-11"
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs font-semibold text-gray-700">Complete Outlet Street Address *</Label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Shop No., Building, Road, Locality"
                className="mt-1 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-[#E23744] h-11"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-gray-700">Cuisines Served</Label>
              <Input
                value={cuisine}
                onChange={(e) => setCuisine(e.target.value)}
                placeholder="North Indian, Chinese, Biryani, Fast Food"
                className="mt-1 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-[#E23744] h-11"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-gray-700">Diet Category</Label>
              <select
                value={diet}
                onChange={(e) => setDiet(e.target.value)}
                className="mt-1 w-full h-11 rounded-md border border-gray-300 bg-white px-3 text-xs sm:text-sm text-gray-900 focus:border-[#E23744] focus:outline-none"
              >
                <option value="NONVEG">Both Veg &amp; Non-Veg</option>
                <option value="PUREVEG">Pure Veg</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end pt-3">
            <Button
              type="button"
              onClick={() => {
                if (validateStep1()) setActiveStep(2);
              }}
              className="bg-[#E23744] hover:bg-[#d32f2f] text-white font-bold px-8 h-12 rounded-xl flex items-center gap-2 shadow-md shadow-red-500/20"
            >
              <span>Continue to Step 2</span>
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {activeStep === 2 && (
        <div className="space-y-5">
          <div className="flex items-center gap-2 text-base font-bold text-gray-900 border-b border-gray-100 pb-2">
            <FileCheck className="size-5 text-[#E23744]" />
            <span>Step 2: FSSAI License, PAN Card &amp; Optional GST</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-gray-700">14-Digit FSSAI License Number *</Label>
                <a
                  href="https://foscos.fssai.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-[#E23744] hover:underline"
                >
                  Apply on FoSCoS
                </a>
              </div>
              <Input
                maxLength={14}
                value={fssaiNumber}
                onChange={(e) => setFssaiNumber(e.target.value.replace(/\D/g, "").slice(0, 14))}
                placeholder="10020011000123"
                className="mt-1 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-[#E23744] h-11 font-mono"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-gray-700">10-Character PAN Card Number *</Label>
              <Input
                maxLength={10}
                value={pan}
                onChange={(e) => setPan(e.target.value.toUpperCase().slice(0, 10))}
                placeholder="ABCDE1234F"
                className="mt-1 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-[#E23744] h-11 font-mono uppercase"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-gray-700">FSSAI Certificate Expiry Date *</Label>
              <Input
                type="date"
                value={fssaiExpiryDate}
                onChange={(e) => setFssaiExpiryDate(e.target.value)}
                className="mt-1 bg-white border-gray-300 text-gray-900 focus:border-[#E23744] h-11 font-mono"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 space-y-3">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hasGst}
                onChange={(e) => {
                  setHasGst(e.target.checked);
                  if (!e.target.checked) setGstin("");
                }}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#E23744] focus:ring-[#E23744]"
              />
              <div>
                <div className="text-xs font-bold text-gray-900">
                  My restaurant is registered under GST (I have a 15-digit GSTIN)
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">
                  Untick if your annual turnover is under ₹20 Lakhs — you can onboard without a GST number.
                </div>
              </div>
            </label>
            {hasGst ? (
              <Input
                maxLength={15}
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase().slice(0, 15))}
                placeholder="18AABCU9603R1ZM (15-Character GSTIN)"
                className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-[#E23744] h-11 font-mono uppercase"
              />
            ) : (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-3.5 py-2.5 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                <span>Automatic Non-GST Onboarding Active — No GSTIN required for turnover &lt; ₹20L.</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setActiveStep(1)}
              className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 h-11 px-6 rounded-xl font-semibold"
            >
              Back
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (validateStep2()) setActiveStep(3);
              }}
              className="bg-[#E23744] hover:bg-[#d32f2f] text-white font-bold px-8 h-12 rounded-xl flex items-center gap-2 shadow-md shadow-red-500/20"
            >
              <span>Continue to Step 3</span>
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {activeStep === 3 && (
        <div className="space-y-5">
          <div className="flex items-center gap-2 text-base font-bold text-gray-900 border-b border-gray-100 pb-2">
            <Banknote className="size-5 text-[#E23744]" />
            <span>Step 3: Settlement Bank Account for Daily Payouts</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold text-gray-700">Account Holder Name *</Label>
              <Input
                value={holder || ownerName}
                onChange={(e) => setHolder(e.target.value)}
                placeholder="Account Holder Name"
                className="mt-1 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-[#E23744] h-11"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-gray-700">Bank Name</Label>
              <Input
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. State Bank of India / HDFC Bank"
                className="mt-1 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-[#E23744] h-11"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-gray-700">Bank Account Number *</Label>
              <Input
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter Bank Account Number"
                className="mt-1 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-[#E23744] h-11 font-mono"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-gray-700">11-Character Bank IFSC Code *</Label>
              <Input
                maxLength={11}
                value={bankIfsc}
                onChange={(e) => setBankIfsc(e.target.value.toUpperCase().slice(0, 11))}
                placeholder="Enter 11-char IFSC"
                className="mt-1 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-[#E23744] h-11 font-mono uppercase"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-xs text-gray-600">
            <span className="font-bold text-gray-900">T+1 Regular Daily Bank Payouts:</span> All earnings from customer orders are deposited directly into your verified bank account daily with a complete itemized statement.
          </div>

          <div className="flex items-center justify-between pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setActiveStep(2)}
              className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 h-11 px-6 rounded-xl font-semibold"
            >
              Back
            </Button>
            <Button
              type="button"
              disabled={busy}
              onClick={() => void handleStartOnboarding()}
              className="bg-[#E23744] hover:bg-[#d32f2f] text-white font-bold px-8 h-12 rounded-xl flex items-center gap-2 shadow-lg shadow-red-500/25"
            >
              {busy ? <RefreshCw className="size-4 animate-spin" /> : <ShieldCheck className="size-5" />}
              <span>{busy ? "Submitting Application..." : "Submit Application & Go Live"}</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
