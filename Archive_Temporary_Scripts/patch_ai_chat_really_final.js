const fs = require('fs');
let file = 'HDmaster/src/lib/orderking/server/ai-chat-service.server.ts';
let content = fs.readFileSync(file, 'utf8');

const importStr = "import { conversationalControl } from '../ai/founder-conversational-control.server';\nimport { registerFounderTools } from '../ai/tool-registry.server';\n\nregisterFounderTools();\n\n";

if (!content.includes('conversationalControl')) {
    content = importStr + content;
}

const target = "const engineeringResult = await tryExecuteEngineeringCommand(currentQuery);";
const hookParts = [
    "    // 0. UMAR OS Universal Conversational Control Fabric",
    "    if (currentQuery.toLowerCase().includes('platform state') || currentQuery.toLowerCase().includes('reconciliation') || currentQuery.toLowerCase().includes('cancellation')) {",
    "       try {",
    "           const result = await conversationalControl.interpretAndExecute(currentQuery, {",
    "             userId: 'founder',",
    "             role: 'SUPER_ADMIN',",
    "             requestId: 'req_' + Date.now(),",
    "             timestamp: new Date().toISOString()",
    "           });",
    "           ",
    "           if (result.status === 'SUCCESS') {",
    "               const responseText = '### 👑 Universal Tool Executed: ' + result.toolExecuted + '\\n\\n`json\\n' + JSON.stringify(result.data, null, 2) + '\\n`';",
    "               onStreamEvent?.({ type: 'delta', data: responseText });",
    "               onStreamEvent?.({ type: 'done', data: { text: responseText } });",
    "               ",
    "               return {",
    "                 text: responseText,",
    "                 modelUsed: 'gemini-2.5-pro',",
    "                 provider: 'Universal Fabric',",
    "                 executionSteps: [],",
    "                 latencyMs: Date.now() - startTime,",
    "               };",
    "           }",
    "       } catch (e) {",
    "           console.error('Conversational Fabric failed', e);",
    "       }",
    "    }"
];
const hookStr = hookParts.join('\n');

if (!content.includes('UMAR OS Universal Conversational Control Fabric')) {
    content = content.replace(target, hookStr + '\n    ' + target);
}

fs.writeFileSync(file, content);
