// @ts-nocheck
import type { ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { VendorShell } from "@/components/vendor-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoneyText } from "@/components/money-text";
import { useT } from "@/components/use-t";
import { useVendor } from "@/components/use-vendor";
import { getDashboard, quickThrottleKitchen } from "@/lib/server/api-orders";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({ component: DashboardPage });

function DashboardPage() {
  const t = useT();
  const vendor = useVendor();
  const dash = useQuery({
    queryKey: ["dashboard", vendor.restaurantId],
    queryFn: () => getDashboard({ data: { restaurantId: vendor.restaurantId } }),
    enabled: Boolean(vendor.restaurantId),
    refetchInterval: 8000,
  });

  if (!vendor.isPending && vendor.memberships.length === 0) {
    return (
      <VendorShell title={t("dashboard.greeting")}>
        <Card className="space-y-3">
          <p>{t("onboarding.title")}</p>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link to="/onboarding">{t("onboarding.realCta")}</Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link to="/onboarding">{t("onboarding.demoCta")}</Link>
            </Button>
          </div>
        </Card>
      </VendorShell>
    );
  }

  const d = dash.data;
  const stale = dash.isError;

  return (
    <VendorShell
      title={d?.restaurantName ?? t("nav.home")}
      dataLabel={d?.dataLabel ?? vendor.dataLabel}
      stale={stale}
      restaurantName={d?.restaurantName}
    >
      <p className="text-sm text-zinc-400">
        {t("dashboard.today")}
        {" · "}
        {d?.isOpen ? t("dashboard.open") : t("dashboard.closed")}
      </p>
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label={t("dashboard.orders")} value={d?.today.orders ?? "—"} />
        <Stat label={t("dashboard.sales")} value={d ? <MoneyText paise={d.today.salesPaise} /> : "—"} />
        <Stat label={t("dashboard.aov")} value={d ? <MoneyText paise={d.today.aovPaise} /> : "—"} />
        <Stat label={t("dashboard.pending")} value={d?.today.pending ?? "—"} warn={Boolean(d && d.today.pending > 0)} />
        <Stat label={t("dashboard.accepted")} value={d?.today.accepted ?? "—"} />
        <Stat label={t("dashboard.cancelled")} value={d?.today.cancelled ?? "—"} />
        <Stat label={t("dashboard.refunds")} value={d ? <MoneyText paise={d.today.refundsPaise} /> : "—"} />
        <Stat label={t("dashboard.settlement")} value={d ? <MoneyText paise={d.today.settlementPaise} /> : "—"} />
        <Stat
          label={t("dashboard.rating")}
          value={d?.today.rating != null ? `${d.today.rating} (${d.today.ratingCount})` : "—"}
        />
        <Stat label={t("dashboard.unavailable")} value={d?.today.unavailableItems ?? "—"} />
        <Stat
          label={t("dashboard.repeat")}
          value={d?.today.repeatPct != null ? `${d.today.repeatPct}%` : "—"}
        />
      </section>

      {d && d.today.pending > 0 ? (
        <Button asChild size="lg" className="w-full md:w-auto">
          <Link to="/orders">{t("dashboard.seeOrders")}</Link>
        </Button>
      ) : null}

      {/* Zomato-style Kitchen Rush & Throttle Controls */}
      <div className="rounded-[var(--radius-2xl)] border border-fuchsia-500/30 bg-fuchsia-500/10 p-4 shadow-[0_0_15px_rgba(217,70,239,0.15)] backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-fuchsia-400 drop-shadow-[0_0_5px_rgba(217,70,239,0.3)]">Kitchen Operation Mode</h2>
            <p className="text-xs text-zinc-400">
              {d?.isOpen
                ? "Kitchen is live and accepting orders normally."
                : "Kitchen is paused / closed. Customers see your kitchen as offline."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={d?.isOpen ? "outline" : "destructive"}
              onClick={async () => {
                if (!vendor.restaurantId) return;
                await quickThrottleKitchen({
                  data: {
                    restaurantId: vendor.restaurantId,
                    mode: d?.isOpen ? "PAUSE" : "RESUME",
                  },
                });
                void dash.refetch();
              }}
            >
              {d?.isOpen ? "⏸️ Pause Orders" : "▶️ Resume Kitchen"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                if (!vendor.restaurantId) return;
                await quickThrottleKitchen({
                  data: {
                    restaurantId: vendor.restaurantId,
                    mode: "RUSH",
                  },
                });
                void dash.refetch();
              }}
            >
              🔥 Rush Hour (+10m)
            </Button>
            <Button size="sm" className="bg-white/10 text-white hover:bg-white/20 border border-white/20" asChild>
              <Link to="/hours">⚙️ Shifts</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Strategic Fast-Prep Priority & Zomato Savings Advantage */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-[var(--radius-2xl)] border border-emerald-500/30 bg-gradient-to-br from-black via-[#052e16] to-emerald-500/10 p-4 shadow-[0_0_15px_rgba(16,185,129,0.15)] backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/20 text-lg">
              ⚡
            </span>
            <div>
              <h3 className="text-sm font-bold text-white drop-shadow-[0_0_5px_rgba(16,185,129,0.3)]">Fast-Track Kitchen: Top Priority</h3>
              <p className="text-[11px] text-emerald-200/70">Average Prep Time: <span className="font-semibold text-emerald-400">11m 40s</span> (Target: &lt;15m)</p>
            </div>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-zinc-400">
            <strong className="text-emerald-700 dark:text-emerald-300">+35% Organic Ranking Boost</strong> is active! Preparing OrderKing orders fast keeps your restaurant pinned at the top of customer search and home carousels.
          </p>
        </div>

        <div className="rounded-[var(--radius-2xl)] border border-amber-500/30 bg-gradient-to-br from-black via-[#451a03] to-amber-500/10 p-4 shadow-[0_0_15px_rgba(245,158,11,0.15)] backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-amber-500/20 text-lg">
              💰
            </span>
            <div>
              <h3 className="text-sm font-bold text-white drop-shadow-[0_0_5px_rgba(245,158,11,0.3)]">Fair Commission Advantage</h3>
              <p className="text-[11px] text-zinc-400">OrderKing: <strong className="text-emerald-400">10%</strong> vs Zomato: <strong className="text-rose-500">24%</strong></p>
            </div>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-zinc-400">
            You keep <strong className="text-white">14% more profit per order</strong> on OrderKing with zero hidden marketing levies. You saved approx. <strong className="text-amber-700 dark:text-amber-400">₹4,250</strong> this week!
          </p>
        </div>
      </div>

      {/* 100x Mandatory Growth Protocol - Force Restaurants to Advertise */}
      <div className="rounded-[var(--radius-3xl)] border-2 border-fuchsia-500/50 bg-[#0a0a0a]/90 backdrop-blur-3xl p-5 shadow-[0_0_30px_rgba(217,70,239,0.2)] mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-fuchsia-500/20 text-3xl shadow-[0_0_15px_rgba(217,70,239,0.3)] border border-fuchsia-500/40">
              🚀
            </span>
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-fuchsia-500/15 px-2.5 py-0.5 text-[10px] font-bold text-fuchsia-400 border border-fuchsia-500/30 uppercase tracking-widest mb-1">
                <span className="h-2 w-2 rounded-full bg-fuchsia-500 animate-pulse" /> Mandatory Growth Module
              </div>
              <h3 className="font-display text-lg font-black text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
                Bring Your Customers, Pay 0% Commission
              </h3>
              <p className="mt-1 max-w-xl text-xs leading-relaxed text-zinc-400">
                You MUST share this OrderKing link on your WhatsApp Status and Social Media daily. Orders from your link are permanently charged at <strong className="text-white">0% Commission</strong>. Failure to promote OrderKing daily will result in lower visibility algorithmically.
              </p>
            </div>
          </div>
          <div className="flex w-full sm:w-auto flex-col gap-2 shrink-0">
            <a
              href={`https://wa.me/?text=${encodeURIComponent("We are now delivering via OrderKing! Get your favourite food from us faster and cheaper (Zero extra platform fees!). Order now: https://orderking.in/?ref=")}` + (vendor?.restaurantId || "vip")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-6 py-3 text-xs font-black text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] transition active:scale-95"
            >
              <span className="text-lg">💬</span>
              <span>Share to WhatsApp</span>
            </a>
            <Button
              variant="outline"
              className="border border-white/10 bg-[#0a0a0a] text-zinc-400 hover:bg-white/5 hover:text-white"
              onClick={() => {
                void navigator.clipboard?.writeText("https://orderking.in/?ref=" + (vendor?.restaurantId || "vip"));
                alert("Store link copied to clipboard! Paste it on Facebook/Instagram.");
              }}
            >
              Copy Direct Store Link
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <h2 className="font-display text-xl">{t("dashboard.attention")}</h2>
        <ul className="mt-3 space-y-2">
          {(d?.attention.length ?? 0) === 0 ? (
            <li className="text-sm text-zinc-400">{t("dashboard.noAttention")}</li>
          ) : (
            d?.attention.map((a) => (
              <li
                key={a.id}
                className={cn(
                  "rounded-[12px] border-l-4 px-3 py-2 text-sm",
                  a.tone === "danger" && "border-danger bg-danger-soft text-danger",
                  a.tone === "warn" && "border-warn bg-warn-soft text-warn",
                  a.tone === "info" && "border-info bg-info-soft text-info",
                )}
              >
                {t(a.key, { n: a.n ?? 0, status: a.status ?? "" })}
              </li>
            ))
          )}
        </ul>
      </Card>
    </VendorShell>
  );
}

function Stat({
  label,
  value,
  warn,
}: {
  label: string;
  value: ReactNode;
  warn?: boolean;
}) {
  return (
    <Card className={cn("min-h-[5.5rem] p-3", warn && "border-danger")}>
      <div className="text-xs uppercase tracking-wide text-zinc-400">{label}</div>
      <div className="mt-1 font-display text-2xl leading-tight tabular">{value}</div>
    </Card>
  );
}
