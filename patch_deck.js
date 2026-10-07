const fs = require('fs');
let file = 'HDmaster/src/components/command/founder-sovereign-deck.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add import
const importStr = 'import { UniversalFabricTab } from "./universal-fabric-tab";\n';
if (!content.includes('UniversalFabricTab')) {
    content = content.replace('import { FounderAiOsShell } from "./founder-ai-os-shell";', importStr + 'import { FounderAiOsShell } from "./founder-ai-os-shell";');
}

// Update the type of deckTab
content = content.replace(
    'useState<"supreme_ai" | "telemetry" | "creator" | "monetization" | "upgrader" | "accounting">',
    'useState<"supreme_ai" | "telemetry" | "creator" | "monetization" | "upgrader" | "accounting" | "fabric">'
);

// Add to Hubs Dropdown
const newHub = '{ id: "fabric", label: "Universal Fabric", icon: Sparkles },';
if (!content.includes('id: "fabric"')) {
    content = content.replace(
        '{ id: "creator", label: "1-Command App Creator", icon: Sparkles },',
        newHub + '\n                  { id: "creator", label: "1-Command App Creator", icon: Sparkles },'
    );
}

// Add the tab render
const tabRender = '{deckTab === "fabric" && <UniversalFabricTab />}\n';
if (!content.includes('<UniversalFabricTab />')) {
    content = content.replace(
        '{deckTab === "creator" && <SupremeCreatorEngine />}',
        tabRender + '\n        {deckTab === "creator" && <SupremeCreatorEngine />}'
    );
}

fs.writeFileSync(file, content);
