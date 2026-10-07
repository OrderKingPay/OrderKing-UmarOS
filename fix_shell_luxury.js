
const fs = require("fs");
const path = "orderking-customers/src/components/market/shell.tsx";
let content = fs.readFileSync(path, "utf8");

// Change the background of the shell to a premium dark gradient
content = content.replace(
  /<div className="min-h-screen bg-surface pb-24 text-fg transition-colors">/,
  `<div className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))] pb-24 text-white transition-colors">`
);

// Update header to glassmorphism
content = content.replace(
  /<header className="sticky top-0 z-40 bg-surface\/80 backdrop-blur-md border-b border-border shadow-sm">/,
  `<header className="sticky top-0 z-40 bg-slate-950/60 backdrop-blur-xl border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">`
);

// Update the bottom nav to a floating pill style with glassmorphism
content = content.replace(
  /<nav\s*aria-label=\{brand\.appName\}\s*className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-zinc-950 border-t border-border \n\s*shadow-\[0_-10px_40px_rgba\(0,0,0,0\.05\)\] overflow-hidden"\s*>/m,
  `<nav
              aria-label={brand.appName}
              className="fixed bottom-4 left-4 right-4 z-40 rounded-full bg-slate-900/80 backdrop-blur-2xl border border-white/20 
shadow-[0_8px_32px_rgba(0,0,0,0.6)] overflow-visible"
            >`
);

// Change text-primary to white or bright colors in Search bar
content = content.replace(
  /className="flex h-11 flex-1 min-w-0 items-center gap-2 rounded-full border border-border bg-surface \n\s*px-4 text-left text-muted hover:bg-surface-2 transition-colors shadow-sm"/m,
  `className="flex h-11 flex-1 min-w-0 items-center gap-2 rounded-full border border-white/10 bg-white/5 
px-4 text-left text-slate-300 hover:bg-white/10 transition-colors shadow-inner"`
);

// Update NavItem styling
content = content.replace(
  /active \? \(colorClass \|\| "text-primary"\) \+ " font-bold" : "text-muted-foreground hover:text-foreground font-medium",/,
  `active ? (colorClass || "text-emerald-400") + " font-black drop-shadow-md scale-105" : "text-slate-400 hover:text-white font-medium",`
);

// Ensure the outer div classes are cleanly handled
content = content.replace(
  /className="text-xs font-bold truncate text-fg"/,
  `className="text-xs font-bold truncate text-white drop-shadow-sm"`
);
content = content.replace(
  /className="text-\[10px\] uppercase tracking-wider text-muted font-bold"/,
  `className="text-[10px] uppercase tracking-wider text-amber-500 font-black"`
);

fs.writeFileSync(path, content, "utf8");
console.log("Done shell.tsx");

