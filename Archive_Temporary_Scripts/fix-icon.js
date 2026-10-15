const fs = require('fs');
const file = 'orderking-customers/src/routes/__root.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace('{ rel: "icon", type: "image/jpeg", href: "/logo.jpg" }', '{ rel: "icon", type: "image/png", href: "/icon-192.png" }');
fs.writeFileSync(file, content);
console.log('Fixed icon link');
