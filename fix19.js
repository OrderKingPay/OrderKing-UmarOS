const fs = require('fs');
let f = 'HDmaster/src/routes/index.tsx';
let c = fs.readFileSync(f, 'utf8');
c = c.replace(/import \{ (.*?) \} from "lucide-react";/, 'import { , Database, Server, GitBranch, CheckCircle2, AlertCircle } from "lucide-react";');
fs.writeFileSync(f, c);
