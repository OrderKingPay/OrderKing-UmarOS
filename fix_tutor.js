const fs = require('fs');
let c = fs.readFileSync('orderking-customers/src/routes/tutor.tsx', 'utf8');
c = c.replace(/import \{ DailyHub \} from \"@\/components\/market\/daily-hub\";/g, '');
c = c.replace(/<div className=\"px-4 py-2 bg-gradient-to-br from-indigo-50 to-purple-50\"><DailyHub \/><\/div>/g, '');
fs.writeFileSync('orderking-customers/src/routes/tutor.tsx', c, 'utf8');
