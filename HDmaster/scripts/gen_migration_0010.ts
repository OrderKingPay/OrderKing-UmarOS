import fs from 'fs';
import { 
  CURATED_CLIENT_LEADS, 
  CURATED_REMOTE_GIGS, 
  UNIVERSAL_PLATFORMS, 
  SEPARABLE_MODULES, 
  ENTERPRISE_BLUEPRINTS 
} from './seed-data.ts';

let sql = '-- Migration to move Supreme Founder AI static data to DB\n\n';

sql += 'CREATE TABLE IF NOT EXISTS founder_client_leads (\n';
sql += '  id VARCHAR(64) PRIMARY KEY,\n';
sql += '  business_name VARCHAR(255),\n';
sql += '  category VARCHAR(64),\n';
sql += '  location VARCHAR(255),\n';
sql += '  monthly_revenue_est VARCHAR(128),\n';
sql += '  pain_point TEXT,\n';
sql += '  project_budget INT,\n';
sql += '  status VARCHAR(64),\n';
sql += '  suggested_solution TEXT,\n';
sql += '  potential_gmv_growth VARCHAR(128)\n';
sql += ');\n\n';

sql += 'CREATE TABLE IF NOT EXISTS founder_remote_gigs (\n';
sql += '  id VARCHAR(64) PRIMARY KEY,\n';
sql += '  title VARCHAR(255),\n';
sql += '  client_location VARCHAR(255),\n';
sql += '  hourly_rate_usd INT,\n';
sql += '  fixed_budget_usd INT,\n';
sql += '  duration VARCHAR(128),\n';
sql += '  skills_required JSONB,\n';
sql += '  description TEXT,\n';
sql += '  match_score INT,\n';
sql += '  platform VARCHAR(128),\n';
sql += '  proposal_template TEXT\n';
sql += ');\n\n';

sql += 'CREATE TABLE IF NOT EXISTS founder_platforms (\n';
sql += '  id VARCHAR(64) PRIMARY KEY,\n';
sql += '  name VARCHAR(255),\n';
sql += '  category VARCHAR(64),\n';
sql += '  description TEXT,\n';
sql += '  icon VARCHAR(64),\n';
sql += '  status VARCHAR(64),\n';
sql += '  api_latency_ms INT,\n';
sql += '  last_sync_time VARCHAR(64),\n';
sql += '  auth_method VARCHAR(128),\n';
sql += '  guardrail_protection JSONB,\n';
sql += '  supported_actions JSONB\n';
sql += ');\n\n';

sql += 'CREATE TABLE IF NOT EXISTS founder_separable_modules (\n';
sql += '  id VARCHAR(64) PRIMARY KEY,\n';
sql += '  name VARCHAR(255),\n';
sql += '  tagline VARCHAR(255),\n';
sql += '  description TEXT,\n';
sql += '  category VARCHAR(64),\n';
sql += '  standalone_route VARCHAR(128),\n';
sql += '  subdomain_url VARCHAR(255),\n';
sql += '  files_count INT,\n';
sql += '  bundle_size_kb INT,\n';
sql += '  tech_stack JSONB,\n';
sql += '  standalone_package_json JSONB,\n';
sql += '  sample_component_code TEXT\n';
sql += ');\n\n';

sql += 'CREATE TABLE IF NOT EXISTS founder_enterprise_blueprints (\n';
sql += '  id VARCHAR(64) PRIMARY KEY,\n';
sql += '  key_name VARCHAR(128) UNIQUE,\n';
sql += '  title VARCHAR(255),\n';
sql += '  category VARCHAR(64),\n';
sql += '  target_organization VARCHAR(255),\n';
sql += '  tech_stack JSONB,\n';
sql += '  database_schema JSONB,\n';
sql += '  api_endpoints JSONB,\n';
sql += '  frontend_routes JSONB,\n';
sql += '  live_preview_url VARCHAR(255),\n';
sql += '  estimated_build_time VARCHAR(128),\n';
sql += '  commercial_value_inr INT,\n';
sql += '  client_handoff_ready BOOLEAN,\n';
sql += '  handoff_credentials JSONB,\n';
sql += '  files JSONB\n';
sql += ');\n\n';

sql += 'TRUNCATE TABLE founder_client_leads;\n';
sql += 'TRUNCATE TABLE founder_remote_gigs;\n';
sql += 'TRUNCATE TABLE founder_platforms;\n';
sql += 'TRUNCATE TABLE founder_separable_modules;\n';
sql += 'TRUNCATE TABLE founder_enterprise_blueprints;\n\n';

function escapeSql(str) {
  if (str === null || str === undefined) return 'NULL';
  return "'" + String(str).replace(/'/g, "''") + "'";
}

for (const lead of CURATED_CLIENT_LEADS) {
  sql += `INSERT INTO founder_client_leads (id, business_name, category, location, monthly_revenue_est, pain_point, project_budget, status, suggested_solution, potential_gmv_growth) VALUES (${escapeSql(lead.id)}, ${escapeSql(lead.businessName)}, ${escapeSql(lead.category)}, ${escapeSql(lead.location)}, ${escapeSql(lead.monthlyRevenueEst)}, ${escapeSql(lead.painPoint)}, ${lead.projectBudget}, ${escapeSql(lead.status)}, ${escapeSql(lead.suggestedSolution)}, ${escapeSql(lead.potentialGmvGrowth)});\n`;
}
sql += '\n';

for (const gig of CURATED_REMOTE_GIGS) {
  sql += `INSERT INTO founder_remote_gigs (id, title, client_location, hourly_rate_usd, fixed_budget_usd, duration, skills_required, description, match_score, platform, proposal_template) VALUES (${escapeSql(gig.id)}, ${escapeSql(gig.title)}, ${escapeSql(gig.clientLocation)}, ${gig.hourlyRateUsd}, ${gig.fixedBudgetUsd || 'NULL'}, ${escapeSql(gig.duration)}, ${escapeSql(JSON.stringify(gig.skillsRequired))}, ${escapeSql(gig.description)}, ${gig.matchScore}, ${escapeSql(gig.platform)}, ${escapeSql(gig.proposalTemplate)});\n`;
}
sql += '\n';

for (const p of UNIVERSAL_PLATFORMS) {
  sql += `INSERT INTO founder_platforms (id, name, category, description, icon, status, api_latency_ms, last_sync_time, auth_method, guardrail_protection, supported_actions) VALUES (${escapeSql(p.id)}, ${escapeSql(p.name)}, ${escapeSql(p.category)}, ${escapeSql(p.description)}, ${escapeSql(p.icon)}, ${escapeSql(p.status)}, ${p.apiLatencyMs}, ${escapeSql(p.lastSyncTime)}, ${escapeSql(p.authMethod)}, ${escapeSql(JSON.stringify(p.guardrailProtection))}, ${escapeSql(JSON.stringify(p.supportedActions))});\n`;
}
sql += '\n';

for (const m of SEPARABLE_MODULES) {
  sql += `INSERT INTO founder_separable_modules (id, name, tagline, description, category, standalone_route, subdomain_url, files_count, bundle_size_kb, tech_stack, standalone_package_json, sample_component_code) VALUES (${escapeSql(m.id)}, ${escapeSql(m.name)}, ${escapeSql(m.tagline)}, ${escapeSql(m.description)}, ${escapeSql(m.category)}, ${escapeSql(m.standaloneRoute)}, ${escapeSql(m.subdomainUrl)}, ${m.filesCount}, ${m.bundleSizeKb}, ${escapeSql(JSON.stringify(m.techStack))}, ${escapeSql(JSON.stringify(m.standalonePackageJson))}, ${escapeSql(m.sampleComponentCode)});\n`;
}
sql += '\n';

for (const [key, b] of Object.entries(ENTERPRISE_BLUEPRINTS)) {
  sql += `INSERT INTO founder_enterprise_blueprints (id, key_name, title, category, target_organization, tech_stack, database_schema, api_endpoints, frontend_routes, live_preview_url, estimated_build_time, commercial_value_inr, client_handoff_ready, handoff_credentials, files) VALUES (${escapeSql(b.id)}, ${escapeSql(key)}, ${escapeSql(b.title)}, ${escapeSql(b.category)}, ${escapeSql(b.targetOrganization)}, ${escapeSql(JSON.stringify(b.techStack))}, ${escapeSql(JSON.stringify(b.databaseSchema))}, ${escapeSql(JSON.stringify(b.apiEndpoints))}, ${escapeSql(JSON.stringify(b.frontendRoutes))}, ${escapeSql(b.livePreviewUrl)}, ${escapeSql(b.estimatedBuildTime)}, ${b.commercialValueInr}, ${b.clientHandoffReady}, ${escapeSql(JSON.stringify(b.handoffCredentials))}, ${escapeSql(JSON.stringify(b.files))});\n`;
}

fs.writeFileSync('migrations/0010_supreme_founder_data.sql', sql);
console.log('Migration 0010 created successfully!');
