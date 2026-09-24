import fs from 'fs';
const projects = ['orderking-customers', 'orderking-partners', 'orderking-riders', 'Apps-integration-'];
for (const p of projects) {
  const file = p + '/package.json';
  if (fs.existsSync(file)) {
    let c = fs.readFileSync(file, 'utf8');
    c = c.replace(/"build": "node scripts\/with-app-env\.mjs vite build && node scripts\/copy-pglite-assets\.mjs && npm run db:migrate"/g, '"build": "node scripts/with-app-env.mjs vite build && node scripts/copy-pglite-assets.mjs && node scripts/fix-ssr.mjs && npm run db:migrate"');
    fs.writeFileSync(file, c);
    console.log('Fixed', file);
  }
}
