const fs = require('fs');
const runtimePath = 'HDmaster/src/lib/orderking/ai/master-ai-runtime.ts';
let runtimeContent = fs.readFileSync(runtimePath, 'utf8');

// Replace any variable declaration where it creates messages array
runtimeContent = runtimeContent.replace(/const messages = \[\];/g, 'const messages: any[] = [];');
runtimeContent = runtimeContent.replace(/const messages = /g, 'const messages: any[] = ');
runtimeContent = runtimeContent.replace(/const completionMessages = /g, 'const completionMessages: any[] = ');

fs.writeFileSync(runtimePath, runtimeContent);
console.log('Fixed any[]');
