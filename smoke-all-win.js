const { execSync, spawn } = require('child_process');
const fs = require('fs');

if (!fs.existsSync('workspace')) fs.mkdirSync('workspace');

const apps = [
  { name: 'HDmaster', url: 'http://127.0.0.1:4173/login' },
  { name: 'orderking-customers', url: 'http://127.0.0.1:4173/' },
  { name: 'orderking-partners', url: 'http://127.0.0.1:4173/' },
  { name: 'orderking-riders', url: 'http://127.0.0.1:4173/' },
  { name: 'Apps-integration-', url: 'http://127.0.0.1:4173/' }
];
let success = true;

async function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function runAll() {
  for (const app of apps) {
    console.log('--- Smoke testing ' + app.name + ' ---');
    const preview = spawn('npx', ['vite', 'preview'], { cwd: app.name, shell: true });
    
    await sleep(5000); // wait for server to boot

    try {
      execSync('node scripts/browser-smoke.mjs ' + app.url + ' C:/Users/hasan/OrderKing/workspace/' + app.name + '.png', { cwd: app.name, stdio: 'inherit' });
      console.log(app.name + ' SMOKE TEST PASSED.');
    } catch (err) {
      console.error(app.name + ' SMOKE TEST FAILED!');
      success = false;
    } finally {
      preview.kill();
    }
  }
  if (!success) process.exit(1);
}

runAll();
