const fs = require('fs');

const corePath = 'C:/Users/hasan/OrderKing/orderking-customers/src/lib/ai/supreme-founder-ai-core.ts';
let core = fs.readFileSync(corePath, 'utf8');

core = core.replace(/100x cleaner than browser cache tools active/g, 'Deep cleaning protocol initialized');
core = core.replace(/Sovereign Cache & Storage Purifier Armed \(100x Cleaner\)/g, 'Cache & Storage Purifier Armed');
core = core.replace(/boost engine performance by 100x!/g, 'optimize engine performance.');
core = core.replace(/Supreme AI Image Generated \(100% Free & Unlimited\)/g, 'AI Image Generated Successfully');
core = core.replace(/Supreme AI Video Generated \(100% Free & Unlimited\)/g, 'AI Video Generated Successfully');
core = core.replace(/Supreme AI Studio Execution/g, 'AI Media Studio Execution');
core = core.replace(/Allocated supreme GPU rendering cluster/g, 'Allocated dedicated GPU rendering cluster');
core = core.replace(/🤖 Supreme AI Operator Executed/g, '🤖 Autonomous AI Operator Executed');
core = core.replace(/with 100% human replacement accuracy/g, 'with high-precision accuracy');
core = core.replace(/Supreme AI Studio/g, 'AI Media Studio');
core = core.replace(/Supreme Founder AI engine/g, 'Founder AI engine');

fs.writeFileSync(corePath, core, 'utf8');

const chatPath = 'C:/Users/hasan/OrderKing/orderking-customers/src/components/ai/supreme-founder-ai-chat.tsx';
let chat = fs.readFileSync(chatPath, 'utf8');

chat = chat.replace(/Double Engine Consensus Validator \(100x Realism\)/g, 'Double Engine Consensus Validator');
chat = chat.replace(/⚡ Auto Supreme Orchestrator \(Autonomous Best\)/g, '⚡ Auto Core Orchestrator (Autonomous Best)');
chat = chat.replace(/💻 Codex Architecture Engine \(Local Core\)/g, '💻 Codex Architecture Engine (Local Core)');
chat = chat.replace(/The Supreme Founder AI engine could not be reached/g, 'The Founder AI engine could not be reached');

fs.writeFileSync(chatPath, chat, 'utf8');
