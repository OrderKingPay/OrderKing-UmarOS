import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { VendorShell } from "@/components/vendor-shell";
import { useVendor } from "@/components/use-vendor";
import { PartnerOperationsAcademy } from "@/components/partner-operations-academy";

export const Route = createFileRoute("/academy")({ component: AcademyPage });

function AcademyPage() {
  const vendor = useVendor();
  const navigate = useNavigate();

  function handleAskSpark(prompt: string) {
    navigate({
      to: "/assistant",
      search: { prompt },
    } as any);
  }

  return (
    <VendorShell
      title="Operations & SOP Academy"
      dataLabel={vendor.dataLabel}
      restaurantName={vendor.selected?.restaurantName}
    >
      <div className="space-y-4">
        <PartnerOperationsAcademy onAskSpark={handleAskSpark} />
      </div>
    </VendorShell>
  );
}
