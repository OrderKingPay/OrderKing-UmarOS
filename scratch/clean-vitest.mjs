import fs from 'node:fs';

const filePath = 'c:/Users/hasan/OrderKing/orderking-customers/vitest.config.ts';
let content = fs.readFileSync(filePath, 'utf8');

const deletedTests = [
  "src/test/sovereign-travel-engine.test.ts",
  "src/test/in-app-travel-booking.test.ts",
  "src/test/travel-partner-affiliates.test.ts",
  "src/test/partner-aggregation-routing.test.ts",
  "src/test/irctc-fintech-reconciliation.test.ts",
  "src/test/travel-provider-truth-gates.test.ts",
  "src/test/adzuna-jobs-hub.test.ts",
  "src/test/academic-tutor-reality.test.ts",
  "src/test/gemini-tutor-solver.test.ts",
  "src/test/academic-tutor-kingpay-integration.test.ts",
  "src/test/travel-autosuggest.test.ts",
  "src/test/dual-travel-engine.test.ts",
  "src/test/travelpayouts-white-label.test.ts",
];

for (const t of deletedTests) {
  content = content.replace(new RegExp(`\\s*"${t}",?\\r?\\n`, 'g'), '\n');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Cleaned vitest.config.ts');
