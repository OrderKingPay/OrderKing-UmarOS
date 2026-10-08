const fs = require('fs');
const files = [
  'src/lib/orderking/auth/rbac-engine.ts',
  'src/lib/orderking/auth/session-manager.ts',
  'src/lib/orderking/discovery/autocomplete.ts',
  'src/lib/orderking/discovery/full-text-search.ts',
  'src/lib/orderking/discovery/recommendation-engine.ts',
  'src/lib/orderking/discovery/trending-detector.ts',
  'src/lib/orderking/testing/load-tester.ts',
  'src/lib/orderking/testing/test-runner.ts'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/import getSql from ['"](.*?)['"];/g, 'import { getSql } from \'$1\';');
  fs.writeFileSync(file, content);
}
console.log('Fixed imports');
