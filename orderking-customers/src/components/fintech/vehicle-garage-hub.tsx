import { Car, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VehicleGarageHubProps {
  walletBalance: number;
  onDeductWallet: (amount: number, description: string) => boolean;
  onOpenScanner: () => void;
}

export function VehicleGarageHub({ walletBalance, onDeductWallet, onOpenScanner }: VehicleGarageHubProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
      <div className="size-16 rounded-full bg-surface-2 flex items-center justify-center text-muted relative">
        <Car className="size-8" />
        <div className="absolute -bottom-1 -right-1 bg-surface rounded-full p-1">
          <Lock className="size-4 text-primary" />
        </div>
      </div>
      <h3 className="font-display text-xl font-bold text-fg">Vehicle Services Locked</h3>
      <p className="text-muted max-w-xs text-sm">
        Pending live RTO/Vahan provider integration for real vehicle data verification.
      </p>
      <Button disabled variant="outline" className="mt-4 opacity-50 cursor-not-allowed">
        Capability Disabled
      </Button>
    </div>
  );
}
