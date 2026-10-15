const fs = require('fs');
const file = 'orderking-customers/src/components/market/shell.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /<nav\s+aria-label={brand\.appName}\s+className="fixed bottom-4 left-4 right-4 [^>]+>\s*<ul className="[^"]+grid-cols-5[^"]+">/;

const newNav = `<nav
            aria-label={brand.appName}
            className="fixed bottom-0 left-0 right-0 z-40 border-t border-amber-500/30 bg-gradient-to-t from-slate-950 via-slate-900 to-slate-950/95 pb-safe shadow-[0_-10px_40px_rgba(245,158,11,0.15)] overflow-hidden"
          >
            <ul className="mx-auto grid max-w-lg grid-cols-5 items-center justify-items-center relative px-2 py-2">`;

if (regex.test(content)) {
  content = content.replace(regex, newNav);
  fs.writeFileSync(file, content);
  console.log('Successfully updated nav');
} else {
  console.log('Regex did not match');
}
