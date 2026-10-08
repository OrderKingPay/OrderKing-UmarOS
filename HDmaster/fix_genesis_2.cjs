const fs = require('fs');

const cartPath = 'src/lib/orderking/ecosystem-core/customer-cart.ts';
let cartCode = fs.readFileSync(cartPath, 'utf8');
cartCode = cartCode.replace('const p = promo[0];', 'const p = promo[0] as any;');
cartCode = cartCode.replace('dbItem[0].price', '(dbItem[0] as any).price');
cartCode = cartCode.replace('!dbItem[0].is_available', '!(dbItem[0] as any).is_available');
cartCode = cartCode.replace('new Date(promo[0].valid_until)', 'new Date((promo[0] as any).valid_until)');
fs.writeFileSync(cartPath, cartCode);

const portalPath = 'src/lib/orderking/ecosystem-core/restaurant-portal.ts';
let portalCode = fs.readFileSync(portalPath, 'utf8');
// Replace sql.begin with a normal begin transaction
portalCode = portalCode.replace('return await sql.begin(async (tx: any) => {', `await sql\`BEGIN\`;
  try {
    const tx = sql;`);
portalCode = portalCode.replace('return earnings;\n  });', `await tx\`COMMIT\`;
    return earnings;
  } catch (err) {
    await sql\`ROLLBACK\`;
    throw err;
  }`);
fs.writeFileSync(portalPath, portalCode);

