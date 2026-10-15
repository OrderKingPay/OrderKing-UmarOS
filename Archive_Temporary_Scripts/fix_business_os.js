const fs = require('fs');
const file = 'HDmaster/src/lib/server/business-os.ts';
let code = fs.readFileSync(file, 'utf8');
code = code.replace('// @ts-nocheck\n', '');
code = code.replace('export const getBusinessOsSnapshot: any = ', 'export const getBusinessOsSnapshot = ');
code = code.replace('map(({ executePrompt, ...rest }) => rest) as any', 'map(({ executePrompt, ...rest }) => rest)');
fs.writeFileSync(file, code);
