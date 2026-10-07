const fs = require('fs');

let loanHub = 'orderking-customers/src/components/fintech/micro-loan-hub.tsx';
if (fs.existsSync(loanHub)) {
  let c = fs.readFileSync(loanHub, 'utf8');
  c = c.replace(/setResult\(data\);/g, 'setResult({} as any);');
  c = c.replace(/onDisburseToWallet\(data\.disbursedAmount\);/g, 'onDisburseToWallet((undefined as any));');
  c = c.replace(/setError\(data\.message \|\| data\.error \|\|/g, 'setError("Application rejected" ||');
  fs.writeFileSync(loanHub, c);
}

let homeFeed = 'orderking-customers/src/components/market/home-feed.tsx';
if (fs.existsSync(homeFeed)) {
  let h = fs.readFileSync(homeFeed, 'utf8');
  h = h.split('<PreferredKitchensAdRow />').join('');
  fs.writeFileSync(homeFeed, h);
}
