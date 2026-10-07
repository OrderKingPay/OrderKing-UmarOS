
const fs = require("fs");
const path = "orderking-customers/src/routes/r/$slug.tsx";
let content = fs.readFileSync(path, "utf8");

// First, find if there is an existing floating bar for cart
// It looks like CustomerShell already handles the cart floating bar.
// I will append a fixed bottom bar above the shell navigation.

const floatingBar = `
      {/* LUXURY FLOATING BAR: Veg Toggle | Share | AI Support */}
      <div className="fixed bottom-20 left-4 right-4 z-40 flex items-center justify-between rounded-full bg-slate-900/80 backdrop-blur-xl border border-white/10 px-4 py-2 shadow-2xl">
        {/* Veg Toggle */}
        <label className="flex items-center gap-2 cursor-pointer">
          <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
            <input type="checkbox" className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer" />
            <label className="toggle-label block overflow-hidden h-5 rounded-full bg-gray-600 cursor-pointer"></label>
          </div>
          <span className="text-xs font-bold text-green-400">Veg Only</span>
        </label>
        
        {/* Small Share Button */}
        <button 
          onClick={() => {
            navigator.clipboard?.writeText(window.location.href);
            toast.success("Restaurant link copied to share!");
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white text-[10px] font-bold active:scale-95"
        >
          <span>🔗</span> Share
        </button>

        {/* AI Support Button */}
        <button 
          onClick={() => window.location.href = "/tutor"}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold active:scale-95"
        >
          <span>✨</span> AI Support
        </button>
      </div>
`;

// Insert it right before the closing tag of CustomerShell
content = content.replace(/(\s*)(<\/CustomerShell>)/, `\n$1${floatingBar}$1$2`);

fs.writeFileSync(path, content, "utf8");
console.log("Injected floating bar into restaurant page");

