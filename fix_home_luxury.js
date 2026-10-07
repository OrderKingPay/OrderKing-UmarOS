
const fs = require("fs");
const path = "orderking-customers/src/components/market/home-feed.tsx";
let content = fs.readFileSync(path, "utf8");

// Update filter chips to be luxurious
content = content.replace(
  /activeFilter === "veg"\s*\?\s*"bg-emerald-600 text-white border-emerald-600"\s*:\s*"bg-surface text-fg border-border hover:bg-surface-2"/,
  `activeFilter === "veg" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]" : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"`
);

// Update section headers
content = content.replace(
  /className="mb-3 font-display text-xl"/,
  `className="mb-4 font-display text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-500 drop-shadow-lg"`
);

// Update kitchen card layout to be glassmorphic inside home-feed? Wait, kitchen cards are in `kitchen-card.tsx`!
fs.writeFileSync(path, content, "utf8");
console.log("Done home-feed.tsx");

