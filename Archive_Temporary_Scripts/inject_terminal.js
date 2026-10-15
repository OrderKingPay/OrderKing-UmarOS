const fs = require('fs');
let c = fs.readFileSync('HDmaster/src/routes/__root.tsx', 'utf8');
if(!c.includes('UmarVoiceTerminal')) {
  c = c.replace(/import \{ Toaster \} from \"sonner\";/, "import { Toaster } from \"sonner\";\nimport { UmarVoiceTerminal } from \"@/components/umar-voice-terminal\";");
  c = c.replace(/<Outlet \/>/, "<Outlet />\n            <UmarVoiceTerminal />");
  fs.writeFileSync('HDmaster/src/routes/__root.tsx', c, 'utf8');
}
