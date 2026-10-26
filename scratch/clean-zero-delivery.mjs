import fs from 'node:fs';

const filePath = 'c:/Users/hasan/OrderKing/orderking-customers/src/components/market/zero-delivery-fallback-card.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Icons
content = content.replace(/\bPlane,\r?\n/g, '');
content = content.replace(/\bTrain,\r?\n/g, '');
content = content.replace(/\bGraduationCap,\r?\n/g, '');
content = content.replace(/\bBriefcase,\r?\n/g, '');

// Texts
content = content.replace(
  'financial, travel, and learning services below.',
  'fintech and grocery services below.'
);
content = content.replace(
  /<strong className="font-bold text-stone-900">22:00–06:00 Night Desk:<\/strong>[\s\S]*?<\/p>/,
  '<strong className="font-bold text-stone-900">24/7 KingPay UPI:</strong> Instant dynamic BharatQR, peer-to-peer transfers, and instant cashback wallet settlements.</p>'
);
content = content.replace(
  /<strong className="font-bold text-stone-900">Morning Essentials:<\/strong>[\s\S]*?<\/p>/,
  '<strong className="font-bold text-stone-900">Mart Groceries:</strong> Essential pantry goods, groceries, and packaged foods shipped across verified zones.</p>'
);

// Services 2 & 3 removal
const servicesToRemoveRegex = /\{\/\* Service 2: Travel Concierge \*\/\}[\s\S]*?\{\/\* Service 4: Mart \/ Essentials \*\/\}/;
content = content.replace(servicesToRemoveRegex, '{/* Service 2: Mart / Essentials */}');

// Grid change from md:grid-cols-2 lg:grid-cols-4 to md:grid-cols-2
content = content.replace(
  'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4',
  'grid grid-cols-1 md:grid-cols-2 gap-4'
);

// Footer pills
content = content.replace(
  /<span>Direct verified tutor profiles<\/span>\s*<span>·<\/span>/g,
  ''
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Cleaned zero-delivery-fallback-card.tsx');
