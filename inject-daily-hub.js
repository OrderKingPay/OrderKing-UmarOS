const fs = require('fs');
const file = 'orderking-customers/src/components/market/home-feed.tsx';
let content = fs.readFileSync(file, 'utf8');

// Insert DailyHub component at the top after imports
const dailyHubComponent = `

function DailyHub() {
  return (
    <div className="mb-4 mt-2">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-display text-lg font-bold text-fg">Daily Hub</h2>
        <span className="text-[10px] uppercase tracking-wider font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Suggested</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
        
        <a href="/tutor" className="snap-start shrink-0 w-32 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl p-3 shadow-md flex flex-col gap-2 no-underline hover:scale-105 transition-transform">
          <div className="h-8 w-8 bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-sm">🎓</div>
          <div>
            <div className="text-white font-bold text-sm leading-tight">AI Tutor</div>
            <div className="text-white/80 text-[10px] leading-tight mt-0.5">Learn & Earn</div>
          </div>
        </a>
        
        <a href="/king-pay" className="snap-start shrink-0 w-32 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-3 shadow-md flex flex-col gap-2 no-underline hover:scale-105 transition-transform">
          <div className="h-8 w-8 bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-sm">💸</div>
          <div>
            <div className="text-white font-bold text-sm leading-tight">Bills & Tickets</div>
            <div className="text-white/80 text-[10px] leading-tight mt-0.5">King Pay 0% Fee</div>
          </div>
        </a>
        
        <a href="/tutor" className="snap-start shrink-0 w-32 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-3 shadow-md flex flex-col gap-2 no-underline hover:scale-105 transition-transform">
          <div className="h-8 w-8 bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-sm">💼</div>
          <div>
            <div className="text-white font-bold text-sm leading-tight">Gig Jobs</div>
            <div className="text-white/80 text-[10px] leading-tight mt-0.5">Work from Home</div>
          </div>
        </a>

      </div>
    </div>
  );
}
`;

if (!content.includes('function DailyHub(')) {
  content = content.replace('export function HomeFeed(', dailyHubComponent + '\nexport function HomeFeed(');
}

// Inject DailyHub into the render tree, just below the 2G network banner.
const target = `{/* 2G / Low-Network Offline-First Resilience Banner */}`;
const injection = `        {/* Daily Hub: Mind-Reading & Geographical Demands */}
        {!q && !veg && !openNow && !category && <DailyHub />}
        `;

if (content.includes(target) && !content.includes('<DailyHub />')) {
  content = content.replace(target, injection + '\n        ' + target);
}

fs.writeFileSync(file, content);
console.log('Daily Hub successfully injected.');
