
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { KingPayShell, type KingPaySection } from "@/components/fintech/kingpay-shell";
import { KingPayWealthHub } from "@/components/fintech/kingpay-wealth-hub";
import { KingPayAccountHub } from "@/components/fintech/kingpay-account-hub";
import { FlightBookingEngine } from "@/components/fintech/flight-booking-engine";

export const Route = createFileRoute("/king-pay")({ component: OrderKingPayPage });

function OrderKingPayPage() {
  const [activeSection, setActiveSection] = useState<KingPaySection>("wealth");

  return (
    <KingPayShell
      walletBalance={84200}
      onAddMoneyClick={() => console.log("add money")}
      onOpenScannerClick={() => console.log("scanner")}
      activeSection={activeSection}
      onSelectSection={setActiveSection}
      alertsCount={2}
    >
      {activeSection === "wealth" && <KingPayWealthHub />}
      {activeSection === "account" && <KingPayAccountHub walletBalance={84200} onOpenScanner={() => {}} />}
      {activeSection === "travel" && <FlightBookingEngine />}
      {activeSection !== "wealth" && activeSection !== "account" && activeSection !== "travel" && (
        <div className="flex items-center justify-center min-h-[50vh] text-muted">
          <p>Please select a tab from the top bar.</p>
        </div>
      )}
    </KingPayShell>
  );
}
