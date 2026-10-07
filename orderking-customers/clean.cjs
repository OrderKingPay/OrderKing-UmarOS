const fs = require('fs');
const p1 = 'C:/Users/hasan/OrderKing/orderking-customers/src/routes/king-pay.tsx';
let c1 = fs.readFileSync(p1, 'utf8');

c1 = c1.replace(/const handleFetchBBPSBill = async \(\) => \{[\s\S]*?\n  \};/g, `const handleFetchBBPSBill = async () => {\n    toast.error('BBPS integration coming soon - Under Development');\n  };`);

c1 = c1.replace(/const handlePayBBPSBill = async \(\) => \{[\s\S]*?\n  \};/g, `const handlePayBBPSBill = async () => {\n    toast.error('BBPS integration coming soon - Under Development');\n  };`);

// Replace loan data with an empty array or remove it
c1 = c1.replace(/export const MICRO_LOAN_PARTNERS = \[[\s\S]*?\];/g, `export const MICRO_LOAN_PARTNERS: any[] = [];`);
c1 = c1.replace(/export const KINGPAY_ESCROW_ACCOUNTS = \[[\s\S]*?\];/g, `export const KINGPAY_ESCROW_ACCOUNTS: any[] = [];`);

fs.writeFileSync(p1, c1);
console.log('done');
