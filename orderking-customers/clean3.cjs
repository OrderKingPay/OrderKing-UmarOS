const fs = require('fs');

const p3 = 'C:/Users/hasan/OrderKing/orderking-customers/src/components/fintech/kingpay-account-hub.tsx';
if (fs.existsSync(p3)) {
    let c3 = fs.readFileSync(p3, 'utf8');
    c3 = c3.replace(/useEffect\(\(\) => \{\n    fetch\("\/api\/escrow\/status"\)\n      \.then\(r => r\.json\(\)\)\n      \.then\(data => setEscrowStatus\(data\)\)\n      \.catch\(\(\) => \{\}\);\n  \}, \[\]\);/g, `// useEffect(() => { fetch('/api/escrow/status') })`);
    
    // Also remove fake account numbers if any inside kingpay-account-hub.tsx
    
    fs.writeFileSync(p3, c3);
}

console.log('done');
