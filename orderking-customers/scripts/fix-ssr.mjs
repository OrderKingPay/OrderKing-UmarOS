import fs from 'fs';
const p = '.vercel/output/functions/__server.func/_ssr/ssr.mjs';
const p2 = '.vercel/output/functions/__server.func/_ssr/ssr2.mjs';
const p3 = '.vercel/output/functions/__server.func/_chunks/ssr-renderer.mjs';

// We do NOT strip ssr_exports from ssr.mjs anymore because ssr-renderer NEEDS it.

if (fs.existsSync(p2)) {
  let c = fs.readFileSync(p2, 'utf8');
  c = c.replace(/__exportAll\$[0-9]+\(\{\s*setCookie:\s*\(\)\s*=>\s*setCookie\$[0-9]+\s*\}\)/g, '{ setCookie: () => setCookie$1, [Symbol.toStringTag]: "Module" }');
  fs.writeFileSync(p2, c);
}

if (fs.existsSync(p3)) {
  let c = fs.readFileSync(p3, 'utf8');
  // Match any minified export name like n.s, n.o, n.a etc.
  c = c.replace(/\.then\(\(n\) => n\.[a-zA-Z0-9_$]+\)/, '.then((n) => Object.values(n).find(v => v && v.default) || n)');
  fs.writeFileSync(p3, c);
}
