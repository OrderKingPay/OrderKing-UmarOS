const fs = require('fs');
const file = 'src/lib/hooks/use-order-sse.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/filter: id=eq\.,/g, 'filter: `id=eq.${orderId}`,');

fs.writeFileSync(file, content, 'utf8');
