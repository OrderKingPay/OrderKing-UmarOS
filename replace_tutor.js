const fs = require('fs');
let c = fs.readFileSync('orderking-customers/src/routes/tutor.tsx', 'utf8');

if(!c.includes('DailyHub')) {
  c = c.replace(/import \{ Link \} from \"@tanstack\/react-router\";/, "import { Link } from \"@tanstack/react-router\";\nimport { DailyHub } from \"@/components/market/daily-hub\";");
  c = c.replace(/<div className=\"flex flex-col gap-6 p-4\">\n/, "<div className=\"flex flex-col gap-6 p-4\">\n        {/* Founder Requested Daily Hub Placement */}\n        <DailyHub />\n\n");
  fs.writeFileSync('orderking-customers/src/routes/tutor.tsx', c, 'utf8');
}
