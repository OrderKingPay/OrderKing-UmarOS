const fs = require('fs');
const file = 'src/lib/orderking/ai/supreme-founder-ai-core.ts';
let lines = fs.readFileSync(file, 'utf8').split('\n');

// 0-indexed line ranges to delete
const deleteRanges = [
  [202, 461],
  [536, 1315]
];

let keepLines = [];
let i = 0;
while (i < lines.length) {
  let skip = false;
  for (let r of deleteRanges) {
    if (i >= r[0] && i <= r[1]) {
      skip = true;
      break;
    }
  }
  if (!skip) {
    keepLines.push(lines[i]);
  }
  i++;
}

let newContent = keepLines.join('\n');

const asyncFns = `
export async function getUniversalPlatforms(): Promise<ConnectedPlatform[]> {
  const mod = await import('../server/supreme-founder-data.server');
  return mod.getUniversalPlatformsFromDb();
}
export async function getSeparableModules(): Promise<SeparableModule[]> {
  const mod = await import('../server/supreme-founder-data.server');
  return mod.getSeparableModulesFromDb();
}
export async function getCuratedClientLeads(): Promise<ClientLead[]> {
  const mod = await import('../server/supreme-founder-data.server');
  return mod.getCuratedClientLeadsFromDb();
}
export async function getCuratedRemoteGigs(): Promise<RemoteContractGig[]> {
  const mod = await import('../server/supreme-founder-data.server');
  return mod.getCuratedRemoteGigsFromDb();
}
export async function getEnterpriseBlueprints(): Promise<Record<string, EnterpriseProjectBlueprint>> {
  const mod = await import('../server/supreme-founder-data.server');
  return mod.getEnterpriseBlueprintsFromDb();
}
`;

newContent = newContent.replace('export function parseFounderQuery', asyncFns + 'export async function parseFounderQuery');

newContent = newContent.replace(/CURATED_CLIENT_LEADS/g, '(await getCuratedClientLeads())');
newContent = newContent.replace(/CURATED_REMOTE_GIGS/g, '(await getCuratedRemoteGigs())');
newContent = newContent.replace(/ENTERPRISE_BLUEPRINTS/g, '(await getEnterpriseBlueprints())');
newContent = newContent.replace(/UNIVERSAL_PLATFORMS/g, '(await getUniversalPlatforms())');
newContent = newContent.replace(/SEPARABLE_MODULES/g, '(await getSeparableModules())');

fs.writeFileSync(file, newContent);
console.log('Script completed');
