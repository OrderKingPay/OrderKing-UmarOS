import fs from 'node:fs';

const filePath = 'c:/Users/hasan/OrderKing/orderking-customers/src/components/market/ultra-luxury-ecosystem-footer.tsx';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/\bPlane,\r?\n/g, '');
content = content.replace(/\bGraduationCap,\r?\n/g, '');

const travelAndTutorCardsRegex = /\{\/\* 3\. SOVEREIGN TRAVEL[\s\S]*?\{\/\* 5\. ROYAL DINING/;
content = content.replace(travelAndTutorCardsRegex, '{/* 3. ROYAL DINING');

content = content.replace(
  'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5',
  'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5'
);

content = content.replace(/<span>Review travel fees<\/span>\s*<span>·<\/span>/g, '');
content = content.replace(/<span>Travel services depend on providers<\/span>\s*<span>·<\/span>/g, '');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Cleaned ultra-luxury-ecosystem-footer.tsx');
