
const fs = require('fs');
const paths = [
  'HDmaster/src/lib/auth/server.ts',
  'orderking-customers/src/lib/auth/server.ts',
  'orderking-partners/src/lib/auth/server.ts',
  'orderking-riders/src/lib/auth/server.ts'
];
for (const p of paths) {
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf-8');
    content = content.replace('database = new Pool({ connectionString: databaseUrl });', 'database = new Pool({ connectionString: databaseUrl });\n    (database as any).on(\'error\', (err) => console.error(\'pg auth pool error:\', err));');
    fs.writeFileSync(p, content);
  }
}

