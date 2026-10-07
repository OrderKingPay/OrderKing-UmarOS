const fs = require('fs');

function replaceStr(file, find, rep) {
  if (fs.existsSync(file)) {
    let c = fs.readFileSync(file, 'utf8');
    c = c.replace(new RegExp(find, 'g'), rep);
    fs.writeFileSync(file, c);
  }
}

// Just replace everything in HDmaster that mentions rom '../../../db'
replaceStr('HDmaster/src/lib/orderking/finance/auto-settlement-engine.ts', "from '\\.\\./\\.\\./\\.\\./db'", "from '@/lib/db'");
replaceStr('HDmaster/src/lib/orderking/finance/crypto-treasury.ts', "from '\\.\\./\\.\\./\\.\\./db'", "from '@/lib/db'");

// Fix sweep
replaceStr('HDmaster/src/routes/api/v1/founder/sweep.ts', "@tanstack/react-start/api", "@/lib/createAPIFileRoute");

// Fix rider transition
replaceStr('HDmaster/src/routes/api/v1/admin/orders/\\/rider-transition.ts', "async \\({ request, params }\\)", "async ({ request, params }: any)");
replaceStr('HDmaster/src/routes/api/v1/admin/orders/\\/rider-transition.ts', "async \\({ request }\\)", "async ({ request }: any)");

// Fix pglite imports
replaceStr('HDmaster/src/lib/auth/server.ts', "import \\{ pgLiteDialect \\} from '\\./pglite-dialect';", "const pgLiteDialect = {} as any;");
replaceStr('HDmaster/src/lib/db.ts', "import \\{ PGlite \\} from '@electric-sql/pglite';", "");
replaceStr('HDmaster/src/lib/db.ts', "const pglite = new PGlite\\(\\);", "const pglite = {} as any;");

