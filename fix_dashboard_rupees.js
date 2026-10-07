const fs = require('fs');
const path = 'orderking-partners/src/routes/dashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

const targetStr = '<Card className="border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-surface to-transparent p-4">';
const endStr = '</Card>';
const startIdx = content.indexOf(targetStr);
const endIdx = content.indexOf(endStr, startIdx) + endStr.length;

if (startIdx !== -1) {
  const replacement = `<Card className="border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-surface to-transparent p-4">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-amber-500/20 text-lg">
              👑
            </span>
            <div>
              <h3 className="text-sm font-bold text-fg">Strategic Partner Alliance</h3>
              <p className="text-[11px] text-slate-400">OrderKing Ecosystem Advantage</p>
            </div>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-400">
            You retain <strong className="text-fg">maximum revenue share</strong> per order with OrderKing's transparent growth model. Enjoy increased order volume, premium brand visibility, and optimized logistics—putting restaurant growth first.
          </p>
        </Card>`;
  content = content.substring(0, startIdx) + replacement + content.substring(endIdx);
}

// Blur the MoneyText
content = content.replace(/<MoneyText([^>]+)\/>/g, '<span className="blur-sm hover:blur-none transition-all cursor-pointer select-none"><MoneyText$1/></span>');

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed dashboard text');
