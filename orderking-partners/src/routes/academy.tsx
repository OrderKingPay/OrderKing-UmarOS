// @ts-nocheck
import { createFileRoute, Link } from "@tanstack/react-router";
import { VendorShell } from "@/components/vendor-shell";
import { CheckCircle2, Clock, PackageCheck, ShieldCheck, Utensils } from "lucide-react";

export const Route = createFileRoute("/academy")({
  component: PartnerGuidePage,
});

function PartnerGuidePage() {
  const guides = [
    {
      icon: Clock,
      title: "1. Accepting Orders & Prep Time",
      desc: "Accept new orders promptly in Orders or Kitchen KDS and set accurate prep time (15m, 20m, or 30m).",
      link: "/orders",
      linkText: "Open Orders",
    },
    {
      icon: PackageCheck,
      title: "2. Packaging & Sealing",
      desc: "Pack dishes in spill-safe containers, seal the bag, and attach the bill before rider handover.",
      link: "/kds",
      linkText: "Open Kitchen",
    },
    {
      icon: ShieldCheck,
      title: "3. Rider Handover",
      desc: "Match the 4-digit pickup code with the delivery partner and mark Ready once packed.",
      link: "/orders",
      linkText: "View Queue",
    },
    {
      icon: Utensils,
      title: "4. Menu & Stock Updates",
      desc: "Toggle unavailable items Out of Stock in Menu immediately to avoid order cancellations.",
      link: "/menu",
      linkText: "Open Menu",
    },
  ];

  return (
    <VendorShell title="Partner Guide">
      <div className="mx-auto max-w-3xl py-4 space-y-4 text-slate-100">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h1 className="text-lg font-bold text-white">Restaurant Operations Guide</h1>
          <p className="text-xs text-slate-400 mt-1">
            Quick steps for kitchen orders, packaging, handover, and menu updates.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {guides.map((g) => {
            const Icon = g.icon;
            return (
              <div key={g.title} className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5 text-sm font-bold text-white">
                    <Icon className="size-4 text-emerald-400 shrink-0" />
                    <span>{g.title}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{g.desc}</p>
                </div>
                <Link
                  to={g.link}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
                >
                  <CheckCircle2 className="size-3.5" />
                  <span>{g.linkText} →</span>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </VendorShell>
  );
}
