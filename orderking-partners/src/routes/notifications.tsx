import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { VendorShell } from "@/components/vendor-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useT } from "@/components/use-t";
import { useVendor } from "@/components/use-vendor";
import { getNotifications, markNotificationsRead } from "@/lib/server/api-more";
import { Bell, CheckCircle2, ArrowRight, ShieldCheck, IndianRupee, Utensils, Settings } from "lucide-react";

export const Route = createFileRoute("/notifications")({ component: NotificationsPage });

type NotificationFilter = "ALL" | "ORDERS" | "SETTLEMENTS" | "COMPLIANCE";

function classifyNotificationCategory(type: string, title: string, body: string): Exclude<NotificationFilter, "ALL"> {
  const combined = `${type} ${title} ${body}`.toLowerCase();
  if (
    combined.includes("settlement") ||
    combined.includes("payout") ||
    combined.includes("utr") ||
    combined.includes("neft") ||
    combined.includes("imps") ||
    combined.includes("invoice") ||
    combined.includes("tds") ||
    combined.includes("tcs")
  ) {
    return "SETTLEMENTS";
  }
  if (
    combined.includes("fssai") ||
    combined.includes("gst") ||
    combined.includes("kyc") ||
    combined.includes("compliance") ||
    combined.includes("license") ||
    combined.includes("verification") ||
    combined.includes("audit")
  ) {
    return "COMPLIANCE";
  }
  return "ORDERS";
}

function getActionLinkForCategory(category: Exclude<NotificationFilter, "ALL">): {
  to: "/orders" | "/settlements" | "/onboarding" | "/settings";
  label: string;
} {
  switch (category) {
    case "SETTLEMENTS":
      return { to: "/settlements", label: "Open Payout & Tax Ledger" };
    case "COMPLIANCE":
      return { to: "/onboarding", label: "Review KYC & FSSAI Status" };
    case "ORDERS":
    default:
      return { to: "/orders", label: "Open Order Register" };
  }
}

function NotificationsPage() {
  const t = useT();
  const vendor = useVendor();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<NotificationFilter>("ALL");
  const [unreadOnly, setUnreadOnly] = useState(false);

  const q = useQuery({
    queryKey: ["ntf", vendor.restaurantId],
    queryFn: () => getNotifications({ data: { restaurantId: vendor.restaurantId } }),
    enabled: Boolean(vendor.restaurantId),
  });

  const allNotifications = q.data?.notifications ?? [];
  const unreadCount = useMemo(() => allNotifications.filter((n) => !n.isRead).length, [allNotifications]);

  const enrichedNotifications = useMemo(() => {
    return allNotifications.map((n) => {
      const category = classifyNotificationCategory(n.type, n.title, n.body);
      const action = getActionLinkForCategory(category);
      return { ...n, category, action };
    });
  }, [allNotifications]);

  const filteredNotifications = useMemo(() => {
    return enrichedNotifications.filter((n) => {
      if (unreadOnly && n.isRead) return false;
      if (filter === "ALL") return true;
      return n.category === filter;
    });
  }, [enrichedNotifications, filter, unreadOnly]);

  const counts = useMemo(() => {
    return {
      ALL: enrichedNotifications.length,
      ORDERS: enrichedNotifications.filter((n) => n.category === "ORDERS").length,
      SETTLEMENTS: enrichedNotifications.filter((n) => n.category === "SETTLEMENTS").length,
      COMPLIANCE: enrichedNotifications.filter((n) => n.category === "COMPLIANCE").length,
    };
  }, [enrichedNotifications]);

  return (
    <VendorShell
      title={t("nav.notifications")}
      subtitle="Real-time operational, settlement, and statutory compliance alerts with 1-tap self-service resolution"
      dataLabel={vendor.dataLabel}
    >
      {/* Active Notification Channels & Self-Service Quick Links */}
      <Card className="space-y-3 border-slate-800 bg-slate-900/90">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Bell className="size-4 text-emerald-400" />
            <span className="text-sm font-semibold text-white">Alert Delivery Channels</span>
            {unreadCount > 0 ? (
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
                {unreadCount} Unread
              </span>
            ) : (
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
                All Caught Up
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant={unreadOnly ? "primary" : "secondary"}
              onClick={() => setUnreadOnly((prev) => !prev)}
            >
              {unreadOnly ? "Showing Unread Only" : "Filter Unread"}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={unreadCount === 0}
              onClick={() =>
                void markNotificationsRead({ data: { restaurantId: vendor.restaurantId } }).then(() =>
                  qc.invalidateQueries({ queryKey: ["ntf"] }),
                )
              }
            >
              <CheckCircle2 className="mr-1.5 size-3.5" />
              {t("notifications.markRead")}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          {q.data?.channels.map((c) => (
            <span
              key={c.channel}
              className={
                c.connected
                  ? "rounded-full border border-emerald-500/30 bg-emerald-950/40 px-2.5 py-1 text-emerald-300"
                  : "rounded-full border border-amber-500/30 bg-amber-950/40 px-2.5 py-1 text-amber-300"
              }
            >
              {c.channel}: {c.connected ? "Active (In-App & KDS)" : t("app.notConnected")}
            </span>
          ))}
        </div>

        {/* Self-Service Action Shortcut Bar */}
        <div className="grid gap-2 border-t border-slate-800 pt-3 sm:grid-cols-4">
          <Link
            to="/orders"
            className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs text-slate-200 hover:border-slate-700"
          >
            <span className="inline-flex items-center gap-1.5 font-medium">
              <Utensils className="size-3.5 text-emerald-400" />
              Live Orders & KDS
            </span>
            <ArrowRight className="size-3.5 text-slate-400" />
          </Link>
          <Link
            to="/settlements"
            className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs text-slate-200 hover:border-slate-700"
          >
            <span className="inline-flex items-center gap-1.5 font-medium">
              <IndianRupee className="size-3.5 text-emerald-400" />
              Settlements & UTRs
            </span>
            <ArrowRight className="size-3.5 text-slate-400" />
          </Link>
          <Link
            to="/onboarding"
            className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs text-slate-200 hover:border-slate-700"
          >
            <span className="inline-flex items-center gap-1.5 font-medium">
              <ShieldCheck className="size-3.5 text-emerald-400" />
              FSSAI, GST & KYC
            </span>
            <ArrowRight className="size-3.5 text-slate-400" />
          </Link>
          <Link
            to="/settings"
            className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs text-slate-200 hover:border-slate-700"
          >
            <span className="inline-flex items-center gap-1.5 font-medium">
              <Settings className="size-3.5 text-emerald-400" />
              Store SLA & Sound
            </span>
            <ArrowRight className="size-3.5 text-slate-400" />
          </Link>
        </div>
      </Card>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-1.5">
        {(
          [
            { id: "ALL", label: `All (${counts.ALL})` },
            { id: "ORDERS", label: `Orders (${counts.ORDERS})` },
            { id: "SETTLEMENTS", label: `Settlements (${counts.SETTLEMENTS})` },
            { id: "COMPLIANCE", label: `Compliance (${counts.COMPLIANCE})` },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              filter === tab.id
                ? "bg-emerald-600 text-white"
                : "border border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notification Feed */}
      {filteredNotifications.length === 0 ? (
        <Card className="py-8 text-center text-sm text-muted">
          {allNotifications.length === 0
            ? t("notifications.empty")
            : "No notifications match the selected category filter."}
        </Card>
      ) : (
        <div className="space-y-2.5">
          {filteredNotifications.map((n) => (
            <Card
              key={n.id}
              className={`flex flex-col justify-between gap-3 sm:flex-row sm:items-center ${
                n.isRead ? "opacity-75" : "border-emerald-500/40 bg-slate-900"
              }`}
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-400">
                    {n.category}
                  </span>
                  <span className="text-[11px] uppercase text-muted">{n.type}</span>
                  {!n.isRead ? (
                    <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                      NEW
                    </span>
                  ) : null}
                </div>
                <div className="font-semibold text-white">{n.title}</div>
                <p className="text-sm text-slate-300">{n.body}</p>
              </div>
              <div className="shrink-0">
                <Link
                  to={n.action.to}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/90 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:border-emerald-500/50 hover:bg-slate-800"
                >
                  <span>{n.action.label}</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </VendorShell>
  );
}
