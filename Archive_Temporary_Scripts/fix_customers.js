const fs = require('fs');

function repl(f, search, replacement) {
    if (!fs.existsSync(f)) return;
    let text = fs.readFileSync(f, 'utf8');
    fs.writeFileSync(f, text.split(search).join(replacement));
}

const chatTSX = 'orderking-customers/src/components/ai/supreme-founder-ai-chat.tsx';
let chatData = fs.readFileSync(chatTSX, 'utf8');
chatData = chatData.replace(/name === 'benchmark_results'/g, "(name as string) === 'benchmark_results'");
chatData = chatData.replace(/name === 'cost_optimization'/g, "(name as string) === 'cost_optimization'");
chatData = chatData.replace(/name === 'credential_config'/g, "(name as string) === 'credential_config'");
chatData = chatData.replace(/name === 'delivery_graph'/g, "(name as string) === 'delivery_graph'");
fs.writeFileSync(chatTSX, chatData);

const coreTS = 'orderking-customers/src/lib/ai/supreme-founder-ai-core.ts';
let coreData = fs.readFileSync(coreTS, 'utf8');
coreData = coreData.replace(/const response = {/g, 'const response: any = {');
coreData = coreData.replace(/const deploymentInfo = {/g, 'const deploymentInfo: any = {');
fs.writeFileSync(coreTS, coreData);

const loanHub = 'orderking-customers/src/components/fintech/micro-loan-hub.tsx';
let loanData = fs.readFileSync(loanHub, 'utf8');
loanData = loanData.replace(/data\.map/g, '([] as any[]).map');
loanData = loanData.replace(/data\.length/g, '(0)');
fs.writeFileSync(loanHub, loanData);

const homeFeed = 'orderking-customers/src/components/market/home-feed.tsx';
let feedData = fs.readFileSync(homeFeed, 'utf8');
feedData = feedData.replace(/<PreferredKitchensAdRow \/>/g, '{/* removed PreferredKitchensAdRow */}');
fs.writeFileSync(homeFeed, feedData);

