const fs = require('fs');
const file = 'orderking-riders/src/lib/rider/engine.ts';
let c = fs.readFileSync(file, 'utf8');
c = c.replace(/public async respondOffer\(a: any, b: any, c: any\): Promise<any> \{ return null; \}/g, 'public async respondOffer(...args: any[]): Promise<any> { return null; }');
c = c.replace(/public async otpForSimulation\(a: any\): Promise<any> \{ return '1234'; \}/g, 'public async otpForSimulation(...args: any[]): Promise<any> { return "1234"; }');
c = c.replace(/verifiedAt: null;\r?\n\s*simulatedPlain\?: string;\r?\n\s*\}/g, 'verifiedAt: null;\n}');
c = c.replace(/attempts: number;\r?\n\s*verifiedAt: null;\r?\n\s*\}/g, 'attempts: number;\n  verifiedAt: null;\n  simulatedPlain?: string;\n}');
fs.writeFileSync(file, c);
