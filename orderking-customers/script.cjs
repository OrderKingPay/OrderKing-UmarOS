const fs = require('fs');
const file = 'src/routes/king-pay.tsx';
let content = fs.readFileSync(file, 'utf8');

const hookImport = `import { useRealKingPayWallet } from "@/lib/hooks/use-real-kingpay-wallet";\n`;
content = content.replace('import { useState, useEffect } from "react";', 'import { useState, useEffect } from "react";\n' + hookImport);

content = content.replace('const [walletBalance, setWalletBalance] = useState(750);', 'const { walletBalance, setWalletBalance, kingCoins, setKingCoins } = useRealKingPayWallet();');
content = content.replace('const [kingCoins, setKingCoins] = useState(4200);', '');

fs.writeFileSync(file, content, 'utf8');
