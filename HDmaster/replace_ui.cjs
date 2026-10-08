const fs = require('fs');
const path = require('path');

const replacements = [
  { regex: /Supreme Female Studio Voice/g, replacement: "Premium Female Studio Voice" },
  { regex: /Supreme AI Video &amp; Image Creation Studio/g, replacement: "Advanced AI Video & Image Creation Studio" },
  { regex: /Supreme Founder Governance/g, replacement: "Platform Governance & Controls" },
  { regex: /Supreme Dispatch Coordinator/g, replacement: "Intelligent Dispatch Coordinator" },
  { regex: /Supreme AI Studio/g, replacement: "Enterprise AI Studio" },
  { regex: /Supreme Founder Execution &amp; Work Deck/g, replacement: "Command Center & Work Deck" },
  { regex: /SUPREME DUPLEX/g, replacement: "ENTERPRISE DUPLEX" },
  { regex: /Synthesizing supreme output/g, replacement: "Synthesizing optimized output" },
  { regex: /1000x Money &amp; Cash Harvester/g, replacement: "Revenue & Cashflow Optimizer" },
  { regex: /1-Click 1000x Affiliate Revenue Maximization Audit/g, replacement: "1-Click Affiliate Revenue Maximization Audit" },
  { regex: /1000x Strategic Nearest-Rider Proximity Engine/g, replacement: "Strategic Nearest-Rider Proximity Engine" },
  { regex: /1-Click 1000x Strategic Nearest-Rider &amp; Fleet Dispatch Engine/g, replacement: "1-Click Intelligent Nearest-Rider & Fleet Dispatch Engine" },
  { regex: /1000x Dynamic Off-Peak Demand Stimulator/g, replacement: "Dynamic Off-Peak Demand Stimulator" },
  { regex: /1-Click 1000x Dynamic Off-Peak Demand &amp; Revenue Multiplier/g, replacement: "1-Click Dynamic Off-Peak Demand & Revenue Multiplier" },
  { regex: /1000x Autonomous Multi-Repo Self-Healing Watchdog/g, replacement: "Autonomous Multi-Repo Self-Healing Watchdog" },
  { regex: />\s*1000x\s*</g, replacement: ">Maximized<" },
  { regex: />1000x More Structured, Organized/g, replacement: ">Highly Structured, Organized" },
  { regex: /1000X SUPERPOWER REVENUE & MONEY HARVESTER/g, replacement: "ENTERPRISE REVENUE & MONEY HARVESTER" }
];

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const dirs = [path.join(process.cwd(), 'src/components'), path.join(process.cwd(), 'src/app'), path.join(process.cwd(), 'src/locales')];
let files = [];
dirs.forEach(d => {
  if (fs.existsSync(d)) files = files.concat(walk(d));
});

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  for (const { regex, replacement } of replacements) {
    content = content.replace(regex, replacement);
  }
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated UI strings in: ${file}`);
  }
}
