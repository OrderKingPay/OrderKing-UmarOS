import fs from 'node:fs';

const filePath = 'c:/Users/hasan/OrderKing/orderking-customers/src/components/navigation/floating-bottom-nav.tsx';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  'export type ActivePlatform = "delivery" | "kingpay" | "travel" | "tutor";',
  'export type ActivePlatform = "delivery" | "kingpay";'
);
content = content.replace(
  'export type ActiveVertical = "orderking" | "tutor-jobs" | "kingpay" | "travel";',
  'export type ActiveVertical = "orderking" | "kingpay";'
);

content = content.replace(/if\s*\(state\.platform === "tutor-jobs" \|\| state\.platform === "tutor"\) return "tutor-jobs";\r?\n/, '');
content = content.replace(/if\s*\(state\.platform === "travel"\) return "travel";\r?\n/, '');
content = content.replace(/if\s*\(p\.startsWith\("\/tutor-jobs"\) \|\| p\.startsWith\("\/tutor"\)\) \{\r?\n\s*return "tutor-jobs";\r?\n\s*\}\r?\n/, '');
content = content.replace(/if\s*\(p\.startsWith\("\/travel"\)\) \{\r?\n\s*return "travel";\r?\n\s*\}\r?\n/, '');

content = content.replace(/"tutor-jobs":\s*\{[\s\S]*?\},\r?\n/, '');
content = content.replace(/travel:\s*\{[\s\S]*?\},\r?\n/, '');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Cleaned floating-bottom-nav.tsx');
