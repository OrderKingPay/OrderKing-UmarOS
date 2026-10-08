import { ConnectorConfig, ConnectorType } from './registry';

export interface OpenAPIParameter {
  name: string;
  in: string;
  required?: boolean;
}

export interface OpenAPIOperation {
  operationId?: string;
  summary?: string;
  parameters?: OpenAPIParameter[];
}

export interface OpenAPIPathItem {
  get?: OpenAPIOperation;
  post?: OpenAPIOperation;
  put?: OpenAPIOperation;
  delete?: OpenAPIOperation;
  patch?: OpenAPIOperation;
}

export interface OpenAPISpec {
  info: {
    title: string;
    version: string;
  };
  servers?: { url: string }[];
  paths: Record<string, OpenAPIPathItem>;
}

export async function generateConnectorFromOpenAPI(specUrl: string, id: string): Promise<Omit<ConnectorConfig, 'healthStatus' | 'createdAt'>> {
  const response = await fetch(specUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch OpenAPI spec from ${specUrl}: ${response.statusText}`);
  }
  
  const spec: OpenAPISpec = await response.json();
  
  const capabilities: string[] = [];
  
  if (spec.paths) {
    for (const [path, methods] of Object.entries(spec.paths)) {
      for (const [method, operation] of Object.entries(methods)) {
        if (operation.operationId) {
          capabilities.push(operation.operationId);
        } else {
          capabilities.push(`${method.toUpperCase()} ${path}`);
        }
      }
    }
  }

  let endpoint = specUrl;
  if (spec.servers && spec.servers.length > 0) {
    endpoint = spec.servers[0].url;
  }

  return {
    id,
    name: spec.info?.title || 'Generated OpenAPI Connector',
    type: 'OPENAPI' as ConnectorType,
    endpoint,
    capabilities,
    version: spec.info?.version || '1.0.0',
    authScheme: 'UNKNOWN'
  };
}
