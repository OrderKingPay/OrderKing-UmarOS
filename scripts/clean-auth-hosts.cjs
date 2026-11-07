const fs = require('fs');

// 1. preview.ts
const pPath = 'orderking-partners/src/lib/auth/preview.ts';
let pContent = fs.readFileSync(pPath, 'utf8');
pContent = pContent.replace(
  '["*.grok-sandbox.com"]',
  '["*.orderkingpay.com", "*.pages.dev", "localhost"]'
);
fs.writeFileSync(pPath, pContent, 'utf8');

// 2. client.ts
const cPath = 'orderking-partners/src/lib/auth/client.ts';
let cContent = fs.readFileSync(cPath, 'utf8');
cContent = cContent.replace(
  'window.location.hostname.endsWith(".grok-sandbox.com")',
  '(window.self !== window.top || window.location.hostname.endsWith(".pages.dev") || window.location.hostname.endsWith(".orderkingpay.com"))'
);
fs.writeFileSync(cPath, cContent, 'utf8');

console.log('clean-auth-hosts: updated preview.ts and client.ts successfully');
