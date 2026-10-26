import fs from 'fs';
import path from 'path';

const rootDir = 'C:/Users/hasan/OrderKing';
const libOrderKing = path.join(rootDir, 'HDmaster/src/lib/orderking');

// The 71 completely dead directories in HDmaster/src/lib/orderking verified earlier
const deadOrderkingDirs = [
  'accessibility',    'agent-memory',       'ai-autonomy',
  'ai-core',          'ai-routing',         'automation',
  'billing',          'browser-control',    'browser-engine',
  'chain-auth',       'chaos',              'cloud-mesh',
  'command-engine',   'comms',              'communications',
  'computer-use',     'connector-fabric',   'data-lineage',
  'data-warehouse',   'db-scale',           'domain-isolation',
  'ecosystem-core',   'emergency',          'evaluation',
  'experimentation',  'external-agents',    'gateway',
  'geo-intelligence', 'geospatial',         'git-ops',
  'globalization',    'god-shield',         'governance',
  'human-in-loop',    'ide-core',           'identity',
  'iot',              'knowledge-graph',    'localization',
  'logging',          'logistics',          'merchants',
  'ml',               'mobile-api',         'monetization',
  'multimodal-audio', 'multimodal-genesis', 'multimodal-media',
  'observability',    'omni-brain',         'orchestration',
  'order-ops',        'p0-recovery',        'plugin-nexus',
  'portal',           'provenance',         'qa',
  'qa-core',          'realtime',           'red-team',
  'retention',        'secure-containment', 'secure-enclave',
  'security-testing', 'support-ai',         'task-manager',
  'testing',          'wealth',             'wealth-router',
  'web3',             'workload-identity'
];

let deletedDirsCount = 0;
let deletedFilesCount = 0;

// 1. Delete dead directories in HDmaster/src/lib/orderking
for (const dirName of deadOrderkingDirs) {
  const target = path.join(libOrderKing, dirName);
  if (fs.existsSync(target)) {
    fs.rmSync(target, { recursive: true, force: true });
    deletedDirsCount++;
    console.log(`[DELETED DEAD MODULE] ${target}`);
  }
}

// 2. Delete abandoned ghost projects at root
const ghostProjects = ['apps-integration', 'superapp-engine'];
for (const proj of ghostProjects) {
  const target = path.join(rootDir, proj);
  if (fs.existsSync(target)) {
    fs.rmSync(target, { recursive: true, force: true });
    deletedDirsCount++;
    console.log(`[DELETED GHOST PROJECT] ${target}`);
  }
}

// 3. Delete root bloat and dump files
const rootBloatFiles = [
  'diff.patch',
  'api_matches.txt',
  'todos.txt',
  'order_test_output.json',
  'capability_scan.json',
  'build_failure_report.md',
  'Deployment_Fix_Report.md'
];

for (const f of rootBloatFiles) {
  const target = path.join(rootDir, f);
  if (fs.existsSync(target)) {
    fs.rmSync(target, { force: true });
    deletedFilesCount++;
    console.log(`[DELETED BLOAT FILE] ${target}`);
  }
}

// 4. Delete log files, temp dirs, and insecure backups across the monorepo
function cleanMonorepoJunk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      if (item.name === 'node_modules' || item.name === '.git') continue;
      if (item.name === '.temp' || (item.name === 'tmp' && dir.includes('.wrangler')) || (item.name === 'tmp' && dir.includes('.tanstack'))) {
        fs.rmSync(fullPath, { recursive: true, force: true });
        deletedDirsCount++;
        console.log(`[DELETED TEMP DIR] ${fullPath}`);
      } else {
        cleanMonorepoJunk(fullPath);
      }
    } else {
      const ext = path.extname(item.name).toLowerCase();
      if (ext === '.log' || item.name.endsWith('.local.bak') || item.name === 'nitro_err.log' || item.name === 'nitro_out.log') {
        fs.rmSync(fullPath, { force: true });
        deletedFilesCount++;
        console.log(`[DELETED LOG/BACKUP] ${fullPath}`);
      }
    }
  }
}

cleanMonorepoJunk(rootDir);

console.log(`\n========================================================`);
console.log(`PURGE COMPLETE: ${deletedDirsCount} directories, ${deletedFilesCount} files permanently deleted!`);
console.log(`========================================================\n`);
