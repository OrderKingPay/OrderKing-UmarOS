const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('C:\\Users\\hasan\\OrderKing\\orderking-customers\\src');

let totalChanges = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    // Supreme Luxury Class Replacements
    content = content.replace(/bg-zinc-950/g, 'bg-black');
    content = content.replace(/bg-zinc-900/g, 'bg-surface');
    content = content.replace(/bg-zinc-800/g, 'bg-surface-2');
    content = content.replace(/border-zinc-800/g, 'border-white/10');
    content = content.replace(/border-zinc-700/g, 'border-white/20');
    content = content.replace(/text-zinc-400/g, 'text-muted');
    content = content.replace(/text-zinc-500/g, 'text-subtle');
    content = content.replace(/text-zinc-600/g, 'text-subtle');
    content = content.replace(/text-zinc-300/g, 'text-gray-300');
    content = content.replace(/bg-zinc-100/g, 'bg-white/10');
    content = content.replace(/text-zinc-900/g, 'text-black');
    content = content.replace(/bg-zinc-50/g, 'bg-white/5');
    
    // Fix growth widget text
    if (file.includes('growth-widget.tsx')) {
        content = content.replace('Invite Friends. <br/>', 'Extend Access. <br/>');
        content = content.replace('Earn ₹500 instantly.', 'Grant ₹500 in Courtesy Credits.');
        content = content.replace('When your friend places their first order, both of you receive ₹500 in your wallet. No hidden terms.', 'Upon their first acquisition, both parties receive a ₹500 courtesy credit in their KingPay reserve. By invitation only.');
        content = content.replace('REFERRAL REWARD', 'MEMBERSHIP PRIVILEGE');
        content = content.replace('Your Invite Link', 'Private Invitation');
    }

    // Replace gradient texts in growth widget to gold/luxury theme
    content = content.replace(/from-emerald-400 to-cyan-400/g, 'from-[#D4AF37] to-[#F59E0B]');
    content = content.replace(/bg-emerald-500\/20/g, 'bg-[#D4AF37]/10');
    content = content.replace(/bg-blue-600\/20/g, 'bg-[#D4AF37]/5');
    
    // Replace text-white with text-fg so it responds to dark/light appropriately and has good contrast
    content = content.replace(/text-white/g, 'text-fg');
    
    if (content !== original) {
        fs.writeFileSync(file, content);
        totalChanges++;
    }
}

console.log('Modified ' + totalChanges + ' files.');
