import fs from 'node:fs';

const filePath = 'c:/Users/hasan/OrderKing/HDmaster/src/routes/index.tsx';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  /const targetDefault = DEFAULT_WORLD_TAB\[validWorld\][\s\S]*?: targetDefault;/,
  `const targetDefault = DEFAULT_WORLD_TAB[validWorld] || "dashboard";
    const resolvedTab =
      tabId && validTabs.includes(tabId)
        ? tabId
        : activeTabs[validWorld] && validTabs.includes(activeTabs[validWorld])
        ? activeTabs[validWorld]
        : targetDefault;`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done regex replace in index.tsx');
