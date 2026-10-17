import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { KingPayShell, type KingPaySection } from "@/components/fintech/kingpay-shell";
import { KingPayCategoryHub } from "@/components/fintech/kingpay-category-hub";
import { KingPayPageSkeleton } from "@/components/skeletons/route-skeletons";
import { AppErrorComponent } from "@/lib/error-component";
import { AddMoneyModal } from "@/components/fintech/add-money-modal";
import { ScanQrModal } from "@/components/fintech/scan-qr-modal";

export const Route = createFileRoute("/king-pay")({
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
  const [activeSection, setActiveSection] = useState<KingPaySection>("pay");
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
