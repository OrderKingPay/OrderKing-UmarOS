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
  ShieldCheck,
} from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  component: PartnerDashboardPage,
});

function PartnerDashboardPage() {
  const vendor = useVendor();
  const [isOnline, setIsOnline] = useState(true);
  const [prepMinutes, setPrepMinutes] = useState<10 | 15 | 25 | 35>(15);
  const [draftInfo, setDraftInfo] = useState<any>(null);
  const [liveOrdersCount, setLiveOrdersCount] = useState<number>(2);
  const [preparingCount, setPreparingCount] = useState<number>(1);
  const [todaySalesPaise, setTodaySalesPaise] = useState<number>(2570000); // ₹25,700.00
  const [netPayoutPaise, setNetPayoutPaise] = useState<number>(1957250); // ₹19,572.50

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("orderking_partner_onboarding_draft");
      if (raw) setDraftInfo(JSON.parse(raw));
      const ordRaw = window.localStorage.getItem("orderking_partner_live_orders_v2");
      if (ordRaw) {
        const parsed = JSON.parse(ordRaw);
        if (Array.isArray(parsed)) {
          setLiveOrdersCount(parsed.filter((o) => o.status === "PLACED").length);
          setPreparingCount(parsed.filter((o) => o.status === "ACCEPTED" || o.status === "READY_FOR_PICKUP").length);
        }
      }
    } catch {}
  }, []);

  const restName =
    vendor?.activeRestaurant?.displayName ||
    vendor?.activeRestaurant?.name ||
    draftInfo?.displayName ||
    draftInfo?.name ||
    "Royal Assam Kitchen";
  const restCity = vendor?.activeRestaurant?.city || draftInfo?.city || "Karimganj / Guwahati, Assam";
  const fssaiNo = draftInfo?.fssaiNumber || "10324001000492";
  const fmt = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const navCards = [
    { to: "/orders", icon: Store, title: "Live Orders", sub: "1-tap accept (10/15/25/35m) & KOT print" },
    { to: "/kds", icon: ChefHat, title: "Kitchen KDS", sub: "Real-time audio siren & prep queue" },
    { to: "/menu", icon: Utensils, title: "Menu & Stock", sub: "In Stock / Out of Stock / Next Day Auto-Reset" },
    { to: "/settlements", icon: Banknote, title: "T+1 Settlement", sub: "Sec 9(5) GST, 194-O TDS, Sec 52 TCS & Net Batch" },
    { to: "/onboarding", icon: CheckCircle2, title: "FSSAI & KYC Profile", sub: "14-digit FSSAI, GSTIN, Bank IFSC & Clickwrap" },
    { to: "/assistant", icon: Sparkles, title: "Spark AI Menu Upload", sub: "Upload photo, PDF, or CSV to update menu" },
    { to: "/promotions", icon: Tag, title: "Offers & Coupons", sub: "Configure flat & percentage customer promos" },
    { to: "/analytics", icon: BarChart3, title: "Sales Analytics", sub: "Integer-paise GMV, AOV & prep SLA metrics" },
    { to: "/reviews", icon: Star, title: "Customer Reviews", sub: "Verified order ratings & instant reply" },
    { to: "/hours", icon: Clock, title: "Operating Hours", sub: "Day, Evening & Late-Night shift timings" },
    { to: "/academy", icon: BookOpen, title: "Partner SOP Guide", sub: "FSSAI hygiene, packaging & rider handover" },
    { to: "/settings", icon: Settings, title: "Soundbox & Settings", sub: "Sylheti/Bengali/Hindi/English voice & printer" },
  ];

  return (
    <VendorShell title="Restaurant Partner Console">
      <div className="mx-auto max-w-5xl py-4 space-y-5 text-slate-100">
        {/* Top Outlet Status, FSSAI Badge & Configurable Prep Timer (10m, 15m, 25m, 35m) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-lg font-bold text-white">{restName}</h1>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                  isOnline
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "bg-slate-800 text-slate-300 border border-slate-700"
                }`}
              >
                {isOnline ? "ONLINE · ACCEPTING ORDERS" : "OFFLINE"}
              </span>
            </div>
            <p className="text-xs text-slate-400 flex flex-wrap items-center gap-2">
              <ShieldCheck className="size-3.5 text-emerald-400" />
              <span>{restCity} · FSSAI Lic: <strong className="font-mono text-slate-200">{fssaiNo}</strong> · ECO GSTIN: <strong className="font-mono text-slate-200">18AFXPH9838M1Z9</strong></span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-950 p-1">
              {([10, 15, 25, 35] as const).map((m) => (
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

        {/* 4 Real Integer-Paise KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <Link to="/orders" className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 hover:border-emerald-500/50 transition">
            <div className="text-xs text-slate-400">New Orders</div>
            <div className="text-2xl font-bold text-white font-mono mt-1">{liveOrdersCount}</div>
            <div className="text-[11px] text-emerald-400 mt-1">Open Order Queue →</div>
          </Link>
          <Link to="/kds" className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 hover:border-emerald-500/50 transition">
            <div className="text-xs text-slate-400">Active KDS Queue</div>
            <div className="text-2xl font-bold text-white font-mono mt-1">{preparingCount}</div>
            <div className="text-[11px] text-emerald-400 mt-1">Default SLA: {prepMinutes}m →</div>
          </Link>
          <Link to="/analytics" className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 hover:border-emerald-500/50 transition">
            <div className="text-xs text-slate-400">Today&apos;s Gross Sales</div>
            <div className="text-xl font-bold text-white font-mono mt-1">{fmt(todaySalesPaise)}</div>
            <div className="text-[11px] text-emerald-400 mt-1">Integer-Paise Ledger →</div>
          </Link>
          <Link to="/settlements" className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 hover:border-emerald-500/50 transition">
            <div className="text-xs text-slate-400">Net T+1 Bank Batch</div>
            <div className="text-xl font-bold text-emerald-400 font-mono mt-1">{fmt(netPayoutPaise)}</div>
            <div className="text-[11px] text-slate-400 mt-1">After Sec 9(5) / 194-O / 52 →</div>
          </Link>
        </div>

        {/* 12 Partner Modules Grid */}
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
