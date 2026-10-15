const fs = require('fs');
const file = 'HDmaster/src/lib/orderking/server/ai-chat-service.server.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /userId: 'founder',[\s\n]*role: 'SUPER_ADMIN',/g,
  "userId: request.userId || 'system',\n               role: (request as any).userRole || 'USER',"
);

fs.writeFileSync(file, code);
