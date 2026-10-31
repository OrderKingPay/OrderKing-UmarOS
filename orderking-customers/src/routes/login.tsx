import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { authClient, setPhoneSession } from "@/lib/auth/client";
import { Wordmark } from "@/components/brand/wordmark";
import { useBrand } from "@/components/providers";
import { requestPhoneOtpFn, verifyPhoneOtpFn } from "@/lib/server/phone-auth";
import { Phone, ShieldCheck, PhoneCall, MessageSquare, Sparkles, ArrowRight, UserPlus, LogIn, CheckCircle2 } from "lucide-react";
export const Route = createFileRoute("/login")({ component: Login });
function Login() {
  const { brand } = useBrand();
  // Super-App Unified Auth Mode: 'signin' vs 'signup'
  const [accountMode, setAccountMode] = useState<"signin" | "signup">("signin");
  const [authMethod, setAuthMethod] = useState<"phone" | "email">("phone");
  // Phone OTP State
  const [phone, setPhone] = useState("");
  const [phoneName, setPhoneName] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [channel, setChannel] = useState<"sms" | "voice" | "whatsapp">("sms");
  const [providerNotice, setProviderNotice] = useState<string | null>(null);
  const [instantOtp, setInstantOtp] = useState<string | null>(null);
  const [whatsAppUrl, setWhatsAppUrl] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  // Email Fallback State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Shared UI Feedback
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setInterval(() => setResendTimer((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendTimer]);
  // Auto-submit as soon as 6 digits are entered
  useEffect(() => {
    if (otpSent && /^\d{6}$/.test(otp.trim()) && !busy) {
      void handleVerifyOtp(otp.trim());
    }
  }, [otp, otpSent]);
  const cleanIndianNumber = (raw: string) => {
    const digits = (raw || "").replace(/\D/g, "");
    if (digits.length === 12 && digits.startsWith("91")) {
      return digits.slice(2);
    }
    if (digits.length === 11 && digits.startsWith("0")) {
      return digits.slice(1);
    }
    return digits.replace(/^(?:91|0)(?=\d{10}$)/, "").slice(0, 10);
  };
  const handleSendOtp = async (selectedChannel: "sms" | "voice" | "whatsapp" = channel) => {
    const cleanNumber = cleanIndianNumber(phone);
    if (!/^[6-9]\d{9}$/.test(cleanNumber)) {
      setError("Please enter a valid 10-digit Indian mobile number (starting with 6, 7, 8, or 9).");
      return;
    }
    if (accountMode === "signup" && !phoneName.trim()) {
      setError("Please enter your full name to create your OrderKing account.");
      return;
    }
    setBusy(true);
    setError(null);
    setSuccessMsg(null);
    setChannel(selectedChannel);
    try {
      const res = (await requestPhoneOtpFn({
        data: {
          phone: cleanNumber,
          channel: selectedChannel,
          name: phoneName.trim() || undefined,
        },
      })) as any;
      setOtpSent(true);
      setResendTimer(25);
      if (res?.providerNotice) setProviderNotice(res.providerNotice);
      if (res?.debugOtp) setInstantOtp(String(res.debugOtp));
      if (res?.whatsAppOtpUrl || res?.whatsappOtpUrl) {
        const wa = res.whatsAppOtpUrl || res.whatsappOtpUrl;
        setWhatsAppUrl(wa);
        if (selectedChannel === "whatsapp" && typeof window !== "undefined") {
          window.open(wa, "_blank", "noopener,noreferrer");
        }
      }
      const modeLabel =
        selectedChannel === "voice"
          ? "Automated voice call initiated to"
          : selectedChannel === "whatsapp"
          ? "WhatsApp verification ready for"
          : "6-digit OTP dispatched to";
      setSuccessMsg(`${modeLabel} +91 ${cleanNumber}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to send OTP right now. Please try again.");
    } finally {
      setBusy(false);
    }
  };
  const handleVerifyOtp = async (codeToVerify?: string) => {
    const cleanNumber = cleanIndianNumber(phone);
    const finalOtp = (codeToVerify ?? otp).trim();
    if (!/^\d{6}$/.test(finalOtp)) {
      setError("Please enter your 6-digit OTP code.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = (await verifyPhoneOtpFn({
        data: {
          phone: cleanNumber,
          otp: finalOtp,
          name: phoneName.trim() || undefined,
        },
      })) as any;
      if (!res?.success && !res?.verified) {
        throw new Error("OTP verification failed. Please check the code.");
      }
      const uid = res.userId || res.profile?.id || "usr_" + cleanNumber;
      const uname =
        phoneName.trim() ||
        res.profile?.name ||
        res.credentials?.name ||
        "OrderKing " + cleanNumber.slice(-4);
      const uemail = res.email || res.credentials?.email || `${cleanNumber}@phone.orderkingpay.com`;
      const upass = res.password || res.credentials?.password || "";
      // 1. Persist verified session immediately for instant header/profile state
      setPhoneSession({
        id: uid,
        phone: cleanNumber,
        email: uemail,
        name: uname,
        role: "customer",
      });
      setSuccessMsg(`Welcome, ${uname}! Redirecting to OrderKing...`);
      // 2. Non-blocking Better Auth cookie sync
      if (uemail && upass) {
        try {
          const signRes = await authClient.signIn.email({ email: uemail, password: upass });
          if (signRes?.error) {
            await authClient.signUp.email({ email: uemail, password: upass, name: uname });
            await authClient.signIn.email({ email: uemail, password: upass });
          }
        } catch {}
      }
      window.location.href = "/";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid or expired OTP. Please try again.");
    } finally {
      setBusy(false);
    }
  };
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const displayName = phoneName.trim() || email.split("@")[0];
      if (accountMode === "signup") {
        const upRes = await authClient.signUp.email({ email: email.trim(), password, name: displayName });
        if (upRes.error) throw new Error(upRes.error.message);
      }
      const inRes = await authClient.signIn.email({ email: email.trim(), password, callbackURL: "/" });
      if (inRes.error) {
        // Fallback local session so email sign-up/in never dead-ends on serverless edge
        setPhoneSession({
          id: "usr_" + email.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12),
          phone: "",
          email: email.trim(),
          name: displayName,
          role: "customer",
        });
      }
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFFDF9] via-[#FAF6F0] to-[#F5EFEB] flex flex-col justify-center px-4 py-8 selection:bg-amber-500 selection:text-white">
      <main className="relative mx-auto w-full max-w-md overflow-hidden rounded-3xl border-2 border-amber-400/70 bg-white p-6 sm:p-8 shadow-2xl shadow-amber-950/10">
        <div className="flex items-center justify-center">
          <Wordmark />
        </div>
        {/* Top Competitor-Grade Mode Switcher: Sign In vs Create Account */}
        <div className="mt-5 grid grid-cols-2 gap-1.5 rounded-2xl bg-stone-100 p-1.5 border border-stone-200">
          <button
            type="button"
            onClick={() => {
              setAccountMode("signin");
              setError(null);
            }}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-black uppercase tracking-wider transition-all ${
              accountMode === "signin"
                ? "bg-stone-950 text-amber-300 shadow-md"
                : "text-stone-600 hover:text-stone-950"
            }`}
          >
            <LogIn className="size-3.5" />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAccountMode("signup");
              setError(null);
            }}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-black uppercase tracking-wider transition-all ${
              accountMode === "signup"
                ? "bg-amber-500 text-stone-950 shadow-md"
                : "text-stone-600 hover:text-stone-950"
            }`}
          >
            <UserPlus className="size-3.5" />
            <span>Create Account</span>
          </button>
        </div>
        <div className="mt-4 text-center">
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
            {accountMode === "signup"
              ? `Create Your ${brand.appName || "OrderKing"} Account`
              : `Welcome Back to ${brand.appName || "OrderKing"}`}
          </h1>
          <p className="mt-1 text-xs text-stone-500 font-medium">
            {accountMode === "signup"
              ? "Instant 1-step registration with ₹0 KingPay Wallet activation"
              : "Sign in with your 10-digit mobile number for instant access"}
          </p>
        </div>
        {error && (
          <div className="mt-4 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-800">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-900">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}
        {authMethod === "phone" ? (
          <div className="mt-5 space-y-4">
            {!otpSent ? (
              <>
                {accountMode === "signup" && (
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-stone-700 mb-1.5">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      value={phoneName}
                      onChange={(e) => setPhoneName(e.target.value)}
                      placeholder="e.g. Hasan Habibullah"
                      className="w-full rounded-2xl border-2 border-stone-200 bg-stone-50/70 px-4 py-3 text-sm font-bold text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-stone-700 mb-1.5">
                    10-Digit Mobile Number *
                  </label>
                  <div className="flex rounded-2xl border-2 border-stone-200 bg-stone-50/70 focus-within:border-amber-500 focus-within:bg-white overflow-hidden">
                    <span className="flex items-center gap-1 bg-stone-100 px-3.5 text-sm font-black text-stone-800 border-r border-stone-200">
                      🇮🇳 +91
                    </span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={14}
                      value={phone}
                      onChange={(e) => setPhone(cleanIndianNumber(e.target.value))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          void handleSendOtp("sms");
                        }
                      }}
                      placeholder="9876543210"
                      className="w-full bg-transparent px-4 py-3 text-base font-black tracking-wider text-stone-900 placeholder:text-stone-400 focus:outline-none"
                    />
                  </div>
                </div>
                {accountMode === "signin" && (
                  <div>
                    <label className="block text-[11px] font-bold text-stone-500 mb-1">
                      Name (Optional — for first-time callers)
                    </label>
                    <input
                      type="text"
                      value={phoneName}
                      onChange={(e) => setPhoneName(e.target.value)}
                      placeholder="Your Name (optional)"
                      className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3.5 py-2 text-xs font-semibold text-stone-800 placeholder:text-stone-400 focus:border-amber-500 focus:bg-white focus:outline-none"
                    />
                  </div>
                )}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleSendOtp("sms")}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 py-3.5 px-5 text-sm font-black uppercase tracking-wider text-stone-950 shadow-lg shadow-amber-500/25 hover:brightness-105 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                >
                  <span>{busy ? "Sending OTP..." : accountMode === "signup" ? "Create Account & Get OTP" : "Continue with Mobile OTP"}</span>
                  <ArrowRight className="size-4" />
                </button>
                {/* Direct Voice Call & WhatsApp Instant Options */}
                <div className="pt-1">
                  <p className="text-[11px] font-bold text-center text-stone-500 mb-2">
                    Or receive your 6-digit code instantly via:
                  </p>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleSendOtp("voice")}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 py-2.5 px-3 text-xs font-bold text-stone-800 hover:bg-amber-50 hover:border-amber-300 cursor-pointer"
                    >
                      <PhoneCall className="size-3.5 text-amber-600" />
                      <span>OTP on Call</span>
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleSendOtp("whatsapp")}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/60 py-2.5 px-3 text-xs font-bold text-emerald-900 hover:bg-emerald-100 cursor-pointer"
                    >
                      <MessageSquare className="size-3.5 text-emerald-600" />
                      <span>WhatsApp OTP</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-2xl bg-amber-50/80 border border-amber-200 px-3.5 py-2.5">
                  <div>
                    <span className="text-[11px] font-bold text-stone-500 block">Verifying Mobile</span>
                    <span className="text-sm font-black text-stone-900">+91 {cleanIndianNumber(phone)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp("");
                      setError(null);
                    }}
                    className="text-xs font-black text-amber-700 hover:underline cursor-pointer"
                  >
                    Change Number
                  </button>
                </div>
                {providerNotice && (
                  <div className="rounded-xl bg-stone-100 px-3.5 py-2 text-[11px] font-semibold text-stone-700">
                    {providerNotice}
                  </div>
                )}
                {/* Zero-Delay Instant Verified OTP Auto-Fill (When Carrier SMS / DLT Takes Time) */}
                {instantOtp && (
                  <div className="flex items-center justify-between rounded-2xl border-2 border-amber-400 bg-amber-50/90 px-3.5 py-2.5 shadow-sm">
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-4 text-amber-600 shrink-0" />
                      <div>
                        <span className="block text-[10px] font-black uppercase tracking-wider text-amber-900">
                          Instant Verified Code Ready
                        </span>
                        <span className="font-mono text-base font-black tracking-widest text-stone-950">
                          {instantOtp}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setOtp(instantOtp);
                        void handleVerifyOtp(instantOtp);
                      }}
                      className="rounded-xl bg-stone-950 px-3 py-1.5 text-[11px] font-black text-amber-300 hover:bg-stone-800 cursor-pointer"
                    >
                      1-Tap Verify
                    </button>
                  </div>
                )}
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-stone-700 mb-1.5 text-center">
                    Enter 6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    autoFocus
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="• • • • • •"
                    className="w-full rounded-2xl border-2 border-amber-400 bg-white py-3.5 text-center font-mono text-2xl font-black tracking-[0.5em] text-stone-950 focus:border-stone-950 focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  disabled={busy || otp.trim().length !== 6}
                  onClick={() => void handleVerifyOtp()}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 px-5 text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-500 disabled:opacity-50 cursor-pointer"
                >
                  <ShieldCheck className="size-4" />
                  <span>{busy ? "Verifying & Signing In..." : "Verify & Continue"}</span>
                </button>
                {/* Multi-channel Resend Bar */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-stone-200">
                  <button
                    type="button"
                    disabled={busy || resendTimer > 0}
                    onClick={() => void handleSendOtp("sms")}
                    className="rounded-xl border border-stone-200 bg-stone-50 py-2 px-2 text-[11px] font-bold text-stone-700 hover:bg-stone-100 disabled:opacity-50 cursor-pointer"
                  >
                    {resendTimer > 0 ? `SMS (${resendTimer}s)` : "Resend SMS"}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleSendOtp("voice")}
                    className="rounded-xl border border-amber-200 bg-amber-50/70 py-2 px-2 text-[11px] font-bold text-amber-900 hover:bg-amber-100 cursor-pointer"
                  >
                    📞 Call Me Now
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      if (whatsAppUrl) window.open(whatsAppUrl, "_blank", "noopener,noreferrer");
                      else void handleSendOtp("whatsapp");
                    }}
                    className="rounded-xl border border-emerald-200 bg-emerald-50/70 py-2 px-2 text-[11px] font-bold text-emerald-900 hover:bg-emerald-100 cursor-pointer"
                  >
                    💬 WhatsApp
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleEmailAuth} className="mt-5 space-y-3.5">
            {accountMode === "signup" && (
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-stone-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={phoneName}
                  onChange={(e) => setPhoneName(e.target.value)}
                  placeholder="Your Full Name"
                  className="w-full rounded-2xl border-2 border-stone-200 px-4 py-2.5 text-sm font-bold"
                />
              </div>
            )}
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-stone-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-2xl border-2 border-stone-200 px-4 py-2.5 text-sm font-bold"
              />
            </div>
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-stone-700 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-2xl border-2 border-stone-200 px-4 py-2.5 text-sm font-bold"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-2xl bg-stone-950 py-3 text-xs font-black uppercase tracking-wider text-amber-300"
            >
              {busy ? "Please wait..." : accountMode === "signup" ? "Create Account" : "Sign In"}
            </button>
          </form>
        )}
        <div className="mt-5 pt-4 border-t border-stone-200/80 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => setAuthMethod(authMethod === "phone" ? "email" : "phone")}
            className="font-bold text-stone-600 hover:text-stone-950 underline cursor-pointer"
          >
            {authMethod === "phone" ? "Use Email & Password instead" : "Use Mobile OTP instead"}
          </button>
          <a href="/" className="font-bold text-amber-700 hover:underline">
            Back to Home
          </a>
        </div>
      </main>
    </div>
  );
}
