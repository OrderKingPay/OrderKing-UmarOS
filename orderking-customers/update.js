const fs = require('fs');

// 1. Update shell.tsx
const shellPath = 'src/components/market/shell.tsx';
let shellCode = fs.readFileSync(shellPath, 'utf8');

// Replace header combining
shellCode = shellCode.replace(
  /<button[\s\S]*?onClick=\{\(\) => setLocOpen\(true\)\}[\s\S]*?<\/button>\s*\{path !== "\/search" && \([\s\S]*?<\/button>\s*\)\}/m,
  <div className="mt-3 flex items-center gap-2 w-full">
          <button
            type="button"
            onClick={() => setLocOpen(true)}
            className={\lex h-11 min-w-0 max-w-[40%] items-center justify-center rounded-full px-3 text-left shrink-0 border \\}
          >
            <div className="flex flex-col min-w-0 w-full">
              <span className="text-[9px] uppercase tracking-wide text-muted font-bold truncate">
                {isDeliveryActive ? t("home.deliveringTo") : "👑 King Pay"}
              </span>
              <span className="text-xs font-bold truncate text-fg">
                {isDeliveryActive ? location.label : location.cityName || location.label}
              </span>
            </div>
          </button>
          
          {path !== "/search" ? (
            <button
              type="button"
              onClick={() => (onSearch ? onSearch() : void navigate({ to: "/search" }))}
              className="flex h-11 flex-1 min-w-0 items-center gap-2 rounded-full border border-border bg-surface px-3 text-left text-muted hover:bg-surface-2 transition"
            >
              <Search className="size-4 shrink-0" aria-hidden />
              <span className="text-xs truncate">
                {isDeliveryActive ? t("home.searchPlaceholder") : "Search King Pay, Bills..."}
              </span>
            </button>
          ) : (
             <div className="flex-1" />
          )}
        </div>
);

// Replace bottom nav
shellCode = shellCode.replace(
  /<ul className="mx-auto grid grid-cols-5 items-center justify-items-center relative px-2">[\s\S]*?<\/ul>/m,
  <ul className="mx-auto grid grid-cols-4 items-center justify-items-center relative px-2">
          <NavItem to="/" icon={House} label="Home" active={path === "/"} />
          <NavItem to="/orders" icon={ClipboardList} label="Orders" active={path.startsWith("/orders")} />
          
          {/* 👑 Glowing KingPay Tab */}
          <li className="relative -top-2 flex w-full justify-center">
            <Link
              to="/king-pay"
              className={cn(
                "group relative flex h-12 w-12 flex-col items-center justify-center gap-0.5 rounded-full border-2 text-xs no-underline shadow-md transition-all active:scale-95",
                path.startsWith("/king-pay")
                  ? "border-amber-400 bg-gradient-to-br from-amber-400 to-yellow-600 text-white shadow-[0_0_15px_rgba(251,191,36,0.4)]"
                  : "border-transparent bg-gradient-to-br from-amber-100 to-amber-200 text-amber-900 shadow-[0_0_10px_rgba(251,191,36,0.2)] hover:border-amber-300"
              )}
            >
              <span className="text-lg leading-none">👑</span>
              <span className="text-[8px] font-black tracking-tight leading-none">KingPay</span>
              {!path.startsWith("/king-pay") && (
                <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white shadow-sm">
                  1
                </span>
              )}
            </Link>
          </li>
          <NavItem to="/account" icon={UserRound} label="Profile" active={path.startsWith("/account")} />
        </ul>
);
fs.writeFileSync(shellPath, shellCode);

// 2. Update __root.tsx
const rootPath = 'src/routes/__root.tsx';
let rootCode = fs.readFileSync(rootPath, 'utf8');
rootCode = rootCode.replace(/\{\s*rel:\s*"preconnect",\s*href:\s*"https:\/\/vitals\.vercel-insights\.com"\s*\},\n/m, '');
fs.writeFileSync(rootPath, rootCode);

// 3. Update server.ts
const serverPath = 'src/lib/auth/server.ts';
let serverCode = fs.readFileSync(serverPath, 'utf8');
serverCode = serverCode.replace(/https:\/\/orderking-customers\.vercel\.app/g, 'https://orderkingpay.com');
serverCode = serverCode.replace(/"orderking-customers\.vercel\.app"/g, '"orderkingpay.com"');
fs.writeFileSync(serverPath, serverCode);

// 4. Update kingpay-shell.tsx
const kpShellPath = 'src/components/fintech/kingpay-shell.tsx';
let kpShellCode = fs.readFileSync(kpShellPath, 'utf8');
kpShellCode = kpShellCode.replace(
  /<nav\s*aria-label="KingPay Navigation"[\s\S]*?<\/nav>/m,
  \<nav
        aria-label="Back to Order King"
        className="fixed inset-x-0 bottom-6 z-40 flex justify-center px-4"
      >
        <Link
          to="/"
          className="group flex w-full max-w-sm items-center justify-center gap-2 rounded-full border-2 border-amber-400/50 bg-surface/90 px-6 py-3.5 text-sm font-bold text-amber-500 shadow-[0_8px_32px_rgba(245,158,11,0.15)] backdrop-blur-md transition-all hover:scale-105 hover:border-amber-400 hover:bg-surface active:scale-95 no-underline"
        >
          <span className="text-lg">←</span>
          <span>Back to Order King</span>
        </Link>
      </nav>\
);
fs.writeFileSync(kpShellPath, kpShellCode);

console.log('All files updated');
