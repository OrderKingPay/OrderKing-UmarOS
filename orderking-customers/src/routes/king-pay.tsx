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

const DEFAULT_WALLET_BALANCE_PAISE = 500000; // ₹5,000.00
const WALLET_STORAGE_KEY = "orderking_wallet_balance_paise";

function OrderKingPayPage() {
  const [activeSection, setActiveSection] = useState<KingPaySection>("pay");
  const [walletBalancePaise, setWalletBalancePaise] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(WALLET_STORAGE_KEY);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 0) {
          return parsed;
        }
      }
    }
    return DEFAULT_WALLET_BALANCE_PAISE;
  });

  const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false);
  const [isScanQrOpen, setIsScanQrOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(WALLET_STORAGE_KEY, walletBalancePaise.toString());
    }
  }, [walletBalancePaise]);

  const handleAddMoneySuccess = (addedPaise: number) => {
    setWalletBalancePaise((prev) => {
      const next = prev + addedPaise;
      if (typeof window !== "undefined") {
        localStorage.setItem(WALLET_STORAGE_KEY, next.toString());
      }
      return next;
    });
  };

  const handleDeductWallet = (amountPaise: number, _description: string): boolean => {
    if (walletBalancePaise < amountPaise) {
      return false;
    }
    setWalletBalancePaise((prev) => {
      const next = Math.max(0, prev - amountPaise);
      if (typeof window !== "undefined") {
        localStorage.setItem(WALLET_STORAGE_KEY, next.toString());
      }
      return next;
    });
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
