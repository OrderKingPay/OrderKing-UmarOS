const fs = require('fs');

const p2 = 'C:/Users/hasan/OrderKing/orderking-customers/src/components/fintech/micro-loan-hub.tsx';
if (fs.existsSync(p2)) {
    let c2 = fs.readFileSync(p2, 'utf8');
    c2 = c2.replace(/const res = await fetch\("\/api\/loans\/apply", \{[\s\S]*?\}\);/g, `toast.error('Loan integration coming soon - Under Development');\n      return;`);
    fs.writeFileSync(p2, c2);
}

console.log('done');
