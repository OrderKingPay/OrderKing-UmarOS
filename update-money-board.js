const fs = require('fs');
const path = 'C:/Users/hasan/OrderKing/orderking-customers/src/components/ai/money-engine-dashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

const sweepFunction = `
  const [sweeping, setSweeping] = useState(false);
  const handleSweepToBank = async () => {
    setSweeping(true);
    toast.info("Initiating secure transfer to Founder bank account...");
    try {
      const res = await fetch("https://orderking-hdmaster-prod.netlify.app/api/v1/founder/sweep", { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message, { duration: 8000 });
      } else {
        toast.error(data.message || data.error);
      }
    } catch (err) {
      toast.error("Sweep failed. Network error.");
    } finally {
      setSweeping(false);
    }
  };
`;

// Insert the sweep function inside the component
content = content.replace(/export function MoneyEngineDashboard\(\) \{/, `export function MoneyEngineDashboard() {` + sweepFunction);

// Add the sweep button to the UI where appropriate
const sweepButton = `
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="text-xs bg-emerald-950/30 text-emerald-400 border-emerald-900/50 hover:bg-emerald-900/50">
                <DollarSign className="size-3 mr-1" /> View Global Ledger
              </Button>
              <Button size="sm" onClick={handleSweepToBank} disabled={sweeping} className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                {sweeping ? <Zap className="size-3 mr-1 animate-pulse" /> : <Banknote className="size-3 mr-1" />} 
                {sweeping ? "Transferring..." : "Sweep to Bank Account"}
              </Button>
            </div>
`;

content = content.replace(/<Button size="sm" variant="outline" className="text-xs[^>]*>[^<]*<DollarSign[^>]*>[^<]*<\/Button>/, sweepButton);

fs.writeFileSync(path, content);
console.log("Updated money-engine-dashboard.tsx to include sweep functionality");
