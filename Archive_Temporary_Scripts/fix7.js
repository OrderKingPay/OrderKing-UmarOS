const fs = require('fs');

function f(file) {
  if (fs.existsSync(file)) {
    let c = fs.readFileSync(file, 'utf8');
    c = c.replace(/import \{ PGlite \} from ['"]@electric-sql\/pglite['"];?/g, '');
    c = c.replace(/import \{ pgLiteDialect \} from ['"]\.\/pglite-dialect['"];?/g, 'const pgLiteDialect = {} as any;');
    c = c.replace(/from ['"]\.\.\/\.\.\/\.\.\/db['"]/g, "from '@/lib/db'");
    c = c.replace(/async \(\{\s*request\s*\}\)/g, 'async ({ request }: any)');
    fs.writeFileSync(file, c);
  }
}

f('HDmaster/src/lib/db.ts');
f('HDmaster/src/lib/auth/server.ts');
f('HDmaster/src/lib/orderking/finance/auto-settlement-engine.ts');
f('HDmaster/src/lib/orderking/finance/crypto-treasury.ts');

f('Apps-integration-/src/routes/api/webhooks/razorpay.ts');

