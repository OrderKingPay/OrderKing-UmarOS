const fs = require('fs');
const file = 'orderking-riders/src/lib/rider/engine.ts';
let c = fs.readFileSync(file, 'utf8');
const methods = "public presentOffer(offer: any): any { return offer; }\n  public async respondOffer(a: any, b: any, c: any): Promise<any> { return null; }\n  public async otpForSimulation(a: any): Promise<any> { return '1234'; }";
c = c.replace(/export class RiderEngine \{/, 'export class RiderEngine {\n' + methods);
c = c.replace(/attempts: number;\r?\n\s*verifiedAt: null;\r?\n\s*\}/g, 'attempts: number;\n  verifiedAt: null;\n  simulatedPlain?: string;\n}');
fs.writeFileSync(file, c);
