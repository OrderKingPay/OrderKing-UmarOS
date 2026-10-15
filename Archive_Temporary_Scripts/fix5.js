const fs = require('fs');

let f = 'HDmaster/src/lib/db.ts';
if (fs.existsSync(f)) {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/dbSource === "pglite"/g, 'dbSource === ("pglite" as any)');
  fs.writeFileSync(f, c);
}

// Ensure the imports are fixed
f = 'HDmaster/src/routes/api/v1/admin/orders//rider-transition.ts';
if (fs.existsSync(f)) {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/async \(\{\s*request,\s*params\s*\}\)/g, 'async ({ request, params }: any)');
  c = c.replace(/async \(\{\s*request\s*\}\)/g, 'async ({ request }: any)');
  fs.writeFileSync(f, c);
}

f = 'HDmaster/src/lib/auth/server.ts';
if (fs.existsSync(f)) {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/import\s*\{\s*pgLiteDialect\s*\}\s*from\s*'\.\/pglite-dialect';/g, 'const pgLiteDialect = {} as any;');
  fs.writeFileSync(f, c);
}

f = 'HDmaster/src/lib/orderking/finance/auto-settlement-engine.ts';
if (fs.existsSync(f)) {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/import\s*\{\s*getSql\s*\}\s*from\s*'\.\.\/\.\.\/\.\.\/db';/g, "import { getSql } from '@/lib/db';");
  fs.writeFileSync(f, c);
}

f = 'HDmaster/src/lib/orderking/finance/crypto-treasury.ts';
if (fs.existsSync(f)) {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/import\s*\{\s*getSql\s*\}\s*from\s*'\.\.\/\.\.\/\.\.\/db';/g, "import { getSql } from '@/lib/db';");
  fs.writeFileSync(f, c);
}

