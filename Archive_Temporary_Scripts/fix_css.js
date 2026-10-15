const fs = require('fs');

const files = [
  'orderking-customers/src/styles.css',
  'orderking-partners/src/styles.css',
  'orderking-riders/src/styles.css'
];

files.forEach(path => {
  if (fs.existsSync(path)) {
    let content = fs.readFileSync(path, 'utf8');
    
    // Replace light colors with deep luxury dark colors
    content = content.replace(/--color-bg:\s*#[a-fA-F0-9]+;/g, '--color-bg: #020617;'); // slate-950
    content = content.replace(/--color-surface:\s*#[a-fA-F0-9]+;/g, '--color-surface: #0F172A;'); // slate-900
    content = content.replace(/--color-surface-2:\s*#[a-fA-F0-9]+;/g, '--color-surface-2: #1E293B;'); // slate-800
    content = content.replace(/--color-fg:\s*#[a-fA-F0-9]+;/g, '--color-fg: #F8FAFC;'); // slate-50
    content = content.replace(/--color-muted:\s*#[a-fA-F0-9]+;/g, '--color-muted: #94A3B8;'); // slate-400
    content = content.replace(/--color-subtle:\s*#[a-fA-F0-9]+;/g, '--color-subtle: #64748B;'); // slate-500
    
    // Add `color-scheme: dark;` to html to force dark scrollbars and inputs
    if (!content.includes('color-scheme: dark')) {
      content = content.replace(/html \{/, 'html {\n    color-scheme: dark;');
    }

    fs.writeFileSync(path, content, 'utf8');
    console.log('Fixed', path);
  }
});
