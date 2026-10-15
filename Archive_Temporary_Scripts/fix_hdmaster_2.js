const fs = require('fs');
const { execSync } = require('child_process');

let files = execSync('dir /s /b HDmaster\\src\\*.ts HDmaster\\src\\*.tsx').toString().split('\r\n').filter(Boolean);

for (const f of files) {
  let content = fs.readFileSync(f, 'utf8');
  let changed = false;

  if (content.includes('@tanstack/react-start/api')) {
    content = content.replace(/@tanstack\/react-start\/api/g, '@tanstack/start/api');
    content = content.replace(/import \{ createAPIFileRoute \} from '@tanstack\/start\/api';\r?\n/, 'import { createAPIFileRoute } from \'@tanstack/start/api\';\n');
    changed = true;
  }
  if (content.includes('@ts-expect-error')) {
    content = content.replace(/\/\/\s*@ts-expect-error.*/g, '');
    changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(f, content);
  }
}
