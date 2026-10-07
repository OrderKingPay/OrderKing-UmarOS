const fs = require('fs');
let f = 'HDmaster/src/lib/engine/ledger.ts';
let c = fs.readFileSync(f, 'utf8');
c = c.replace('// @ts-nocheck\n', '');
c = c.replace(/SELECT \* FROM financial_ledger WHERE order_id = \$\{orderId\}/, 'SELECT * FROM financial_ledger WHERE order_id =  as Promise<Array<{ destination_account_id: string, source_account_id: string, amount: number }>>');
c = c.replace(/\(tx as any\)\.amount/g, 'Number(tx.amount)');
c = c.replace(/const orders = await \(await getSql\(\)\)\\n\s+SELECT id, total_amount, commission_rate FROM orders/g, 'const orders = await (await getSql())<any>\n      SELECT id, total_amount, commission_rate FROM orders');
c = c.replace(/\(order as any\)\.total_amount/g, 'Number(order.total_amount)');
fs.writeFileSync(f, c);
