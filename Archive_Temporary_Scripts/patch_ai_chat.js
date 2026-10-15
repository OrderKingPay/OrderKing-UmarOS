const fs = require('fs');
let file = 'HDmaster/src/lib/orderking/server/ai-chat-service.server.ts';
let content = fs.readFileSync(file, 'utf8');

const importStr = "import { conversationalControl } from '../ai/founder-conversational-control.server';\nimport { registerFounderTools } from '../ai/tool-registry.server';\n\nregisterFounderTools();\n\n";

if (!content.includes('conversationalControl')) {
    content = content.replace("import { tryExecuteEngineeringCommand, tryExecuteWorkforceCommand }", importStr + "import { tryExecuteEngineeringCommand, tryExecuteWorkforceCommand }");
    
    // Fallback if that exact import string doesn't exist
    if (!content.includes(importStr)) {
         content = importStr + content;
    }
}

const hookStr = 
    // 0. UMAR OS Universal Conversational Control Fabric
    if (currentQuery.toLowerCase().includes('platform state') || currentQuery.toLowerCase().includes('reconciliation')) {
       try {
           const result = await conversationalControl.interpretAndExecute(currentQuery, {
             userId: 'founder',
             role: 'SUPER_ADMIN',
             requestId: 'req_' + Date.now(),
             timestamp: new Date().toISOString()
           });
           
           if (result.status === 'SUCCESS') {
               const responseText = "### 👑 Universal Tool Executed: " + result.toolExecuted + "\\n\\n\\\json\\n" + JSON.stringify(result.data, null, 2) + "\\n\\\";
               onStreamEvent?.({ type: "delta", data: responseText });
               onStreamEvent?.({ type: "done", data: { text: responseText } });
               
               return {
                 text: responseText,
                 modelUsed: "gemini-2.5-pro",
                 provider: "Universal Fabric",
                 executionSteps: [],
                 latencyMs: Date.now() - startTime,
               };
           }
       } catch (e) {
           console.error('Conversational Fabric failed', e);
       }
    }
;

if (!content.includes('UMAR OS Universal Conversational Control Fabric')) {
    content = content.replace('const engineeringResult = await tryExecuteEngineeringCommand(currentQuery);', hookStr + '\n    const engineeringResult = await tryExecuteEngineeringCommand(currentQuery);');
}

fs.writeFileSync(file, content);
