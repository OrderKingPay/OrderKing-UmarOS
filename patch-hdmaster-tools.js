const fs = require('fs');
const path = 'C:/Users/hasan/OrderKing/HDmaster/src/lib/orderking/server/ai-chat-service.server.ts';
let content = fs.readFileSync(path, 'utf8');

// 1. Add import
if (!content.includes('executeFounderTool')) {
    content = content.replace(
        'import * as q from "./queries.server.ts";',
        'import * as q from "./queries.server.ts";\nimport { FOUNDER_TOOLS, executeFounderTool } from "../ai/founder-tools.server";'
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
console.log("Patched HDmaster ai-chat-service.server.ts");
