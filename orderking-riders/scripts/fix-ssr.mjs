
import fs from 'fs';
const p = '.vercel/output/functions/__server.func/_ssr/ssr.mjs';
if (fs.existsSync(p)) {
  let c = fs.readFileSync(p, 'utf8');
  c = c.replace(/,\s*ssr_exports as [a-zA-Z0-9_$]+|ssr_exports as [a-zA-Z0-9_$]+,\s*/g, '');
  fs.writeFileSync(p, c);
}

