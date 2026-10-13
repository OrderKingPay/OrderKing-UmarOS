import { useEffect, useRef, useState, Suspense, type CSSProperties } from "react";
import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Bell,
  Bike,
  Calculator,
  ChartNoAxesColumn,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Command as CommandIcon,
  Crown,
  FileText,
  Flag,
  Gift,
  IdCard,
  LayoutDashboard,
  LifeBuoy,
  Map,
  Megaphone,
  Menu,
  Palette,
  PanelsTopLeft,
  Percent,
  Radio,
  Receipt,
  Scale,
  ScrollText,
  Settings,
  Shield,
  Sparkles,
  Utensils,
  UserRound,
  Users,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { UserButton, RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { bootstrapSession, updateEmployeeFn } from "@/lib/orderking/actions";
import {
  NAV,
  UMAR_OS_BOTTOM_HUBS,
  itemAllowed,
  type BottomNavHub,
  type BottomNavOption,
} from "@/lib/orderking/nav";
import { LOCALES, LOCALE_LABELS, t, type Locale } from "@/lib/orderking/i18n";
import { parseCommand, intentPath } from "@/lib/orderking/search";
import { ROLE_LABELS, SYSTEM_ROLES } from "@/lib/orderking/permissions";
import { OrderKingMark } from "@/components/brand/mark";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const ICONS = {
  layout: LayoutDashboard,
  crown: Crown,
  radio: Radio,
  receipt: Receipt,
  bike: Bike,
  map: Map,
  utensils: Utensils,
  users: Users,
  user: UserRound,
  shield: Shield,
  lifeBuoy: LifeBuoy,
  wallet: Wallet,
  scale: Scale,
  calculator: Calculator,
  percent: Percent,
  gift: Gift,
  megaphone: Megaphone,
  panels: PanelsTopLeft,
  chart: ChartNoAxesColumn,
  file: FileText,
  alert: AlertTriangle,
  spark: Sparkles,
  id: IdCard,
  palette: Palette,
  flag: Flag,
  settings: Settings,
  bell: Bell,
  scroll: ScrollText,
  activity: Activity,
};

export type EmployeeSession = NonNullable<
  Extract<Awaited<ReturnType<typeof bootstrapSession>>, { ok: true }>
>["employee"];

type AlertSeverityTier = "EMERGENCY" | "DANGER" | "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

type FounderRemediationAlert = {
  id: string;
  tier: AlertSeverityTier;
  title: string;
  rootCause: string;
  resolutionSteps: string;
  autoFixActionLabel: string;
  targetPath: string;
  resolved: boolean;
};

const INITIAL_FOUNDER_ALERTS: FounderRemediationAlert[] = [
  {
    id: "flt-emergency-1",
    tier: "EMERGENCY",
    title: "Gateway Webhook Signature Verification Guard",
    rootCause:
      "Ensure Razorpay & Cashfree webhook secrets match production environment variables before high-volume settlement batch dispatch.",
    resolutionSteps:
      "Zero-Harassment Resolution: Run automated HMAC-SHA256 endpoint verification and synchronize active payment gateway keys.",
    autoFixActionLabel: "Verify & Sync Payment Webhooks",
    targetPath: "/app/golive",
    resolved: false,
  },
  {
    id: "flt-danger-1",
    tier: "DANGER",
    title: "Pending Restaurant FSSAI 14-Digit License Verification",
    rootCause:
      "Unverified restaurant outlets cannot accept live customer orders under FSSAI Food Safety & Standards Act, 2006.",
    resolutionSteps:
      "Zero-Harassment Resolution: Trigger automated FoSCoS 14-digit checksum & KYC document validation across pending merchant applications.",
    autoFixActionLabel: "Run FSSAI Batch Checksum Audit",
    targetPath: "/app/kyc",
    resolved: false,
  },
  {
    id: "flt-critical-1",
    tier: "CRITICAL",
    title: "Integer-Paise Settlement & Statutory Tax Reconciliation (Sec 9(5) / 194-O)",
    rootCause:
      "Weekly restaurant settlement batches require pre-flight reconciliation of 5% CGST Sec 9(5), 0.5% TCS Sec 52, and 0.1% TDS Sec 194-O.",
    resolutionSteps:
      "Zero-Harassment Resolution: Execute deterministic integer-paise ledger audit and lock verified payout batches for NEFT/IMPS transfer.",
    autoFixActionLabel: "Reconcile Integer-Paise Ledger",
    targetPath: "/app/settlements",
    resolved: false,
  },
  {
    id: "flt-high-1",
    tier: "HIGH",
    title: "Zone Rider Dispatch & Peak Rain/Dinner Buffer Guard",
    rootCause:
      "High order density in core delivery zones requires proactive kitchen prep SLA buffers (+10m) to prevent rider wait-time bottlenecks.",
    resolutionSteps:
      "Zero-Harassment Resolution: Rebalance zone dispatch thresholds and synchronize dynamic kitchen prep SLA recommendations.",
    autoFixActionLabel: "Auto-Balance Zone Dispatch",
    targetPath: "/app/dispatch",
    resolved: false,
  },
  {
    id: "flt-medium-1",
    tier: "MEDIUM",
    title: "Catalog Dish Photo & Description Completeness Check",
    rootCause:
      "Partner dishes missing 4:3 studio photos or descriptions experience lower customer tap-to-cart conversion.",
    resolutionSteps:
      "Zero-Harassment Resolution: Dispatch automated Spark AI Dish Studio advisory to partner kitchens without locking their menu.",
    autoFixActionLabel: "Dispatch Spark Advisory Notice",
    targetPath: "/app/restaurants",
    resolved: false,
  },
  {
    id: "flt-low-1",
    tier: "LOW",
    title: "23-Language Regional Localization & Telemetry Sync",
    rootCause:
      "All 22 Scheduled Indian Languages + English dictionaries are active across Command, Partner, and Rider surfaces.",
    resolutionSteps:
      "Zero-Harassment Resolution: Refresh localized dictionary cache and verify immutable audit log indexing.",
    autoFixActionLabel: "Refresh Localization Cache",
    targetPath: "/app/health",
    resolved: false,
  },
];

const TIER_STYLES: Record<AlertSeverityTier, { badge: string; border: string }> = {
  EMERGENCY: {
    badge: "bg-red-600 text-white border-red-500",
    border: "border-red-500/40 bg-red-950/15",
  },
  DANGER: {
    badge: "bg-rose-500/20 text-rose-400 border-rose-500/40",
    border: "border-rose-500/30 bg-rose-950/10",
  },
  CRITICAL: {
    badge: "bg-orange-500/20 text-orange-400 border-orange-500/40",
    border: "border-orange-500/30 bg-orange-950/10",
  },
  HIGH: {
    badge: "bg-amber-500/20 text-amber-400 border-amber-500/40",
    border: "border-amber-500/30 bg-amber-950/10",
  },
  MEDIUM: {
    badge: "bg-sky-500/20 text-sky-400 border-sky-500/40",
    border: "border-sky-500/30 bg-sky-950/10",
  },
  LOW: {
    badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
    border: "border-emerald-500/30 bg-emerald-950/10",
  },
};

export function CommandShell() {
  const { user, isPending } = useCurrentUserState();
  const [locale, setLocale] = useState<Locale>("en");
  const [navOpen, setNavOpen] = useState(false);
  const [cmd, setCmd] = useState("");
  const [cmdOpen, setCmdOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [bellOpen, setBellOpen] = useState(false);
  const [selectedTierFilter, setSelectedTierFilter] = useState<"ALL" | AlertSeverityTier>("ALL");
  const [alerts, setAlerts] = useState<FounderRemediationAlert[]>(INITIAL_FOUNDER_ALERTS);
  const [activeHubId, setActiveHubId] = useState<BottomNavHub["id"] | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string>("delivery");
  const [hubFilterQuery, setHubFilterQuery] = useState<string>("");

  const mainViewportRef = useRef<HTMLDivElement | null>(null);
  const asideRef = useRef<HTMLElement | null>(null);

  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const qc = useQueryClient();

  const session = useQuery({
    queryKey: ["session"],
    queryFn: () => bootstrapSession(),
    enabled: Boolean(user),
  });

  const assume = useMutation({
    mutationFn: (role: string | null) => {
      const emp = session.data && session.data.ok ? session.data.employee : null;
      if (!emp) throw new Error("No employee session");
      return updateEmployeeFn({
        data: {
          id: emp.id,
          assumedRoleKey: role,
          reason: role ? `View as ${role}` : "Exit role preview",
        },
      });
    },
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Role view updated");
        void qc.invalidateQueries();
      } else toast.error(res.error);
    },
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((v) => !v);
      } else if (e.key === "Escape") {
        setActiveHubId(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (isPending || (user && session.isPending)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg text-muted">
        <OrderKingMark className="size-10" />
        <p className="font-display text-xl text-fg">Umar OS</p>
        <p className="text-xs text-amber-400 font-mono tracking-wider">SOVEREIGN FOUNDER COMMAND</p>
        <div className="h-24 w-72 animate-pulse rounded-[24px] bg-surface" />
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;

  const payload = session.data && session.data.ok ? session.data : null;
  const employee = payload?.employee;
  if (session.data && !session.data.ok) {
    return (
      <main className="grid min-h-screen place-items-center bg-bg p-6 text-fg">
        <div className="max-w-md rounded-[24px] border border-border bg-surface p-6">
          <h1 className="font-display text-2xl">Cannot enter Command</h1>
          <p className="mt-2 text-sm text-muted">{session.data.error}</p>
        </div>
      </main>
    );
  }
  if (employee && employee.status === "PENDING") {
    return (
      <main className="grid min-h-screen place-items-center bg-bg p-6 text-fg">
        <div className="max-w-md rounded-[24px] border border-border bg-surface p-6">
          <OrderKingMark className="size-10" />
          <h1 className="mt-4 font-display text-2xl">Access pending</h1>
          <p className="mt-2 text-sm text-muted">
            Your account is waiting for an administrator invite. The first person to sign in becomes Advanced Admin;
            later employees must be invited.
          </p>
          <div className="mt-6">
            <UserButton />
          </div>
        </div>
      </main>
    );
  }

  const perms = employee?.permissions ?? [];
  const groups = NAV.map((g) => ({
    ...g,
    items: g.items.filter(
      (it) => itemAllowed(it, perms) || employee?.actingRoleKey === "SUPER_ADMIN"
    ),
  })).filter((g) => g.items.length);

  const brand = payload?.branding as Record<string, string> | null;
  const appName = brand?.admin_branding || brand?.app_name || "Umar OS";

  const runCommand = () => {
    const intent = parseCommand(cmd);
    const path = intentPath(intent);
    setCmdOpen(false);
    setCmd("");
    const [targetPathname, qs] = path.split("?");
    const search = Object.fromEntries(new URLSearchParams(qs ?? ""));
    void navigate({ to: (targetPathname || "/app") as "/app", search });
  };

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const expandAllGroups = () => {
    setCollapsedGroups({});
  };

  const collapseAllGroups = () => {
    const next: Record<string, boolean> = {};
    for (const g of groups) {
      next[g.id] = true;
    }
    setCollapsedGroups(next);
  };

  const scrollMainViewport = (direction: "up" | "down") => {
    const el = mainViewportRef.current;
    if (!el) return;
    el.scrollBy({
      top: direction === "up" ? -480 : 480,
      behavior: "smooth",
    });
  };

  const handleAutoFixAlert = (alertItem: FounderRemediationAlert) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertItem.id ? { ...a, resolved: true } : a))
    );
    toast.success(`Auto-Remediated [${alertItem.tier}]: ${alertItem.title}`);
  };

  const unresolvedCount = alerts.filter((a) => !a.resolved).length;
  const filteredAlerts = alerts.filter(
    (a) => selectedTierFilter === "ALL" || a.tier === selectedTierFilter
  );

  const activeHub = UMAR_OS_BOTTOM_HUBS.find((h) => h.id === activeHubId) ?? null;

  const handleSelectBottomHub = (hub: BottomNavHub) => {
    if (activeHubId === hub.id) {
      setActiveHubId(null);
      setHubFilterQuery("");
      return;
    }
    setActiveHubId(hub.id);
    setActiveCategoryId(hub.categories[0]?.id ?? "");
    setHubFilterQuery("");
  };

  const handleSelectBottomOption = (
    hub: BottomNavHub,
    categoryLabel: string,
    option: BottomNavOption
  ) => {
    setActiveHubId(null);
    setHubFilterQuery("");
    void navigate({
      to: option.to as "/app",
      search: option.query,
      hash: option.hash,
    });
    toast.success(
      `Opened ${option.label} (${hub.label} › ${categoryLabel} › ${option.subCategory})`
    );
  };

  const normalizedHubQuery = hubFilterQuery.trim().toLowerCase();

  const visibleHubCategories = activeHub
    ? activeHub.categories.filter((cat) => {
        if (!normalizedHubQuery) return true;
        const catMatches =
          cat.label.toLowerCase().includes(normalizedHubQuery) ||
          cat.summary.toLowerCase().includes(normalizedHubQuery) ||
          cat.badge.toLowerCase().includes(normalizedHubQuery);
        const optionMatches = cat.options.some(
          (opt) =>
            opt.label.toLowerCase().includes(normalizedHubQuery) ||
            opt.subCategory.toLowerCase().includes(normalizedHubQuery) ||
            opt.description.toLowerCase().includes(normalizedHubQuery) ||
            opt.badge.toLowerCase().includes(normalizedHubQuery) ||
            opt.to.toLowerCase().includes(normalizedHubQuery)
        );
        return catMatches || optionMatches;
      })
    : [];

  const activeCategory =
    visibleHubCategories.find((c) => c.id === activeCategoryId) ??
    visibleHubCategories[0] ??
    null;

  const displayedOptions: Array<{
    categoryLabel: string;
    option: BottomNavOption;
  }> = activeHub
    ? normalizedHubQuery
      ? visibleHubCategories.flatMap((cat) =>
          cat.options
            .filter(
              (opt) =>
                cat.label.toLowerCase().includes(normalizedHubQuery) ||
                opt.label.toLowerCase().includes(normalizedHubQuery) ||
                opt.subCategory.toLowerCase().includes(normalizedHubQuery) ||
                opt.description.toLowerCase().includes(normalizedHubQuery) ||
                opt.badge.toLowerCase().includes(normalizedHubQuery) ||
                opt.to.toLowerCase().includes(normalizedHubQuery)
            )
            .map((option) => ({ categoryLabel: cat.label, option }))
        )
      : (activeCategory?.options ?? []).map((option) => ({
          categoryLabel: activeCategory?.label ?? "",
          option,
        }))
    : [];

  const cssVars = brand
    ? ({
        ["--color-bg" as string]: brand.color_bg,
        ["--color-fg" as string]: brand.color_fg,
        ["--color-primary" as string]: brand.color_primary,
        ["--color-primary-fg" as string]: brand.color_primary_fg,
        ["--color-accent" as string]: brand.color_accent,
      } as CSSProperties)
    : undefined;

  return (
    <div className="h-screen bg-bg text-fg overflow-hidden" style={cssVars}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-fg"
      >
        Skip to content
      </a>

      {employee?.assumedRoleKey && employee.assumedRoleKey !== employee.roleKey ? (
        <div className="flex items-center justify-center gap-3 bg-info/20 px-4 py-2 text-xs shrink-0">
          Viewing as {ROLE_LABELS[employee.assumedRoleKey] ?? employee.assumedRoleKey}. Mutations use this role’s
          permissions.
          <button className="underline" type="button" onClick={() => assume.mutate(null)}>
            Exit
          </button>
        </div>
      ) : null}

      <div className="flex h-full overflow-hidden">
        <aside
          ref={asideRef}
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-64 overflow-y-auto border-r border-border bg-surface p-4 transition-transform md:static md:translate-x-0 shrink-0",
            navOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          )}
        >
          <div className="mb-4 flex items-center justify-between">
            <Link to="/app" className="flex items-center gap-2" onClick={() => setNavOpen(false)}>
              <OrderKingMark className="size-8" />
              <div>
                <p className="font-display text-base leading-none">{appName}</p>
                <p className="text-[10px] uppercase tracking-widest text-muted">Command</p>
              </div>
            </Link>
            <button
              className="md:hidden"
              type="button"
              onClick={() => setNavOpen(false)}
              aria-label="Close menu"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Expand All / Collapse All Controls */}
          <div className="mb-3 flex items-center justify-between gap-1.5 rounded-lg border border-border bg-elevated/60 px-2.5 py-1.5 text-[11px]">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
              Categories ({groups.length})
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={expandAllGroups}
                className="rounded px-1.5 py-0.5 font-medium text-fg hover:bg-surface transition"
              >
                Expand All
              </button>
              <span className="text-muted">·</span>
              <button
                type="button"
                onClick={collapseAllGroups}
                className="rounded px-1.5 py-0.5 font-medium text-muted hover:bg-surface hover:text-fg transition"
              >
                Collapse All
              </button>
            </div>
          </div>

          <nav className="space-y-3 pb-20">
            {groups.map((g) => {
              const isCollapsed = Boolean(collapsedGroups[g.id]);
              return (
                <div key={g.id} className="rounded-xl border border-border/50 bg-bg/30 p-1.5">
                  <button
                    type="button"
                    onClick={() => toggleGroup(g.id)}
                    className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-[11px] font-bold uppercase tracking-[0.14em] text-subtle hover:bg-elevated hover:text-fg transition"
                  >
                    <span>{t(locale, g.i18n)}</span>
                    <span className="flex items-center gap-1 text-[10px] font-mono text-muted">
                      <span>{g.items.length}</span>
                      {isCollapsed ? (
                        <ChevronRight className="size-3.5" />
                      ) : (
                        <ChevronDown className="size-3.5" />
                      )}
                    </span>
                  </button>
                  {!isCollapsed ? (
                    <ul className="mt-1 space-y-0.5">
                      {g.items.map((item) => {
                        const Icon = ICONS[item.icon];
                        const active =
                          item.path === "/app"
                            ? pathname === "/app"
                            : pathname.startsWith(item.path);
                        return (
                          <li key={item.id}>
                            <Link
                              to={item.path}
                              onClick={() => setNavOpen(false)}
                              className={cn(
                                "flex min-h-10 items-center gap-2 rounded-[10px] px-2.5 py-1.5 text-sm transition",
                                active
                                  ? "bg-elevated font-semibold text-fg"
                                  : "text-muted hover:bg-elevated hover:text-fg"
                              )}
                            >
                              <Icon className="size-4 shrink-0" />
                              <span className="truncate">{t(locale, item.i18n)}</span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </div>
              );
            })}
          </nav>
        </aside>

        <div
          ref={mainViewportRef}
          className="relative flex min-w-0 flex-1 flex-col h-full overflow-y-auto"
        >
          <header className="sticky top-0 z-30 flex items-center gap-2.5 border-b border-border bg-bg/90 px-3 py-2 backdrop-blur md:px-6">
            <button
              type="button"
              className="grid size-11 place-items-center md:hidden"
              onClick={() => setNavOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </button>
            <div className="flex-1 max-w-2xl px-2">
              <div
                className="relative group cursor-text"
                onClick={() => setCmdOpen(true)}
              >
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CommandIcon className="h-5 w-5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                </div>
                <input
                  type="text"
                  readOnly
                  placeholder="Global Search... (Press ⌘K)"
                  className="block w-full pl-10 pr-12 py-2.5 border-2 border-slate-200 rounded-xl leading-5 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 sm:text-sm transition-all cursor-text shadow-sm hover:border-slate-300 hover:bg-white"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="inline-flex items-center px-2 py-1 border border-slate-200 rounded text-xs font-sans font-medium text-slate-400">
                    ⌘K
                  </span>
                </div>
              </div>
            </div>

            {/* 6-Tier Founder Notification & Auto-Remediation Bell */}
            <button
              type="button"
              onClick={() => setBellOpen(true)}
              className="relative flex h-10 items-center gap-1.5 rounded-[10px] border border-border bg-elevated px-2.5 text-xs font-semibold text-fg hover:bg-surface transition"
              aria-label="Open 6-Tier Founder Notification and Auto-Remediation Center"
              title="6-Tier Founder Notification & Auto-Remediation Center"
            >
              <Bell className="size-4 text-amber-400" />
              <span className="hidden lg:inline">Alerts</span>
              {unresolvedCount > 0 ? (
                <span className="rounded-full bg-red-600 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white">
                  {unresolvedCount}
                </span>
              ) : (
                <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-400">
                  0
                </span>
              )}
            </button>

            {/* All 23 Indian Constitutional Languages + English Selector */}
            <select
              aria-label="Language"
              className="h-10 max-w-[11rem] rounded-[10px] border border-border bg-elevated px-2 text-xs font-medium"
              value={locale}
              onChange={(e) => setLocale(e.target.value as Locale)}
            >
              {LOCALES.map((loc) => (
                <option key={loc} value={loc}>
                  {LOCALE_LABELS[loc]}
                </option>
              ))}
            </select>

            {employee &&
            (employee.roleKey === "SUPER_ADMIN" ||
              employee.permissions.includes("assume_role")) ? (
              <select
                aria-label="View as role"
                className="hidden h-10 max-w-[9rem] rounded-[10px] border border-border bg-elevated px-2 text-xs md:block"
                value={employee.assumedRoleKey ?? employee.roleKey}
                onChange={(e) =>
                  assume.mutate(
                    e.target.value === employee.roleKey ? null : e.target.value
                  )
                }
              >
                {SYSTEM_ROLES.filter((r) => r !== "CUSTOM").map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            ) : null}
            <div className="hidden items-center gap-2 md:flex">
              <div className="text-right">
                <p className="text-xs text-muted">
                  {employee ? ROLE_LABELS[employee.actingRoleKey] : ""}
                </p>
                <p className="text-sm">{employee?.name}</p>
              </div>
              <UserButton />
            </div>
            <div className="md:hidden">
              <UserButton />
            </div>
          </header>

          <main id="main" className="flex-1 px-3 py-4 pb-24 md:px-6 md:py-6 md:pb-24">
            <Suspense fallback={<CommandContentSkeleton />}>
              <Outlet />
            </Suspense>
          </main>

          {/* Floating Scroll Up / Scroll Down Viewport Controls */}
          <div className="fixed bottom-20 right-5 z-30 flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => scrollMainViewport("up")}
              className="flex size-9 items-center justify-center rounded-full border border-border bg-surface/90 text-fg shadow-lg backdrop-blur hover:bg-elevated transition"
              aria-label="Scroll Up"
              title="Scroll Up (↑)"
            >
              <ArrowUp className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollMainViewport("down")}
              className="flex size-9 items-center justify-center rounded-full border border-border bg-surface/90 text-fg shadow-lg backdrop-blur hover:bg-elevated transition"
              aria-label="Scroll Down"
              title="Scroll Down (↓)"
            >
              <ArrowDown className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 6-Tier Founder Notification & Auto-Remediation Slide-Over Drawer */}
      {bellOpen ? (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs"
          onClick={() => setBellOpen(false)}
        >
          <div
            className="flex h-full w-full max-w-xl flex-col border-l border-border bg-surface text-fg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <Bell className="size-5 text-amber-400" />
                  <h2 className="text-base font-bold">
                    6-Tier Founder Notification &amp; Auto-Remediation Desk
                  </h2>
                </div>
                <p className="mt-0.5 text-xs text-muted">
                  Zero-Harassment Autonomous Diagnostics · 1-Click Auto-Fix &amp; Direct Module Routing
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBellOpen(false)}
                className="rounded-lg p-1.5 text-muted hover:bg-elevated hover:text-fg"
                aria-label="Close Notification Drawer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Severity Tier Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 border-b border-border bg-elevated/40 px-5 py-3">
              {(
                [
                  "ALL",
                  "EMERGENCY",
                  "DANGER",
                  "CRITICAL",
                  "HIGH",
                  "MEDIUM",
                  "LOW",
                ] as const
              ).map((tier) => {
                const isSelected = selectedTierFilter === tier;
                return (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setSelectedTierFilter(tier)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition",
                      isSelected
                        ? "border-primary bg-primary text-primary-fg"
                        : "border-border bg-surface text-muted hover:text-fg"
                    )}
                  >
                    {tier}
                  </button>
                );
              })}
            </div>

            {/* Alert Cards */}
            <div className="flex-1 space-y-3 overflow-y-auto p-5">
              {filteredAlerts.map((item) => {
                const style = TIER_STYLES[item.tier];
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "rounded-2xl border p-4 space-y-2.5 transition",
                      item.resolved ? "border-border bg-elevated/30 opacity-75" : style.border
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold",
                            style.badge
                          )}
                        >
                          {item.tier}
                        </span>
                        <h3 className="text-sm font-bold text-fg">{item.title}</h3>
                      </div>
                      {item.resolved ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                          <CheckCircle2 className="size-3" /> Resolved
                        </span>
                      ) : null}
                    </div>

                    <p className="text-xs text-muted">
                      <strong className="text-fg">Root Cause:</strong> {item.rootCause}
                    </p>
                    <p className="text-xs text-muted">
                      <strong className="text-fg">Resolution Steps:</strong> {item.resolutionSteps}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      {!item.resolved ? (
                        <button
                          type="button"
                          onClick={() => handleAutoFixAlert(item)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-black hover:bg-amber-400 transition"
                        >
                          <Zap className="size-3.5" />
                          <span>⚡ Auto-Fix: {item.autoFixActionLabel}</span>
                        </button>
                      ) : (
                        <span className="text-[11px] font-medium text-emerald-400">
                          ✓ Autonomous remediation verified
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setBellOpen(false);
                          void navigate({ to: item.targetPath as "/app" });
                        }}
                        className="rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-fg hover:bg-elevated transition"
                      >
                        Open Module →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {cmdOpen ? (
        <div
          className="fixed inset-0 z-50 grid place-items-start bg-bg/70 p-4 pt-[15vh]"
          onClick={() => setCmdOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-[20px] border border-border bg-surface p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                runCommand();
              }}
            >
              <Input
                autoFocus
                value={cmd}
                onChange={(e) => setCmd(e.target.value)}
                placeholder="Find delayed orders today…"
              />
            </form>
            <p className="mt-2 text-xs text-muted">
              Natural-language search respects your permissions.
            </p>
          </div>
        </div>
      ) : null}

      {/* Hierarchical Category -> Sub-Category -> Actionable Option Mega-Drawer */}
      {activeHub ? (
        <div
          className="fixed inset-0 bottom-16 z-40 flex flex-col justify-end bg-black/65 backdrop-blur-xs"
          onClick={() => setActiveHubId(null)}
        >
          <div
            className="mx-auto flex max-h-[78vh] w-full max-w-7xl flex-col overflow-hidden rounded-t-3xl border border-border bg-surface text-fg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mega-Drawer Top Header & Search Filter */}
            <div className="flex flex-col gap-3 border-b border-border bg-elevated/60 px-4 py-3.5 md:flex-row md:items-center md:justify-between md:px-6">
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-xl border text-lg",
                    activeHub.isPrimary
                      ? "border-amber-400/50 bg-amber-500/15 text-amber-300"
                      : "border-border bg-surface text-fg"
                  )}
                >
                  <span aria-hidden="true">{activeHub.emoji}</span>
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-base font-bold text-fg md:text-lg">
                      {activeHub.label}
                    </h2>
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider",
                        activeHub.isPrimary
                          ? "border-amber-400/50 bg-amber-500/20 text-amber-300"
                          : "border-border bg-surface text-muted"
                      )}
                    >
                      {activeHub.badge}
                    </span>
                    <span className="text-[11px] font-mono text-muted">
                      {activeHub.categories.length} Categories ·{" "}
                      {activeHub.categories.reduce(
                        (sum, cat) => sum + cat.options.length,
                        0
                      )}{" "}
                      Controls
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted">{activeHub.tagline}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-full md:w-80">
                  <Input
                    value={hubFilterQuery}
                    onChange={(e) => setHubFilterQuery(e.target.value)}
                    placeholder="Filter categories, sub-categories, or controls..."
                    aria-label="Filter categories, sub-categories, or controls"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setActiveHubId(null)}
                  className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-muted hover:bg-elevated hover:text-fg transition"
                  aria-label="Close Hub Mega-Drawer"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Mega-Drawer Two-Column Hierarchy Body */}
            <div className="grid flex-1 grid-cols-1 overflow-hidden md:grid-cols-12">
              {/* Left/Top Column: Categories inside the selected Hub */}
              <div className="border-b border-border bg-bg/40 p-3 overflow-y-auto md:col-span-4 md:border-b-0 md:border-r lg:col-span-3">
                <p className="mb-2 px-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted">
                  1. Select Category ({visibleHubCategories.length})
                </p>
                <div className="flex gap-1.5 overflow-x-auto pb-1 md:flex-col md:overflow-x-visible md:pb-0">
                  {visibleHubCategories.map((cat) => {
                    const isSelected = activeCategory?.id === cat.id && !normalizedHubQuery;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setActiveCategoryId(cat.id);
                          if (normalizedHubQuery) setHubFilterQuery("");
                        }}
                        className={cn(
                          "flex shrink-0 items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left transition md:w-full",
                          isSelected
                            ? activeHub.isPrimary
                              ? "border-amber-400/50 bg-amber-500/15 text-fg shadow-xs"
                              : "border-primary/50 bg-elevated text-fg shadow-xs"
                            : "border-transparent bg-surface/50 text-muted hover:border-border hover:bg-surface hover:text-fg"
                        )}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-fg">{cat.label}</p>
                          <p className="hidden truncate text-[11px] text-muted md:block">
                            {cat.badge}
                          </p>
                        </div>
                        <span className="rounded-md border border-border bg-bg/60 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-muted">
                          {cat.options.length}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right/Main Panel: Sub-Categories & Actionable Options */}
              <div className="flex-1 overflow-y-auto p-4 md:col-span-8 md:p-5 lg:col-span-9">
                {activeCategory && !normalizedHubQuery ? (
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-amber-400">
                          2. Sub-Categories &amp; Actionable Controls
                        </span>
                        <span className="rounded-full border border-border bg-elevated px-2 py-0.5 font-mono text-[10px] text-muted">
                          {activeCategory.badge}
                        </span>
                      </div>
                      <h3 className="mt-0.5 text-sm font-bold text-fg md:text-base">
                        {activeCategory.label}
                      </h3>
                      <p className="text-xs text-muted">{activeCategory.summary}</p>
                    </div>
                  </div>
                ) : (
                  <div className="mb-4 border-b border-border/60 pb-3">
                    <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-amber-400">
                      Filtered Results ({displayedOptions.length})
                    </p>
                    <p className="text-xs text-muted">
                      Showing matching sub-categories and controls in {activeHub.label}
                    </p>
                  </div>
                )}

                {displayedOptions.length === 0 ? (
                  <div className="rounded-2xl border border-border bg-bg/40 p-6 text-center">
                    <p className="text-sm font-semibold text-fg">
                      No matching categories or controls found
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      Clear the search filter or select another category on the left.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {displayedOptions.map(({ categoryLabel, option }) => {
                      const isCurrentRoute =
                        option.to === "/app"
                          ? pathname === "/app"
                          : pathname.startsWith(option.to);
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() =>
                            handleSelectBottomOption(activeHub, categoryLabel, option)
                          }
                          className={cn(
                            "group flex flex-col justify-between rounded-2xl border p-4 text-left transition",
                            isCurrentRoute
                              ? "border-amber-400/50 bg-amber-500/10"
                              : "border-border bg-bg/40 hover:border-amber-400/40 hover:bg-elevated/70"
                          )}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-400">
                                {normalizedHubQuery
                                  ? `${categoryLabel} · ${option.subCategory}`
                                  : option.subCategory}
                              </span>
                              <span className="rounded-full border border-border bg-surface px-2 py-0.5 font-mono text-[10px] font-semibold text-muted group-hover:text-fg">
                                {option.badge}
                              </span>
                            </div>
                            <h4 className="mt-1.5 text-sm font-bold text-fg group-hover:text-amber-300 transition">
                              {option.label}
                            </h4>
                            <p className="mt-1 text-xs leading-relaxed text-muted">
                              {option.description}
                            </p>
                          </div>

                          <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2.5 text-[11px]">
                            <span className="font-mono text-muted">
                              {option.to}
                              {option.hash ? `#${option.hash}` : ""}
                            </span>
                            <span className="font-semibold text-fg group-hover:translate-x-0.5 transition">
                              Open Control →
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Sticky Bottom Command Navigation Bar (5 Hubs + Home Dashboard) */}
      <nav
        aria-label="UMAR OS Bottom Command Navigation Hubs"
        className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-surface/95 px-2 py-1.5 shadow-2xl backdrop-blur md:px-4"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-1.5 overflow-x-auto">
          {/* Quick Home Dashboard Button */}
          <button
            type="button"
            onClick={() => {
              setActiveHubId(null);
              setHubFilterQuery("");
              void navigate({ to: "/app" });
              mainViewportRef.current?.scrollTo({ top: 0, behavior: "smooth" });
              toast.success("Home Dashboard — Sovereign Command Overview");
            }}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs font-semibold transition",
              pathname === "/app" && !activeHubId
                ? "border-primary/50 bg-elevated text-fg"
                : "border-border bg-bg/50 text-muted hover:bg-elevated hover:text-fg"
            )}
            title="Return to Home Dashboard (/app)"
          >
            <LayoutDashboard className="size-4 text-emerald-400 shrink-0" />
            <span className="hidden sm:inline">Home Dashboard</span>
          </button>

          {/* 5 Hierarchical Bottom Navigation Hubs */}
          <div className="flex flex-1 items-center justify-start gap-1.5 md:justify-center">
            {UMAR_OS_BOTTOM_HUBS.map((hub) => {
              const isOpen = activeHubId === hub.id;
              const isPrimary = Boolean(hub.isPrimary);
              return (
                <button
                  key={hub.id}
                  type="button"
                  onClick={() => handleSelectBottomHub(hub)}
                  aria-expanded={isOpen}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-left transition",
                    isPrimary
                      ? isOpen
                        ? "border-amber-400 bg-amber-500/25 text-fg shadow-md ring-2 ring-amber-400/30"
                        : "border-amber-400/60 bg-amber-500/15 text-fg hover:bg-amber-500/25 shadow-sm"
                      : isOpen
                        ? "border-primary bg-elevated text-fg shadow-sm"
                        : "border-border bg-bg/60 text-muted hover:border-border hover:bg-elevated hover:text-fg"
                  )}
                >
                  <span className="text-base leading-none" aria-hidden="true">
                    {hub.emoji}
                  </span>
                  <div className="leading-tight">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          "text-xs whitespace-nowrap",
                          isPrimary ? "font-extrabold text-amber-300" : "font-bold text-fg"
                        )}
                      >
                        {hub.label}
                      </span>
                      <span
                        className={cn(
                          "hidden rounded-full border px-1.5 py-0.2 font-mono text-[9px] font-bold uppercase lg:inline-block",
                          isPrimary
                            ? "border-amber-400/50 bg-amber-500/20 text-amber-200"
                            : "border-border bg-surface text-muted"
                        )}
                      >
                        {hub.badge}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}

export function useEmployee() {
  const q = useQuery({ queryKey: ["session"], queryFn: () => bootstrapSession() });
  return q.data && q.data.ok ? q.data.employee : null;
}

function CommandContentSkeleton() {
  return (
    <div
      className="space-y-4 animate-pulse"
      aria-busy="true"
      aria-label="Loading workspace module"
    >
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="h-7 w-48 bg-surface rounded-lg" />
        <div className="h-8 w-24 bg-surface rounded-lg" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 bg-surface rounded-xl border border-border" />
        ))}
      </div>
      <div className="h-80 w-full bg-surface rounded-xl border border-border" />
    </div>
  );
}
