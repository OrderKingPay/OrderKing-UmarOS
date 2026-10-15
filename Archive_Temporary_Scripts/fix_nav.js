
const fs = require("fs");
const path = "orderking-customers/src/components/market/shell.tsx";
let content = fs.readFileSync(path, "utf8");

content = content.replace(
  /{!path\.startsWith\("\/king-pay"\) \? \([\s\S]*?\) : \(/,
  `      {!path.startsWith("/king-pay") ? (
        <nav
            aria-label={brand.appName}
            className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-zinc-950 border-t border-border shadow-[0_-10px_40px_rgba(0,0,0,0.05)] overflow-hidden"
          >
            <ul className="mx-auto grid max-w-lg grid-cols-4 items-center justify-items-center relative px-2 py-1">
            <NavItem to="/" icon={House} label="Home" active={path === "/"} colorClass="text-emerald-500" />
            <NavItem to="/orders" icon={ClipboardList} label="Orders" active={path.startsWith("/orders")} colorClass="text-blue-500" />
            
            {/* 👑 Glowing KingPay Tab */}
            <li className="relative -top-2 flex w-full justify-center">
              <Link
                to="/king-pay"
                className={cn(
                  "group relative flex h-14 w-14 flex-col items-center justify-center rounded-full border-4 border-white dark:border-zinc-950 text-xs no-underline shadow-lg transition-all active:scale-95",
                  path.startsWith("/king-pay")
                    ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-[0_4px_20px_rgba(245,158,11,0.5)]"
                    : "bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 text-white shadow-[0_4px_15px_rgba(245,158,11,0.3)] hover:brightness-110"
                )}
              >
                <span className="text-xl leading-none drop-shadow-sm mt-0.5">👑</span>
                <span className="text-[10px] font-black tracking-tight leading-none drop-shadow-sm mt-0.5">KingPay</span>
                {!path.startsWith("/king-pay") && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 border border-white text-[10px] font-bold text-white shadow-sm">
                    1
                  </span>
                )}
              </Link>
            </li>
            
            <NavItem to="/account" icon={UserRound} label="Profile" active={path.startsWith("/account")} colorClass="text-purple-500" />
          </ul>
        </nav>
      ) : (`
);

content = content.replace(
  /function NavItem\(\{\s+to,\s+icon: Icon,\s+label,\s+active,\s+badge,\s+\}: \{[\s\S]*?\) \{[\s\S]*?<Link[\s\S]*?active \? "text-primary font-bold" : "text-slate-400 hover:text-slate-700 font-medium",[\s\S]*?\)/,
  `function NavItem({
    to,
    icon: Icon,
    label,
    active,
    badge,
    colorClass
  }: {
    to: string;
    icon: typeof House;
    label: string;
    active: boolean;
    badge?: number | string;
    colorClass?: string;
  }) {
    return (
      <li className="w-full flex justify-center py-2">
        <Link
          to={to}
          className={cn(
            "flex flex-col items-center justify-center gap-1 text-[10px] sm:text-[11px] no-underline relative transition-colors",
            active ? (colorClass || "text-primary") + " font-bold" : "text-muted-foreground hover:text-foreground font-medium",
          )`
);

fs.writeFileSync(path, content, "utf8");
console.log("Done updating nav!");

