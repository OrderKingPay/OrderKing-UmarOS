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
    title: "Promotions & Offers",
    subtitle: "Custom discounts, festive campaigns & promo codes",
    tag: "Growth",
  },
  "/analytics": {
    title: "Business Performance & Analytics",
    subtitle: "Live order volume, sales breakdown & peak hours",
    tag: "Insights",
  },
  "/reviews": {
    title: "Customer Reviews & Ratings",
    subtitle: "Guest feedback, 5-star ratings & direct replies",
    tag: "Feedback",
  },
  "/hours": {
    title: "Outlet Timings & Operational Shifts",
    subtitle: "Opening hours, slot schedules & temporary closures",
    tag: "Operations",
  },
  "/notifications": {
    title: "Order Alerts & Notifications",
    subtitle: "Real-time dispatch updates, notes & audio alerts",
    tag: "Alerts",
  },
  "/onboarding": {
    title: "Restaurant Profile & Documents",
    subtitle: "FSSAI license, PAN details & bank settlement account",
    tag: "Profile",
  },
  "/support": {
    title: "Help Center & Support Desk",
    subtitle: "Raise tickets for payouts, transit spills, menu updates & hardware",
    tag: "Support",
    highlight: true,
  },
  "/settings": {
    title: "Outlet Settings & Hardware",
    subtitle: "Printer integration, POS hardware & staff permissions",
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
        <Card className="border-gray-200 bg-white p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-900">
                {vendor.selected?.restaurantName ?? "OrderKing Restaurant Partner"}
              </span>
              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                Active Partner
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span>
                Role: <strong className="text-gray-700">{role ?? "PARTNER"}</strong>
              </span>
              <span>·</span>
              <span>
                Status:{" "}
                <strong className="text-emerald-700 font-semibold">
                  {vendor.selected?.verificationStatus ?? "ACTIVE"}
                </strong>
              </span>
              <span>·</span>
              <span>
                Delivery Fee: <strong className="text-gray-700">{deliveryCommissionDisplay}</strong>
              </span>
              <span>·</span>
              <span>
                Dine-In: <strong className="text-emerald-700 font-semibold">{dineInCommissionDisplay}</strong>
              </span>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSoundOn(!soundOn)}
            className={`text-xs font-semibold h-9 rounded-xl border ${
              soundOn
                ? "bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100"
                : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
            }`}
          >
            {soundOn ? (
              <>
                <Volume2 className="mr-1.5 size-3.5 text-emerald-600" /> Kitchen Audio Siren ON
              </>
            ) : (
              <>
                <VolumeX className="mr-1.5 size-3.5 text-gray-400" /> Kitchen Audio Siren Muted
              </>
            )}
          </Button>
        </Card>

        {/* Navigation Grid */}
        <div className="grid gap-2 sm:grid-cols-2">
          {(!role || can(role, "orders.view")) && (
            <Link
              to="/dining"
              className="group flex min-h-16 items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 hover:border-[#E23744] hover:shadow-sm transition"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex size-10 items-center justify-center rounded-xl bg-red-50 text-[#E23744] group-hover:scale-105 transition">
                  <CalendarDays className="size-5" />
                </div>
                <div>
                  <div className="font-bold text-gray-900 flex items-center gap-2 text-sm">
                    <span>{t("nav.dining") || "Dining & Table Reservations"}</span>
                    <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
                      {dineInCommissionDisplay}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Live floor plans, table turns &amp; guest reservations
                  </div>
                </div>
              </div>
              <ArrowUpRight className="size-4 text-gray-400 group-hover:text-[#E23744] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
            </Link>
          )}

          {items.map((item) => {
            const meta = NAV_ITEM_METADATA[item.to];
            return (
              <Link
                key={item.to}
                to={item.to}
                className="group flex min-h-16 items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 hover:border-[#E23744] hover:shadow-sm transition"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex size-10 items-center justify-center rounded-xl transition group-hover:scale-105 bg-gray-100 text-[#E23744]">
                    <item.icon className="size-5" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 flex items-center gap-2 text-sm">
                      <span>{meta?.title ?? t(item.key)}</span>
                      {meta?.tag && (
                        <span className="rounded-full px-2 py-0.5 text-[9px] font-bold border bg-gray-100 border-gray-200 text-gray-700">
                          {meta.tag}
                        </span>
                      )}
                    </div>
                    {meta?.subtitle && (
                      <div className="text-xs text-gray-500 mt-0.5">
                        {meta.subtitle}
                      </div>
                    )}
                  </div>
                </div>
                <ArrowUpRight
                  className="size-4 text-gray-400 transition group-hover:text-[#E23744] group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </Link>
            );
          })}
        </div>

        {/* 1-Tap Pan-India Regional Language Selector */}
        <Card className="border-gray-200 bg-white p-4 space-y-2.5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="size-4 text-[#E23744]" />
              <div>
                <h2 className="text-sm font-bold text-gray-900">
                  Regional Languages
                </h2>
                <p className="text-xs text-gray-500">
                  Switch the partner portal language instantly ({ALL_INDIAN_LANGUAGES.length} Indian Languages)
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase bg-gray-100 border border-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
              {lang}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {ALL_INDIAN_LANGUAGES.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => setLang(l.code)}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                  lang === l.code
                    ? "bg-[#E23744] text-white shadow-xs"
                    : "border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                {l.native} <span className="opacity-70">({l.label})</span>
              </button>
            ))}
          </div>
        </Card>

        {/* OrderKing Partner Support & Helpdesk */}
        <Card className="border-gray-200 bg-white p-4 space-y-2.5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HeartHandshake className="size-4 text-[#E23744]" />
              <div>
                <h2 className="text-sm font-bold text-gray-900">
                  OrderKing Partner Support
                </h2>
                <p className="text-xs text-gray-500">
                  Dedicated merchant assistance for order issues, payouts and menu updates
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">24/7 SUPPORT</span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-gray-600 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <Mail className="size-3.5 text-gray-400" />
              <span>
                Partner Desk:{" "}
                <a
                  href="mailto:partner-support@orderkingpay.com"
                  className="text-[#E23744] font-semibold hover:underline"
                >
                  partner-support@orderkingpay.com
                </a>
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-500 text-xs">
              <Sparkles className="size-3 text-orange-500" />
              <span>OrderKing Partner Platform</span>
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
