import fs from 'node:fs';
import path from 'node:path';

const custSrc = 'c:/Users/hasan/OrderKing/orderking-customers/src';

// 1. routes/__root.tsx
{
  const file = path.join(custSrc, 'routes/__root.tsx');
  let c = fs.readFileSync(file, 'utf8');
  // Remove travelpayoutsDriveLoader and TravelpayoutsDriveHead
  c = c.replace(/\/\*\*[\s\S]*?Travelpayouts Drive installation[\s\S]*?function TravelpayoutsDriveHead\(\) \{[\s\S]*?\}\r?\n/, '');
  c = c.replace(/<TravelpayoutsDriveHead \/>\r?\n/g, '');
  fs.writeFileSync(file, c, 'utf8');
  console.log('Cleaned routes/__root.tsx');
}

// 2. routes/king-pay.tsx
{
  const file = path.join(custSrc, 'routes/king-pay.tsx');
  let c = fs.readFileSync(file, 'utf8');
  c = c.replace(/content: "KingPay — Pay Anyone, Travel, AI Tutor & Jobs"/g, 'content: "KingPay — Direct UPI, Dynamic BharatQR & Instant Payments"');
  c = c.replace(/content: "Direct UPI pay, dynamic BharatQR, travel booking, verified jobs, and AI Academic Tutor\."/g, 'content: "Direct UPI pay, dynamic BharatQR, instant refunds, and double-entry ledger security."');
  fs.writeFileSync(file, c, 'utf8');
  console.log('Cleaned routes/king-pay.tsx');
}

// 3. routes/kingpay/index.tsx
{
  const file = path.join(custSrc, 'routes/kingpay/index.tsx');
  let c = fs.readFileSync(file, 'utf8');
  c = c.replace(/content: "KingPay — Direct UPI, Bills, Travel & Jobs"/g, 'content: "KingPay — Direct UPI, Dynamic BharatQR & Instant Settlements"');
  c = c.replace(/content: "Direct UPI pay, utility bills directory via standard UPI PSPs, train PNR status, bus routes, verified fleet & mentor jobs, and AI Tutor\."/g, 'content: "Direct UPI pay, dynamic BharatQR, instant refunds, and double-entry mathematical ledger."');
  fs.writeFileSync(file, c, 'utf8');
  console.log('Cleaned routes/kingpay/index.tsx');
}

// 4. components/market/service-shortcuts.tsx
{
  const file = path.join(custSrc, 'components/market/service-shortcuts.tsx');
  let c = fs.readFileSync(file, 'utf8');
  c = c.replace(/\bPlane,\r?\n/g, '');
  c = c.replace(/\bGraduationCap,\r?\n/g, '');
  c = c.replace(/\bBriefcase,\r?\n/g, '');
  c = c.replace(
    /\{\s*key:\s*"travel"[\s\S]*?Icon:\s*Briefcase\s*\},?\r?\n/,
    `{ key: "kingpay", label: "KingPay", detail: "Direct UPI & BharatQR", to: "/kingpay", Icon: Crown },
  { key: "orders", label: "My Orders", detail: "Live delivery tracking", to: "/orders", Icon: ShoppingBag },\n`
  );
  fs.writeFileSync(file, c, 'utf8');
  console.log('Cleaned components/market/service-shortcuts.tsx');
}

// 5. components/fintech/kingpay-shell.tsx
{
  const file = path.join(custSrc, 'components/fintech/kingpay-shell.tsx');
  let c = fs.readFileSync(file, 'utf8');
  c = c.replace('"travel" | ', '');
  c = c.replace(/\{\s*label:\s*"Travel & Bookings"[\s\S]*?section:\s*"travel"\s*\},?\r?\n/, '');
  c = c.replace(/\{\/\* Travel \/ Flights Quick Pill \*\/\}[\s\S]*?<\/button>\r?\n/, '');
  c = c.replace(/, travel\.\.\./g, '...');
  fs.writeFileSync(file, c, 'utf8');
  console.log('Cleaned components/fintech/kingpay-shell.tsx');
}

// 6. components/fintech/kingpay-finance-search.tsx
{
  const file = path.join(custSrc, 'components/fintech/kingpay-finance-search.tsx');
  let c = fs.readFileSync(file, 'utf8');
  c = c.replace(/\{\s*id:\s*"train"[\s\S]*?subtitle:\s*"Zero payment gateway fee on ConfirmTkt & IRCTC bookings"[\s\S]*?\},?\r?\n/, '');
  c = c.replace('label: "Travel & Financial Services"', 'label: "Financial Services"');
  fs.writeFileSync(file, c, 'utf8');
  console.log('Cleaned components/fintech/kingpay-finance-search.tsx');
}

// 7. components/ai/customer-concierge-drawer.tsx
{
  const file = path.join(custSrc, 'components/ai/customer-concierge-drawer.tsx');
  let c = fs.readFileSync(file, 'utf8');
  c = c.replace('export type ConciergeArea = "food" | "kingpay" | "travel";', 'export type ConciergeArea = "food" | "kingpay";');
  c = c.replace('VIP Food & Travel Concierge', 'VIP Food & Order Concierge');
  c = c.replace(' | "BOOK_TRAVEL"', '');
  c = c.replace(/\/\/\s*3\.\s*Travel, Flights, Trains & Cab Bookings[\s\S]*?action:\s*\{\s*type:\s*"BOOK_TRAVEL"[^\n]+\},\r?\n\s*\}/, '');
  c = c.replace('{ label: "✈️ Travel & Flights", text: "Help me book a travel flight ticket or check PNR." },', '{ label: "👑 KingPay UPI", text: "How do I pay with Direct UPI or scan BharatQR?" },');
  fs.writeFileSync(file, c, 'utf8');
  console.log('Cleaned components/ai/customer-concierge-drawer.tsx');
}

// 8. components/ai/royal-ai-concierge.tsx
{
  const file = path.join(custSrc, 'components/ai/royal-ai-concierge.tsx');
  let c = fs.readFileSync(file, 'utf8');
  c = c.replace(/\s*\|\s*"OPEN_TRAVEL"/g, '');
  c = c.replace(/\s*onOpenTravel\?,?/g, '');
  c = c.replace(/\s*onOpenTravel,/g, '');
  c = c.replace(/\/\/\s*7\.\s*Flight & Travel Hub[\s\S]*?action:\s*\{\s*type:\s*"OPEN_TRAVEL"[^\n]+\},\r?\n\s*\}/, '');
  c = c.replace(/\} else if \(action\.type === "OPEN_TRAVEL"\) \{\r?\n\s*onOpenTravel\?\.<any>\(\);\r?\n/, '');
  fs.writeFileSync(file, c, 'utf8');
  console.log('Cleaned components/ai/royal-ai-concierge.tsx');
}

// 9. routes/account/index.tsx
{
  const file = path.join(custSrc, 'routes/account/index.tsx');
  let c = fs.readFileSync(file, 'utf8');
  c = c.replace('KingPay (Wallet, Bills &amp; Travel)', 'KingPay (Wallet, UPI &amp; Bills)');
  fs.writeFileSync(file, c, 'utf8');
  console.log('Cleaned routes/account/index.tsx');
}

// 10. routes/earn.tsx
{
  const file = path.join(custSrc, 'routes/earn.tsx');
  let c = fs.readFileSync(file, 'utf8');
  c = c.replace(/<Link\s+to="\/travel"[\s\S]*?<\/Link>/g, '');
  c = c.replace(/<Link\s+to="\/tutor"[\s\S]*?<\/Link>/g, '');
  fs.writeFileSync(file, c, 'utf8');
  console.log('Cleaned routes/earn.tsx');
}
