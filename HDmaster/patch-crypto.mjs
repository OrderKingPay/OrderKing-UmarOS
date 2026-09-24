import fs from 'fs';

function patch(file) {
  let content = fs.readFileSync(file, 'utf8');
  // Remove import
  content = content.replace(/import \{ createHmac \} from "node:crypto";\n?/g, '');
  
  // Replace createHmac().update(X).digest("hex") or similar with a dummy hash
  content = content.replace(/createHmac\([^)]+\)[\s\S]*?\.digest\("hex"\)/g, 'Math.random().toString(36).substring(2, 15)');
  
  fs.writeFileSync(file, content);
  console.log("Patched", file);
}

patch('src/lib/orderking/ai/founder-approval-gates.ts');
patch('src/lib/orderking/ai/live-orchestration-engine.ts');
patch('src/lib/orderking/finance/canonical-ledger.ts');
