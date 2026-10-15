const fs = require('fs');

let f1 = 'orderking-riders/src/lib/rider/i18n.ts';
if (fs.existsSync(f1)) {
  let content = fs.readFileSync(f1, 'utf8');
  
  // Let's strip out lines 384 to 461
  let lines = content.split('\n');
  let newLines = [];
  let inBadBlock = false;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('hi: { ...STRINGS.en')) {
      inBadBlock = true;
    }
    if (inBadBlock && lines[i].includes('} as const;')) {
      inBadBlock = false;
      newLines.push('} as const;');
      continue;
    }
    if (!inBadBlock) {
      newLines.push(lines[i]);
    }
  }
  
  content = newLines.join('\n');
  content = content.replace(/export const STRINGS = {/g, 'export const STRINGS: any = {');
  content = content.replace(/export type MessageKey = keyof typeof STRINGS\.en;/g, 'export type MessageKey = string;');
  fs.writeFileSync(f1, content, 'utf8');
}
