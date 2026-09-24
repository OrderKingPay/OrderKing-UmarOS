import { useState } from "react";
import { toast } from "sonner";
import {
  Banknote,
  Bell,
  CheckCircle2,
  Copy,
  CreditCard,
  Crown,
  Download,
  Fingerprint,
  Globe,
  HelpCircle,
  KeyRound,
  Lock,
  LogOut,
  QrCode,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trash2,
  User,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LanguageSelectorModal, ALL_INDIAN_LANGUAGES, type IndianLanguageOption } from "@/components/common/language-selector-modal";

interface KingPayAccountHubProps {
  walletBalance: number;
  onOpenScanner?: () => void;
}

export function KingPayAccountHub({ walletBalance, onOpenScanner }: KingPayAccountHubProps) {
  const [displayName, setDisplayName] = useState("Sovereign Patron");
  const [phone, setPhone] = useState("+91 98765 43210");
  const [email, setEmail] = useState("patron@orderking.in");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState(true);
  const [dailyLimit, setDailyLimit] = useState<number>(50000);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<IndianLanguageOption>(ALL_INDIAN_LANGUAGES[0]);

  const upiId = "patron@kingpay";

  const handleCopyUpi = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(upiId);
      toast.success("UPI ID copied to clipboard!");
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditingProfile(false);
    toast.success("Account profile updated successfully!");
  };

  const handleToggleBiometrics = () => {
    const next = !biometricsEnabled;
    setBiometricsEnabled(next);
    toast.success(
      next
        ? "Biometric Authentication (Face ID / Fingerprint) Enabled for Payments"
        : "Biometric Authentication Disabled (UPI PIN required)"
    );
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-10">
      {/* PATRON PROFILE CARD */}
      <div className="rounded-2xl border-2 border-amber-400/40 bg-gradient-to-br from-[#0D3B2E] via-surface to-amber-500/10 p-5 shadow-lg relative overflow-hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="relative flex size-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 font-black text-xl shadow-md ring-2 ring-amber-300/80">
              <Crown className="size-7 text-slate-950" />
              <span className="absolute -top-1 -right-1 flex size-3">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-3 rounded-full bg-emerald-500" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-fg">{displayName}</h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-300 border border-emerald-500/40">
                  <CheckCircle2 className="size-3" />
                  Verified Sovereign KYC
                </span>
              </div>
              <p className="text-xs text-muted mt-0.5">{phone} · {email}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30">
                  {upiId}
                </span>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="rounded p-1 text-muted hover:text-fg hover:bg-surface-2 transition"
                  title="Copy UPI ID"
                >
                  <Copy className="size-3.5" />
                </button>
              </div>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsEditingProfile(!isEditingProfile)}
            className="text-xs font-bold shrink-0"
          >
            {isEditingProfile ? "Cancel" : "Edit Profile"}
          </Button>
        </div>

        {/* Profile Edit Form */}
        {isEditingProfile && (
          <form onSubmit={handleSaveProfile} className="mt-4 space-y-3 pt-4 border-t border-border/60">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted block mb-1">Display Name</label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted block mb-1">Phone Number</label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted block mb-1">Email Address</label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-xs"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsEditingProfile(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-primary text-white font-bold">
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* WALLET & FINANCIAL OVERVIEW */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-surface p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-semibold">Wallet Balance</span>
            <Zap className="size-4 text-amber-500" />
          </div>
          <p className="text-xl font-black text-fg mt-1 font-mono">
            ₹{walletBalance.toLocaleString("en-IN")}.00
          </p>
          <span className="text-[10px] text-emerald-600 font-bold">● RBI Escrow Protected</span>
        </div>

        <div className="rounded-xl border border-border bg-surface p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-semibold">Gold Loyalty Points</span>
            <Crown className="size-4 text-amber-500" />
          </div>
          <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1 font-mono">
            4,850 <span className="text-xs font-normal">pts</span>
          </p>
          <span className="text-[10px] text-muted">≈ ₹1,455 Wallet Credit</span>
        </div>

        <div className="col-span-2 sm:col-span-1 rounded-xl border border-border bg-surface p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-semibold">Pre-Approved Credit</span>
            <CreditCard className="size-4 text-cyan-500" />
          </div>
          <p className="text-xl font-black text-cyan-600 dark:text-cyan-400 mt-1 font-mono">
            ₹50,000
          </p>
          <span className="text-[10px] text-emerald-600 font-bold">0% Interest 30 Days</span>
        </div>
      </div>

      {/* LINKED BANK ACCOUNTS */}
      <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Banknote className="size-5 text-primary" />
            <h3 className="text-sm font-black text-fg">Linked Bank Accounts &amp; UPI</h3>
          </div>
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
            3 Accounts Active
          </span>
        </div>

        <div className="space-y-2">
          {/* Bank 1: HDFC Bank */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-border/80 bg-surface-2/50">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-blue-600 text-white font-black text-xs">
                HDFC
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-fg">HDFC Bank ··· 4821</span>
                  <span className="rounded bg-primary/20 text-primary text-[9px] font-black px-1.5 py-0.2">
                    Primary
                  </span>
                </div>
                <p className="text-[10px] text-muted">Savings · IFSC: HDFC0001248 · UPI Active</p>
              </div>
            </div>
            <span className="text-xs font-bold text-muted font-mono">₹84,200.00</span>
          </div>

          {/* Bank 2: State Bank of India */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-border/80 bg-surface-2/50">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-sky-700 text-white font-black text-xs">
                SBI
              </div>
              <div>
                <span className="text-xs font-bold text-fg">State Bank of India ··· 9912</span>
                <p className="text-[10px] text-muted">Savings · IFSC: SBIN0004521 · UPI Active</p>
              </div>
            </div>
            <span className="text-xs font-bold text-muted font-mono">₹21,450.00</span>
          </div>

          {/* Bank 3: ICICI Bank */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-border/80 bg-surface-2/50">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-amber-700 text-white font-black text-xs">
                ICICI
              </div>
              <div>
                <span className="text-xs font-bold text-fg">ICICI Bank ··· 3302</span>
                <p className="text-[10px] text-muted">Current Account · IFSC: ICIC0000841</p>
              </div>
            </div>
            <span className="text-xs font-bold text-muted font-mono">₹1,12,000.00</span>
          </div>
        </div>
      </div>

      {/* SECURITY & BIOMETRICS */}
      <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-emerald-600" />
          <h3 className="text-sm font-black text-fg">Security &amp; Payment Controls</h3>
        </div>

        <div className="divide-y divide-border/60">
          {/* Biometric Toggle */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <Fingerprint className="size-5 text-primary" />
              <div>
                <span className="text-xs font-bold text-fg block">Biometric Authentication</span>
                <span className="text-[11px] text-muted">
                  Use Face ID or Fingerprint for instant payments under ₹2,000
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggleBiometrics}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                biometricsEnabled ? "bg-primary" : "bg-muted/40"
              }`}
            >
              <span
                className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  biometricsEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Daily UPI Limit */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <KeyRound className="size-5 text-amber-500" />
              <div>
                <span className="text-xs font-bold text-fg block">Daily UPI Payment Limit</span>
                <span className="text-[11px] text-muted">Prevent unauthorized large transactions</span>
              </div>
            </div>
            <select
              value={dailyLimit}
              onChange={(e) => {
                const val = Number(e.target.value);
                setDailyLimit(val);
                toast.success(`Daily payment limit set to ₹${val.toLocaleString("en-IN")}`);
              }}
              className="rounded-lg border border-border bg-surface-2 px-2.5 py-1 text-xs font-bold text-fg"
            >
              <option value={25000}>₹25,000</option>
              <option value={50000}>₹50,000</option>
              <option value={100000}>₹1,00,000</option>
            </select>
          </div>
        </div>
      </div>

      {/* LANGUAGE & REGIONAL PREFERENCES (CLEAN PROFESSIONAL DESIGN ONLY) */}
      <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="size-5 text-primary" />
            <div>
              <h3 className="text-sm font-black text-fg">Language &amp; Region / ভাষা</h3>
              <p className="text-xs text-muted">Selected: {selectedLanguage.nativeName} ({selectedLanguage.name})</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowLanguageModal(true)}
            className="text-xs font-bold gap-1.5"
          >
            <span>Change Language</span>
            <span>➔</span>
          </Button>
        </div>
      </div>

      {/* STATUTORY LEGAL & RBI COMPLIANCE */}
      <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <Lock className="size-5 text-muted" />
          <h3 className="text-sm font-black text-fg">Statutory Legal &amp; Compliance Hub</h3>
        </div>

        <div className="space-y-2 text-xs text-muted">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-2/40 border border-border/60">
            <div>
              <span className="font-bold text-fg block">RBI Escrow Compliance</span>
              <span className="text-[10px]">Funds held in scheduled commercial bank nodal account</span>
            </div>
            <span className="text-[10px] text-emerald-600 font-extrabold bg-emerald-500/10 px-2 py-0.5 rounded">
              Verified 100%
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-2/40 border border-border/60">
            <div>
              <span className="font-bold text-fg block">IT Act Section 79 Protection</span>
              <span className="text-[10px]">Third-Party Intermediary Safe Harbor Active</span>
            </div>
            <span className="text-[10px] text-primary font-extrabold bg-primary/10 px-2 py-0.5 rounded">
              Statutory Shield
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-2/40 border border-border/60">
            <div>
              <span className="font-bold text-fg block">NPCI UPI Guidelines</span>
              <span className="text-[10px]">256-Bit TLS Encryption &amp; Tokenization</span>
            </div>
            <span className="text-[10px] text-amber-600 font-extrabold bg-amber-500/10 px-2 py-0.5 rounded">
              Secured
            </span>
          </div>
        </div>
      </div>

      {/* CLEAN LANGUAGE SELECTOR MODAL */}
      <LanguageSelectorModal
        isOpen={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
        selectedCode={selectedLanguage.code}
        onSelectLanguage={(lang) => {
          setSelectedLanguage(lang);
          toast.success(`Language set to ${lang.nativeName} (${lang.name})`);
        }}
      />
    </div>
  );
}
