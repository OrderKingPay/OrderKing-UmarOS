const fs = require('fs');
const path = 'C:/Users/hasan/OrderKing/orderking-customers/src/routes/tutor.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  'placeholder="Initialize academic query..."',
  'placeholder="Initialize academic query... (e.g. \'Explain quantum entanglement\' or \'Solve integration of x^2\')"'
);

content = content.replace(
  'Processing tactical data...',
  'Synthesizing curriculum-aligned response...'
);

content = content.replace(
  'End-to-End Encrypted',
  'End-to-End Encrypted (AES-256)'
);

content = content.replace(
  'Verified Syllabi',
  'NCERT / State Board Verified'
);

fs.writeFileSync(path, content, 'utf8');
