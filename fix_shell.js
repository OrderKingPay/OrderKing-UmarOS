
const fs = require("fs");
const path = "orderking-customers/src/components/market/shell.tsx";
let content = fs.readFileSync(path, "utf8");

// 1. Remove Theme Toggle button
content = content.replace(
  /<button[^>]*onClick=\{toggleTheme\}[^>]*>[\s\S]*?<\/button>/,
  ""
);

// 2. Change the bottom nav from floating pill to docked luxury bar
content = content.replace(
  /className="fixed bottom-4 left-4 right-4 z-50 flex h-16 items-center justify-around bg-gradient-to-r from-slate-900\/95 via-indigo-950\/95 to-slate-900\/95 backdrop-blur-2xl border border-amber-500\/30 rounded-2xl shadow-\[0_8px_40px_rgba\(245,158,11,0\.15\)\]"/,
  `className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 backdrop-blur-3xl border-t border-indigo-500/30 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_40px_rgba(79,70,229,0.15)]"`
);

// 3. Make ALL navigation icons vibrant and glowing (not just text color, but active glows)
content = content.replace(/text-emerald-400 drop-shadow-\[0_0_8px_rgba\(52,211,153,0\.5\)\]/, "text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.8)] scale-110");
content = content.replace(/text-sky-400 drop-shadow-\[0_0_8px_rgba\(56,189,248,0\.5\)\]/, "text-sky-400 drop-shadow-[0_0_12px_rgba(56,189,248,0.8)] scale-110");
content = content.replace(/text-violet-400 drop-shadow-\[0_0_8px_rgba\(167,139,250,0\.5\)\]/, "text-violet-400 drop-shadow-[0_0_12px_rgba(167,139,250,0.8)] scale-110");
content = content.replace(/text-rose-400 drop-shadow-\[0_0_8px_rgba\(251,113,133,0\.5\)\]/, "text-rose-400 drop-shadow-[0_0_12px_rgba(251,113,133,0.8)] scale-110");

// 4. Force dark mode on mount
content = content.replace(/useThemeStore\.getState\(\)\.setTheme\("dark"\);/, `document.documentElement.classList.add("dark"); document.documentElement.style.backgroundColor = "#020617";`);

fs.writeFileSync(path, content, "utf8");
console.log("Fixed shell.tsx");

