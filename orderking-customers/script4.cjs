const fs = require('fs');
const file = 'src/routes/king-pay.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/const \[kingCoins, setKingCoins\] = useState\(4200\);/g, '');
content = content.replace(/setKingCoins\(\(prev\) => /g, 'setKingCoins(');
content = content.replace(/setKingCoins\(\(c\) => /g, 'setKingCoins(');

fs.writeFileSync(file, content, 'utf8');
