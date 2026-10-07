const fs = require('fs');

let homeFeed = 'orderking-customers/src/components/market/home-feed.tsx';
if (fs.existsSync(homeFeed)) {
  let h = fs.readFileSync(homeFeed, 'utf8');
  h = h.replace(/\{?\/\*?.*?PreferredKitchensAdRow.*?(\*\/)?\}?/g, '');
  fs.writeFileSync(homeFeed, h);
}

let loanHub = 'orderking-customers/src/components/fintech/micro-loan-hub.tsx';
if (fs.existsSync(loanHub)) {
  let l = fs.readFileSync(loanHub, 'utf8');
  l = l.replace(/setError\("Application rejected" \|\|/g, 'setError("Application rejected"');
  fs.writeFileSync(loanHub, l);
}

