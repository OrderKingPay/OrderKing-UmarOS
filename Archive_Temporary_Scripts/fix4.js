const fs = require('fs');

function fix(file) {
  let c = fs.readFileSync(file, 'utf8');
  c = c.replace(/adapters: liveOrchestrationEngine\.listRegisteredAdapters\(\)\.map\(\(\{ executePrompt, \.\.\.rest \}\) => rest\) as any\.map[^\n]+/g, 
    "adapters: liveOrchestrationEngine.listRegisteredAdapters().map(({ executePrompt, ...rest }) => rest) as any,");
  fs.writeFileSync(file, c);
}
fix('HDmaster/src/lib/server/business-os.ts');
fix('HDmaster/src/lib/orderking/server/business-os.server.ts');
