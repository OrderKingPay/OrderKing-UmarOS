const fs = require('fs');

const files = [
  'Apps-integration-/src/routes/__root.tsx',
  'HDmaster/src/routes/__root.tsx',
  'orderking-partners/src/routes/__root.tsx',
  'orderking-riders/src/routes/__root.tsx'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/href:\s*['"]\/__grok\/icon-180\.png['"]/g, 'href: \"/icon-192.png\"');
    fs.writeFileSync(file, content, 'utf8');
  }
}
console.log('Fixed apple-touch-icon references');
