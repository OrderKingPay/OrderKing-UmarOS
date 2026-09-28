const fs = require('fs');
const file = 'C:/Users/hasan/OrderKing/orderking-customers/src/lib/server/orders.ts';
let content = fs.readFileSync(file, 'utf8');

// Replace listMyOrders
content = content.replace(
  /(export const listMyOrders = createServerFn\(\{ method: "GET" \}\)\.middleware\(\[authMiddleware\]\)\.handler\(async \(\{ context \}\) => \{ \n)([\s\S]*?)(  \}\n  const sql = await getSql\(\);[\s\S]*?return \{ orders \}; \n\}\);)/,
  `$1  try {\n$2$3\n  } catch (err) {\n    console.error("listMyOrders failed:", err);\n    return { orders: [] };\n  }\n});`
);

// Replace getMyOrder
content = content.replace(
  /(export const getMyOrder = createServerFn\(\{ method: "GET" \}\)\.middleware\(\[authMiddleware\]\)\.validator\(\(input: \{ orderId: string \}\) => input\)\.handler\(async \(\{ context, data \}\) => \{ \n)([\s\S]*?)(return \{ order: detail \}; \n\}\);)/,
  `$1  try {\n$2$3\n  } catch (err) {\n    console.error("getMyOrder failed:", err);\n    return { order: null };\n  }\n});`
);

fs.writeFileSync(file, content);
console.log('Patched orders.ts');
