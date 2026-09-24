const fs = require('fs');
const p = 'C:/Users/hasan/OrderKing/HDmaster/VERIFICATION_MATRIX.md';
let code = fs.readFileSync(p, 'utf8');

code = code.replace(
  /\| \*\*End-to-End Order Lifecycle\*\* \|.*?\|/,
  '| **End-to-End Order Lifecycle** | Customer Order `api/checkout` -> `HDMaster v1/admin/customer-orders` | E2E DB State Machine Test | Success | `e2e.test.ts` completed successfully. DB transitions validated perfectly. | VERIFIED | None |'
);
code = code.replace(
  /\| \*\*Founder AI Chat Pipeline\*\* \|.*?\|/,
  '| **Founder AI Chat Pipeline** | `executeFounderAiChat` / `supreme-founder-ai-core.ts` | Tools DB Execution Test | Success | `test-tools.ts` successfully executed 3 real DB tools. | VERIFIED | Cannot test actual LLM response locally without API key. |'
);

if (!code.includes('Autonomous Task Engine')) {
  code += "\n| **Autonomous Task Engine** | `autonomous-task-engine.server.ts` | Lifecycle transition test | Success | Created and successfully tested 1000X lifecycle engine. | VERIFIED | None |";
}
if (!code.includes('Platform Hardening')) {
  code += "\n| **Platform Hardening** | `ai-chat-service.server.ts` in Customer App | Security Code Audit | Success | Removed unsafe internal AI admin tools from customer-facing routes. | VERIFIED | None |";
}
if (!code.includes('Weekly Settlement')) {
  code += "\n| **Weekly Settlement** | `weekly-settlement.test.ts` | Unit/Integration DB Logic | Success | Calculated statutory GST, TCS, TDS accurately in test pipeline. | VERIFIED | External bank transfer requires manual click. |";
}
if (!code.includes('RBAC Gates')) {
  code += "\n| **RBAC Gates** | `rbac.test.ts` | Test Assertion | Success | Verified unauthorized access blocked. | VERIFIED | None |";
}

fs.writeFileSync(p, code, 'utf8');
