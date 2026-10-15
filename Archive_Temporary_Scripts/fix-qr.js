const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'orderking-customers/src/components/fintech/receive-money-qr-studio.tsx');
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/import QRCode from 'qrcode';\r?\n/, '');

const newBlock = `  // Generate QR Code on change
  useEffect(() => {
    const uri = generateUpiUri();
    const url = \`https://api.qrserver.com/v1/create-qr-code/?size=480x480&data=\${encodeURIComponent(uri)}&bgcolor=FFFFFF&color=0F172A\`;
    setQrDataUrl(url);
  }, [upiId, payeeName, amount, note]);`;

const regex = /\/\/\s*Generate QR Code on change[\s\S]*?\}, \[upiId, payeeName, amount, note\]\);/;
code = code.replace(regex, newBlock);

fs.writeFileSync(file, code);
console.log('Fixed QR code!');
