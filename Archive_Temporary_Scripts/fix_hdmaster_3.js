const fs = require('fs');
const { execSync } = require('child_process');

let files = execSync('dir /s /b HDmaster\\src\\*.ts HDmaster\\src\\*.tsx').toString().split('\r\n').filter(Boolean);

for (const f of files) {
  let content = fs.readFileSync(f, 'utf8');
  let changed = false;

  if (content.includes('@tanstack/start/api')) {
    content = content.replace(/@tanstack\/start\/api/g, '@tanstack/react-start/api');
    changed = true;
  }
  if (content.includes('@tanstack/start')) {
    content = content.replace(/@tanstack\/start/g, '@tanstack/react-start');
    changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(f, content);
  }
}
