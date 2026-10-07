const fs = require('fs');
let c = fs.readFileSync('orderking-partners/src/routes/dashboard.tsx', 'utf8');
c = c.replace(/Kitchen Operation Mode/g, "Business Operation Mode");
c = c.replace(/Kitchen is live/g, "Business is live");
c = c.replace(/your kitchen as offline/g, "your business as offline");
c = c.replace(/Resume Kitchen/g, "Resume Operations");
c = c.replace(/Fast-Track Kitchen/g, "Fast-Track Service");
c = c.replace(/Zomato-style Kitchen Rush & Throttle Controls/g, "Enterprise High-Volume Throttle Controls");
fs.writeFileSync('orderking-partners/src/routes/dashboard.tsx', c, 'utf8');
