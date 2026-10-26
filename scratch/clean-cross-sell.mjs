import fs from 'node:fs';

const filePath = 'c:/Users/hasan/OrderKing/orderking-customers/src/components/market/contextual-cross-sell-bar.tsx';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/import\s*\{\s*Plane,\s*GraduationCap,\s*/g, 'import { ');
content = content.replace(/Plane,\s*/g, '');
content = content.replace(/GraduationCap,\s*/g, '');

content = content.replace(
  'KingPay UPI, Travel, Tutor &amp; Jobs, and Mart are active nationwide.',
  'KingPay UPI and Mart Grocery are active nationwide.'
);
content = content.replace(
  '24/7 KingPay UPI recharges, live IRCTC train PNR tracking, and outstation rides.',
  '24/7 KingPay UPI transfers, dynamic BharatQR, and Mart deliveries.'
);
content = content.replace(
  'Instant bill payments, travel bookings, and direct tutor connections active across India.',
  'Instant bill payments, KingPay UPI transfers, and local restaurant delivery.'
);

// Remove travel and tutor links
content = content.replace(/<Link\s+to="\/travel"[\s\S]*?<\/Link>\s*<Link\s+to="\/tutor"[\s\S]*?<\/Link>/, '');
content = content.replace(/<Link\s+to="\/travel"[\s\S]*?<span>Train PNR &amp; Travel<\/span>\s*<\/Link>/, '');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Cleaned contextual-cross-sell-bar.tsx');
