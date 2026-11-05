// @ts-nocheck
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { VendorShell } from "@/components/vendor-shell";
import { Button } from "@/components/ui/button";
import { useVendor } from "@/components/use-vendor";
import {
  Store,
  Utensils,
  Banknote,
  Tag,
  Star,
  Clock,
  Sparkles,
  Settings,
  CheckCircle2,
  ChefHat,
  BarChart3,
  BookOpen,
  Power,
} from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  component: PartnerDashboardPage,
});

function PartnerDashboardPage() {
  const vendor = useVendor();
  const [isOnline, setIsOnline] = useState(true);
  const [prepMinutes, setPrepMinutes] = useState<number>(20);
  const [draftInfo, setDraftInfo] = useState<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("orderking_partner_onboarding_draft");
      if (raw) setDraftInfo(JSON.parse(raw));
    } catch {}
  }, []);

  const restName =
    vendor?.activeRestaurant?.displayName ||
    vendor?.activeRestaurant?.name ||
    draftInfo?.displayName ||
    draftInfo?.name ||
    "Restaurant Partner";
  const restCity = vendor?.activeRestaurant?.city || draftInfo?.city || "Guwahati";
  const payoutCycle = draftInfo?.settlementCycle === "EXPRESS_T1" ? "Next-Day (T+1)" : "Standard Payout";

  const navCards = [
    { to: "/orders", icon: Store, title: "Orders", sub: "Accept & track incoming orders" },
    { to: "/kds", icon: ChefHat, title: "Kitchen KDS", sub: "Preparation queue & KOT print" },
    { to: "/menu", icon: Utensils, title: "Menu & Stock", sub: "Edit dishes, prices & stock" },
    { to: "/settlements", icon: Banknote, title: "Settlement", sub: "Bank payouts & statements" },
    { to: "/promotions", icon: Tag, title: "Offers", sub: "Create customer discounts" },
    { to: "/analytics", icon: BarChart3, title: "Analytics", sub: "Sales & order history" },
    { to: "/reviews", icon: Star, title: "Reviews", sub: "Customer ratings & feedback" },
    { to: "/hours", icon: Clock, title: "Operating Hours", sub: "Opening & closing schedule" },
    { to: "/onboarding", icon: CheckCircle2, title: "Restaurant Profile", sub: "Outlet, FSSAI, PAN & bank" },
    { to: "/assistant", icon: Sparkles, title: "Spark Assistant", sub: "Instant kitchen & menu help" },
    { to: "/academy", icon: BookOpen, title: "Partner Guide", sub: "Packaging & handover steps" },
    { to: "/settings", icon: Settings, title: "Settings", sub: "Printer & outlet preferences" },
  ];

  return (
    <VendorShell title="Home">
      <div className="mx-auto max-w-5xl py-4 space-y-5 text-slate-100">
        {/* Top Outlet Status & Prep Time Bar */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-bold text-white">{restName}</h1>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                  isOnline
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "bg-slate-800 text-slate-300 border border-slate-700"
                }`}
              >
                {isOnline ? "ONLINE" : "OFFLINE"}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {restCity} · Payout: {payoutCycle}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-950 p-1">
              {[15, 20, 25, 30].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPrepMinutes(m)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                    prepMinutes === m
                      ? "bg-emerald-600 text-white"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {m}m
                </button>
              ))}
            </div>

            <Button
              type="button"
              onClick={() => setIsOnline((prev) => !prev)}
              className={`h-10 px-4 rounded-xl text-xs font-bold flex items-center gap-2 ${
                isOnline
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-200"
              }`}
            >
              <Power className="size-3.5" />
              <span>{isOnline ? "Accepting Orders" : "Go Online"}</span>
            </Button>
          </div>
        </div>

        {/* 4 Clean KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <Link to="/orders" className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 hover:border-emerald-500/50 transition">
            <div className="text-xs text-slate-400">New Orders</div>
            <div className="text-2xl font-bold text-white mt-1">0</div>
            <div className="text-[11px] text-emerald-400 mt-1">Open Orders →</div>
          </Link>
          <Link to="/kds" className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 hover:border-emerald-500/50 transition">
            <div className="text-xs text-slate-400">Preparing</div>
            <div className="text-2xl font-bold text-white mt-1">0</div>
            <div className="text-[11px] text-emerald-400 mt-1">Prep Time: {prepMinutes}m →</div>
          </Link>
          <Link to="/analytics" className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 hover:border-emerald-500/50 transition">
            <div className="text-xs text-slate-400">Today&apos;s Sales</div>
            <div className="text-2xl font-bold text-white mt-1">₹0</div>
            <div className="text-[11px] text-emerald-400 mt-1">View Sales →</div>
          </Link>
          <Link to="/settlements" className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 hover:border-emerald-500/50 transition">
            <div className="text-xs text-slate-400">Bank Payout</div>
            <div className="text-2xl font-bold text-white mt-1">₹0</div>
            <div className="text-[11px] text-emerald-400 mt-1">{payoutCycle} →</div>
          </Link>
        </div>

        {/* Clean Partner Navigation Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          {navCards.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-2xl border border-slate-800 bg-slate-900/90 hover:border-emerald-500/50 hover:bg-slate-900 p-4 flex items-start gap-3.5 transition"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                  <Icon className="size-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">{item.title}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{item.sub}</div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </VendorShell>
  );
}
