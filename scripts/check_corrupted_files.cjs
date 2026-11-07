const { execSync } = require('child_process');
const fs = require('fs');

const files = [
  'HDmaster/src/components/command/commercial-command-dials.tsx',
  'HDmaster/src/components/command/order-king-command-suite-modal.tsx',
  'HDmaster/src/components/command/standalone-exporter-modal.tsx',
  'HDmaster/src/components/customization/UmarOsVisualCustomizationStudio.tsx',
  'HDmaster/src/components/dashboard/MetaOmnichannelHub.tsx',
  'HDmaster/src/components/dashboard/UmarOS_AI_Terminal.tsx',
  'HDmaster/src/components/franchise/B2BSaaSSalesDeckGenerator.tsx',
  'HDmaster/src/components/playbook/launch-playbook-view.tsx',
  'HDmaster/src/components/pricing/CentralPricingSwitch.tsx',
  'orderking-customers/src/components/ai/capability-benchmark-hub.tsx',
  'orderking-customers/src/components/ai/emergency-recovery-hub.tsx',
  'orderking-customers/src/components/ai/supreme-founder-ai-chat.tsx',
  'orderking-customers/src/components/kingpay/remittance-desk.tsx',
  'orderking-customers/src/components/market/live-chat-support-modal.tsx',
  'orderking-customers/src/components/market/voice-search-dialog.tsx',
  'orderking-customers/src/components/travel/train-booking-engine.tsx',
  'orderking-customers/src/lib/security/xss.ts',
  'orderking-customers/src/routes/account/index.tsx',
  'orderking-customers/src/routes/api/og.ts',
  'orderking-customers/src/routes/api/sitemap.ts',
  'orderking-customers/src/routes/legal/privacy.tsx',
  'orderking-customers/src/routes/legal/terms.tsx',
  'orderking-customers/src/routes/search.tsx',
  'orderking-customers/src/routes/travel/index.tsx',
  'orderking-customers/src/routes/travel/trips.tsx',
  'orderking-customers/src/test/crypto-security.test.ts',
  'orderking-partners/src/components/kitchen-display-station.tsx',
  'orderking-partners/src/components/settings/catalogue-stock-controls-panel.tsx',
  'orderking-partners/src/components/settings/kingpay-soundbox-settings-panel.tsx',
  'orderking-partners/src/components/settings/thermal-printer-hardware-panel.tsx',
  'orderking-riders/src/components/rider/delivery-actions.tsx',
  'orderking-riders/src/components/rider/vip-ambassador-pass.tsx',
  'orderking-riders/src/routes/assistant.tsx',
  'orderking-riders/src/routes/earnings.tsx'
];

for (const file of files) {
  try {
    const diff = execSync(`git diff HEAD~1..HEAD -- "${file}"`, { encoding: 'utf8' });
    const changes = diff.split(/\r?\n/).filter(l => (l.startsWith('+') || l.startsWith('-')) && !l.startsWith('+++') && !l.startsWith('---'));
    console.log(`${file}: ${changes.length} changed lines`);
    // Print lines to see if only entity unescape changed
    for (const c of changes) {
      console.log('  ', c);
    }
  } catch (e) {
    console.error(file, e.message);
  }
}
