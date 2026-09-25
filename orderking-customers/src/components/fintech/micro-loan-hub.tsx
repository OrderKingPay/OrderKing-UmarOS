import { Banknote, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MicroLoanHubProps {
  walletBalance: number;
  onDisburseToWallet: (amount: number) => void;
}

export function MicroLoanHub() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
      <div className="size-16 rounded-full bg-surface-2 flex items-center justify-center text-muted relative">
        <Banknote className="size-8" />
        <div className="absolute -bottom-1 -right-1 bg-surface rounded-full p-1">
          <Lock className="size-4 text-primary" />
        </div>
      </div>
      <h3 className="font-display text-xl font-bold text-fg">Financial Services Locked</h3>
      <p className="text-muted max-w-xs text-sm">
        Pending verified NBFC provider integration and KYC compliance APIs. No fake loans are permitted.
      </p>
      <Button disabled variant="outline" className="mt-4 opacity-50 cursor-not-allowed">
        Capability Disabled
      </Button>
    </div>
  );
}
