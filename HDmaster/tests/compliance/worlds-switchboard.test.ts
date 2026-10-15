import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

test('UmarOS 10-Worlds Switchboard - All 10 Worlds & Sub-Category Tabs Integrity', () => {
  const indexPath = path.resolve('src/routes/index.tsx');
  assert.ok(fs.existsSync(indexPath), 'HDmaster/src/routes/index.tsx must exist');

  const content = fs.readFileSync(indexPath, 'utf8');

  const EXPECTED_WORLDS = [
    'home',
    'orderking',
    'kingpay',
    'travel',
    'b2b',
    'umarai',
    'design',
    'connections',
    'alerts',
    'settings',
  ];

  // 1. Verify all 10 Worlds are present in WorldId type
  for (const worldId of EXPECTED_WORLDS) {
    assert.ok(
      content.includes(`| "${worldId}"`),
      `WorldId must include "${worldId}"`
    );
  }

  // 2. Verify SUB_CATEGORY_TABS definition
  const expectedTabs: Record<string, string[]> = {
    home: ['dashboard', 'worlds-map', 'checklist', 'legal', 'settings'],
    orderking: [
      'dashboard',
      'orders',
      'restaurants',
      'riders',
      'customers',
      'dispatch',
      'settings',
    ],
    kingpay: [
      'dashboard',
      'profit',
      'wallet-mdr',
      'master-switch',
      'commissions',
      'settings',
    ],
    travel: [
      'dashboard',
      'travel-hub',
      'my-trips',
      'ai-tutor',
      'jobs',
      'settings',
    ],
    b2b: ['dashboard', 'sales-deck', 'franchise', 'crm-pipeline', 'settings'],
    umarai: ['dashboard', 'ask-ai', 'teams', 'benchmarks', 'settings'],
    design: [
      'dashboard',
      'app-look',
      'banners',
      'app-builder',
      'design-studio',
      'media-studio',
      'social-studio',
      'settings',
    ],
    connections: ['dashboard', 'plugins', 'map-zones', 'settings'],
    alerts: [
      'dashboard',
      'action-center',
      'create-alert',
      'fair-policy',
      'settings',
    ],
    settings: [
      'dashboard',
      'all-worlds',
      'languages',
      'activity-log',
      'settings',
    ],
  };

  for (const [worldId, tabs] of Object.entries(expectedTabs)) {
    for (const tabId of tabs) {
      assert.ok(
        content.includes(`"${tabId}"`),
        `World "${worldId}" must define tab "${tabId}"`
      );
    }
  }

  // 3. Verify DEFAULT_WORLD_TAB has valid entries
  for (const worldId of EXPECTED_WORLDS) {
    if (worldId === 'travel') {
      assert.ok(
        content.includes('travel: "travel-hub"') || content.includes('travel: "dashboard"'),
        'DEFAULT_WORLD_TAB must have valid default tab for travel (travel-hub or dashboard)'
      );
    } else {
      assert.ok(
        content.includes(`${worldId}: "dashboard"`),
        `DEFAULT_WORLD_TAB must have default tab for ${worldId}`
      );
    }
  }

  // 4. Verify World 4 (travel) renders full TravelPage orchestration view under dashboard and travel-hub
  assert.ok(
    content.includes('import { TravelPage } from "@/components/travel/TravelPage"'),
    'index.tsx must import TravelPage component'
  );

  // TravelPage under dashboard
  const travelInDashboardPattern = /activeWorldId === "travel"[\s\S]*?<TravelPage \/>/g;
  assert.ok(
    travelInDashboardPattern.test(content),
    'World 4 (travel) must render <TravelPage /> under dashboard'
  );

  // TravelPage under travel-hub
  assert.ok(
    content.includes('currentTabId === "travel-hub"'),
    'World 4 (travel) must have travel-hub sub-category tab'
  );
  const travelInHubPattern = /currentTabId === "travel-hub"[\s\S]*?<TravelPage \/>/g;
  assert.ok(
    travelInHubPattern.test(content),
    'World 4 (travel) must render <TravelPage /> under travel-hub tab'
  );

  // 5. Verify Zero Blank/White Sections - every tab has concrete JSX rendering
  for (const [worldId, tabs] of Object.entries(expectedTabs)) {
    for (const tabId of tabs) {
      if (tabId === 'dashboard') {
        assert.ok(
          content.includes(`activeWorldId === "${worldId}"`),
          `Dashboard Box 1 must handle world "${worldId}"`
        );
      } else if (tabId === 'settings') {
        assert.ok(
          content.includes('currentTabId === "settings"'),
          'Full settings panel must handle settings tab'
        );
      } else {
        const condition = `activeWorldId === "${worldId}" && currentTabId === "${tabId}"`;
        assert.ok(
          content.includes(condition),
          `Must have explicit render condition: ${condition}`
        );
      }
    }
  }

  // 6. Verify ErrorBoundary and Fallback Card shielding
  assert.ok(
    content.includes('<AdminErrorBoundary'),
    'Stage viewport must be protected by AdminErrorBoundary'
  );
  assert.ok(
    content.includes('!currentWorld.tabs.some'),
    'Safety fallback card must exist for unmatched tabs'
  );

  // 7. Verify all 16 Specialist Teams have valid worlds and tabs
  const teamWorldRegex = /worldId:\s*"([^"]+)"\s*as\s*WorldId,\s*tabId:\s*"([^"]+)"/g;
  let match;
  let teamCount = 0;
  while ((match = teamWorldRegex.exec(content)) !== null) {
    teamCount++;
    const [_, teamWorld, teamTab] = match;
    assert.ok(
      EXPECTED_WORLDS.includes(teamWorld),
      `Team target world "${teamWorld}" must be one of the 10 Worlds`
    );
    assert.ok(
      expectedTabs[teamWorld]?.includes(teamTab),
      `Team target tab "${teamTab}" must exist in world "${teamWorld}"`
    );
  }
  assert.strictEqual(teamCount, 16, 'All 16 Specialist Teams must be mapped');
});
