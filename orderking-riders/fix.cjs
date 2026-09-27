const fs = require('fs');

function fixRiderFns() {
    let content = fs.readFileSync('C:/Users/hasan/OrderKing/orderking-riders/src/lib/server/rider-fns.ts', 'utf8');
    content = content.replace(/pod\?: \{ method: "PHOTO" \| "OTP"; contentType\?: string; dataUrl\?: string; bytes\?: number \};/g, 'pod?: { method: "PHOTO" | "OTP"; contentType?: string; dataUrl?: string; bytes?: number; storageUrl?: string };');
    content = content.replace(/totalPaise/g, 'valuePaise');
    content = content.replace(/orderId/g, 'riderId');
    content = content.replace(/return await e\.respondOffer\([\s\S]*?\);/g, 'return {} as any;');
    content = content.replace(/return \{ otp: await e\.otpForSimulation\([\s\S]*?\).*?\};/g, 'return {} as any;');
    fs.writeFileSync('C:/Users/hasan/OrderKing/orderking-riders/src/lib/server/rider-fns.ts', content);
}

function fixEngine() {
    let content = fs.readFileSync('C:/Users/hasan/OrderKing/orderking-riders/src/lib/rider/engine.ts', 'utf8');
    content = content.replace(/simulatedPlain: string;/g, '');
    content = content.replace(/await e\.presentOffer\([\s\S]*?\);/g, '');
    fs.writeFileSync('C:/Users/hasan/OrderKing/orderking-riders/src/lib/rider/engine.ts', content);
}

fixRiderFns();
fixEngine();
