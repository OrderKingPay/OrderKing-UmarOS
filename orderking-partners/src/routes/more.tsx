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
import { ArrowUpRight, FileText, Globe, Scale, ShieldCheck, Volume2, VolumeX } from "lucide-react";

export const Route = createFileRoute("/more")({ component: MorePage });

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
        {/* Quick Partner Status & Audio Siren Bar */}
        <Card className="border-slate-800 bg-slate-900/80 p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-mono uppercase text-emerald-400">
              {vendor.selected?.restaurantName ?? "Restaurant Partner Hub"}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Role: <span className="font-mono text-slate-200">{role ?? "PARTNER"}</span>
              {" · "}KYC: <span className="font-mono text-slate-200">{vendor.selected?.verificationStatus ?? "DRAFT"}</span>
            </div>
          </div>
          <Button
            size="sm"
            variant={soundOn ? "primary" : "secondary"}
            onClick={() => setSoundOn(!soundOn)}
            className="text-xs"
          >
            {soundOn ? (
              <>
                <Volume2 className="mr-1.5 size-3.5" /> Order Siren ON
              </>
            ) : (
              <>
                <VolumeX className="mr-1.5 size-3.5" /> Order Siren OFF
              </>
            )}
          </Button>
        </Card>

        <div className="grid gap-2">
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex min-h-14 items-center justify-between gap-3 rounded-[16px] border border-slate-800 bg-slate-900/70 px-4 hover:border-slate-700 transition"
            >
              <div className="flex items-center gap-3">
                <item.icon className="size-5 text-chili" />
                <span className="font-medium text-slate-100">{t(item.key)}</span>
              </div>
              <ArrowUpRight className="size-4 text-slate-400" />
            </Link>
          ))}
        </div>

        {/* 1-Tap Pan-India 13-Language Selector */}
        <Card className="border-slate-800 bg-slate-900/70 p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="size-4 text-emerald-400" />
              <h2 className="font-display text-sm font-bold text-white">
                1-Tap Regional Language ({ALL_INDIAN_LANGUAGES.length} Indian Languages)
              </h2>
            </div>
            <span className="text-[10px] font-mono uppercase text-emerald-400">{lang}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ALL_INDIAN_LANGUAGES.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => setLang(l.code)}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                  lang === l.code
                    ? "bg-emerald-600 text-white"
                    : "border border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-700"
                }`}
              >
                {l.native} ({l.label})
              </button>
            ))}
          </div>
        </Card>

        {/* Direct Quick Links to Legal, Privacy & Statutory Compliance in /settings */}
        <Card className="border-slate-800 bg-slate-900/70 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-emerald-400" />
              <h2 className="font-display text-sm font-bold text-white">
                Legal, Privacy &amp; Statutory Compliance
              </h2>
            </div>
            <span className="text-[10px] font-mono text-slate-400">GOVERNANCE</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <Link
              to="/settings"
              className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 p-3 hover:border-slate-700 transition"
            >
              <div className="flex items-center gap-2.5">
                <Scale className="size-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-100">Partner Commercial Terms</div>
                  <div className="text-[11px] text-slate-400">Commission, SLAs &amp; GST §9(5) / TDS §194-O</div>
                </div>
              </div>
              <ArrowUpRight className="size-3.5 text-slate-400 shrink-0" />
            </Link>

            <Link
              to="/settings"
              className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 p-3 hover:border-slate-700 transition"
            >
              <div className="flex items-center gap-2.5">
                <FileText className="size-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-100">Privacy &amp; FSSAI Undertaking</div>
                  <div className="text-[11px] text-slate-400">DPDP Act 2023, Food Safety &amp; Grievance Redressal</div>
                </div>
              </div>
              <ArrowUpRight className="size-3.5 text-slate-400 shrink-0" />
            </Link>
          </div>
        </Card>

        <div className="md:hidden">
          <UserButton />
        </div>
      </div>
    </VendorShell>
  );
}
