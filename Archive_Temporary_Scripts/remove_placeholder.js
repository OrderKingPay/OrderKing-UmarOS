const fs = require('fs');
let code = fs.readFileSync('HDmaster/src/routes/index.tsx', 'utf8');
// remove the PlaceholderPanel definition
code = code.replace(/function PlaceholderPanel[\s\S]+?\}\n\n/, '');
fs.writeFileSync('HDmaster/src/routes/index.tsx', code, 'utf8');
