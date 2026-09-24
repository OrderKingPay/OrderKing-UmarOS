const fs = require('fs');
let c = fs.readFileSync('C:/Users/hasan/OrderKing/orderking-customers--orders-/src/routes/checkout.tsx', 'utf8');

c = c.replace('import { newId } from "@/lib/ids";', 'import { newId } from "@/lib/ids";\nimport { createRazorpayOrder } from "@/lib/server/razorpay.server";');

const target = `const cfg = await loadConfig();`;
const replace = `const cfg = await loadConfig();
        if (method === "RAZORPAY_ONLINE") {
          await createRazorpayOrder({ data: { amountPaise: totalPayable, currency: "INR", notes: { receipt: idempotencyKey } } });
        }`;

c = c.replace(target, replace);
fs.writeFileSync('C:/Users/hasan/OrderKing/orderking-customers--orders-/src/routes/checkout.tsx', c, 'utf8');
