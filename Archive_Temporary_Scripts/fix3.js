const fs = require('fs');
['C:/Users/hasan/OrderKing/OrderKing-partners/src/routes/kitchen.tsx', 'C:/Users/hasan/OrderKing/OrderKing-partners/src/routes/orders.tsx'].forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/\(o\) =>/g, '(o: any) =>');
  fs.writeFileSync(f, c, 'utf8');
});
