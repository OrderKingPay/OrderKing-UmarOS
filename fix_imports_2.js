const fs = require('fs');
const { execSync } = require('child_process');

function fixImports(dir) {
  let files = execSync('dir /s /b ' + dir + '\\src\\*.ts ' + dir + '\\src\\*.tsx').toString().split('\r\n').filter(Boolean);
  for (const f of files) {
    let content = fs.readFileSync(f, 'utf8');
    let changed = false;

    if (content.includes('@tanstack/start/api') || content.includes('@tanstack/react-start/api')) {
      content = content.replace(/import \{ createAPIFileRoute \} from '@tanstack\/(react-)?start\/api';/g, 'import { createAPIFileRoute } from "@/lib/createAPIFileRoute";');
      changed = true;
    }
    
    if (changed) fs.writeFileSync(f, content);
  }
}

fixImports('HDmaster');
fixImports('orderking-customers');
