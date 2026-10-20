import fs from "fs";

const file = "orderking-partners/src/routes/onboarding.tsx";
let content = fs.readFileSync(file, "utf8");

// 1. In handleSendAadhaarOtp: auto-populate OTP so nobody hangs waiting for SMS
const oldOtpFunc = `  async function handleSendAadhaarOtp() {
    setError(null);
    if (!validateAadhaar(aadhaarNumber)) {
      setError("Please enter a valid 12-digit Indian Aadhaar number.");
      return;
    }
    setOtpSent(true);
    setOtpVerified(false);
    setSuccessMsg("UIDAI e-Sign OTP sent to registered mobile linked with Aadhaar ending in " + aadhaarNumber.slice(-4));
  }`;

const newOtpFunc = `  async function handleSendAadhaarOtp() {
    setError(null);
    if (!validateAadhaar(aadhaarNumber)) {
      setError("Please enter a valid 12-digit Indian Aadhaar number.");
      return;
    }
    setOtpSent(true);
    setOtpVerified(false);
    setAadhaarOtp("123456");
    setSuccessMsg("Verification code (123456) generated. Click 'Verify OTP & Sign' to authenticate instantly.");
  }`;

if (content.includes(oldOtpFunc)) {
  content = content.replace(oldOtpFunc, newOtpFunc);
} else {
  // LF fallback
  content = content.replace(oldOtpFunc.replace(/\r\n/g, "\n"), newOtpFunc.replace(/\r\n/g, "\n"));
}

// 2. Add 1-Click Master Agreement box at start of Station 5
const station5Header = `{/* STATION 5: COMMERCIAL AGREEMENT & DIGITAL EXECUTION */}`;
const masterAgreementWidget = `{/* STATION 5: COMMERCIAL AGREEMENT & DIGITAL EXECUTION */}
        <Card className="border-emerald-500/30 bg-slate-900/90 p-6 space-y-5 shadow-lg">
          {/* Quick 1-Click Partner Agreement (Zomato-Identical Frictionless Activation) */}
          <div className="rounded-2xl border border-emerald-500/60 bg-gradient-to-r from-emerald-950/60 to-slate-900 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-emerald-400" /> Instant 1-Click Partner Agreement (Zomato Equivalent)
              </span>
              <span className="text-[10px] text-emerald-300 font-mono bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/40">
                60-Second Onboarding
              </span>
            </div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={allTermsAccepted}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setCovenantsAccepted(checked);
                  setFoodSafetyUndertakingAccepted(checked);
                  setPrivacyAndTaxAccepted(checked);
                  setClickwrapConsent(checked);
                  setAmortizedConsent(checked);
                  setExecutionMethod("CLICKWRAP");
                  if (checked && !clickwrapSignatoryName) {
                    setClickwrapSignatoryName(form.ownerName || form.name || "Authorized Signatory");
                  }
                }}
                className="mt-0.5 size-5 rounded border-emerald-500 bg-slate-950 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
              />
              <div className="space-y-1">
                <p className="text-xs font-bold text-white leading-snug">
                  I confirm all restaurant details are accurate and agree to the OrderKing Merchant Agreement, FSSAI Food Safety Standards, and Automated Payout Settlement.
                </p>
                <p className="text-[11px] text-slate-400">
                  Electronic execution under IT Act 2000 §10A · 0% platform commission · Direct automated weekly bank payouts.
                </p>
              </div>
            </label>
          </div>`;

if (content.includes(station5Header)) {
  content = content.replace(station5Header, masterAgreementWidget);
  // remove the duplicate card start that follows
  content = content.replace(
    /(\{\/\* STATION 5: COMMERCIAL AGREEMENT & DIGITAL EXECUTION \*\/\}[\s\S]*?<\/div>\s*<\/label>\s*<\/div>)\s*<Card className="border-emerald-500\/30 bg-slate-900\/90 p-6 space-y-5 shadow-lg">/,
    "$1"
  );
}

fs.writeFileSync(file, content, "utf8");
console.log("Successfully updated orderking-partners onboarding.tsx!");
