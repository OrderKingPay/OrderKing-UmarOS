import { useEffect, useRef, useState, Suspense, type CSSProperties } from "react";
import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminErrorBoundary } from "@/components/error-boundary";
import { ResilientRouteOutlet } from "@/components/common/resilient-route-outlet";
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
  UMAR_OS_10_WORLDS,
  UMAR_OS_BOTTOM_HUBS,
  itemAllowed,
  type BottomNavHub,
  type BottomNavOption,
  type BottomNavWorld,
  type BottomNavWorldId,
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

function resolveWorldFromPath(pathname: string): BottomNavWorld {
  if (
    pathname.startsWith("/app/orders") ||
    pathname.startsWith("/app/dispatch") ||
    pathname.startsWith("/app/restaurants") ||
    pathname.startsWith("/app/riders") ||
    pathname.startsWith("/app/customers") ||
    pathname.startsWith("/app/kyc") ||
    pathname.startsWith("/app/support") ||
    pathname.startsWith("/app/promotions")
  ) {
    return UMAR_OS_10_WORLDS[1]!;
  }
  if (
    pathname.startsWith("/app/finance") ||
    pathname.startsWith("/app/settlements") ||
    pathname.startsWith("/app/economics") ||
    pathname.startsWith("/app/loyalty") ||
    pathname.startsWith("/app/rbi-compliance-hub")
  ) {
    return UMAR_OS_10_WORLDS[2]!;
  }
  if (
    pathname.startsWith("/app/travel") ||
    pathname.startsWith("/app/education") ||
    pathname.startsWith("/app/jobs") ||
    pathname.startsWith("/app/employees")
  ) {
    return UMAR_OS_10_WORLDS[3]!;
  }
  if (
    pathname.startsWith("/app/ceo") ||
    pathname.startsWith("/app/founder-command") ||
    pathname.startsWith("/app/baas-hijack-hub") ||
    pathname.startsWith("/app/pos-terminals") ||
    pathname.startsWith("/app/reports")
  ) {
    return UMAR_OS_10_WORLDS[4]!;
  }
  if (pathname.startsWith("/app/ai")) {
    return UMAR_OS_10_WORLDS[5]!;
  }
  if (
    pathname.startsWith("/app/cms") ||
    pathname.startsWith("/app/branding") ||
    pathname.startsWith("/app/marketing") ||
    pathname.startsWith("/app/meta-dm") ||
    pathname.startsWith("/app/jio-airtel") ||
    pathname.startsWith("/app/telecom-arbitrage") ||
    pathname.startsWith("/app/wifi-interception") ||
    pathname.startsWith("/app/oem-lockscreen")
  ) {
    return UMAR_OS_10_WORLDS[6]!;
  }
  if (
    pathname.startsWith("/app/golive") ||
    pathname.startsWith("/app/fintech-connectors") ||
    pathname.startsWith("/app/zones") ||
    pathname.startsWith("/app/tech-registry") ||
    pathname.startsWith("/app/world-tech")
  ) {
    return UMAR_OS_10_WORLDS[7]!;
  }
  if (
    pathname.startsWith("/app/notifications") ||
    pathname.startsWith("/app/risk") ||
    pathname.startsWith("/app/approvals") ||
    pathname.startsWith("/app/audit") ||
    pathname.startsWith("/app/health")
  ) {
    return UMAR_OS_10_WORLDS[8]!;
  }
  if (pathname.startsWith("/app/settings") || pathname.startsWith("/app/flags")) {
    return UMAR_OS_10_WORLDS[9]!;
  }
  return UMAR_OS_10_WORLDS[0]!;
}

export function CommandShell() {
  const { user, isPending } = useCurrentUserState();
  const [locale, setLocale] = useState<Locale>("en");
  const [navOpen, setNavOpen] = useState(false);
  const [cmd, setCmd] = useState("");
  const [cmdOpen, setCmdOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [bellOpen, setBellOpen] = useState(false);
  const [pageSettingsOpen, setPageSettingsOpen] = useState(false);
  const [pageDensity, setPageDensity] = useState<"comfortable" | "compact">("comfortable");
  const [pageAutoRefresh, setPageAutoRefresh] = useState<"10s" | "30s" | "manual">("10s");
  const [pageDefaultCity, setPageDefaultCity] = useState<"all" | "karimganj" | "silchar">("all");
  const [selectedTierFilter, setSelectedTierFilter] = useState<"ALL" | AlertSeverityTier>("ALL");
  const [alerts, setAlerts] = useState<FounderRemediationAlert[]>(INITIAL_FOUNDER_ALERTS);
  const [activeWorldId, setActiveWorldId] = useState<BottomNavWorldId | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string>("home_dashboard");
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
        setActiveWorldId(null);
        setPageSettingsOpen(false);
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

  const currentRouteWorld = resolveWorldFromPath(pathname);
  const activeWorld = UMAR_OS_10_WORLDS.find((w) => w.id === activeWorldId) ?? null;

  const handleSelectBottomWorld = (world: BottomNavWorld) => {
    if (activeWorldId === world.id) {
      setActiveWorldId(null);
      setHubFilterQuery("");
      return;
    }
    setActiveWorldId(world.id);
    setActiveCategoryId(world.categories[0]?.id ?? "");
    setHubFilterQuery("");
    void navigate({ to: world.defaultTo as "/app" });
  };

  const handleOpenWorldSettings = (world: BottomNavWorld) => {
    const settingsCategory =
      world.categories.find((c) => c.id.endsWith("_settings")) ??
      world.categories[world.categories.length - 1];
    setActiveWorldId(world.id);
    setActiveCategoryId(settingsCategory?.id ?? world.categories[0]?.id ?? "");
    setHubFilterQuery("");
  };

  const handleSelectBottomOption = (
    world: BottomNavWorld | BottomNavHub,
    categoryLabel: string,
    option: BottomNavOption
  ) => {
    setActiveWorldId(null);
    setHubFilterQuery("");
    void navigate({
      to: option.to as "/app",
      search: option.query,
      hash: option.hash,
    });
    toast.success(
      `Opened ${option.label} (${world.label} › ${categoryLabel} › ${option.subCategory})`
    );
  };

  const normalizedHubQuery = hubFilterQuery.trim().toLowerCase();

  const visibleHubCategories = activeWorld
    ? activeWorld.categories.filter((cat) => {
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
  }> = activeWorld
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

            {/* Page Settings & Customize Button (Every Page in /app/*) */}
            <button
              type="button"
              onClick={() => setPageSettingsOpen(true)}
              className="flex h-10 items-center gap-1.5 rounded-[10px] border border-amber-400/50 bg-amber-500/15 px-2.5 text-xs font-bold text-amber-300 hover:bg-amber-500/25 transition"
              aria-label="Open Page Settings and Customize"
              title="Customize this page's settings, rules, and layout"
            >
              <Settings className="size-4 text-amber-400 shrink-0" />
              <span className="hidden sm:inline">⚙️ Page Settings &amp; Customize</span>
              <span className="sm:hidden">⚙️ Settings</span>
            </button>

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

          <main
            id="main"
            className={cn(
              "flex-1 pb-28 md:pb-28",
              pageDensity === "compact"
                ? "px-2 py-2.5 md:px-4 md:py-3"
                : "px-3 py-4 md:px-6 md:py-6"
            )}
          >
            <AdminErrorBoundary inline sectionName="Command Viewport">
              <ResilientRouteOutlet fallback={<CommandContentSkeleton />} />
            </AdminErrorBoundary>
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

      {/* Page Settings & Customize Slide-Over Drawer (Accessible from Every /app/* Page) */}
      {pageSettingsOpen ? (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs"
          onClick={() => setPageSettingsOpen(false)}
        >
          <div
            className="flex h-full w-full max-w-lg flex-col border-l border-border bg-surface text-fg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <Settings className="size-5 text-amber-400" />
                  <h2 className="text-base font-bold">
                    ⚙️ Page Settings &amp; Customize
                  </h2>
                </div>
                <p className="mt-0.5 text-xs text-muted">
                  Active World: <strong className="text-fg">{currentRouteWorld.label}</strong> ({currentRouteWorld.shortTitle}) · Route <code className="font-mono">{pathname}</code>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPageSettingsOpen(false)}
                className="rounded-lg p-1.5 text-muted hover:bg-elevated hover:text-fg"
                aria-label="Close Page Settings Drawer"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-5 text-xs">
              {/* Section 1: Live Page Layout & Display Controls */}
              <div className="rounded-2xl border border-border bg-elevated/40 p-4 space-y-3">
                <h3 className="text-sm font-bold text-fg">
                  1. Customize This Page&apos;s Layout &amp; Refresh
                </h3>
                <div className="space-y-2.5">
                  <div>
                    <label className="block font-medium text-muted mb-1">
                      Page Layout Spacing
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(["comfortable", "compact"] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => {
                            setPageDensity(mode);
                            toast.success(`Page layout set to ${mode}`);
                          }}
                          className={cn(
                            "rounded-xl border px-3 py-2 font-semibold capitalize transition",
                            pageDensity === mode
                              ? "border-amber-400 bg-amber-500/15 text-fg"
                              : "border-border bg-surface text-muted hover:text-fg"
                          )}
                        >
                          {mode} View
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-muted mb-1">
                      Live Data Refresh Speed
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["10s", "30s", "manual"] as const).map((interval) => (
                        <button
                          key={interval}
                          type="button"
                          onClick={() => {
                            setPageAutoRefresh(interval);
                            toast.success(`Refresh mode set to ${interval}`);
                          }}
                          className={cn(
                            "rounded-xl border px-2.5 py-2 font-semibold uppercase transition",
                            pageAutoRefresh === interval
                              ? "border-amber-400 bg-amber-500/15 text-fg"
                              : "border-border bg-surface text-muted hover:text-fg"
                          )}
                        >
                          {interval}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-muted mb-1">
                      Default City Scope
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(
                        [
                          { id: "all", label: "All Cities" },
                          { id: "karimganj", label: "Karimganj" },
                          { id: "silchar", label: "Silchar" },
                        ] as const
                      ).map((cityOpt) => (
                        <button
                          key={cityOpt.id}
                          type="button"
                          onClick={() => {
                            setPageDefaultCity(cityOpt.id);
                            toast.success(`Default city filter set to ${cityOpt.label}`);
                          }}
                          className={cn(
                            "rounded-xl border px-2.5 py-2 font-semibold transition",
                            pageDefaultCity === cityOpt.id
                              ? "border-amber-400 bg-amber-500/15 text-fg"
                              : "border-border bg-surface text-muted hover:text-fg"
                          )}
                        >
                          {cityOpt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Current World Categories & Settings */}
              <div className="rounded-2xl border border-border bg-elevated/40 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-fg">
                      2. {currentRouteWorld.label} — Categories &amp; Options
                    </h3>
                    <p className="text-[11px] text-muted">
                      {currentRouteWorld.shortTitle}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPageSettingsOpen(false);
                      handleOpenWorldSettings(currentRouteWorld);
                    }}
                    className="rounded-xl border border-amber-400/50 bg-amber-500/15 px-3 py-1.5 font-bold text-amber-300 hover:bg-amber-500/25 transition"
                  >
                    Open Drawer →
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {currentRouteWorld.categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setPageSettingsOpen(false);
                        setActiveWorldId(currentRouteWorld.id);
                        setActiveCategoryId(cat.id);
                      }}
                      className="flex items-center justify-between rounded-xl border border-border bg-surface px-3 py-2 text-left hover:bg-elevated transition"
                    >
                      <div>
                        <p className="font-bold text-fg">{cat.label}</p>
                        <p className="text-[11px] text-muted">{cat.summary}</p>
                      </div>
                      <span className="rounded-md border border-border bg-bg px-2 py-0.5 font-mono text-[10px] text-muted">
                        {cat.options.length} options
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Section 3: Direct Master Settings & Rule Pages */}
              <div className="rounded-2xl border border-border bg-elevated/40 p-4 space-y-2.5">
                <h3 className="text-sm font-bold text-fg">
                  3. Master Rules, Fees &amp; App Customizations
                </h3>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPageSettingsOpen(false);
                      void navigate({ to: "/app/settings" as "/app" });
                    }}
                    className="rounded-xl border border-border bg-surface p-3 text-left hover:border-amber-400/40 hover:bg-elevated transition"
                  >
                    <p className="font-bold text-fg">⚙️ Fees &amp; SLA Rules</p>
                    <p className="mt-0.5 text-[11px] text-muted">
                      Delivery fees, commission bps &amp; prep timers
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPageSettingsOpen(false);
                      void navigate({ to: "/app/flags" as "/app" });
                    }}
                    className="rounded-xl border border-border bg-surface p-3 text-left hover:border-amber-400/40 hover:bg-elevated transition"
                  >
                    <p className="font-bold text-fg">🚩 Feature Switches</p>
                    <p className="mt-0.5 text-[11px] text-muted">
                      Turn modules on or off in 1 click
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPageSettingsOpen(false);
                      void navigate({ to: "/app/branding" as "/app" });
                    }}
                    className="rounded-xl border border-border bg-surface p-3 text-left hover:border-amber-400/40 hover:bg-elevated transition"
                  >
                    <p className="font-bold text-fg">🎨 App Colors &amp; Brand</p>
                    <p className="mt-0.5 text-[11px] text-muted">
                      Theme colors, logo &amp; white-label name
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPageSettingsOpen(false);
                      void navigate({ to: "/app/golive" as "/app" });
                    }}
                    className="rounded-xl border border-border bg-surface p-3 text-left hover:border-amber-400/40 hover:bg-elevated transition"
                  >
                    <p className="font-bold text-fg">🔌 API Keys &amp; Go-Live</p>
                    <p className="mt-0.5 text-[11px] text-muted">
                      Razorpay, SMS OTP, Maps &amp; DB keys
                    </p>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

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

      {/* Hierarchical Category -> Sub-Category -> Actionable Option Mega-Drawer for the 10 Worlds */}
      {activeWorld ? (
        <div
          className="fixed inset-0 bottom-16 z-40 flex flex-col justify-end bg-black/65 backdrop-blur-xs"
          onClick={() => setActiveWorldId(null)}
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
                    activeWorld.isPrimary
                      ? "border-amber-400/50 bg-amber-500/15 text-amber-300"
                      : "border-border bg-surface text-fg"
                  )}
                >
                  <span aria-hidden="true">{activeWorld.emoji}</span>
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-base font-bold text-fg md:text-lg">
                      {activeWorld.label} — {activeWorld.shortTitle}
                    </h2>
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider",
                        activeWorld.isPrimary
                          ? "border-amber-400/50 bg-amber-500/20 text-amber-300"
                          : "border-border bg-surface text-muted"
                      )}
                    >
                      {activeWorld.badge}
                    </span>
                    <span className="text-[11px] font-mono text-muted">
                      {activeWorld.categories.length} Categories ·{" "}
                      {activeWorld.categories.reduce(
                        (sum, cat) => sum + cat.options.length,
                        0
                      )}{" "}
                      Options
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted">{activeWorld.tagline}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenWorldSettings(activeWorld)}
                  className="rounded-xl border border-amber-400/50 bg-amber-500/15 px-3 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/25 transition"
                >
                  ⚙️ World Settings
                </button>
                <div className="w-full sm:w-64">
                  <Input
                    value={hubFilterQuery}
                    onChange={(e) => setHubFilterQuery(e.target.value)}
                    placeholder="Search categories or options..."
                    aria-label="Search categories or options"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setActiveWorldId(null)}
                  className="flex h-9 items-center gap-1 rounded-xl border border-border bg-surface px-2.5 text-xs font-semibold text-muted hover:bg-elevated hover:text-fg transition"
                  aria-label="Close World Drawer"
                >
                  <span>View Page</span>
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Mega-Drawer Two-Column Hierarchy Body */}
            <div className="grid flex-1 grid-cols-1 overflow-hidden md:grid-cols-12">
              {/* Left/Top Column: Categories inside the selected World */}
              <div className="border-b border-border bg-bg/40 p-3 overflow-y-auto md:col-span-4 md:border-b-0 md:border-r lg:col-span-3">
                <p className="mb-2 px-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted">
                  1. Category ({visibleHubCategories.length})
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
                            ? activeWorld.isPrimary
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
                          2. Sub-Category &amp; Option
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
                      Showing matching sub-categories and options in {activeWorld.label}
                    </p>
                  </div>
                )}

                {displayedOptions.length === 0 ? (
                  <div className="rounded-2xl border border-border bg-bg/40 p-6 text-center">
                    <p className="text-sm font-semibold text-fg">
                      No matching categories or options found
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
                            handleSelectBottomOption(activeWorld, categoryLabel, option)
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
                              Open Option →
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

      {/* LUXURY FLOATING COMMAND CONSOLE DOCK (10 WORLDS) */}
      <nav
        aria-label="UMAR OS 10-World Bottom Command Navigation"
        className="fixed bottom-3 inset-x-0 z-40 pointer-events-none mx-auto max-w-7xl px-3 sm:px-4"
      >
        <div className="pointer-events-auto relative rounded-3xl bg-surface/90 backdrop-blur-2xl border border-border shadow-[0_20px_50px_rgba(0,0,0,0.3),inset_0_1px_1px_0_rgba(255,255,255,0.1)] px-3 py-2 flex items-center justify-between gap-1.5 overflow-x-auto scrollbar-none">
          {UMAR_OS_10_WORLDS.map((world) => {
            const isDrawerOpen = activeWorldId === world.id;
            const isRouteActive = currentRouteWorld.id === world.id;
            const isPrimary = Boolean(world.isPrimary);
            return (
              <button
                key={world.id}
                type="button"
                onClick={() => handleSelectBottomWorld(world)}
                aria-expanded={isDrawerOpen}
                title={`${world.label} — ${world.shortTitle}`}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-2xl border px-3 py-1.5 text-left transition-all duration-200 active:scale-95",
                  isPrimary
                    ? isDrawerOpen || isRouteActive
                      ? "border-amber-400 bg-amber-500/25 text-fg shadow-[0_0_15px_rgba(245,158,11,0.35)] ring-1 ring-amber-400/40"
                      : "border-amber-400/50 bg-amber-500/15 text-fg hover:bg-amber-500/25"
                    : isDrawerOpen || isRouteActive
                      ? "border-primary bg-elevated text-fg shadow-xs ring-1 ring-primary/30"
                      : "border-border/60 bg-bg/60 text-muted hover:border-border hover:bg-elevated hover:text-fg"
                )}
              >
                <span className="text-sm leading-none" aria-hidden="true">
                  {world.emoji}
                </span>
                <div className="leading-tight">
                  <span
                    className={cn(
                      "block text-[11px] whitespace-nowrap",
                      isPrimary
                        ? "font-extrabold text-amber-300"
                        : isDrawerOpen || isRouteActive
                          ? "font-bold text-fg"
                          : "font-semibold text-fg/90"
                    )}
                  >
                    {world.label}
                  </span>
                  <span className="hidden text-[9px] text-muted xl:block truncate max-w-[7.5rem]">
                    {world.shortTitle}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export const Shell = CommandShell;
export { UMAR_OS_10_WORLDS, UMAR_OS_BOTTOM_HUBS };

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
