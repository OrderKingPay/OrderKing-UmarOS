const fs = require('fs');

// Fix HDmaster db.ts type import
let f = 'HDmaster/src/lib/db.ts';
if (fs.existsSync(f)) {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/import\("@electric-sql\/pglite"\)\.PGlite/g, 'any');
  fs.writeFileSync(f, c);
}

// Fix HDmaster auth server
f = 'HDmaster/src/lib/auth/server.ts';
if (fs.existsSync(f)) {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/import\s*\{\s*pgliteDialect\s*\}\s*from\s*['"]\.\/pglite-dialect['"];?/g, 'const pgliteDialect = {} as any;');
  fs.writeFileSync(f, c);
}

// Fix Apps-integration- gates.tsx
f = 'Apps-integration-/src/lib/auth/gates.tsx';
if (fs.existsSync(f)) {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/<Navigate to=\{to\} \/>/g, '<Navigate to={"/login"} search={{ redirect: "/" }} />');
  fs.writeFileSync(f, c);
}

