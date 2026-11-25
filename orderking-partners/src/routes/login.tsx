import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState, useEffect, useMemo, useRef } from "react";
import { setPhoneSession, getPhoneSession } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { OrderKingMark } from "@/components/mark";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useMerchantBranding } from "@orderking/ui";
import { platformConfig } from "@/lib/platform-config";
import {
  sendPartnerOtpFn,
  verifyPartnerOtpFn,
  sanitizeIndianPhone,
  isValidIndianPhone,
} from "@/lib/server/sms-gateway";
import { ORDERKING_ONBOARDING_DRAFT_KEY } from "@/routes/onboarding";
import {
  ShieldCheck,
  Phone,
  MessageCircle,
  RefreshCw,
  HelpCircle,
  Lock,
  Mail,
  Eye,
  EyeOff,
  X,
  Headphones,
} from "lucide-react";

export const Route = createFileRoute("/login")({
  validateSearch: (
    search: Record<string, unknown>
  ): { mode?: "in" | "up"; phone?: string; name?: string } => ({
    mode: search.mode === "up" ? "up" : search.mode === "in" ? "in" : undefined,
    phone: typeof search.phone === "string" ? search.phone : undefined,
    name: typeof search.name === "string" ? search.name : undefined,
  }),
  beforeLoad: ({ context }) => {
    if (context?.sessionUser) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: LoginPage,
});

export function LoginPage() {
  const search = Route.useSearch();
  const branding = useMerchantBranding();
  const { user } = useCurrentUserState();

  // If already authenticated via client-side phone session, route directly to dashboard
  useEffect(() => {
    if (typeof window !== "undefined") {
      const s = getPhoneSession();
      if (s?.user?.id || user?.id) {
        window.location.replace("/dashboard");
      }
    }
  }, [user]);

  // Auth Card State
  const [mode, setMode] = useState<"up" | "in">(search.mode === "up" ? "up" : "in");
  const [authMethod, setAuthMethod] = useState<"otp" | "password">("otp");
  const [otpStep, setOtpStep] = useState<"phone" | "code">("phone");
  const [mobileNumber, setMobileNumber] = useState(search.phone || "");
  const [name, setName] = useState(search.name || "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const digitRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  const cleanPhone = useMemo(() => sanitizeIndianPhone(mobileNumber), [mobileNumber]);
  const isPhoneValid = isValidIndianPhone(cleanPhone);

  useEffect(() => {
    if (otpStep !== "code") return;
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const tId = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(tId);
  }, [otpStep, countdown]);

  async function handleSendOtp(channel: "sms" | "whatsapp" = "sms") {
    if (!isPhoneValid) {
      setError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }
    if (mode === "up" && !name.trim()) {
      setError("Please enter the restaurant owner / manager full name.");
      return;
    }

    setWorking(true);
    setError(null);

    try {
      const res = await sendPartnerOtpFn({
        data: { phone: cleanPhone, channel },
      });
      if (!res?.success && res?.success !== undefined) {
        throw new Error("SMS was not delivered.");
      }
      setOtpStep("code");
      setCountdown(30);
      setCanResend(false);
      setOtpDigits(["", "", "", "", "", ""]);
      setOtpCode("");

      if (channel === "whatsapp" && res?.whatsAppOtpUrl && typeof window !== "undefined") {
        window.open(res.whatsAppOtpUrl, "_blank");
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Failed to dispatch verification code.");
    } finally {
      setWorking(false);
    }
  }

  function handleDigitChange(index: number, val: string) {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...otpDigits];
    next[index] = digit;
    setOtpDigits(next);
    const joined = next.join("");
    setOtpCode(joined);

    if (digit && index < 5) {
      digitRefs.current[index + 1]?.focus();
    }
    if (joined.length === 6) {
      void handleVerifyOtp(joined);
    }
  }

  function handleDigitKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      digitRefs.current[index - 1]?.focus();
    }
  }

  function handlePasteOtp(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasteData) return;
    const next = ["", "", "", "", "", ""];
    for (let i = 0; i < pasteData.length; i++) {
      next[i] = pasteData[i];
    }
    setOtpDigits(next);
    const joined = next.join("");
    setOtpCode(joined);
    if (pasteData.length === 6) {
      void handleVerifyOtp(joined);
    } else if (pasteData.length < 6) {
      digitRefs.current[pasteData.length]?.focus();
    }
  }

  async function handleVerifyOtp(codeToVerify?: string) {
    const code = (codeToVerify || otpCode).replace(/\D/g, "").trim();
    if (code.length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setWorking(true);
    setError(null);

    try {
      const verifyRes = await verifyPartnerOtpFn({
        data: { phone: cleanPhone, otp: code },
      });

      if (!verifyRes.success) {
        throw new Error("Invalid verification code. Please check or tap Resend.");
      }

      const verifiedEmail = verifyRes.email;
      const partnerDisplayName = name.trim() || `Partner ${cleanPhone.slice(-4)}`;

      setPhoneSession({
        id: "prt_" + cleanPhone,
        phone: cleanPhone,
        email: verifiedEmail,
        name: partnerDisplayName,
        role: "partner",
      });

      const hasRestaurant = Boolean((verifyRes as any)?.hasRestaurant);
      const shouldOnboard = !hasRestaurant || verifyRes.isNewUser || mode === "up";

      if (shouldOnboard) {
        if (typeof window !== "undefined") {
          try {
            const rawDraft = window.localStorage.getItem(ORDERKING_ONBOARDING_DRAFT_KEY);
            const prev = rawDraft ? JSON.parse(rawDraft) : {};
            window.localStorage.setItem(
              ORDERKING_ONBOARDING_DRAFT_KEY,
              JSON.stringify({
                ...prev,
                phone: cleanPhone,
                ownerName: name.trim() || prev.ownerName || "",
                name: prev.name || "",
                savedAt: new Date().toISOString(),
              })
            );
          } catch {}
        }
        window.location.assign("/onboarding");
      } else {
        window.location.assign("/dashboard");
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Verification failed. Please check the code.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-gray-900 font-sans flex flex-col justify-between selection:bg-red-500 selection:text-white">
      {/* 1. Header (Zomato for Business Standard) */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/login" className="flex items-center gap-3 group">
            <OrderKingMark className="size-9 text-[#E23744] transition-transform group-hover:scale-105" />
            <div>
              <div className="font-display text-xl font-black tracking-tight text-gray-900 flex items-center gap-1.5">
                <span>{branding.appName || platformConfig.brand.appName}</span>
                <span className="rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#E23744]">
                  Partner
                </span>
              </div>
              <div className="text-[11px] text-gray-500 font-medium leading-none">
                Restaurant Partner Portal
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 transition-colors cursor-pointer"
            >
              <HelpCircle className="size-3.5 text-[#E23744]" />
              <span>Need Help?</span>
            </button>
            <a
              href="tel:+919395065587"
              className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 transition-colors"
            >
              <Headphones className="size-3.5 text-[#E23744]" />
              <span>+91 9395065587</span>
            </a>
            <button
              type="button"
              onClick={() => {
                setMode(mode === "in" ? "up" : "in");
                setError(null);
                setOtpStep("phone");
              }}
              className="text-xs font-bold text-[#E23744] hover:bg-red-50 border border-red-200 px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer"
            >
              {mode === "in" ? "Register Restaurant" : "Partner Sign In"}
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Login Card (Focused, Centered, Native Zomato Partner Experience) */}
      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6">
        <div className="w-full max-w-[440px]">
          <div className="rounded-3xl border border-gray-200 bg-white p-7 sm:p-9 shadow-lg">
            {/* Card Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  {mode === "up" ? "Restaurant Registration" : "Partner Sign In"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === "in" ? "up" : "in");
                    setError(null);
                    setOtpStep("phone");
                  }}
                  className="text-xs font-bold text-[#E23744] hover:underline cursor-pointer"
                >
                  {mode === "in" ? "Register outlet →" : "Sign in instead →"}
                </button>
              </div>
              <h1 className="font-display text-2xl font-black text-gray-900">
                {mode === "up" ? "Register Your Restaurant" : "Sign In to Partner Portal"}
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                {mode === "up"
                  ? "Enter your mobile number to begin digital restaurant onboarding."
                  : "Enter your registered mobile number to receive an OTP."}
              </p>
            </div>

            {/* Auth Method Selector (Mobile OTP vs Corporate Email & Password) */}
            {mode === "in" && (
              <div className="grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1 mb-5 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod("otp");
                    setError(null);
                  }}
                  className={`py-2 rounded-lg transition-all cursor-pointer ${
                    authMethod === "otp"
                      ? "bg-white text-gray-900 shadow-xs"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  Mobile OTP
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod("password");
                    setError(null);
                  }}
                  className={`py-2 rounded-lg transition-all cursor-pointer ${
                    authMethod === "password"
                      ? "bg-white text-gray-900 shadow-xs"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  Email &amp; Password
                </button>
              </div>
            )}

            {/* Flow A: Mobile Phone OTP Flow */}
            {authMethod === "otp" ? (
              otpStep === "phone" ? (
                <div className="space-y-4">
                  {mode === "up" && (
                    <div>
                      <Label htmlFor="login-owner-name" className="text-xs font-semibold text-gray-700">
                        Owner / Manager Full Name *
                      </Label>
                      <Input
                        id="login-owner-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Full name as on PAN card"
                        className="mt-1 border-gray-300 bg-white text-gray-900 h-12 text-sm focus:border-[#E23744] rounded-xl"
                      />
                    </div>
                  )}

                  <div>
                    <Label htmlFor="login-reg-phone" className="text-xs font-semibold text-gray-700">
                      10-Digit Mobile Number *
                    </Label>
                    <div className="relative mt-1 flex items-center">
                      <span className="absolute left-3 text-xs font-bold text-gray-500">+91</span>
                      <Input
                        id="login-reg-phone"
                        type="tel"
                        maxLength={10}
                        autoFocus
                        value={mobileNumber}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          setMobileNumber(val.startsWith("91") && val.length > 10 ? val.slice(2, 12) : val.slice(0, 10));
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && isPhoneValid && !working) {
                            void handleSendOtp("sms");
                          }
                        }}
                        placeholder="Enter mobile number"
                        className="pl-12 border-gray-300 bg-white text-gray-900 h-12 font-mono text-base focus:border-[#E23744] rounded-xl"
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-gray-400">
                      We will send a 6-digit verification code to this phone number.
                    </p>
                  </div>

                  {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                      {error}
                    </div>
                  )}

                  <Button
                    type="button"
                    disabled={working || !isPhoneValid}
                    onClick={() => void handleSendOtp("sms")}
                    className="w-full h-12 bg-[#E23744] hover:bg-[#d32f2f] text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-red-500/20 text-sm cursor-pointer transition-all"
                  >
                    {working ? <RefreshCw className="size-4 animate-spin" /> : <Phone className="size-4" />}
                    <span>Continue with OTP</span>
                  </Button>

                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      disabled={working || !isPhoneValid}
                      onClick={() => void handleSendOtp("whatsapp")}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:underline cursor-pointer disabled:opacity-50"
                    >
                      <MessageCircle className="size-3.5" />
                      <span>Get OTP on WhatsApp</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Step 2: OTP Verification Code with Individual 6 Digits */
                <div className="space-y-4">
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-gray-500">OTP dispatched to:</div>
                      <div className="text-sm font-bold text-gray-900 font-mono">+91 {cleanPhone}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setOtpStep("phone");
                        setError(null);
                        setOtpCode("");
                        setOtpDigits(["", "", "", "", "", ""]);
                      }}
                      className="text-xs font-bold text-[#E23744] hover:underline cursor-pointer"
                    >
                      Change
                    </button>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-gray-700 block mb-2">
                      Enter 6-Digit Verification Code
                    </Label>

                    {/* 6 Individual Digit Inputs with Auto-Advance */}
                    <div className="grid grid-cols-6 gap-2">
                      {otpDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => {
                            digitRefs.current[idx] = el;
                          }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          autoFocus={idx === 0}
                          value={digit}
                          onChange={(e) => handleDigitChange(idx, e.target.value)}
                          onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                          onPaste={idx === 0 ? handlePasteOtp : undefined}
                          className="w-full h-13 text-center font-mono text-xl font-bold rounded-xl border border-gray-300 bg-white text-gray-900 focus:border-[#E23744] focus:ring-2 focus:ring-red-100 outline-none transition-all"
                        />
                      ))}
                    </div>
                    <p className="mt-1 text-[11px] text-gray-400 text-center">
                      Auto-advances as you type. Paste supported.
                    </p>
                  </div>

                  {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                      {error}
                    </div>
                  )}

                  <Button
                    type="button"
                    disabled={working || otpCode.length !== 6}
                    onClick={() => void handleVerifyOtp()}
                    className="w-full h-12 bg-[#E23744] hover:bg-[#d32f2f] text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-red-500/20 text-sm cursor-pointer transition-all"
                  >
                    {working ? <RefreshCw className="size-4 animate-spin" /> : <ShieldCheck className="size-5" />}
                    <span>Verify &amp; Sign In</span>
                  </Button>

                  <div className="pt-2 flex items-center justify-between text-xs text-gray-500 border-t border-gray-100">
                    <button
                      type="button"
                      disabled={working}
                      onClick={() => void handleSendOtp("whatsapp")}
                      className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:underline cursor-pointer"
                    >
                      <MessageCircle className="size-3.5" />
                      <span>Send on WhatsApp</span>
                    </button>

                    {canResend ? (
                      <button
                        type="button"
                        onClick={() => void handleSendOtp("sms")}
                        className="font-bold text-[#E23744] hover:underline cursor-pointer"
                      >
                        Resend SMS
                      </button>
                    ) : (
                      <span className="font-mono text-gray-400">Resend in {countdown}s</span>
                    )}
                  </div>
                </div>
              )
            ) : (
              /* Flow B: Corporate Email & Password Sign In */
              <div className="space-y-4">
                <div>
                  <Label htmlFor="login-corporate-email" className="text-xs font-semibold text-gray-700">
                    Corporate / Registered Business Email *
                  </Label>
                  <div className="relative mt-1 flex items-center">
                    <Mail className="size-4 absolute left-3 text-gray-400" />
                    <Input
                      id="login-corporate-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="partner@restaurant.com"
                      className="pl-10 border-gray-300 bg-white text-gray-900 h-12 text-sm focus:border-[#E23744] rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-corporate-password" className="text-xs font-semibold text-gray-700">
                      Password *
                    </Label>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMethod("otp");
                        setError("Enter your phone number to sign in via verified OTP.");
                      }}
                      className="text-[11px] font-semibold text-[#E23744] hover:underline cursor-pointer"
                    >
                      Sign in with OTP instead
                    </button>
                  </div>
                  <div className="relative mt-1 flex items-center">
                    <Lock className="size-4 absolute left-3 text-gray-400" />
                    <Input
                      id="login-corporate-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="pl-10 pr-10 border-gray-300 bg-white text-gray-900 h-12 text-sm focus:border-[#E23744] rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                    {error}
                  </div>
                )}

                <Button
                  type="button"
                  disabled={working || !email || !password}
                  onClick={() => {
                    setError("For security, restaurant accounts use direct mobile phone OTP authentication. Switch to Mobile OTP tab to sign in.");
                  }}
                  className="w-full h-12 bg-[#E23744] hover:bg-[#d32f2f] text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-red-500/20 text-sm cursor-pointer transition-all"
                >
                  <Lock className="size-4" />
                  <span>Sign In with Password</span>
                </Button>
              </div>
            )}

            {/* Bottom Quick Switch Link */}
            <div className="mt-6 pt-4 border-t border-gray-100 text-center">
              {mode === "in" ? (
                <p className="text-xs text-gray-500">
                  New to OrderKing?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("up");
                      setError(null);
                      setOtpStep("phone");
                    }}
                    className="font-bold text-[#E23744] hover:underline cursor-pointer"
                  >
                    Register your restaurant
                  </button>
                </p>
              ) : (
                <p className="text-xs text-gray-500">
                  Already registered?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("in");
                      setError(null);
                      setOtpStep("phone");
                    }}
                    className="font-bold text-[#E23744] hover:underline cursor-pointer"
                  >
                    Sign in to your account
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* 3. Statutory Compliance Footer */}
      <footer className="bg-white py-6 border-t border-gray-200 text-xs text-gray-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <OrderKingMark className="size-5 text-[#E23744]" />
            <span className="font-bold text-gray-900">OrderKing Restaurant Partner Portal</span>
          </div>
          <div className="text-center sm:text-right">
            <div>Order King Foods Private Limited • GSTIN: 18AFXPH9838M1Z9 • Assam - 788710</div>
            <div className="text-[11px] text-gray-400 mt-0.5">Section 9(5) CGST Compliance • SAC 996331 Restaurant Services</div>
          </div>
        </div>
      </footer>

      {/* 4. "Need Help Signing In?" Drawer / Modal */}
      {helpOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-display text-lg font-black text-gray-900 flex items-center gap-2">
                <HelpCircle className="size-5 text-[#E23744]" />
                <span>Partner Login Assistance</span>
              </h3>
              <button
                type="button"
                onClick={() => setHelpOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-gray-600">
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                <div className="font-bold text-gray-900">1. Did your registered phone number change?</div>
                <p>Submit your outlet GSTIN and 14-digit FSSAI certificate to our merchant verification team to update your primary login phone.</p>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                <div className="font-bold text-gray-900">2. Delay in receiving SMS OTP?</div>
                <p>Use the "Get OTP on WhatsApp" button for instant delivery over data connection.</p>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                <div className="font-bold text-gray-900">3. Multi-Outlet Corporate Accounts</div>
                <p>If you manage multiple kitchen locations under a brand, use your primary registered mobile number to access all connected outlets.</p>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-3 space-y-2">
              <a
                href="tel:+919395065587"
                className="w-full h-11 bg-gray-900 hover:bg-black text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2"
              >
                <Phone className="size-4" />
                <span>Call Partner Helpline: +91 9395065587</span>
              </a>
              <a
                href="https://wa.me/919395065587?text=Hello%20OrderKing%20Partner%20Support,%20I%20need%20assistance%20logging%20into%20my%20restaurant%20portal."
                target="_blank"
                rel="noreferrer"
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2"
              >
                <MessageCircle className="size-4" />
                <span>Chat on WhatsApp Support</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
