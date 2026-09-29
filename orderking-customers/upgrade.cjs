const fs = require('fs');
const path = 'c:/Users/hasan/OrderKing/orderking-customers/src/components/market/home-feed.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add glassmorphism to top containers
content = content.replace(
  'className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-[var(--radius-xl)] border-2 border-emerald-500/30 bg-emerald-500/5 p-4 shadow-sm"',
  'className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-[var(--radius-3xl)] border border-white/20 dark:border-white/10 bg-white/40 dark:bg-black/40 backdrop-blur-3xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.08)]"'
);

// Add glass to live order banner
content = content.replace(
  'className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-[var(--radius-xl)] border-2 border-primary/30 bg-primary/5 p-4 shadow-sm"',
  'className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-[var(--radius-3xl)] border border-white/20 dark:border-white/10 bg-white/40 dark:bg-black/40 backdrop-blur-3xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.08)]"'
);

// Add glass to past order cards
content = content.replace(
  'className="flex w-64 shrink-0 flex-col justify-between rounded-[var(--radius-xl)] border border-border bg-surface p-3.5 shadow-sm transition hover:shadow"',
  'className="flex w-64 shrink-0 flex-col justify-between rounded-[var(--radius-2xl)] border border-white/20 dark:border-white/10 bg-white/40 dark:bg-black/40 backdrop-blur-2xl p-4 shadow-lg transition hover:shadow-xl"'
);

// Add glass to categories
content = content.replace(
  'className="aspect-square overflow-hidden rounded-[var(--radius-lg)] bg-surface-2"',
  'className="aspect-square overflow-hidden rounded-[var(--radius-2xl)] bg-white/20 dark:bg-black/20 backdrop-blur-xl border border-white/20 shadow-inner p-1"'
);

// Upgrade skeleton 1 (categories)
content = content.replace(
  /<Skeleton key=\{i\} className="h-24 w-24 shrink-0" \/>/g,
  '<div key={i} className="h-24 w-24 shrink-0 rounded-[var(--radius-2xl)] bg-white/20 dark:bg-black/20 backdrop-blur-xl border border-white/10 animate-pulse shadow-sm" />'
);

// Upgrade skeleton 2 (restaurants)
content = content.replace(
  /<Skeleton className="h-52 w-full rounded-\[var\(--radius-xl\)\] bg-surface-2" \/>/g,
  '<div className="h-64 w-full rounded-[var(--radius-3xl)] bg-white/30 dark:bg-black/30 backdrop-blur-2xl border border-white/20 shadow-[0_8px_30px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col"><div className="h-40 w-full bg-black/10 dark:bg-white/10 animate-pulse" /><div className="p-4 space-y-3"><div className="h-5 w-2/3 bg-black/10 dark:bg-white/10 rounded-full animate-pulse" /><div className="h-4 w-1/3 bg-black/10 dark:bg-white/10 rounded-full animate-pulse" /></div></div>'
);

// Add glass to referral
content = content.replace(
  'className="rounded-[var(--radius-xl)] border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 shadow-xs"',
  'className="rounded-[var(--radius-3xl)] border border-white/20 dark:border-white/10 bg-gradient-to-r from-primary/20 via-white/40 to-white/10 dark:via-black/40 dark:to-black/10 backdrop-blur-3xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.08)]"'
);

// Fix overall container background if any (it has none, let's keep it clean)

fs.writeFileSync(path, content, 'utf8');
console.log("Upgraded HomeFeed to Apple-level aesthetics with Glassmorphism and modern Skeletons.");
