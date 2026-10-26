import fs from 'node:fs';

const filePath = 'c:/Users/hasan/OrderKing/orderking-customers/src/components/market/shell.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Line 61
content = content.replace(
  '["/kingpay", "/king-pay", "/travel", "/tutor", "/news", "/earn"]',
  '["/kingpay", "/king-pay", "/news", "/earn"]'
);

// Top nav
const oldTopNavRegex = /\{\/\* Row 1 Center: Sovereign Top Navigation[\s\S]*?<\/nav>/;
const newTopNav = `{/* Row 1 Center: Core Navigation (Food, KingPay, Orders) */}
          <nav aria-label="OrderKing Core Navigation" className="flex items-center gap-1 sm:gap-2">
            <Link
              to="/"
              className={cn(
                "inline-flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3 sm:py-1 rounded-full border text-[11px] sm:text-xs font-bold transition shadow-2xs no-underline",
                path === "/" || path.startsWith("/r/") || path.startsWith("/delivery")
                  ? isDark
                    ? "border-amber-400 bg-amber-500/20 text-amber-200 font-black ring-1 ring-amber-400/40"
                    : "border-amber-500 bg-amber-50 text-amber-950 font-black shadow-xs ring-1 ring-amber-400"
                  : isDark
                    ? "border-white/15 bg-white/5 hover:bg-white/10 text-slate-200 hover:border-white/30"
                    : "border-amber-300/80 bg-white/90 hover:bg-amber-50/80 text-gray-800 hover:border-amber-400"
              )}
            >
              <UtensilsCrossed className={cn("size-3.5", isDark ? "text-amber-400" : "text-amber-600")} />
              <span>Food Delivery</span>
            </Link>
            <Link
              to="/kingpay"
              className={cn(
                "inline-flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3 sm:py-1 rounded-full border text-[11px] sm:text-xs font-bold transition shadow-2xs no-underline",
                path.startsWith("/kingpay") || path.startsWith("/king-pay")
                  ? isDark
                    ? "border-yellow-400 bg-yellow-500/20 text-yellow-200 font-black ring-1 ring-yellow-400/40"
                    : "border-amber-500 bg-amber-50 text-amber-950 font-black shadow-xs ring-1 ring-amber-400"
                  : isDark
                    ? "border-white/15 bg-white/5 hover:bg-white/10 text-slate-200 hover:border-white/30"
                    : "border-amber-300/80 bg-white/90 hover:bg-amber-50/80 text-gray-800 hover:border-amber-400"
              )}
            >
              <Crown className={cn("size-3.5", isDark ? "text-yellow-400" : "text-amber-600")} />
              <span>KingPay UPI</span>
            </Link>
            <Link
              to="/orders"
              className={cn(
                "inline-flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3 sm:py-1 rounded-full border text-[11px] sm:text-xs font-bold transition shadow-2xs no-underline",
                path.startsWith("/orders")
                  ? isDark
                    ? "border-rose-400 bg-rose-500/20 text-rose-200 font-black ring-1 ring-rose-400/40"
                    : "border-amber-500 bg-amber-50 text-amber-950 font-black shadow-xs ring-1 ring-amber-400"
                  : isDark
                    ? "border-white/15 bg-white/5 hover:bg-white/10 text-slate-200 hover:border-white/30"
                    : "border-amber-300/80 bg-white/90 hover:bg-amber-50/80 text-gray-800 hover:border-amber-400"
              )}
            >
              <ShoppingBag className={cn("size-3.5", isDark ? "text-rose-400" : "text-amber-600")} />
              <span>Orders</span>
            </Link>
          </nav>`;

content = content.replace(oldTopNavRegex, newTopNav);

// User menu link to /travel
content = content.replace(/<Link\s+to="\/travel"[\s\S]*?<span>Travel &amp; Bookings<\/span>\s*<\/Link>\s*/, '');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated customer shell.tsx');
