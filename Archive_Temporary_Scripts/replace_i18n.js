const fs = require('fs');
let c = fs.readFileSync('orderking-partners/src/lib/i18n/en.ts', 'utf8');

c = c.replace(/Your kitchen/g, "Your business");
c = c.replace(/Not a live kitchen/g, "Not a live restaurant");
c = c.replace(/New kitchen\?/g, "New partner?");
c = c.replace(/Run the kitchen/g, "Run your restaurant");
c = c.replace(/Built for small kitchens in Karimganj and beyond/g, "Built for leading restaurants and premium food brands");
c = c.replace(/kitchen: "Kitchen"/g, "kitchen: \"Operations\"");
c = c.replace(/Kitchen is clear/g, "Queue is clear");
c = c.replace(/Kitchen is \{status\}/g, "Business is {status}");
c = c.replace(/No tickets\./g, "No active tickets.");
c = c.replace(/Kitchen mode/g, "Operations mode");
c = c.replace(/Kitchen assistant/g, "Business assistant");
c = c.replace(/Tell us about your kitchen/g, "Tell us about your business");
c = c.replace(/simulated kitchen/g, "simulated restaurant");
c = c.replace(/kitchen_overloaded: "Kitchen overloaded"/g, "kitchen_overloaded: \"High order volume / Overloaded\"");

fs.writeFileSync('orderking-partners/src/lib/i18n/en.ts', c, 'utf8');
