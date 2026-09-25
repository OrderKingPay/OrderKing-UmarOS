const fs = require('fs');

// Fix system-diagnostics.test.ts
let file = 'HDmaster/src/lib/orderking/security/system-diagnostics.test.ts';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/test\(\"([^"]+)\", \(\) => \{/g, 'test("", async () => {');
content = content.replace(/const report = SystemDiagnosticsEngine\.runFullDiagnostics\(\);/g, 'const report = await SystemDiagnosticsEngine.runFullDiagnostics();');
fs.writeFileSync(file, content);

// Fix business-os.server.ts createServerFn
file = 'HDmaster/src/lib/orderking/server/business-os.server.ts';
content = fs.readFileSync(file, 'utf8');
content = content.replace(/createServerFn\("GET", /g, 'createServerFn({ method: "GET" }).handler(');
fs.writeFileSync(file, content);
