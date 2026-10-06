const fs = require('fs');
const glob = require('glob');

const files = glob.sync('**/src/lib/db.ts', { ignore: 'node_modules/**' });
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  content = content.replace(
    /const rawDatabaseUrl =[\s\S]*?export const dbSource: DbSource = databaseUrl \? "neon" : "pglite";/g,
    'export function getDatabaseUrl() {\n  const raw = typeof process !== "undefined" ? process.env.DATABASE_URL : undefined;\n  let url = raw && raw.trim() ? raw : undefined;\n  if (url && url.includes("your_supabase_pooler")) url = undefined;\n  return url;\n}\nexport function getDbSource() {\n  return getDatabaseUrl() ? "neon" : "pglite";\n}\nexport const dbSource = "neon";'
  );

  content = content.replace(
    /const pool = new Pool\(\{ connectionString: databaseUrl \}\);/g,
    'const url = getDatabaseUrl(); if (!url) throw new Error("DATABASE_URL is missing"); const pool = new Pool({ connectionString: url });'
  );

  content = content.replace(/dbSource === "neon"/g, 'getDbSource() === "neon"');
  content = content.replace(/dbSource !== "pglite"/g, 'getDbSource() !== "pglite"');
  content = content.replace(/if \(typeof window === "undefined" && dbSource === "pglite"\) \{/g, 'if (typeof window === "undefined" && getDbSource() === "pglite") {');

  fs.writeFileSync(file, content);
  console.log('Fixed', file);
}
