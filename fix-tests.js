const fs = require('fs');
const file = 'HDmaster/src/lib/orderking/platform-hardening.test.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/\"BRONZE\"/g, '"SILVER"');
content = content.replace(/\"DIAMOND\"/g, '"KING"');
content = content.replace(/\"PLATINUM\"/g, '"KING"');
content = content.replace(/pointsEarned/g, 'coinsEarned');
content = content.replace(/pointsBurned/g, 'coinsBurned');
content = content.replace(/remainingPoints/g, 'remainingCoins');
content = content.replace(/pointsToNextTier/g, 'coinsToNextTier');
content = content.replace(/earnRateBps/g, 'burnRateBps');

fs.writeFileSync(file, content);
