import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { KingPayShell, type KingPaySection } from "@/components/fintech/kingpay-shell";
import { KingPayCategoryHub } from "@/components/fintech/kingpay-category-hub";
import { KingPayPageSkeleton } from "@/components/skeletons/route-skeletons";
import { AppErrorComponent } from "@/lib/error-component";

export const Route = createFileRoute("/king-pay")({
  component: OrderKingPayPage,
  pendingComponent: KingPayPageSkeleton,
  errorComponent: AppErrorComponent,
});

function OrderKingPayPage() {
  const [activeSection, setActiveSection] = useState<KingPaySection>("pay");
  return (
    <KingPayShell
      activeSection={activeSection}
      onSelectSection={setActiveSection}
      onAddMoneyClick={() => {}}
      onOpenScannerClick={() => {}}
    >
      <KingPayCategoryHub activeSection={activeSection} onSelectSection={setActiveSection} />
    </KingPayShell>
  );
}
