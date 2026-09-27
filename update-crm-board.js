const fs = require('fs');
const path = 'C:/Users/hasan/OrderKing/orderking-customers/src/components/ai/founder-crm-hub.tsx';
let content = fs.readFileSync(path, 'utf8');

// We will add the PR Awards section as a new tab or just a block inside the CRM.
// Let's first make sure it imports useEffect.
content = content.replace(/import { useState } from "react";/, `import { useState, useEffect } from "react";`);

const awardsCode = `
  const [awards, setAwards] = useState<any[]>([]);
  const [fetchingAwards, setFetchingAwards] = useState(false);

  useEffect(() => {
    async function fetchAwards() {
      setFetchingAwards(true);
      try {
        const res = await fetch("https://orderking-hdmaster-prod.netlify.app/api/v1/founder/pr-nominations");
        const data = await res.json();
        if (data.success) setAwards(data.awards);
      } catch (e) {
        console.error(e);
      } finally {
        setFetchingAwards(false);
      }
    }
    fetchAwards();
  }, []);

  const AwardsPanel = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-fg uppercase tracking-widest">Global Prestige & Awards Engine</h3>
        <Badge variant="outline" className="border-amber-500/50 text-amber-500 bg-amber-500/10">B1/B2 Compliant</Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {awards.map(award => (
          <div key={award.id} className="rounded-xl border border-border bg-surface p-4 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-sm text-fg">{award.title}</h4>
                <Badge variant="secondary" className="text-[10px]">{award.organization}</Badge>
              </div>
              <p className="text-xs text-muted mb-4">{award.pitch}</p>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-border">
              <span className="text-[10px] font-bold text-emerald-500">{award.deadline}</span>
              <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => window.open(award.url, "_blank")}>
                Apply / Nominate
              </Button>
            </div>
          </div>
        ))}
        {fetchingAwards && <div className="text-xs text-muted animate-pulse p-4">Scanning global prestige networks...</div>}
      </div>
    </div>
  );
`;

content = content.replace(/export function FounderCrmHub\(\) \{/, `export function FounderCrmHub() {\n` + awardsCode);

// Inject AwardsPanel into the layout. We will just append it before the final closing div.
content = content.replace(/(<\/div>\s*<\/div>\s*)$/, `
          {/* Injected Prestige Engine */}
          <div className="mt-8 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent p-6">
            <AwardsPanel />
          </div>
$1`);

fs.writeFileSync(path, content);
console.log("Updated founder-crm-hub.tsx with Prestige Engine");
