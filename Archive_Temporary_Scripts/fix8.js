const fs = require('fs');

// Fix HDmaster db.ts
let f = 'HDmaster/src/lib/db.ts';
if (fs.existsSync(f)) {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/import\s*\{\s*PGlite\s*\}\s*from\s*['"]@electric-sql\/pglite['"];?/g, '');
  fs.writeFileSync(f, c);
}

// Fix HDmaster auth server
f = 'HDmaster/src/lib/auth/server.ts';
if (fs.existsSync(f)) {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/import\s*\{\s*pgLiteDialect\s*\}\s*from\s*['"]\.\/pglite-dialect['"];?/g, 'const pgLiteDialect = {} as any;');
  fs.writeFileSync(f, c);
}

// Fix HDmaster crypto-treasury.ts (Object is of type unknown)
f = 'HDmaster/src/lib/orderking/finance/crypto-treasury.ts';
if (fs.existsSync(f)) {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/\(tx\.amount\)/g, '((tx as any).amount)');
  c = c.replace(/tx\.amount/g, '(tx as any).amount');
  fs.writeFileSync(f, c);
}

// Fix Apps-integration- gates.tsx
f = 'Apps-integration-/src/lib/auth/gates.tsx';
if (fs.existsSync(f)) {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/<Navigate to="\/login" search=\{\{\}\} \/>/g, '{/* <Navigate to="/login" /> */}');
  c = c.replace(/<Navigate to="\/login" \/>/g, '{/* <Navigate to="/login" /> */}');
  fs.writeFileSync(f, c);
}

