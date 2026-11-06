// @ts-nocheck
import { createFileRoute, Link } from "@tanstack/react-router";
import { VendorShell } from "@/components/vendor-shell";
import { Store, ChefHat, Utensils, Banknote, ShieldCheck, Sparkles, Tag, BarChart3, Star, Clock, Settings, LogOut } from "lucide-react";

export const Route = createFileRoute("/more")({
  component: PartnerMoreHubPage,
});

function PartnerMoreHubPage() {
  const links = [
    { to: "/orders", icon: Store, label: "Live Orders & KOT Print", desc: "1-tap accept (10m/15m/25m/35m) & mandatory reject reason log" },
    { to: "/kds", icon: ChefHat, label: "Kitchen Display System (KDS)", desc: "Real-time audio siren & station prep queue" },
    { to: "/menu", icon: Utensils, label: "Menu & Stock Manager", desc: "In Stock / Out of Stock / Next Day Auto-Reset & price snapshot guard" },
    { to: "/settlements", icon: Banknote, label: "Daily Ledger & T+1 Settlement", desc: "Sec 9(5) 5% GST, 15-22% Commission, Sec 194-O TDS & Sec 52 TCS" },
    { to: "/onboarding", icon: ShieldCheck, label: "14-Digit FSSAI, GSTIN & Clickwrap KYC", desc: "Verify FSSAI license expiry, bank IFSC & digital contract" },
    { to: "/assistant", icon: Sparkles, label: "Spark AI Menu Upload", desc: "Upload menu photos, PDFs, or CSVs to auto-populate dishes" },
    { to: "/promotions", icon: Tag, label: "Offers & Customer Discounts", desc: "Create flat or percentage discounts for high-conversion slots" },
    { to: "/analytics", icon: BarChart3, label: "Sales & Prep SLA Analytics", desc: "Daily integer-paise GMV, AOV, and kitchen prep time scorecard" },
    { to: "/reviews", icon: Star, label: "Customer Ratings & Reviews", desc: "Inspect verified customer dish ratings and send instant replies" },
    { to: "/hours", icon: Clock, label: "Outlet Shift & Operating Hours", desc: "Configure Day, Evening, and Late-Night kitchen availability" },
    { to: "/settings", icon: Settings, label: "Soundbox Voice & Printer Settings", desc: "Sylheti, Bengali, Hindi & English voice alerts + 80mm thermal KOT" },
  ];

  function handleSignOut() {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("orderking_authenticated_user");
      window.localStorage.removeItem("orderking_phone_session");
      window.localStorage.removeItem("orderking_auth_session_v1");
      window.location.assign("/login");
    }
  }

  return (
    <VendorShell title="Restaurant Management Hub">
      <div className="mx-auto max-w-5xl py-4 space-y-4 text-slate-100">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">All Restaurant Partner Controls</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Entity: Orderkingpay · GSTIN: 18AFXPH9838M1Z9 · FSSAI Verified Storefront
            </p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-xl border border-rose-500/40 bg-rose-950/30 hover:bg-rose-900/50 px-4 py-2 text-xs font-bold text-rose-300 flex items-center gap-1.5"
          >
            <LogOut className="size-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {links.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-2xl border border-slate-800 bg-slate-900/90 hover:border-emerald-500/50 p-4 flex items-start gap-3.5 transition"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                  <Icon className="size-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">{item.label}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{item.desc}</div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </VendorShell>
  );
}
