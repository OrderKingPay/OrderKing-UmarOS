/**
 * Cloudflare Pages API Integration
 * API Documentation: https://api.cloudflare.com/
 */

export interface CloudflareApiConfig {
  accountId: string;
  projectName: string;
  apiToken: string;
}

export interface CloudflareDeployment {
  id: string;
  short_id: string;
  project_id: string;
  project_name: string;
  environment: string;
  url: string;
  created_on: string;
  modified_on: string;
  latest_stage: {
    name: string;
    started_on: string;
    ended_on: string;
    status: string;
  };
  deployment_trigger: {
    type: string;
    metadata: {
      branch: string;
      commit_hash: string;
      commit_message: string;
    };
  };
  stages: any[];
  build_config: any;
  env_vars: any;
  aliases: string[] | null;
}

export interface CloudflareDeploymentsResponse {
  success: boolean;
  errors: any[];
  messages: any[];
  result: CloudflareDeployment[];
  result_info: {
    page: number;
    per_page: number;
    count: number;
    total_count: number;
  };
}

export interface CloudflareDomain {
  id: string;
  name: string;
  status: string;
  created_on: string;
  zone_tag: string;
  certificate_authority: string;
}

export interface CloudflareDomainsResponse {
  success: boolean;
  errors: any[];
  messages: any[];
  result: CloudflareDomain[];
}

export interface CloudflareTriggerDeploymentResponse {
  success: boolean;
  errors: any[];
  messages: any[];
  result: CloudflareDeployment;
}

const CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4';

/**
 * Triggers a new deployment for a Cloudflare Pages project.
 */
export async function triggerNewDeployment(config: CloudflareApiConfig, branch?: string): Promise<CloudflareTriggerDeploymentResponse> {
  const url = `${CLOUDFLARE_API_BASE}/accounts/${config.accountId}/pages/projects/${config.projectName}/deployments`;
  const body = branch ? JSON.stringify({ branch }) : undefined;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiToken}`,
      'Content-Type': 'application/json',
    },
    body: body
  });

  if (!response.ok) {
    throw new Error(`Cloudflare API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Lists active deployments for a Cloudflare Pages project.
 */
export async function listActiveDeployments(config: CloudflareApiConfig): Promise<CloudflareDeploymentsResponse> {
  const url = `${CLOUDFLARE_API_BASE}/accounts/${config.accountId}/pages/projects/${config.projectName}/deployments`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${config.apiToken}`,
      'Content-Type': 'application/json',
    }
  });

  if (!response.ok) {
    throw new Error(`Cloudflare API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetches project domains for a Cloudflare Pages project.
 */
export async function fetchProjectDomains(config: CloudflareApiConfig): Promise<CloudflareDomainsResponse> {
  const url = `${CLOUDFLARE_API_BASE}/accounts/${config.accountId}/pages/projects/${config.projectName}/domains`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${config.apiToken}`,
      'Content-Type': 'application/json',
    }
  });

  if (!response.ok) {
    throw new Error(`Cloudflare API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
