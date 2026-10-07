const fs = require('fs');
const file = 'orderking-customers/src/components/fintech/micro-loan-hub.tsx';
let c = fs.readFileSync(file, 'utf8');
if (!c.includes('import { toast }')) {
  c = 'import { toast } from "sonner";\n' + c;
  fs.writeFileSync(file, c);
}
