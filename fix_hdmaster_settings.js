
const fs = require("fs");
const path = "HDmaster/src/routes/settings.tsx";
let content = fs.readFileSync(path, "utf8");

content = content.replace(/bg-slate-50 text-slate-900/g, "bg-gradient-to-br from-slate-950 via-gray-900 to-black text-slate-100");
content = content.replace(/bg-white/g, "bg-slate-900/50 backdrop-blur-md border-white/5");
content = content.replace(/border-slate-200/g, "border-white/10");
content = content.replace(/text-slate-900/g, "text-white");
content = content.replace(/text-slate-500/g, "text-slate-400");
content = content.replace(/text-slate-700/g, "text-slate-300");
content = content.replace(/text-slate-600/g, "text-slate-300");
content = content.replace(/text-slate-400/g, "text-slate-500");
content = content.replace(/bg-emerald-500\/10/g, "bg-emerald-900/30");
content = content.replace(/text-emerald-700/g, "text-emerald-400");

// Fix Sidebar
content = content.replace(/bg-slate-100/g, "bg-white/10 text-white");
content = content.replace(/hover:bg-slate-100/g, "hover:bg-white/5 text-slate-400 hover:text-slate-200");

fs.writeFileSync(path, content, "utf8");
console.log("HDMaster settings made ultra-luxury dark mode");

