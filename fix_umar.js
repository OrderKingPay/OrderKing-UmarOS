const fs = require('fs');
let code = fs.readFileSync('Apps-integration-/src/routes/api/umar-voice.ts', 'utf8');

code = code.replace(/catch \(e\)/g, 'catch (e: any)');
code = code.replace(/const tools = \[/g, 'const tools: any = [');
code = code.replace(/name: call\.name,/g, 'name: call.name || "",');
code = code.replace(/sendMessage\(\[\{/g, 'sendMessage([{ /* @ts-expect-error */');

fs.writeFileSync('Apps-integration-/src/routes/api/umar-voice.ts', code, 'utf8');
