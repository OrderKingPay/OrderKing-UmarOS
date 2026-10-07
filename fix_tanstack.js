const fs = require('fs');
let apiPath = 'Apps-integration-/src/lib/orderking/server/api.ts';
if (fs.existsSync(apiPath)) {
  let content = fs.readFileSync(apiPath, 'utf8');
  content = content.replace(/\.inputValidator\(/g, '.validator(');
  fs.writeFileSync(apiPath, content, 'utf8');
}
