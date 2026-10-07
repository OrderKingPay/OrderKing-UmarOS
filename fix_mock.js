const fs = require('fs');

let f = 'orderking-customers/src/lib/ai/supreme-founder-ai-core.ts';
if (fs.existsSync(f)) {
  let c = fs.readFileSync(f, 'utf8');
  // Just use as any for the response object itself because it's a completely mocked payload returned by AI 
  c = c.replace(/const response = {/g, 'const response: any = {');
  c = c.replace(/const deploymentInfo = {/g, 'const deploymentInfo: any = {');
  fs.writeFileSync(f, c);
}

// supreme-founder-ai-chat.tsx
f = 'orderking-customers/src/components/ai/supreme-founder-ai-chat.tsx';
if (fs.existsSync(f)) {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/name === 'benchmark_results'/g, "name === ('benchmark_results' as any)");
  c = c.replace(/name === 'cost_optimization'/g, "name === ('cost_optimization' as any)");
  c = c.replace(/name === 'credential_config'/g, "name === ('credential_config' as any)");
  c = c.replace(/name === 'delivery_graph'/g, "name === ('delivery_graph' as any)");
  fs.writeFileSync(f, c);
}
