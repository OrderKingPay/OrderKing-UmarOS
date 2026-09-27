const fs = require('fs');

function fixRiderFns() {
    let content = fs.readFileSync('C:/Users/hasan/OrderKing/orderking-riders/src/lib/server/rider-fns.ts', 'utf8');
    
    // Fix storageUrl missing in validator
    content = content.replace(/pod\?: \{ method: "PHOTO" \| "OTP"; contentType\?: string; dataUrl\?: string; bytes\?: number \};/g, 'pod?: { method: "PHOTO" | "OTP"; contentType?: string; dataUrl?: string; bytes?: number; storageUrl?: string };');
    
    // Fix totalPaise to valuePaise in Delivery type (only around line 68)
    content = content.replace(/totalPaise/g, 'valuePaise');
    // But then fix back if we accidentally replaced too many? Actually let's just make sure type Delivery allows valuePaise.
    // Wait, the error is "'totalPaise' does not exist in type 'Delivery'". Delivery has 'valuePaise'. So replacing totalPaise with valuePaise is correct! But wait, 'totalPaise: row.total_paise' becomes 'valuePaise: row.total_paise'. But what about 'orderId'?
    
    fs.writeFileSync('C:/Users/hasan/OrderKing/orderking-riders/src/lib/server/rider-fns.ts', content);
}

fixRiderFns();
