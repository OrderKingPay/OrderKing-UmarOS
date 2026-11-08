import { createFileRoute } from "@tanstack/react-router";
import { CustomerShell } from "@/components/market/shell";
import { useBrand } from "@/components/providers";

export const Route = createFileRoute("/about")({ component: AboutPage });

function AboutPage() {
  const { brand, invoice } = useBrand();
  return (
    <CustomerShell>
      <article className="max-w-2xl mx-auto px-4 py-6 text-sm text-muted space-y-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-fg">{brand.appName}</h1>
          <p className="mt-1.5 text-base text-fg font-medium">{brand.tagline}</p>
          <p className="mt-2 text-sm leading-relaxed">{brand.description}</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
          <h2 className="font-display text-lg font-bold text-fg">Our Delivery Commitment</h2>
          <ul className="space-y-2 text-xs sm:text-sm">
            <li className="flex items-start gap-2.5">
              <span className="text-emerald-500 font-bold">✓</span>
              <span><strong>Fresh &amp; Direct:</strong> Orders prepared fresh by verified local restaurants and kitchens.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-emerald-500 font-bold">✓</span>
              <span><strong>Transparent Pricing:</strong> Clear bill breakdown with zero hidden fees.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-emerald-500 font-bold">✓</span>
              <span><strong>Live Order Tracking:</strong> Real-time GPS tracking from the kitchen to your doorstep.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-emerald-500 font-bold">✓</span>
              <span><strong>Dedicated Support:</strong> Instant assistance for your orders and delivery inquiries.</span>
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-border/80 bg-surface-2/40 p-4 space-y-1.5 text-xs">
          <h3 className="font-semibold text-fg">Regulatory &amp; FSSAI Details</h3>
          <p className="text-muted leading-relaxed">
            Operating under {invoice.companyName} · GSTIN: <span className="font-mono">{invoice.gstin}</span> · FSSAI License: <span className="font-mono">{invoice.fssai}</span>
          </p>
        </div>
      </article>
    </CustomerShell>
  );
}
