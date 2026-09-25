const fs = require('fs');

const testPath = 'HDmaster/src/lib/orderking/ai/master-ai-command.test.ts';
let testContent = fs.readFileSync(testPath, 'utf8');
testContent = testContent.replace(/consensusReached/g, 'provider');
fs.writeFileSync(testPath, testContent);

const runtimePath = 'HDmaster/src/lib/orderking/ai/master-ai-runtime.ts';
let runtimeContent = fs.readFileSync(runtimePath, 'utf8');
runtimeContent = runtimeContent.replace(/role: string/g, 'role: "user" | "assistant" | "system" | "tool"');
fs.writeFileSync(runtimePath, runtimeContent);

console.log('Fixed types');
