import { ArrowRight, ShieldCheck, ExternalLink, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MicroLoanHubProps {
  walletBalance: number;
  /** Kept for backwards compatibility; direct disbursement is intentionally not performed here. */
  onDisburseToWallet?: (amount: number) => void;
}

type ProviderOffer = {
  id: string;
  name: string;
  lender: string;
  description: string;
  sourceUrl: string;
  officialUrl: string;
  status: "available" | "partner_required";
};

const PROVIDER_OFFERS: ProviderOffer[] = [
  {
    id: "navi",
    name: "Navi Cash Loan",
    lender: "Navi Finserv Limited",
    description: "Apply directly with the lender. Eligibility, rate, approval and disbursal are decided by the lender.",
    sourceUrl: import.meta.env.VITE_KINGPAY_NAVI_AFFILIATE_URL || "https://navi.com/finserv",
    officialUrl: "https://navi.com/finserv",
    status: "available",
  },
  {
    id: "lendingkart",
    name: "Lendingkart Business Finance",
    lender: "Lendingkart Finance Limited",
    description: "Business-loan application is handled by the lender. OrderKing does not approve or disburse the loan.",
    sourceUrl:
      import.meta.env.VITE_KINGPAY_LENDINGKART_AFFILIATE_URL ||
      "https://www.lendingkart.com/partner-with-us/",
    officialUrl: "https://www.lendingkart.com/",
    status: "available",
  },
];

export function MicroLoanHub({ walletBalance, onDisburseToWallet: _onDisburseToWallet }: MicroLoanHubProps) {
  const hasBalance = Number.isFinite(walletBalance);

  return (
    <div className="space-y-6 p-4 text-fg md:p-6">
      <div className="relative overflow-hidden rounded-3xl border-2 border-emerald-500/30 bg-emerald-500/5 p-6 shadow-xl sm:p-10">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-600">
            <ShieldCheck className="size-3.5" /> Verified lender marketplace
          </div>
          <h2 className="font-display text-3xl font-black text-emerald-700 dark:text-emerald-400 sm:text-4xl">
            KingPay Loan Marketplace
          </h2>
          <p className="max-w-3xl text-sm font-medium text-muted sm:text-base">
            Loan applications are completed by the external lender. OrderKing does not invent eligibility,
            approve loans, create a loan ID, or claim wallet disbursement without a confirmed provider transaction.
          </p>

          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-muted">
            <div className="flex items-start gap-2">
              <Info className="mt-0.5 size-4 shrink-0 text-amber-500" />
              <div>
                <p className="font-bold text-fg">Affiliate/partner tracking</p>
                <p className="mt-1">
                  A provider-specific affiliate URL can be configured through public application configuration after
                  a real partner agreement is active. No commission is promised until the provider agreement and
                  tracking are verified.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {PROVIDER_OFFERS.map((offer) => (
              <div key={offer.id} className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black">{offer.name}</h3>
                    <p className="mt-1 text-xs font-semibold text-muted">{offer.lender}</p>
                  </div>
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-600">
                    External provider
                  </span>
                </div>

                <p className="mt-3 text-sm text-muted">{offer.description}</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    className="bg-emerald-600 font-bold text-white hover:bg-emerald-700"
                    onClick={() => window.open(offer.sourceUrl, "_blank", "noopener,noreferrer")}
                  >
                    Continue with provider
                    <ArrowRight className="ml-1.5 size-4" />
                  </Button>
                  <a
                    href={offer.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-xl border border-border px-3 py-2 text-xs font-bold text-muted hover:bg-surface-2"
                  >
                    Official site
                    <ExternalLink className="ml-1.5 size-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-border bg-surface-2/40 p-4 text-xs text-muted">
            <p className="font-bold text-fg">What happens to your KingPay wallet?</p>
            <p className="mt-1">
              No automatic wallet credit is made from this screen. A lender must confirm a real disbursal before any
              OrderKing ledger or wallet balance can be updated.
            </p>
          </div>

          {hasBalance ? (
            <p className="text-[11px] text-muted">
              Current KingPay wallet balance is displayed from the existing account state; this loan screen never modifies it.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
