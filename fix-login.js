const fs = require('fs');

const files = [
  'Apps-integration-/src/routes/login.tsx',
  'HDmaster/src/routes/login.tsx',
  'orderking-customers/src/routes/login.tsx',
  'orderking-partners/src/routes/login.tsx',
  'orderking-riders/src/routes/login.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/const isVercel = [^\n]+;\r?\n/g, '');
    content = content.replace(/{authEnabled && !isVercel \? \(/g, '{authEnabled ? (');
    fs.writeFileSync(file, content);
    console.log('Fixed', file);
  }
});
