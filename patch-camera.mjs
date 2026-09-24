import fs from 'fs';

const projects = ['HDmaster', 'orderking-customers', 'orderking-partners', 'orderking-riders', 'Apps-integration-'];
for (const p of projects) {
  const file = p + '/vercel.json';
  if (fs.existsSync(file)) {
    let c = fs.readFileSync(file, 'utf8');
    c = c.replace(/"camera=\(\)"/g, '"camera=(self)"');
    fs.writeFileSync(file, c);
    console.log('Fixed', file);
  }
}

// Remove banner from customer app
const kingPayFile = 'orderking-customers/src/routes/king-pay.tsx';
if (fs.existsSync(kingPayFile)) {
  let kp = fs.readFileSync(kingPayFile, 'utf8');
  // Remove the div containing DEMO MODE
  kp = kp.replace(/<div className="w-full bg-red-600 text-white text-center text-\[10px\] font-black py-1\.5 tracking-widest z-\[999\] \nrelative uppercase border-b border-red-700">\n\s*⚠️ DEMO MODE: SYNTHETIC DATA\. NOT CONNECTED TO PRODUCTION FINANCIAL LEDGER ⚠️\n\s*<\/div>/g, '');
  // Also on a single line if it collapsed
  kp = kp.replace(/<div className="w-full bg-red-600 text-white text-center text-\[10px\] font-black py-1\.5 tracking-widest z-\[999\] relative uppercase border-b border-red-700">\s*⚠️ DEMO MODE: SYNTHETIC DATA\. NOT CONNECTED TO PRODUCTION FINANCIAL LEDGER ⚠️\s*<\/div>/g, '');
  
  fs.writeFileSync(kingPayFile, kp);
  console.log('Removed demo banner');
}
