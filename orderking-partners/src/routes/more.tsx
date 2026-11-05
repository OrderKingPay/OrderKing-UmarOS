import { createFileRoute, Link } from "@tanstack/react-router";
import { VendorShell, MORE_NAV } from "@/components/vendor-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/use-t";
import { useVendor } from "@/components/use-vendor";
import { useClientState } from "@/lib/client-state";
import { can } from "@/lib/rbac";
import { ALL_INDIAN_LANGUAGES } from "./settings";
import {
  ArrowUpRight,
  Clock3,
  Globe,
  Settings,
  Store,
  Volume2,
  VolumeX,
} from "lucide-react";

export const Route = createFileRoute("/more")({ component: MorePage });

const NAV_ITEM_METADATA: Record<
  string,
  { title: string; subtitle: string; tag?: string }
> = {
  "/dashboard": {
    title: "Dashboard Overview",
    subtitle: "Today's sales, incoming orders, and kitchen rush controls",
    tag: "Live",
  },
  "/hours": {
    title: "Operating Hours",
    subtitle: "Opening & closing timings, shift schedules, and holidays",
    tag: "Kitchen",
  },
  "/settings": {
    title: "Outlet Settings",
    subtitle: "Notification chimes, staff accounts, and thermal printers",
    tag: "Settings",
  },
  "/onboarding": {
    title: "Outlet Profile & Documents",
    subtitle: "Restaurant details, FSSAI registration, and bank payouts",
    tag: "Outlet",
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

  return (
    <VendorShell
      title={t("nav.more")}
      dataLabel={vendor.dataLabel}
      restaurantName={vendor.selected?.restaurantName}
    >
      <div className="space-y-4">
        {/* Quick Partner Status & Audio Bar */}
        <Card className="border-slate-800 bg-slate-900/80 p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold">
                {vendor.selected?.restaurantName ?? "Restaurant Partner"}
              </span>
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[9.5px] font-semibold text-emerald-400">
                Active Partner
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-2">
              <span>Outlet ID: <strong className="font-mono text-slate-200">{vendor.restaurantId ?? "rst_verified"}</strong></span>
              <span>·</span>
              <span>Role: <strong className="font-mono text-slate-200">{role ?? "OWNER"}</strong></span>
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
                <Volume2 className="mr-1.5 size-3.5 text-emerald-400" /> Order Sound Active
              </>
            ) : (
              <>
                <VolumeX className="mr-1.5 size-3.5 text-slate-400" /> Order Sound Muted
              </>
            )}
          </Button>
        </Card>

        {/* Navigation Grid */}
        <div className="grid gap-2">
          {items.map((item) => {
            const meta = NAV_ITEM_METADATA[item.to] ?? {
              title: t(item.key),
              subtitle: "Manage outlet configuration",
            };
            return (
              <Link
                key={item.to}
                to={item.to}
                className="group flex min-h-16 items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 hover:border-slate-700 hover:bg-slate-900/90 transition"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex size-10 items-center justify-center rounded-xl border border-slate-700/60 bg-slate-800/60 text-chili group-hover:scale-105 transition">
                    <item.icon className="size-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-100 flex items-center gap-2">
                      <span>{meta.title}</span>
                      {meta.tag && (
                        <span className="rounded-full bg-slate-800 border border-slate-700 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                          {meta.tag}
                        </span>
                      )}
                    </div>
                    {meta.subtitle && (
                      <div className="text-xs text-slate-400 mt-0.5">
                        {meta.subtitle}
                      </div>
                    )}
                  </div>
                </div>
                <ArrowUpRight className="size-4 text-slate-400 group-hover:text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
              </Link>
            );
          })}
        </div>

        {/* Language Selector */}
        <Card className="border-slate-800 bg-slate-900/70 p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="size-4 text-emerald-400" />
              <div>
                <h2 className="font-display text-sm font-bold text-white">
                  Language Preferences
                </h2>
                <p className="text-[11px] text-slate-400">
                  Select your preferred language for kitchen alerts and tickets
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

        {/* Support Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-slate-800 bg-slate-900/60 text-xs text-slate-400">
          <span>Need help with your outlet or orders?</span>
          <div className="flex items-center gap-3">
            <span className="hover:text-slate-200 cursor-pointer">Terms of Service</span>
            <span>·</span>
            <span className="hover:text-slate-200 cursor-pointer">Privacy Policy</span>
            <span>·</span>
            <a href="mailto:support@orderkingpay.com" className="font-semibold text-emerald-400 hover:underline">
              support@orderkingpay.com
            </a>
          </div>
        </div>
      </div>
    </VendorShell>
  );
}
