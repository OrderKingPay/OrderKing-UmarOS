const fs = require('fs');
let i18nPath = 'orderking-riders/src/lib/rider/i18n.ts';
if (fs.existsSync(i18nPath)) {
  let content = fs.readFileSync(i18nPath, 'utf8');
  content = content.replace(/export type MessageKey = [^;]+;/, 'export type MessageKey = string;');
  fs.writeFileSync(i18nPath, content, 'utf8');
}
