const fs = require('fs');
const files = [
  'Archive_Legacy_Roshoi_Do_Not_Delete/roshoi-customers--orders-/src/components/map.tsx',
  'Archive_Legacy_Roshoi_Do_Not_Delete/roshoi-partners/src/components/delivery-map.tsx',
  'Archive_Legacy_Roshoi_Do_Not_Delete/roshoi-riders/src/components/delivery-map.tsx',
  'Archive_Legacy_Roshoi_Do_Not_Delete/roshoi-riders/src/routes/active-order.tsx',
  'orderking-customers/src/components/map.tsx',
  'orderking-partners/src/components/delivery-map.tsx',
  'orderking-riders/src/components/delivery-map.tsx',
  'orderking-riders/src/routes/active-order.tsx'
];

for (const file of files) {
  try {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/AIzaSyD[a-zA-Z0-9_\-]+/g, 'import.meta.env.VITE_GOOGLE_MAPS_API_KEY');
    fs.writeFileSync(file, content);
    console.log('Scrubbed: ' + file);
  } catch(e) {
    console.log('Error reading: ' + file);
  }
}
