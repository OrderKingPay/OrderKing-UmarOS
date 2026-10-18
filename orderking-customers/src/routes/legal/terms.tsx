
import { createFileRoute } from "@tanstack/react-router";
import { CustomerShell } from "@/components/market/shell";
import { useBrand, useT } from "@/components/providers";

export const Route = createFileRoute("/legal/terms")({ component: TermsPage });

function TermsPage() {
  const { t } = useT();
  const { brand, marketplace } = useBrand();
  return (
    <CustomerShell>
      <article className="px-4 py-5 text-sm text-muted">
        <h1 className="font-display text-3xl text-fg">{t("legal.terms")}</h1>
        <p className="mt-4 leading-relaxed">
          {brand.companyName} operates a hyperlocal multi-vendor marketplace platform. Participating merchant partners are verified prior to catalog activation. Order totals, delivery charges, statutory GST, and platform commissions ({marketplace.defaultCommissionBps / 100}%) are calculated server-side and recorded immutably per order. Cash on delivery and certified UPI payment rails are supported across serviceable delivery zones.
        </p>
      </article>
    </CustomerShell>
  );
}
