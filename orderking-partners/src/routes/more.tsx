import { createFileRoute, Link } from "@tanstack/react-router";
import { VendorShell, MORE_NAV } from "@/components/vendor-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/use-t";
import { useVendor } from "@/components/use-vendor";
import { useClientState } from "@/lib/client-state";
import { can } from "@/lib/rbac";
import { UserButton } from "@/lib/auth/gates";
import { ALL_INDIAN_LANGUAGES } from "./settings";
import { useCommissionTokens } from "@orderking/ui";
import {
  ArrowUpRight,
  CalendarDays,
  FileText,
  Globe,
  HeartHandshake,
  Mail,
  Scale,
  ShieldCheck,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";

export const Route = createFileRoute("/more")({ component: MorePage });

const NAV_ITEM_METADATA: Record<
  string,
  { title: string; subtitle: string; tag?: string; highlight?: boolean }
> = {
  "/promotions": {
    title: "Promotions & Dynamic Offers",
    subtitle: "Custom discounts, festive campaigns & chef specials",
    tag: "Growth",
  },
  "/analytics": {
    title: "Business Intelligence & Analytics",
    subtitle: "Live order volume, top-selling dishes & peak revenue windows",
    tag: "Insights",
  },
  "/reviews": {
    title: "Guest Reviews & Hospitality",
    subtitle: "Patron feedback, 5-star ratings & direct chef replies",
    tag: "Guest Love",
  },
  "/hours": {
    title: "Kitchen Hours & Shift Schedule",
    subtitle: "Operating timings, holiday shifts & prep SLA pacing",
    tag: "Operations",
  },
  "/assistant": {
    title: "King AI Restaurant Co-Pilot",
    subtitle: "Ask business questions, prep forecasts & menu optimization",
    tag: "King AI",
    highlight: true,
  },
  "/notifications": {
    title: "Kitchen Alerts & Updates",
    subtitle: "Real-time dispatch updates, customer notes & audio alerts",
    tag: "Live",
  },
  "/onboarding": {
    title: "Restaurant Profile & Credentials",
    subtitle: "FSSAI compliance, outlet showcase & bank settlement details",
    tag: "Profile",
  },
  "/settings": {
    title: "Kitchen Settings & Hardware",
    subtitle: "Commission rates, thermal ESC/POS printers & staff permissions",
    tag: "Settings",
  },
};

function MorePage() {
  const t = useT();
  const vendor = useVendor();
  const role = vendor.role;
  const lang = useClientState((s) => s.lang);
  const setLang = useClientState((s) => s.setLang);
  const soundOn = useClientState((s) => s.soundOn);
  const setSoundOn = useClientState((s) => s.setSoundOn);
  const items = MORE_NAV.filter((item) => !role || can(role, item.perm));

  const commissionTokens = useCommissionTokens();
  const defaultDeliveryBps = commissionTokens.standardDeliveryBps ?? 2800;
  const commissionBps = vendor.selected?.commissionBps ?? defaultDeliveryBps;
  const deliveryCommissionDisplay = `${Math.round(commissionBps / 100)}%`;
  const dineInCommissionDisplay =
    commissionTokens.dineInBps === 0 ? "0%" : `${Math.round(commissionTokens.dineInBps / 100)}%`;

  return (
    <VendorShell
      title={t("nav.more")}
      dataLabel={vendor.dataLabel}
      restaurantName={vendor.selected?.restaurantName}
    >
      <div className="space-y-4">
        {/* Quick Partner Status & Audio Siren Bar */}
        <Card className="border-slate-800 bg-slate-900/80 p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                {vendor.selected?.restaurantName ?? "Order King Restaurant Partner"}
              </span>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[9.5px] font-semibold text-emerald-400">
                Order King Partner
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span>
                Role: <strong className="font-mono text-slate-200">{role ?? "PARTNER"}</strong>
              </span>
              <span>·</span>
              <span>
                Status:{" "}
                <strong className="font-mono text-emerald-300">
                  {vendor.selected?.verificationStatus ?? "ACTIVE"}
                </strong>
              </span>
              <span>·</span>
              <span>
                Delivery: <strong className="font-mono text-slate-200">{deliveryCommissionDisplay}</strong>
              </span>
              <span>·</span>
              <span>
                Dine-In: <strong className="font-mono text-emerald-300">{dineInCommissionDisplay} Commission</strong>
              </span>
            </div>
          </div>
          <Button
            size="sm"
            variant={soundOn ? "primary" : "secondary"}
            onClick={() => setSoundOn(!soundOn)}
            className="text-xs font-medium"
          >
            {soundOn ? (
              <>
                <Volume2 className="mr-1.5 size-3.5 text-emerald-400" /> Order Siren Active
              </>
            ) : (
              <>
                <VolumeX className="mr-1.5 size-3.5 text-slate-400" /> Order Siren Muted
              </>
            )}
          </Button>
        </Card>

        {/* Navigation Grid */}
        <div className="grid gap-2">
          {(!role || can(role, "orders.view")) && (
            <Link
              to="/dining"
              className="group flex min-h-16 items-center justify-between gap-4 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/30 via-slate-900/80 to-slate-900/70 p-4 hover:border-amber-500/70 transition"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 group-hover:scale-105 transition">
                  <CalendarDays className="size-5" />
                </div>
                <div>
                  <div className="font-semibold text-slate-100 flex items-center gap-2">
                    <span>{t("nav.dining") || "Dining & Table Reservations"}</span>
                    <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[9.5px] font-bold text-emerald-300">
                      {dineInCommissionDisplay} Dine-In Commission
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Live floor plans, table turns &amp; guest reservation management
                  </div>
                </div>
              </div>
              <ArrowUpRight className="size-4 text-amber-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
            </Link>
          )}

          {items.map((item) => {
            const meta = NAV_ITEM_METADATA[item.to];
            const isKingAi = item.to === "/assistant";
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`group flex min-h-16 items-center justify-between gap-4 rounded-2xl border p-4 transition ${
                  isKingAi
                    ? "border-emerald-500/40 bg-gradient-to-r from-emerald-950/25 via-slate-900/80 to-slate-900/70 hover:border-emerald-500/70"
                    : "border-slate-800 bg-slate-900/70 hover:border-slate-700 hover:bg-slate-900/90"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`flex size-10 items-center justify-center rounded-xl border transition group-hover:scale-105 ${
                      isKingAi
                        ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                        : "bg-slate-800/60 border-slate-700/60 text-chili"
                    }`}
                  >
                    <item.icon className="size-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-100 flex items-center gap-2">
                      <span>{meta?.title ?? t(item.key)}</span>
                      {meta?.tag && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                            isKingAi
                              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                              : "bg-slate-800 border-slate-700 text-slate-300"
                          }`}
                        >
                          {meta.tag}
                        </span>
                      )}
                    </div>
                    {meta?.subtitle && (
                      <div className="text-xs text-slate-400 mt-0.5">
                        {meta.subtitle}
                      </div>
                    )}
                  </div>
                </div>
                <ArrowUpRight
                  className={`size-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${
                    isKingAi ? "text-emerald-400" : "text-slate-400"
                  }`}
                />
              </Link>
            );
          })}
        </div>

        {/* 1-Tap Pan-India Regional Language Selector */}
        <Card className="border-slate-800 bg-slate-900/70 p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="size-4 text-emerald-400" />
              <div>
                <h2 className="font-display text-sm font-bold text-white">
                  Regional Kitchen Languages
                </h2>
                <p className="text-[11px] text-slate-400">
                  Switch the partner portal instantly ({ALL_INDIAN_LANGUAGES.length} Indian Languages)
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono uppercase bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
              {lang}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {ALL_INDIAN_LANGUAGES.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => setLang(l.code)}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                  lang === l.code
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "border border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-700 hover:text-white"
                }`}
              >
                {l.native} <span className="opacity-70">({l.label})</span>
              </button>
            ))}
          </div>
        </Card>

        {/* Order King Partner Charter & Hospitality Standards */}
        <Card className="border-slate-800 bg-slate-900/70 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-emerald-400" />
              <div>
                <h2 className="font-display text-sm font-bold text-white">
                  Order King Partner Charter &amp; Trust
                </h2>
                <p className="text-[11px] text-slate-400">
                  Transparent commercials, food hygiene guidelines &amp; guest data privacy
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono tracking-wider text-emerald-400 uppercase bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              TRUST &amp; TRANSPARENCY
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <Link
              to="/settings"
              className="group flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 p-3 hover:border-slate-700 transition"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-105 transition">
                  <Scale className="size-4 shrink-0" />
                </div>
                <div>
                  <div className="font-semibold text-slate-100 group-hover:text-emerald-300 transition">
                    Fair Commercial Terms &amp; Payouts
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {Math.round(defaultDeliveryBps / 100)}% delivery take-rate, {dineInCommissionDisplay} dine-in &amp; direct tax clarity
                  </div>
                </div>
              </div>
              <ArrowUpRight className="size-3.5 text-slate-400 group-hover:text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition shrink-0" />
            </Link>

            <Link
              to="/settings"
              className="group flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 p-3 hover:border-slate-700 transition"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-105 transition">
                  <FileText className="size-4 shrink-0" />
                </div>
                <div>
                  <div className="font-semibold text-slate-100 group-hover:text-emerald-300 transition">
                    Guest Trust, Food Safety &amp; Privacy
                  </div>
                  <div className="text-[11px] text-slate-400">
                    FSSAI hygiene standards &amp; DPDP guest data protection
                  </div>
                </div>
              </div>
              <ArrowUpRight className="size-3.5 text-slate-400 group-hover:text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition shrink-0" />
            </Link>
          </div>
        </Card>

        {/* Order King Partner Concierge & Chef Support */}
        <Card className="border-slate-800 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-950 p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HeartHandshake className="size-4 text-emerald-400" />
              <div>
                <h2 className="font-display text-sm font-bold text-white">
                  Order King Partner Concierge
                </h2>
                <p className="text-[11px] text-slate-400">
                  Dedicated assistance for restaurateurs, head chefs &amp; operations managers
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-slate-400">24/7 SUPPORT</span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-300 border-t border-slate-800/80">
            <div className="flex items-center gap-2">
              <Mail className="size-3.5 text-emerald-400" />
              <span>
                Partner Desk:{" "}
                <a
                  href="mailto:partner-support@orderkingpay.com"
                  className="text-emerald-400 hover:underline"
                >
                  partner-support@orderkingpay.com
                </a>
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
              <Sparkles className="size-3 text-emerald-400" />
              <span>Powered by Order King Hospitality Engine</span>
            </div>
          </div>
        </Card>

        <div className="md:hidden">
          <UserButton />
        </div>
      </div>
    </VendorShell>
  );
}
