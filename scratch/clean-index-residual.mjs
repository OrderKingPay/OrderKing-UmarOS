import fs from 'node:fs';

const filePath = 'c:/Users/hasan/OrderKing/HDmaster/src/routes/index.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Clean selectWorld
content = content.replace(
  `    const targetDefault = DEFAULT_WORLD_TAB[validWorld] || (validWorld === "travel" ? "travel-hub" : "dashboard");
    const resolvedTab =
      validWorld === "travel" && (!tabId || tabId === "dashboard")
        ? "travel-hub"
        : tabId && validTabs.includes(tabId)
        ? tabId
        : activeTabs[validWorld] && validTabs.includes(activeTabs[validWorld])
        ? activeTabs[validWorld]
        : targetDefault;`,
  `    const targetDefault = DEFAULT_WORLD_TAB[validWorld] || "dashboard";
    const resolvedTab =
      tabId && validTabs.includes(tabId)
        ? tabId
        : activeTabs[validWorld] && validTabs.includes(activeTabs[validWorld])
        ? activeTabs[validWorld]
        : targetDefault;`
);

// Clean handleAddTrip
content = content.replace(
  /\/\/\s*World 4: Add New Trip Reference[\s\S]*?recordLog\(`Saved travel booking reference[^\n]+\);\r?\n\s*\};\r?\n/,
  ''
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Cleaned residual index.tsx items.');
