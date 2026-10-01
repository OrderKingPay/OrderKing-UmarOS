const { execSync } = require('child_process');
const apps = [
  { name: 'HDmaster', url: 'http://127.0.0.1:8081/login' },
  { name: 'orderking-customers', url: 'http://127.0.0.1:8081/' },
  { name: 'orderking-partners', url: 'http://127.0.0.1:8081/' },
  { name: 'orderking-riders', url: 'http://127.0.0.1:8081/' },
  { name: 'Apps-integration-', url: 'http://127.0.0.1:8081/' }
];
let success = true;
for (const app of apps) {
  console.log('--- Smoke testing ' + app.name + ' ---');
  try {
    execSync('node scripts/preview.mjs restart', { cwd: app.name, stdio: 'inherit' });
    execSync('node scripts/browser-smoke.mjs ' + app.url + ' C:/Users/hasan/OrderKing/workspace/' + app.name + '.png', { cwd: app.name, stdio: 'inherit' });
    console.log(app.name + ' SMOKE TEST PASSED.');
  } catch (err) {
    console.error(app.name + ' SMOKE TEST FAILED!');
    success = false;
  } finally {
    try {
      execSync('node scripts/preview.mjs stop', { cwd: app.name, stdio: 'inherit' });
    } catch(e) {}
  }
}
if (!success) process.exit(1);
