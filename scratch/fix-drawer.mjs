import fs from 'node:fs';

const filePath = 'c:/Users/hasan/OrderKing/orderking-customers/src/components/ai/customer-concierge-drawer.tsx';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  `    ;
    }

    // 4. KingPay, UPI QR Scanner & Utility Bills`,
  `    // 4. KingPay, UPI QR Scanner & Utility Bills`
);

content = content.replace(
  'I am your OrderKing Food & Travel concierge. I can guide you through authentic local feasts, track active deliveries, resolve order inquiries, or assist with flights, trains, hotels, and KingPay.',
  'I am your OrderKing Food & Dining concierge. I can guide you through authentic local feasts, track active deliveries, resolve order inquiries, or assist with KingPay.'
);

content = content.replace('OrderKing VIP Food & Travel Concierge', 'OrderKing VIP Food & Dining Concierge');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed customer-concierge-drawer.tsx');
