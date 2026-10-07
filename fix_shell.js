
const fs = require("fs");
const path = "orderking-customers/src/components/market/shell.tsx";
let content = fs.readFileSync(path, "utf8");

content = content.replace(
  /\{\/\* 👑 DYNAMIC 3D KINGPAY & ZERO-FEE PROMOTION PILL \*\/\}[\s\S]*?<\/Link>/,
  `{/* 👑 DYNAMIC TRAVEL & KINGPAY PILL */}
            <Link
              to="/king-pay"
              className="group flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 text-white shadow-lg shadow-orange-500/30 transition-all active:scale-95 hover:scale-105 no-underline ml-auto border border-white/20"
            >
              <span className="text-sm drop-shadow-md">👑</span>
              <span className="text-sm drop-shadow-md">✈️</span>
              <span className="text-sm drop-shadow-md">🏨</span>
              <span className="text-sm drop-shadow-md">🚆</span>
            </Link>`
);

content = content.replace(
  /<div className="fixed bottom-4 left-4 right-4 z-40 flex justify-center pointer-events-none">[\s\S]*?<\/div>/,
  `<div className="fixed bottom-6 left-4 right-4 z-50 flex justify-center pointer-events-none">
          <Link
            to="/"
            className="pointer-events-auto flex items-center justify-center gap-3 w-full max-w-sm rounded-full bg-gradient-to-r from-orange-500 via-red-500 to-rose-600 px-6 py-4 text-lg font-black text-white shadow-[0_10px_40px_rgba(249,115,22,0.5)] active:scale-95 transition-all no-underline border-2 border-white/20 hover:brightness-110"
            style={{ animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" }}
          >
            <span className="text-2xl drop-shadow-lg">🍔</span>
            <span className="drop-shadow-md uppercase tracking-wide text-center leading-tight">Craving Food?<br/><span className="text-[11px] opacity-90">Tap to Order Now!</span></span>
            <span className="text-2xl drop-shadow-lg">🍕</span>
          </Link>
        </div>`
);

fs.writeFileSync(path, content, "utf8");
console.log("Done");

