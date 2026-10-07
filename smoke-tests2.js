const { execSync } = require('child_process');
const apps = ['orderking-customers', 'orderking-partners', 'orderking-riders', 'HDmaster', 'Apps-integration-'];
let success = true;
for (const app of apps) {
  console.log('Checking ' + app);
  try {
    execSync('pnpm run typecheck', { cwd: `C:/Users/hasan/OrderKing/` + app, stdio: 'pipe' });
    console.log(app + ' passed!');
  } catch(e) {
    console.error(app + ' FAILED:');
    console.error(e.stdout ? e.stdout.toString() : e.message);
    success = false;
  }
}
if (!success) process.exit(1);
