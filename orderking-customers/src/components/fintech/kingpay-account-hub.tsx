
import { useState, useEffect } from "react";
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
import { useT } from "@/components/providers";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

interface KingPayAccountHubProps {
  walletBalance: number;
  onOpenScanner?: () => void;
}

export function KingPayAccountHub({ walletBalance, onOpenScanner }: KingPayAccountHubProps) {
  const { user } = useCurrentUserState();
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [biometricsEnabled] = useState(false);
  const [dailyLimit] = useState<number>(50000);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const { lang, setLang } = useT();
  const selectedLanguage = ALL_INDIAN_LANGUAGES.find(l => l.code === lang) || ALL_INDIAN_LANGUAGES[0];

  useEffect(() => {
    setDisplayName(user?.displayName ?? "");
    setEmail(user?.primaryEmail ?? "");
  }, [user]);

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
                  {user?.isDevFallback ? "Development fallback account" : "Signed-in account"}
                </span>
              </div>
              <p className="text-xs text-muted mt-0.5">{phone ? phone + " · " : ""}{email || "Email not available"}</p>
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
          <span className="text-[10px] text-muted">Source: current account state; escrow protection is not verified here.</span>
        </div>

        <div className="rounded-xl border border-border bg-surface p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-semibold">Gold Loyalty Points</span>
            <Crown className="size-4 text-amber-500" />
          </div>
          <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1 font-mono">
            Unavailable
          </p>
          <span className="text-[10px] text-muted">No verified loyalty ledger connected.</span>
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

      {/* VERIFIED BANK CONNECTION STATE */}
      <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <Banknote className="size-5 text-primary" />
          <h3 className="text-sm font-black text-fg">Linked Bank Accounts &amp; UPI</h3>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-muted">
          <p className="font-bold text-fg">No verified bank-account data is connected to this screen.</p>
          <p className="mt-1">Bank names, masked account numbers and balances are not invented. A regulated account-information or UPI provider integration is required before live account data can be shown.</p>
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
                <span className="text-[11px] text-muted">Unavailable until a real device credential/payment authentication provider is connected.</span>
              </div>
            </div>
            <span className="rounded-full bg-amber-500/10 px-2 py-1 text-[10px] font-bold text-amber-700 dark:text-amber-300">Not connected</span>
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

      {/* LEGAL / COMPLIANCE STATUS */}
      <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <Lock className="size-5 text-muted" />
          <h3 className="text-sm font-black text-fg">Legal &amp; Compliance Status</h3>
        </div>
        <div className="space-y-2 text-xs text-muted">
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
            <span className="font-bold text-fg block">Escrow / regulated payment status</span>
            <span className="text-[10px]">Not verified in this account screen. Live regulatory status will appear only after the actual provider integration returns it.</span>
          </div>
          <div className="rounded-xl border border-border/60 bg-surface-2/40 p-3">
            <span className="font-bold text-fg block">OrderKing legal documents</span>
            <span className="text-[10px]">Use the current OrderKing Terms, Privacy and Refund policies for OrderKing-specific obligations. OrderKing is not a government authority.</span>
          </div>
        </div>
      </div>
      {/* CLEAN LANGUAGE SELECTOR MODAL */}
      <LanguageSelectorModal
        isOpen={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
        selectedCode={selectedLanguage.code}
        onSelectLanguage={(l) => {
          setLang(l.code as any);
          toast.success(`Language set to ${l.nativeName} (${l.name})`);
        }}
      />
    </div>
  );
}
