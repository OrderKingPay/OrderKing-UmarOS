import fs from 'fs';
const p = '.vercel/output/functions/__server.func/_ssr/ssr.mjs';
const p2 = '.vercel/output/functions/__server.func/_ssr/ssr2.mjs';
const p3 = '.vercel/output/functions/__server.func/_chunks/ssr-renderer.mjs';

if (fs.existsSync(p)) {
  let c = fs.readFileSync(p, 'utf8');
  c = c.replace(/,\s*ssr_exports as [a-zA-Z0-9_$]+|ssr_exports as [a-zA-Z0-9_$]+,\s*/g, '');
  fs.writeFileSync(p, c);
}

if (fs.existsSync(p2)) {
  let c = fs.readFileSync(p2, 'utf8');
  c = c.replace(/__exportAll\$[0-9]+\(\{\s*setCookie:\s*\(\)\s*=>\s*setCookie\$[0-9]+\s*\}\)/g, '{ setCookie: () => setCookie$1, [Symbol.toStringTag]: "Module" }');
  fs.writeFileSync(p2, c);
}

if (fs.existsSync(p3)) {
  let c = fs.readFileSync(p3, 'utf8');
  c = c.replace('.then((n) => n.s)', '.then((n) => n.default || n.s || n)');
  fs.writeFileSync(p3, c);
}
