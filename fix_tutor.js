const fs = require('fs');
const file = 'orderking-customers/src/routes/tutor.tsx';
let code = fs.readFileSync(file, 'utf8');
code = code.replace('{/* @ts-nocheck */}\\n', '');
code = code.replace('{/* @ts-nocheck */}', '');
fs.writeFileSync(file, code);
