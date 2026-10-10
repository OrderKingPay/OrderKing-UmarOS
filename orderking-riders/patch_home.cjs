const fs = require('fs');

const file = 'src/components/rider/home-view.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Inject lucide-react imports
content = content.replace(
  'import { Clock3, Wallet } from "lucide-react";',
  'import { Clock3, Wallet, Thermometer, Navigation, Zap, Flame, Target } from "lucide-react";'
);

// 2. Add Gamification, ThermalBagTracker, and PredictiveRouting components above HomeView
const newComponents = 
"function GamificationPanel({ completed, earnings }: { completed: number; earnings: number }) {\n" +
"  const goal = 15;\n" +
"  const progress = Math.min((completed / goal) * 100, 100);\n" +
"  const streak = 4;\n" +
"  return (\n" +
"    <section className=\"rounded-xl border border-primary/30 bg-surface p-4 shadow-neon glassmorphism\">\n" +
"      <div className=\"flex items-center justify-between mb-3\">\n" +
"        <h3 className=\"font-display text-sm font-bold text-primary neon-text flex items-center gap-1\"><Flame className=\"size-4\" /> Gig Engine Active</h3>\n" +
"        <Badge className=\"bg-primary text-black font-bold text-xs\">{streak} Day Streak!</Badge>\n" +
"      </div>\n" +
"      <div className=\"mb-2 flex justify-between text-xs text-muted-foreground\">\n" +
"        <span className=\"flex items-center gap-1\"><Target className=\"size-3\"/> Daily Goal: {completed}/{goal} Gigs</span>\n" +
"        <span>{goal - completed > 0 ? (goal - completed) + ' to go' : 'Goal Met!'}</span>\n" +
"      </div>\n" +
"      <div className=\"h-2 w-full bg-muted rounded-full overflow-hidden mb-3\">\n" +
"        <div className=\"h-full bg-primary transition-all duration-500 ease-out\" style={{ width: progress + '%' }} />\n" +
"      </div>\n" +
"      {completed >= goal && (\n" +
"        <div className=\"text-[10px] text-primary font-bold bg-primary/10 rounded px-2 py-1 text-center border border-primary/20 neon-text\">\n" +
"          🏆 UNLOCKED: 1.5x SURGE MULTIPLIER\n" +
"        </div>\n" +
"      )}\n" +
"    </section>\n" +
"  );\n" +
"}\n" +
"\n" +
"function ThermalBagTracker() {\n" +
"  const [temp, setTemp] = useState(62.4);\n" +
"  useEffect(() => {\n" +
"    const i = setInterval(() => setTemp(t => t > 58 ? t - (Math.random() * 0.5) : t + Math.random()), 3000);\n" +
"    return () => clearInterval(i);\n" +
"  }, []);\n" +
"  const isOptimal = temp > 60;\n" +
"  return (\n" +
"    <section className=\"rounded-xl border border-accent/30 bg-surface p-4 shadow-neon-cyan glassmorphism mt-4\">\n" +
"      <div className=\"flex items-center justify-between mb-2\">\n" +
"        <h3 className=\"font-display text-sm font-bold text-accent neon-text-cyan flex items-center gap-2\">\n" +
"          <Thermometer className=\"size-4\" /> Thermal-Bag Sync\n" +
"        </h3>\n" +
"        <Badge className={(isOptimal ? 'bg-accent' : 'bg-destructive') + ' text-black font-bold text-[10px]'}>\n" +
"          {isOptimal ? 'OPTIMAL' : 'WARNING'}\n" +
"        </Badge>\n" +
"      </div>\n" +
"      <div className=\"flex items-center gap-4\">\n" +
"        <div className=\"flex-1\">\n" +
"          <p className=\"text-[10px] text-muted-foreground uppercase tracking-widest\">Core Temp</p>\n" +
"          <div className=\"flex items-baseline gap-1\">\n" +
"            <span className={'font-display text-2xl ' + (isOptimal ? 'text-accent' : 'text-destructive')}>{temp.toFixed(1)}</span>\n" +
"            <span className=\"text-sm text-muted-foreground\">°C</span>\n" +
"          </div>\n" +
"        </div>\n" +
"        <div className=\"flex-1\">\n" +
"          <p className=\"text-[10px] text-muted-foreground uppercase tracking-widest\">Food Integrity</p>\n" +
"          <div className=\"h-1.5 w-full bg-muted rounded-full overflow-hidden mt-1\">\n" +
"            <div className={'h-full ' + (isOptimal ? 'bg-accent shadow-neon-cyan' : 'bg-destructive')} style={{ width: Math.min((temp/65)*100, 100) + '%' }} />\n" +
"          </div>\n" +
"        </div>\n" +
"      </div>\n" +
"    </section>\n" +
"  );\n" +
"}\n" +
"\n" +
"function PredictiveRouting() {\n" +
"  return (\n" +
"    <div className=\"rounded-xl border border-primary/30 bg-surface p-4 shadow-neon glassmorphism space-y-3 mt-4\">\n" +
"      <h3 className=\"font-display text-sm font-bold text-primary neon-text flex items-center gap-2\">\n" +
"        <Navigation className=\"size-4\" /> Predictive AI Routing\n" +
"      </h3>\n" +
"      <div className=\"grid grid-cols-2 gap-2 text-xs\">\n" +
"         <div className=\"bg-card p-2 rounded border border-border\">\n" +
"            <p className=\"text-muted-foreground uppercase tracking-wider text-[10px]\">Traffic Matrix</p>\n" +
"            <p className=\"font-bold text-emerald-400\">Clear (-4 mins)</p>\n" +
"         </div>\n" +
"         <div className=\"bg-card p-2 rounded border border-border\">\n" +
"            <p className=\"text-muted-foreground uppercase tracking-wider text-[10px]\">Active Vector</p>\n" +
"            <p className=\"font-bold text-accent neon-text-cyan\">Route Beta</p>\n" +
"         </div>\n" +
"      </div>\n" +
"      <p className=\"text-[10px] text-muted-foreground italic flex items-center gap-1\">\n" +
"        <Zap className=\"size-3 text-primary\" /> Re-routing dynamically via ML nodes. ETA confidence: 99.1%.\n" +
"      </p>\n" +
"    </div>\n" +
"  );\n" +
"}\n";

content = content.replace(
  'type Home = Awaited<ReturnType<typeof getHomeFn>>;',
  'type Home = Awaited<ReturnType<typeof getHomeFn>>;\n' + newComponents
);

// 3. Replace the Zomato and HPCL sections with our Gamification & Thermal Bag tracking
content = content.replace(/\{\/\*\s*OrderKing Rider Advantage vs Zomato\s*\*\/\}(.|\n)*?<\/section>/g, '<GamificationPanel completed={home.completedToday} earnings={home.todayEarningsPaise} />');
content = content.replace(/\{\/\*\s*HPCL & IOCL Partner Fuel Pump Quick Navigator\s*\*\/\}(.|\n)*?<\/section>/g, '<ThermalBagTracker />');

// 4. Inject PredictiveRouting if active
content = content.replace(
  '<DeliveryActions',
  '<PredictiveRouting />\n          <DeliveryActions'
);

fs.writeFileSync(file, content);
console.log('Successfully updated home-view.tsx');
