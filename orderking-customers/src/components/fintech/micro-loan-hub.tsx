import { Banknote, ArrowRight, ShieldCheck, Zap, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MicroLoanHubProps {
  walletBalance: number;
  onDisburseToWallet: (amount: number) => void;
}

export function MicroLoanHub({ walletBalance, onDisburseToWallet }: MicroLoanHubProps) {
  const handleNavi = () => window.open("https://navi.com/personal-loan?utm_source=orderking_affiliate", "_blank");
  const handleKreditBee = () => window.open("https://www.kreditbee.in/?utm_source=orderking_affiliate", "_blank");
  const handleBajaj = () => window.open("https://www.bajajfinserv.in/insta-emi-card?utm_source=orderking_affiliate", "_blank");

  return (
    <div className="space-y-6 text-fg p-4 md:p-6">
      <div className="relative overflow-hidden rounded-3xl border-2 border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-surface to-bg p-6 sm:p-10 text-center shadow-xl">
        <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500 mb-6">
          <Banknote className="size-10" />
        </div>
        
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-4 py-1.5 text-xs font-black text-emerald-500 ring-1 ring-emerald-500/40 mb-4">
          <Sparkles className="size-4 animate-pulse" />
          <span>Pre-Approved Credit Active</span>
        </div>
        
        <h2 className="font-display text-3xl sm:text-4xl font-black tracking-tight mb-4">
          Sovereign Credit Line & Micro-Loans
        </h2>
        
        <p className="text-muted text-sm sm:text-base max-w-2xl mx-auto mb-8">
          Instant ₹1,000 – ₹50,000 pre-approved credit disbursed directly to your King Pay Wallet. 100% RBI Regulated with Zero Hidden Charges. Select a trusted partner below.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto text-left">
          {/* Navi */}
          <div className="bg-surface-2 p-6 rounded-2xl border border-border hover:border-emerald-500/50 transition-colors flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-lg text-fg">Navi Cash Loan</h3>
              <span className="bg-green-500/20 text-green-500 text-xs px-2 py-1 rounded font-bold">Lowest Interest</span>
            </div>
            <p className="text-sm text-muted mb-2">Navi Finserv Ltd (RBI Registered NBFC)</p>
            <div className="text-sm space-y-1 mb-6 flex-grow">
              <p>• Limit: Up to ₹5,00,000</p>
              <p>• Interest: 9.9% - 14.5% p.a.</p>
              <p>• 2-Min Disbursal (0 Paperwork)</p>
            </div>
            <Button onClick={handleNavi} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-6">
              Instant 2-Min Approval <ArrowRight className="ml-2 size-4" />
            </Button>
          </div>

          {/* KreditBee */}
          <div className="bg-surface-2 p-6 rounded-2xl border border-border hover:border-emerald-500/50 transition-colors flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-lg text-fg">KreditBee 24x7</h3>
              <span className="bg-blue-500/20 text-blue-500 text-xs px-2 py-1 rounded font-bold">High Approval</span>
            </div>
            <p className="text-sm text-muted mb-2">Krazybee Services (RBI Registered NBFC)</p>
            <div className="text-sm space-y-1 mb-6 flex-grow">
              <p>• Limit: Up to ₹3,00,000</p>
              <p>• Interest: 1.0% - 1.5% / month</p>
              <p>• 5-Min Approval for Low CIBIL</p>
            </div>
            <Button onClick={handleKreditBee} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-6">
              Instant 2-Min Approval <ArrowRight className="ml-2 size-4" />
            </Button>
          </div>

          {/* Bajaj Finserv */}
          <div className="bg-surface-2 p-6 rounded-2xl border border-border hover:border-emerald-500/50 transition-colors flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-lg text-fg">Bajaj Insta EMI</h3>
              <span className="bg-purple-500/20 text-purple-500 text-xs px-2 py-1 rounded font-bold">No-Cost EMI</span>
            </div>
            <p className="text-sm text-muted mb-2">India's #1 NBFC</p>
            <div className="text-sm space-y-1 mb-6 flex-grow">
              <p>• Limit: ₹2,00,000 Credit Limit</p>
              <p>• Tenure: 3 - 24 Months</p>
              <p>• 0 down payment on first purchase.</p>
            </div>
            <Button onClick={handleBajaj} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-6">
              Activate ₹2L Insta EMI <ArrowRight className="ml-2 size-4" />
            </Button>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm font-bold text-muted">
          <span className="flex items-center gap-2">
             <ShieldCheck className="size-5 text-emerald-500" /> 100% RBI Regulated
          </span>
          <span className="flex items-center gap-2">
             <Zap className="size-5 text-yellow-500" /> Instant Disbursal
          </span>
        </div>
      </div>
    </div>
  );
}
