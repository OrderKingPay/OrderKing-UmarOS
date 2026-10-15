const fs = require('fs');
const path = 'C:/Users/hasan/OrderKing/orderking-customers/src/components/market/restaurant-card.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  '// High-end UI realism details',
  '// High-fidelity UI realism details'
).replace(
  'const distance = `${(Math.random() * 4 + 0.5).toFixed(1)} km away in Koramangala`;',
  `const microLocations = ["Koramangala 5th Block", "Indiranagar 100ft Rd", "HSR Layout Sector 2", "Bandra West", "Connaught Place"];\n  const exactLocation = microLocations[Math.floor(Math.random() * microLocations.length)];\n  const distance = \`\${(Math.random() * 4 + 0.5).toFixed(1)} km away in \${exactLocation}\`;`
).replace(
  'const vehicle = "Delivering via Electric Bike";',
  `const vehicles = ["Delivering via Electric Yulu", "Delivering via Ather 450X", "Delivering via Ola S1 Pro", "Delivering via TVS iQube"];\n  const vehicle = vehicles[Math.floor(Math.random() * vehicles.length)];`
).replace(
  'const surge = "Rain Surge ⚡ +₹20";',
  `const isSurge = Math.random() > 0.7;\n  const surgeAmt = Math.floor(Math.random() * 15) + 10;\n  const surge = isSurge ? \`Rain Surge ⚡ +₹\${surgeAmt}\` : null;`
).replace(
  'const cookingStatus = "Live: Firing the Wok";',
  `const statuses = ["Live: Firing the Wok", "Live: Packing your order", "Live: Tandoor is hot", "Live: Preparing ingredients"];\n  const cookingStatus = statuses[Math.floor(Math.random() * statuses.length)];`
);

fs.writeFileSync(path, content, 'utf8');
