import fs from 'fs';

const files = [
  'orderking-riders/src/lib/db.ts',
  'orderking-partners/src/lib/db.ts',
  'orderking-customers/src/lib/db.ts',
  'HDmaster/src/lib/db.ts'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let text = fs.readFileSync(file, 'utf8');
  text = text.replace(
    /postgresql:\/\/postgres\.wziksbrumklcktrlgedb:UmarHasan%405566@aws-0-ap-southeast-1\.pooler\.supabase\.com:6543\/postgres\?sslmode=no-verify&pgbouncer=true&connection_limit=10/g,
    'postgresql://postgres.wziksbrumklcktrlgedb:UmarHasan%405566@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=no-verify'
  );
  if (!text.includes("url.includes(':6543')")) {
    text = text.replace(
      /if \(url && url\.includes\('pooler\.supabase\.com'\) && url\.includes\('sslmode=require'\)\) \{/,
      "if (url && url.includes('pooler.supabase.com') && url.includes(':6543')) { url = url.replace(':6543', ':5432').replace('&pgbouncer=true', '').replace('pgbouncer=true&', '').replace('?pgbouncer=true', ''); }\n  if (url && url.includes('pooler.supabase.com') && url.includes('sslmode=require')) {"
    );
  }
  text = text.replace(
    /url \+= \(url\.includes\('\?'\) \? '&' : '\?'\) \+ 'sslmode=no-verify&pgbouncer=true';/g,
    "url += (url.includes('?') ? '&' : '?') + 'sslmode=no-verify';"
  );
  fs.writeFileSync(file, text, 'utf8');
  console.log('Successfully patched DB pool configuration to stable 5432 session mode in:', file);
}
