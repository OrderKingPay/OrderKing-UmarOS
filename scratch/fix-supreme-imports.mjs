import fs from 'node:fs';

const filePath = 'c:/Users/hasan/OrderKing/orderking-customers/src/components/fintech/supreme-kingpay-experience.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Ensure ScanLine and Plus are imported
content = content.replace('  Send,', '  Send,\n  ScanLine,\n  Plus,');

// Remove lines 30-47 (tutor and travel-autosuggest imports)
const badImportsRegex = /import\s*\{\s*ALL_INDIAN_BOARDS[\s\S]*?from\s*["']\.\/travel-autosuggest["'];\r?\n/;
content = content.replace(badImportsRegex, '');

// Remove searchAirportOptions and searchStationOptions
content = content.replace(/\/\/\s*Real query lookups[\s\S]*?export const searchStationOptions[^\n]+\r?\n/, '');

// If extractStationCode is needed or not:
content = content.replace(/export const extractStationCode =[\s\S]*?return code && \/\^\[A-Z0-9\]\{2,5\}\$\/\.test\(code\) \? code : null;\r?\n\};\r?\n/, '');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed supreme-kingpay-experience.tsx imports');
