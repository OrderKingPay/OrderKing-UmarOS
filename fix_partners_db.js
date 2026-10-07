const fs = require('fs');

let f2 = 'orderking-partners/src/lib/db.ts';
if (fs.existsSync(f2)) {
  let c2 = fs.readFileSync(f2, 'utf8');
  c2 = c2.replace(/import \{ PGlite \} from '@electric-sql\/pglite';/g, "// import { PGlite } from '@electric-sql/pglite';");
  c2 = c2.replace(/provider === 'pglite'/g, "(provider as string) === 'pglite'");
  c2 = c2.replace(/dbSource === "pglite"/g, "(dbSource as string) === 'pglite'");
  c2 = c2.replace(/__pgliteInstance__\?: Promise<import\("@electric-sql\/pglite"\)\.PGlite>;/g, "__pgliteInstance__?: Promise<any>;");
  fs.writeFileSync(f2, c2, 'utf8');
}
