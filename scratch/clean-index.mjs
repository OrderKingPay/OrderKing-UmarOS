import fs from 'node:fs';

const filePath = 'c:/Users/hasan/OrderKing/HDmaster/src/routes/index.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove import TravelPage
content = content.replace(/import\s*\{\s*TravelPage\s*\}\s*from\s*["']@\/components\/travel\/TravelPage["'];\r?\n/, '');

// 2. Remove | "travel" from WorldId
content = content.replace(/\s*\|\s*"travel"/, '');

// 3. Remove world 4 from TEN_WORLDS / WORLDS array
// Let's locate World 4 block
const world4Start = content.indexOf('id: "travel",');
if (world4Start !== -1) {
  // find the opening brace before id: "travel"
  const braceStart = content.lastIndexOf('{', world4Start);
  // find the corresponding closing brace
  let depth = 0;
  let braceEnd = -1;
  for (let i = braceStart; i < content.length; i++) {
    if (content[i] === '{') depth++;
    else if (content[i] === '}') {
      depth--;
      if (depth === 0) {
        braceEnd = i;
        break;
      }
    }
  }
  if (braceEnd !== -1) {
    // include trailing comma if any
    let cutEnd = braceEnd + 1;
    while (cutEnd < content.length && (content[cutEnd] === ',' || content[cutEnd] === ' ' || content[cutEnd] === '\r' || content[cutEnd] === '\n')) {
      cutEnd++;
    }
    console.log(`Removing World 4 from WORLDS array (chars ${braceStart} to ${cutEnd})`);
    content = content.slice(0, braceStart) + content.slice(cutEnd);
  }
}

// 4. Update SUB_CATEGORY_TABS
content = content.replace(/travel:\s*\[[\s\S]*?\],\r?\n/, '');

// 5. Update DEFAULT_WORLD_TAB
content = content.replace(/travel:\s*["'][^"']+["'],\r?\n/, '');

// 6. Update TEAMS: team-07, team-08, team-09
content = content.replace(/\{\s*id:\s*"team-07"[\s\S]*?\},?\r?\n/g, '');
content = content.replace(/\{\s*id:\s*"team-08"[\s\S]*?\},?\r?\n/g, '');
content = content.replace(/\{\s*id:\s*"team-09"[\s\S]*?\},?\r?\n/g, '');

// 7. Remove World 4 local states: savedTrips, localJobs, tutor
content = content.replace(/\/\/\s*World 4: Saved Travel Itineraries[\s\S]*?const \[newTripRoute, setNewTripRoute\] = useState\(""\);\r?\n/, '');
content = content.replace(/\/\/\s*World 4: Local Kitchen & Rider Jobs[\s\S]*?const \[newJobVacancies, setNewJobVacancies\] = useState\("5"\);\r?\n/, '');
content = content.replace(/\/\/\s*World 4: AI Tutor Interactive Audio[\s\S]*?const \[completedLessons, setCompletedLessons\] = useState<string\[\]>\(\[\]\);\r?\n/, '');

// 8. Remove World 4 handlers: handleSaveTrip, handleDeleteTrip, handlePostJob, handleDeleteJob, handleSpeakLesson, handleToggleLessonComplete
content = content.replace(/const handleSaveTrip =[\s\S]*?recordLog\(`Saved travel booking reference[^\n]+\);\r?\n\s*\};\r?\n/, '');
content = content.replace(/const handleDeleteTrip =[\s\S]*?localStorage\.setItem\("orderking_saved_trips_v1"[^\n]+\);\r?\n\s*\}\s*catch[^\n]+\r?\n\s*\};\r?\n/, '');
content = content.replace(/\/\/\s*World 4: Post New Local Job\r?\n\s*const handlePostJob =[\s\S]*?recordLog\(`Posted new hiring opening[^\n]+\);\r?\n\s*\};\r?\n/, '');
content = content.replace(/const handleDeleteJob =[\s\S]*?recordLog\("Removed job opening from board"\);\r?\n\s*\};\r?\n/, '');
content = content.replace(/const handleSpeakLesson =[\s\S]*?recordLog\(`Playing audio lesson:[^\n]+\);\r?\n\s*\};\r?\n/, '');
content = content.replace(/const handleToggleLessonComplete =[\s\S]*?\};\r?\n/, '');

// 9. Remove dashboard travel cards
content = content.replace(/\{activeWorldId === "travel" && \([\s\S]*?<ResultMetricCard[\s\S]*?<\/div>\s*\)\}\r?\n/, '');
content = content.replace(/\{activeWorldId === "travel" && \(\s*<>\s*<ActionCard\s+title="Travel Provider Orchestration"[\s\S]*?<\/ActionCard>\s*<ActionCard\s+title="Post Jobs & Spoken English Tutor"[\s\S]*?<\/ActionCard>\s*<>\s*\)\}/, '');
// If actioncard regex didn't match due to fragments, let's do a more flexible replacement:
content = content.replace(/\{activeWorldId === "travel" && \([\s\S]*?title="Travel Provider Orchestration"[\s\S]*?<\/ActionCard>\s*<\/?>\s*\)\}/, '');
content = content.replace(/\{activeWorldId === "travel" && \([\s\S]*?<TravelPage \/>[\s\S]*?<\/section>\s*\)\}/, '');

// 10. Remove WORLD 4 SUB-CATEGORY TABS
const w4TabsStart = content.indexOf('WORLD 4 (`travel`) SUB-CATEGORY TABS');
if (w4TabsStart !== -1) {
  const commentStart = content.lastIndexOf('{/*', w4TabsStart);
  const w5TabsStart = content.indexOf('WORLD 5 (`b2b`) SUB-CATEGORY TABS');
  if (w5TabsStart !== -1) {
    const commentEnd = content.lastIndexOf('{/*', w5TabsStart);
    console.log(`Removing World 4 sub-category tabs block from char ${commentStart} to ${commentEnd}`);
    content = content.slice(0, commentStart) + content.slice(commentEnd);
  }
}

// 11. Clean any residual references in text/slogans
content = content.replace(/All 10 Worlds \(Home, OrderKing, King Pay, Travel & Work, B2B & CRM, UMAR AI, App & Design, Connections, Alerts, Settings\)/g, 'All 9 Worlds (Home, OrderKing, King Pay, B2B & CRM, UMAR AI, App & Design, Connections, Alerts, Settings)');
content = content.replace(/UMAR OS 10-World Founder Command Center/g, 'UMAR OS 9-World Founder Command Center');

// Renumber remaining worlds: 5->4, 6->5, 7->6, 8->7, 9->8, 10->9
content = content.replace(/number:\s*5,\s*navLabel:\s*"B2B & CRM",\s*emoji:\s*"💼",\s*icon:\s*Briefcase,\s*title:\s*"5\./g, 'number: 4, navLabel: "B2B & CRM", emoji: "💼", icon: Briefcase, title: "4.');
content = content.replace(/number:\s*6,\s*navLabel:\s*"UMAR AI",\s*emoji:\s*"🤖",\s*icon:\s*Bot,\s*title:\s*"6\./g, 'number: 5, navLabel: "UMAR AI", emoji: "🤖", icon: Bot, title: "5.');
content = content.replace(/number:\s*7,\s*navLabel:\s*"App & Design",\s*emoji:\s*"🎨",\s*icon:\s*Palette,\s*title:\s*"7\./g, 'number: 6, navLabel: "App & Design", emoji: "🎨", icon: Palette, title: "6.');
content = content.replace(/number:\s*8,\s*navLabel:\s*"Connections",\s*emoji:\s*"🔌",\s*icon:\s*Plug,\s*title:\s*"8\./g, 'number: 7, navLabel: "Connections", emoji: "🔌", icon: Plug, title: "7.');
content = content.replace(/number:\s*9,\s*navLabel:\s*"Alerts",\s*emoji:\s*"🚨",\s*icon:\s*ShieldAlert,\s*title:\s*"9\./g, 'number: 8, navLabel: "Alerts", emoji: "🚨", icon: ShieldAlert, title: "8.');
content = content.replace(/number:\s*10,\s*navLabel:\s*"Settings",\s*emoji:\s*"⚙️",\s*icon:\s*Sliders,\s*title:\s*"10\./g, 'number: 9, navLabel: "Settings", emoji: "⚙️", icon: Sliders, title: "9.');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully cleaned routes/index.tsx');
