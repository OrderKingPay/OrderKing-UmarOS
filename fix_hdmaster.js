
const fs = require("fs");
const path = "HDmaster/src/routes/index.tsx";
let content = fs.readFileSync(path, "utf8");

content = content.replace(/bg-slate-50 text-slate-900/g, "bg-gradient-to-br from-slate-950 via-gray-900 to-black text-slate-100");
content = content.replace(/bg-white/g, "bg-slate-900/50 backdrop-blur-md border-white/5");
content = content.replace(/border-slate-200/g, "border-white/10");
content = content.replace(/text-slate-900/g, "text-white");
content = content.replace(/text-slate-500/g, "text-slate-400");
content = content.replace(/bg-emerald-50/g, "bg-emerald-900/30");
content = content.replace(/hover:bg-emerald-100/g, "hover:bg-emerald-800/40");
content = content.replace(/border-slate-100/g, "border-white/5");
content = content.replace(/text-slate-600/g, "text-slate-300");

// Fix MetricCards
content = content.replace(/bg-blue-50/g, "bg-blue-900/20");
content = content.replace(/bg-amber-50/g, "bg-amber-900/20");
content = content.replace(/bg-purple-50/g, "bg-purple-900/20");
content = content.replace(/text-blue-600/g, "text-blue-400");
content = content.replace(/text-emerald-600/g, "text-emerald-400");
content = content.replace(/text-amber-600/g, "text-amber-400");
content = content.replace(/text-purple-600/g, "text-purple-400");

// Fix Modules
content = content.replace(/bg-slate-50/g, "bg-slate-800/30");

fs.writeFileSync(path, content, "utf8");
console.log("HDMaster dashboard made ultra-luxury dark mode");

