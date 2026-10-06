import { execSync } from 'child_process';
import path from 'path';

const apps = [
  'HDmaster',
  'orderking-customers',
  'orderking-partners',
  'orderking-riders',
  'Apps-integration-'
];

console.log('Running Smoke Tests (Typecheck) for all 5 Apps...');

let allPassed = true;

for (const app of apps) {
  console.log(`\n--- Testing ${app} ---`);
  try {
    // Run typecheck inside the workspace
    // We try to run `tsc --noEmit` locally in each app's directory.
    // If an app doesn't have a tsconfig, tsc will fail. But presumably they do.
    execSync(`npx tsc --noEmit`, { stdio: 'inherit', cwd: path.resolve(process.cwd(), app) });
    console.log(`✅ ${app} passed typecheck.`);
  } catch (error) {
    console.error(`❌ ${app} failed typecheck.`);
    allPassed = false;
  }
}

if (!allPassed) {
  console.error('\n❌ Smoke tests failed!');
  process.exit(1);
} else {
  console.log('\n✅ All smoke tests passed!');
  process.exit(0);
}
