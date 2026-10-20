import { createFileRoute, useRouterState, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Sparkles, ChevronRight } from "lucide-react";
import { KingPayShell, type KingPaySection } from "@/components/fintech/kingpay-shell";
import { KingPayCategoryHub } from "@/components/fintech/kingpay-category-hub";
import { KingPayPageSkeleton } from "@/components/skeletons/route-skeletons";
import { AppErrorComponent } from "@/lib/error-component";
import { AddMoneyModal } from "@/components/fintech/add-money-modal";
import { ScanQrModal } from "@/components/fintech/scan-qr-modal";

export type KingPaySearch = {
  tab?: string;
};

export const Route = createFileRoute("/king-pay")({
  validateSearch: (search: Record<string, unknown>): KingPaySearch => ({
    tab: typeof search.tab === "string" ? search.tab : undefined,
  }),
  component: OrderKingPayPage,
  pendingComponent: KingPayPageSkeleton,
  errorComponent: AppErrorComponent,
});

import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useRealKingPayWallet } from "@/lib/hooks/use-real-kingpay-wallet";
import {
  recordAuthenticTopUp,
  recordAuthenticPayment,
} from "@/lib/kingpay/ledger-binding";

function OrderKingPayPage() {
  const search = Route.useSearch();
  const hash = useRouterState({ select: (s) => s?.location?.hash ?? "" }) ?? "";
  const initialSection: KingPaySection =
    search?.tab === "passbook" || (hash || "").replace(/^#/, "").toLowerCase() === "passbook"
      ? "passbook"
      : "pay";
  const [activeSection, setActiveSection] = useState<KingPaySection>(initialSection);

  useEffect(() => {
    const cleanHash = (hash || "").replace(/^#/, "").toLowerCase();
    if (search?.tab === "passbook" || cleanHash === "passbook") {
      setActiveSection("passbook");
    }
  }, [search?.tab, hash]);
  const { user } = useCurrentUserState();
  const userId = user?.id || "dev-user";

  // Connect directly to the real Supabase ledger wallet hook - strictly authentic balance
  const { walletBalancePaise, deductMoney } = useRealKingPayWallet();
  const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false);
  const [isScanQrOpen, setIsScanQrOpen] = useState(false);

  const handleAddMoneySuccess = async (addedPaise: number) => {
    try {
      await recordAuthenticTopUp({
        userId,
        amountPaise: addedPaise,
        source: "UPI",
      });
    } catch (err) {
      console.error("Failed to record top-up to ledger:", err);
    }
  };

  const handleDeductWallet = (amountPaise: number, description: string): boolean => {
    if (walletBalancePaise < amountPaise) {
      return false;
    }

    // Immediately post authentic double-entry deduction
    recordAuthenticPayment({
      userId,
      recipientId: "MERCHANT_NODAL",
      amountPaise,
      memo: description,
    }).catch((err) => {
      console.error("Failed to record authentic payment to ledger:", err);
    });

    deductMoney.mutate({ amount: amountPaise / 100, description });
    return true;
  };

  return (
    <>
      <KingPayShell
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        walletBalance={walletBalancePaise}
        onAddMoneyClick={() => setIsAddMoneyOpen(true)}
        onOpenScannerClick={() => setIsScanQrOpen(true)}
      >
        <div className="mx-auto max-w-5xl px-4 pt-4 pb-1">
          <Link
            to="/kingpay"
            className="flex items-center justify-between p-3.5 rounded-2xl border border-amber-400/50 bg-gradient-to-r from-amber-950/70 via-slate-900 to-[#121622] hover:border-amber-400 transition no-underline text-white shadow-md group"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 shadow-sm group-hover:scale-105 transition-transform">
                <Sparkles className="size-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-amber-300">Supreme KingPay Super Engine</span>
                  <span className="text-[9px] font-black uppercase px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    Live 4 Pillars
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Tickets (Flights, Trains, Buses, Hotels) · AI Tutor · Verified Jobs · 1-Tap UPI
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-amber-400 group-hover:underline">
              <span>Open Supreme Hub</span>
              <ChevronRight className="size-3.5" />
            </div>
          </Link>
        </div>
        <KingPayCategoryHub activeSection={activeSection} onSelectSection={setActiveSection} />
      </KingPayShell>

      {/* Add Money Modal */}
      <AddMoneyModal
        isOpen={isAddMoneyOpen}
        onClose={() => setIsAddMoneyOpen(false)}
        currentBalancePaise={walletBalancePaise}
        onSuccess={handleAddMoneySuccess}
      />

      {/* Scan & Pay QR Modal */}
      <ScanQrModal
        isOpen={isScanQrOpen}
        onClose={() => setIsScanQrOpen(false)}
        walletBalancePaise={walletBalancePaise}
        onDeductWallet={handleDeductWallet}
      />
    </>
  );
}
