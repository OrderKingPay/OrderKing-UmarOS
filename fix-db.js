
const fs = require('fs');
const paths = [
  'HDmaster/src/lib/db.ts',
  'orderking-customers/src/lib/db.ts',
  'orderking-partners/src/lib/db.ts',
  'orderking-riders/src/lib/database/db.ts',
  'orderking-riders/src/lib/db.ts'
];
for (const p of paths) {
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf-8');
    content = content.replace('const pool = new Pool({ connectionString: databaseUrl });', 'const pool = new Pool({ connectionString: databaseUrl });\n      pool.on(\'error\', (err) => console.error(\'pg db pool error:\', err.message));');
    fs.writeFileSync(p, content);
  }
}

