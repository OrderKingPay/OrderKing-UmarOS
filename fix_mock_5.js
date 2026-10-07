const fs = require('fs');
let loanHub = 'orderking-customers/src/components/fintech/micro-loan-hub.tsx';
if (fs.existsSync(loanHub)) {
  let l = fs.readFileSync(loanHub, 'utf8');
  l = l.replace(/setError\("Application rejected" "Application rejected"\);/g, 'setError("Application rejected");');
  fs.writeFileSync(loanHub, l);
}
