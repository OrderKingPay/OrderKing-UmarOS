// @ts-nocheck
import { useEffect, useState, type CSSProperties } from "react";
import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  Bell,
  Bike,
  Calculator,
  ChartNoAxesColumn,
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
  Zap
} from "lucide-react";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { bootstrapSession, updateEmployeeFn } from "@/lib/orderking/actions";
import { NAV, itemAllowed } from "@/lib/orderking/nav";
import { t, type Locale } from "@/lib/orderking/i18n";
import { parseCommand, intentPath } from "@/lib/orderking/search";
import { ROLE_LABELS, SYSTEM_ROLES } from "@/lib/orderking/permissions";
import { OrderKingMark } from "@/components/brand/mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

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

export type EmployeeSession = NonNullable<Extract<Awaited<ReturnType<typeof bootstrapSession>>, { ok: true }>>["employee"];

export function CommandShell() {
  const { user, isPending } = useCurrentUserState();
  const [locale, setLocale] = useState<Locale>("en");
  const [navOpen, setNavOpen] = useState(false);
  const [cmd, setCmd] = useState("");
  const [cmdOpen, setCmdOpen] = useState(false);
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
      const emp =
        session.data && session.data.ok ? session.data.employee : null;
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
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (isPending || (user && session.isPending)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#050505] text-white">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}>
          <OrderKingMark className="size-16 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
        </motion.div>
        <p className="font-display text-2xl font-black bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">Umar OS initializing...</p>
        <p className="text-xs text-cyan-400 font-mono tracking-widest animate-pulse">SOVEREIGN FOUNDER COMMAND</p>
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;

  const payload = session.data && session.data.ok ? session.data : null;
  const employee = payload?.employee;
  if (session.data && !session.data.ok) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#050505] p-6 text-white">
        <div className="max-w-md rounded-3xl border border-red-500/30 bg-black p-8 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
          <h1 className="font-display text-3xl font-black text-red-500">Access Denied</h1>
          <p className="mt-4 text-gray-400">{session.data.error}</p>
        </div>
      </main>
    );
  }
  if (employee && employee.status === "PENDING") {
    return (
      <main className="grid min-h-screen place-items-center bg-[#050505] p-6 text-white">
        <div className="max-w-md rounded-3xl border border-cyan-500/30 bg-black p-8 shadow-[0_0_30px_rgba(34,211,238,0.1)] text-center">
          <OrderKingMark className="size-16 mx-auto mb-6 text-cyan-500" />
          <h1 className="font-display text-2xl font-black">Clearance Pending</h1>
          <p className="mt-4 text-sm text-gray-400">
            Awaiting executive override. If you are the founder, you will be elevated automatically.
          </p>
          <div className="mt-8 flex justify-center">
            <UserButton />
          </div>
        </div>
      </main>
    );
  }

  const perms = employee?.permissions ?? [];
  const groups = NAV.map((g) => ({
    ...g,
    items: g.items.filter((it) => itemAllowed(it, perms) || employee?.actingRoleKey === "SUPER_ADMIN"),
  })).filter((g) => g.items.length);

  const brand = payload?.branding as Record<string, string> | null;
  const appName = brand?.admin_branding || brand?.app_name || "Umar OS";

  const runCommand = () => {
    const intent = parseCommand(cmd);
    const path = intentPath(intent);
    setCmdOpen(false);
    setCmd("");
    const [pathname, qs] = path.split("?");
    const search = Object.fromEntries(new URLSearchParams(qs ?? ""));
    void navigate({ to: (pathname || "/app") as "/app", search });
  };

  return (
    <div className="h-screen bg-[#050505] text-zinc-100 font-sans overflow-hidden selection:bg-cyan-500/30">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-cyan-500 focus:px-3 focus:py-2 focus:text-black focus:font-bold">
        Skip to content
      </a>

      {employee?.assumedRoleKey && employee.assumedRoleKey !== employee.roleKey ? (
        <div className="flex items-center justify-center gap-3 bg-red-900/40 border-b border-red-500/30 px-4 py-2 text-xs shrink-0 font-mono tracking-widest text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
          <AlertTriangle className="size-4 animate-pulse" />
          SIMULATION ACTIVE: Viewing as {ROLE_LABELS[employee.assumedRoleKey] ?? employee.assumedRoleKey}. Mutations use this role’s permissions.
          <button className="underline hover:text-white font-bold ml-2" type="button" onClick={() => assume.mutate(null)}>
            TERMINATE SIMULATION
          </button>
        </div>
      ) : null}

      <div className="flex h-full overflow-hidden relative z-10">
        
        {/* SIDEBAR */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-[280px] flex flex-col overflow-y-auto border-r border-white/5 bg-black/80 backdrop-blur-3xl transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] md:static md:translate-x-0 shrink-0",
            navOpen ? "translate-x-0 shadow-[20px_0_50px_rgba(0,0,0,0.8)]" : "-translate-x-full md:translate-x-0",
          )}
        >
          <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-xl mb-6 flex items-center justify-between p-6 border-b border-white/5">
            <Link to="/app" className="flex items-center gap-3 group" onClick={() => setNavOpen(false)}>
              <div className="relative">
                <OrderKingMark className="size-10 text-white transition-transform duration-500 group-hover:rotate-180" />
                <div className="absolute inset-0 bg-cyan-400/20 blur-xl rounded-full scale-0 group-hover:scale-150 transition-transform duration-500" />
              </div>
              <div>
                <p className="font-display text-lg font-black tracking-tighter bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">{appName}</p>
                <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-cyan-400/80">Command Module</p>
              </div>
            </Link>
            <button className="md:hidden p-2 rounded-full bg-white/5 text-gray-400 hover:bg-white/10" type="button" onClick={() => setNavOpen(false)} aria-label="Close menu">
              <X className="size-5" />
            </button>
          </div>

          <nav className="flex-1 space-y-8 px-4 pb-24">
            {groups.map((g) => (
              <div key={g.id}>
                <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-[0.25em] text-zinc-600">{t(locale, g.i18n)}</p>
                <ul className="space-y-1">
                  {g.items.map((item) => {
                    const Icon = ICONS[item.icon];
                    const active = item.path === "/app" ? pathname === "/app" : pathname.startsWith(item.path);
                    return (
                      <li key={item.id}>
                        <Link
                          to={item.path}
                          onClick={() => setNavOpen(false)}
                          className={cn(
                            "group flex min-h-[44px] items-center gap-3 rounded-2xl px-3 text-sm font-medium transition-all duration-300",
                            active 
                              ? "bg-gradient-to-r from-cyan-500/10 to-blue-500/5 text-cyan-400 shadow-[inset_2px_0_0_rgba(34,211,238,1)]" 
                              : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100",
                          )}
                        >
                          <Icon className={cn("size-4 transition-transform duration-300", active ? "scale-110 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" : "group-hover:scale-110")} />
                          {t(locale, item.i18n)}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        {/* MAIN CONTENT AREA */}
        <div className="flex min-w-0 flex-1 flex-col h-full overflow-y-auto bg-black relative">
          
          {/* Subtle global gradient background */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-400 via-transparent to-transparent" />

          <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-white/5 bg-black/60 px-4 py-3 backdrop-blur-2xl md:px-8 md:py-4">
            <button type="button" className="grid size-11 place-items-center rounded-full bg-white/5 md:hidden" onClick={() => setNavOpen(true)} aria-label="Open menu">
              <Menu className="size-5 text-gray-300" />
            </button>
            
            <button
              type="button"
              onClick={() => setCmdOpen(true)}
              className="group flex h-11 flex-1 items-center gap-3 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 hover:border-cyan-500/30 px-4 text-left text-sm text-gray-400 transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)] max-w-xl"
            >
              <CommandIcon className="size-4 text-cyan-500/70 group-hover:text-cyan-400" />
              <span className="hidden sm:inline font-mono text-xs tracking-wide">Enter Directive / Query Database...</span>
              <span className="ml-auto hidden rounded-md bg-black/50 border border-white/10 px-2 py-0.5 text-[10px] font-bold text-gray-500 sm:inline group-hover:text-cyan-400 group-hover:border-cyan-500/50 transition-colors">⌘K</span>
            </button>

            <div className="flex items-center gap-3 ml-auto">
               <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full text-[10px] font-bold uppercase tracking-widest text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.1)]">
                 <Zap className="size-3" /> System Stable
               </div>
              <select
                aria-label="Language"
                className="h-10 rounded-full border border-white/10 bg-white/5 px-4 pr-8 text-xs font-bold hover:bg-white/10 transition-colors text-gray-300 cursor-pointer appearance-none"
                style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%22%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23ffffff%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right .7rem top 50%', backgroundSize: '.65rem auto' }}
                value={locale}
                onChange={(e) => setLocale(e.target.value as Locale)}
              >
                <option value="en" className="bg-black text-white">EN</option>
                <option value="bn" className="bg-black text-white">বাংলা</option>
                <option value="as" className="bg-black text-white">অসমীয়া</option>
                <option value="hi" className="bg-black text-white">हिन्दी</option>
              </select>
              {employee && (employee.roleKey === "SUPER_ADMIN" || employee.permissions.includes("assume_role")) ? (
                <select
                  aria-label="View as role"
                  className="hidden h-10 w-32 rounded-full border border-white/10 bg-white/5 px-4 pr-8 text-xs font-bold hover:bg-white/10 transition-colors text-gray-300 md:block cursor-pointer appearance-none truncate"
                  style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%22%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23ffffff%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right .7rem top 50%', backgroundSize: '.65rem auto' }}
                  value={employee.assumedRoleKey ?? employee.roleKey}
                  onChange={(e) => assume.mutate(e.target.value === employee.roleKey ? null : e.target.value)}
                >
                  {SYSTEM_ROLES.filter((r) => r !== "CUSTOM").map((r) => (
                    <option key={r} value={r} className="bg-black text-white">
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
              ) : null}
              <div className="hidden items-center gap-3 md:flex ml-2 pl-4 border-l border-white/10">
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400">{employee ? ROLE_LABELS[employee.actingRoleKey] : ""}</p>
                  <p className="text-sm font-bold text-white">{employee?.name}</p>
                </div>
                <div className="ring-2 ring-white/10 rounded-full hover:ring-cyan-500/50 transition-all">
                  <UserButton />
                </div>
              </div>
              <div className="md:hidden">
                <UserButton />
              </div>
            </div>
          </header>

          <main id="main" className="flex-1 relative z-10 p-4 md:p-8">
            <Outlet />
          </main>
        </div>
      </div>

      <AnimatePresence>
        {cmdOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-start bg-black/80 backdrop-blur-sm p-4 pt-[15vh]" 
            onClick={() => setCmdOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: -20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: -20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="w-full max-w-2xl mx-auto rounded-3xl border border-white/10 bg-[#0a0a0a] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(34,211,238,0.1)] relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-600" />
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                   <CommandIcon className="size-6 text-cyan-400" />
                   <h2 className="text-lg font-bold">UmarOS Command Terminal</h2>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    runCommand();
                  }}
                >
                  <input
                    autoFocus
                    value={cmd}
                    onChange={(e) => setCmd(e.target.value)}
                    placeholder="E.g. find delayed orders, increase pricing..."
                    className="w-full bg-black/50 border border-white/10 rounded-2xl p-5 text-xl text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono shadow-inner"
                  />
                </form>
                <div className="mt-6 flex items-center gap-3 px-1">
                  <Sparkles className="size-4 text-purple-400" />
                  <p className="text-sm font-medium text-gray-400">Natural-language intent parsing active. Secured by clearance level.</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function useEmployee() {
  const q = useQuery({ queryKey: ["session"], queryFn: () => bootstrapSession() });
  return q.data && q.data.ok ? q.data.employee : null;
}
