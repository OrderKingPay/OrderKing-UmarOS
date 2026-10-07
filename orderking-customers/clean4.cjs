const fs = require('fs');

const p1 = 'C:/Users/hasan/OrderKing/orderking-customers/src/routes/king-pay.tsx';
if (fs.existsSync(p1)) {
    let c1 = fs.readFileSync(p1, 'utf8');
    c1 = c1.replace(/const LOAN_PRODUCTS: LoanProduct\[\] = \[[\s\S]*?\n\];/g, `const LOAN_PRODUCTS: LoanProduct[] = [];`);
    fs.writeFileSync(p1, c1);
}

console.log('done');
