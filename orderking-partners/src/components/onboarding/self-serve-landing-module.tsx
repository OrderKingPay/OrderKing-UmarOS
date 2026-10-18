import { useState, useId } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  validateFssai,
  validatePan,
  validateIfsc,
  validateGstin,
} from "@/lib/merchant-kyc";
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Building2,
  Clock,
  Banknote,
  UtensilsCrossed,
  ArrowRight,
  Sparkles,
  Store,
  ChevronRight,
  Check,
  Scale,
} from "lucide-react";

export function SelfServeLandingModule() {
  const { user } = useCurrentUserState();
  const navigate = useNavigate();

  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [restaurantName, setRestaurantName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("Delhi NCR");
  const [address, setAddress] = useState("");

  // KYC
  const [fssaiNumber, setFssaiNumber] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [gstin, setGstin] = useState("");
  const [isGstExempt, setIsGstExempt] = useState(false);

  // Banking & Hours
  const [bankAccount, setBankAccount] = useState("");
  const [bankIfsc, setBankIfsc] = useState("");
  const [bankHolder, setBankHolder] = useState("");
  const [openTime, setOpenTime] = useState("10:00");
  const [closeTime, setCloseTime] = useState("23:00");

  // Sample signature menu dish
  const [dishName, setDishName] = useState("Special Dum Biryani");
  const [dishDiet, setDishDiet] = useState<"VEG" | "NONVEG">("NONVEG");
  const [dishPrice, setDishPrice] = useState("299");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Live Validations
  const isFssaiValid = validateFssai(fssaiNumber);
  const isPanValid = validatePan(panNumber);
  const isIfscValid = validateIfsc(bankIfsc);
  const isPhoneValid = /^[6-9]\d{9}$/.test(phone.trim().replace(/\D/g, "").slice(-10));
  const isStep1Valid = Boolean(restaurantName.trim() && ownerName.trim() && isPhoneValid && address.trim());
  const isStep2Valid = Boolean(isFssaiValid && isPanValid);
  const isStep3Valid = Boolean(bankAccount.trim().length >= 8 && isIfscValid);

  function handleStartOnboarding() {
    setErrorMsg(null);

    if (!restaurantName.trim()) {
      setErrorMsg("Please enter your restaurant name.");
      setActiveStep(1);
      return;
    }
    if (!isPhoneValid) {
      setErrorMsg("Please enter a valid 10-digit Indian mobile number.");
      setActiveStep(1);
      return;
    }
    if (!address.trim()) {
      setErrorMsg("Please enter your kitchen address.");
      setActiveStep(1);
      return;
    }

    setSubmitting(true);

    // Save draft details to localStorage for automatic pickup during authenticated onboarding
    if (typeof window !== "undefined") {
      const draft = {
        name: restaurantName.trim(),
        ownerName: ownerName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        city: city.trim(),
        address: address.trim(),
        fssaiNumber: fssaiNumber.trim(),
        pan: panNumber.trim().toUpperCase(),
        gstin: isGstExempt ? "" : gstin.trim().toUpperCase(),
        bankAccount: bankAccount.trim(),
        bankIfsc: bankIfsc.trim().toUpperCase(),
        bankName: bankHolder.trim() || ownerName.trim(),
        openingTime: openTime,
        closingTime: closeTime,
        dishName: dishName.trim(),
        dishDiet,
        dishPrice: dishPrice.trim(),
      };
      try {
        window.localStorage.setItem("orderking_partner_onboarding_draft", JSON.stringify(draft));
      } catch {
        // Storage unavailable
      }
    }

    if (user) {
      void navigate({ to: "/onboarding" });
    } else {
      void navigate({
        to: "/login",
        search: { mode: "up" },
      });
    }
  }

  return (
    <Card className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/95 p-6 sm:p-8 shadow-2xl backdrop-blur-xl font-sans space-y-6 text-left">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 font-mono">
              Self-Serve Restaurant Onboarding
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
              100% Industry Benchmark KYC
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
            Register Your Restaurant in Minutes
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Submit your outlet details, 14-digit FSSAI, business PAN, and settlement bank account. Go live with zero manual delays.
          </p>
        </div>

        {/* Step Indicator Pills */}
        <div className="flex items-center gap-1.5 shrink-0">
          {[
            { num: 1, label: "Identity" },
            { num: 2, label: "KYC" },
            { num: 3, label: "Banking" },
            { num: 4, label: "Menu" },
          ].map((s) => (
            <button
              key={s.num}
              type="button"
              onClick={() => setActiveStep(s.num as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                activeStep === s.num
                  ? "bg-emerald-600 text-white font-bold shadow-md shadow-emerald-950"
                  : "bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200"
              }`}
            >
              <span>{s.num}.</span>
              <span className="hidden md:inline">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-3.5 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Step 1: Restaurant Identity */}
      {activeStep === 1 && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
            <Building2 className="size-4 text-emerald-400" />
            <span>Station 1: Restaurant Identity &amp; Physical Kitchen</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-slate-300">Restaurant Trade Name *</Label>
              <Input
                placeholder="e.g. Royal Biryani &amp; Kebabs"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-300">Owner / Authorized Signatory Name *</Label>
              <Input
                placeholder="e.g. Mohammad Umar"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-300">Contact Mobile Number (10 digits) *</Label>
              <Input
                placeholder="e.g. 9876543210"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 text-sm font-mono"
              />
              {phone && !isPhoneValid && (
                <p className="text-[11px] text-amber-400 mt-1">Please enter a valid 10-digit Indian mobile number (starts with 6-9).</p>
              )}
            </div>
            <div>
              <Label className="text-xs text-slate-300">Operating City</Label>
              <Input
                placeholder="e.g. Delhi NCR, Mumbai, Bengaluru"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs text-slate-300">Kitchen Pickup Address *</Label>
              <Input
                placeholder="e.g. Shop 4, Connaught Place, Inner Circle, New Delhi"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="button"
              onClick={() => setActiveStep(2)}
              disabled={!isStep1Valid}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-5"
            >
              Continue to Statutory KYC <ChevronRight className="size-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: FSSAI, PAN & Statutory Verification */}
      {activeStep === 2 && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
            <ShieldCheck className="size-4 text-emerald-400" />
            <span>Station 2: Food Safety License (FSSAI) &amp; Business PAN</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs text-slate-300">14-Digit FSSAI License Number *</Label>
                {isFssaiValid ? (
                  <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="size-3" /> FSSAI Verified
                  </span>
                ) : fssaiNumber ? (
                  <span className="text-[11px] font-mono text-amber-400">Must be 14 numeric digits</span>
                ) : null}
              </div>
              <Input
                placeholder="e.g. 10019011000123"
                maxLength={14}
                value={fssaiNumber}
                onChange={(e) => setFssaiNumber(e.target.value.replace(/\D/g, ""))}
                className={`bg-slate-950 font-mono text-sm ${
                  isFssaiValid ? "border-emerald-500 text-emerald-300" : "border-slate-800 text-white"
                }`}
              />
              <p className="text-[11px] text-slate-400 mt-1">Mandatory under Food Safety and Standards Act 2006.</p>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs text-slate-300">Business / Signatory PAN *</Label>
                {isPanValid ? (
                  <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="size-3" /> Valid PAN
                  </span>
                ) : panNumber ? (
                  <span className="text-[11px] font-mono text-amber-400">Format: ABCDE1234F</span>
                ) : null}
              </div>
              <Input
                placeholder="e.g. ABCDE1234F"
                maxLength={10}
                value={panNumber}
                onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                className={`bg-slate-950 font-mono text-sm uppercase ${
                  isPanValid ? "border-emerald-500 text-emerald-300" : "border-slate-800 text-white"
                }`}
              />
              <p className="text-[11px] text-slate-400 mt-1">Required for Income Tax Act §194-O TDS credits.</p>
            </div>

            <div className="sm:col-span-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-slate-300">GSTIN Certificate (Optional)</Label>
                <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isGstExempt}
                    onChange={(e) => setIsGstExempt(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-emerald-500"
                  />
                  <span>Turnover &lt; ₹20L (GST Exempt)</span>
                </label>
              </div>
              <Input
                disabled={isGstExempt}
                placeholder={isGstExempt ? "Exempted from GST registration" : "e.g. 07AAAAA0000A1Z5"}
                maxLength={15}
                value={isGstExempt ? "" : gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                className="bg-slate-950 border-slate-800 text-white font-mono text-sm uppercase placeholder:text-slate-600"
              />
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setActiveStep(1)}
              className="border-slate-800 text-slate-300 text-xs"
            >
              Back
            </Button>
            <Button
              type="button"
              onClick={() => setActiveStep(3)}
              disabled={!isStep2Valid}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-5"
            >
              Continue to Banking &amp; Timings <ChevronRight className="size-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Payout Banking & Operating Hours */}
      {activeStep === 3 && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
            <Banknote className="size-4 text-emerald-400" />
            <span>Station 3: Settlement Bank Account &amp; Kitchen Hours</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-slate-300">Bank Account Number *</Label>
              <Input
                placeholder="e.g. 50100234567890"
                maxLength={20}
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value.replace(/\D/g, ""))}
                className="bg-slate-950 border-slate-800 text-white font-mono text-sm"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs text-slate-300">Bank IFSC Code (11 chars) *</Label>
                {isIfscValid ? (
                  <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="size-3" /> Valid IFSC
                  </span>
                ) : bankIfsc ? (
                  <span className="text-[11px] font-mono text-amber-400">e.g. HDFC0001234</span>
                ) : null}
              </div>
              <Input
                placeholder="e.g. HDFC0001234"
                maxLength={11}
                value={bankIfsc}
                onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                className={`bg-slate-950 font-mono text-sm uppercase ${
                  isIfscValid ? "border-emerald-500 text-emerald-300" : "border-slate-800 text-white"
                }`}
              />
            </div>
            <div>
              <Label className="text-xs text-slate-300">Opening Time (24h)</Label>
              <Input
                type="time"
                value={openTime}
                onChange={(e) => setOpenTime(e.target.value)}
                className="bg-slate-950 border-slate-800 text-white text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-300">Closing Time (24h)</Label>
              <Input
                type="time"
                value={closeTime}
                onChange={(e) => setCloseTime(e.target.value)}
                className="bg-slate-950 border-slate-800 text-white text-sm"
              />
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setActiveStep(2)}
              className="border-slate-800 text-slate-300 text-xs"
            >
              Back
            </Button>
            <Button
              type="button"
              onClick={() => setActiveStep(4)}
              disabled={!isStep3Valid}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-5"
            >
              Continue to Menu Quick-Start <ChevronRight className="size-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: First Signature Menu Dish & Launch */}
      {activeStep === 4 && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
            <UtensilsCrossed className="size-4 text-emerald-400" />
            <span>Station 4: First Signature Dish &amp; Launch</span>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3">
            <div className="text-xs font-semibold text-slate-200">Add your first popular dish:</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <Label className="text-xs text-slate-300">Dish Name</Label>
                <Input
                  value={dishName}
                  onChange={(e) => setDishName(e.target.value)}
                  placeholder="e.g. Royal Chicken Dum Biryani"
                  className="bg-slate-900 border-slate-800 text-white text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-slate-300">Price (₹ INR)</Label>
                <Input
                  value={dishPrice}
                  onChange={(e) => setDishPrice(e.target.value.replace(/\D/g, ""))}
                  placeholder="299"
                  className="bg-slate-900 border-slate-800 text-white font-mono text-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <span className="text-xs text-slate-400">Dietary Type:</span>
              <button
                type="button"
                onClick={() => setDishDiet("NONVEG")}
                className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition ${
                  dishDiet === "NONVEG"
                    ? "bg-rose-950 text-rose-300 border border-rose-700"
                    : "bg-slate-900 text-slate-400 border border-slate-800"
                }`}
              >
                <span className="size-2 rounded-full bg-rose-500" /> Non-Veg
              </button>
              <button
                type="button"
                onClick={() => setDishDiet("VEG")}
                className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition ${
                  dishDiet === "VEG"
                    ? "bg-emerald-950 text-emerald-300 border border-emerald-700"
                    : "bg-slate-900 text-slate-400 border border-slate-800"
                }`}
              >
                <span className="size-2 rounded-full bg-emerald-500" /> Pure Veg
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-2 text-xs text-slate-300">
            <div className="font-semibold text-emerald-300 flex items-center gap-1.5">
              <Scale className="size-4" /> Real T+1 Daily Settlement Economics
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Orders delivered today are itemized down to integer paise. Platform take-rate and statutory GST §9(5) (5% ECO remitted directly to govt) are settled daily into your bank account.
            </p>
          </div>

          <div className="flex justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setActiveStep(3)}
              className="border-slate-800 text-slate-300 text-xs"
            >
              Back
            </Button>
            <Button
              type="button"
              onClick={handleStartOnboarding}
              disabled={submitting}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold px-7 h-11 rounded-xl shadow-lg shadow-emerald-950"
            >
              {submitting ? "Launching Outlet..." : "Register Restaurant & Start Receiving Orders"}
              <ArrowRight className="size-4 ml-1.5" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
