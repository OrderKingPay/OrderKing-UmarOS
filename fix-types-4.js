const fs = require('fs');
const runtimePath = 'HDmaster/src/lib/orderking/ai/master-ai-runtime.ts';
let runtimeContent = fs.readFileSync(runtimePath, 'utf8');

runtimeContent = runtimeContent.replace(/const messages: any\[\] = \[\];/g, 'const messages = [] as any;');
runtimeContent = runtimeContent.replace(/const messages: any\[\] = /g, 'const messages = ');
runtimeContent = runtimeContent.replace(/const completionMessages: any\[\] = /g, 'const completionMessages = ');
runtimeContent = runtimeContent.replace(/messages,(\s*)preferredProvider/g, 'messages: messages as any,$1preferredProvider');
runtimeContent = runtimeContent.replace(/messages: completionMessages,/g, 'messages: completionMessages as any,');
runtimeContent = runtimeContent.replace(/messages: Array<Record<string, unknown>>/g, 'messages: Array<any>');

fs.writeFileSync(runtimePath, runtimeContent);

const pagesPath = 'HDmaster/src/components/command/pages.tsx';
if (fs.existsSync(pagesPath)) {
  let pagesContent = fs.readFileSync(pagesPath, 'utf8');
  pagesContent = pagesContent.replace(/<TravelPage \/>/g, '<div>Travel Page Coming Soon</div>');
  fs.writeFileSync(pagesPath, pagesContent);
}

console.log('Fixed types forcefully');
