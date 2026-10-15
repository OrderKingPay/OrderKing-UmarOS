
const fs = require("fs");
const path = "orderking-customers/src/routes/orders/$id.tsx";
let content = fs.readFileSync(path, "utf8");

const supportBtn = `
      {/* ZOMATO STYLE ORDER SUPPORT */}
      <div className="mt-8 border-t border-white/10 pt-6">
        <h3 className="text-lg font-bold text-white mb-4">Need help with your order?</h3>
        <div className="grid grid-cols-2 gap-3">
          <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition active:scale-95">
            <span className="text-2xl">🛍️</span>
            <span className="text-xs font-semibold text-slate-300">Items missing</span>
          </button>
          <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition active:scale-95">
            <span className="text-2xl">🍲</span>
            <span className="text-xs font-semibold text-slate-300">Food was bad</span>
          </button>
          <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition active:scale-95">
            <span className="text-2xl">🕒</span>
            <span className="text-xs font-semibold text-slate-300">Order is late</span>
          </button>
          <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 hover:bg-indigo-500/30 transition active:scale-95">
            <span className="text-2xl">✨</span>
            <span className="text-xs font-semibold text-indigo-300">Chat with Support</span>
          </button>
        </div>
      </div>
`;

// Insert it before the final closing div/CustomerShell of the order page.
// The file might be long, let us look for the "Bill Details" section and insert it after.
// Or just find `<div className="mt-6 flex flex-col gap-2">` which is likely the bottom buttons.

content = content.replace(/({\/\* FOOTER ACTIONS \*\/})/, `$1\n${supportBtn}\n`);

fs.writeFileSync(path, content, "utf8");
console.log("Injected Zomato style order support");

