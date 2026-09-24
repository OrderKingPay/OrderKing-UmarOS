const fs = require('fs');
const path = 'C:/Users/hasan/OrderKing/orderking-customers--orders-/src/lib/server/ai-chat-service.server.ts';
let content = fs.readFileSync(path, 'utf8');

// 1. Add import
if (!content.includes('executeFounderTool')) {
    content = content.replace(
        'import { getSql } from "@/lib/db";',
        'import { getSql } from "@/lib/db";\nimport { FOUNDER_TOOLS, executeFounderTool } from "../ai/founder-tools.server";'
    );
}

// 2. Inject FOUNDER_TOOLS into the stream tools array
content = content.replace(
    /tools: \[\s*\{\s*name: "inspectLocalFile"/,
    'tools: [\n              ...FOUNDER_TOOLS,\n              { name: "inspectLocalFile"'
);

// 3. Add execution logic
content = content.replace(
    /\} else \{\n\s*result = "Tool not found\.";\n\s*\}/,
    '} else {\n                   try { result = JSON.stringify(await executeFounderTool(tc.name, tc.arguments)); } catch(e) { result = "Tool not found or failed: " + String(e); }\n                }'
);

fs.writeFileSync(path, content, 'utf8');
console.log("Patched ai-chat-service.server.ts");
