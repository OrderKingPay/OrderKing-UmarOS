import { URLSearchParams } from 'url';

export interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    [key: string]: any;
  };
  servers?: { url: string; description?: string }[];
  paths: Record<string, Record<string, OpenAPIOperation>>;
  components?: {
    securitySchemes?: Record<string, any>;
    schemas?: Record<string, any>;
    [key: string]: any;
  };
  security?: Record<string, string[]>[];
}

export interface OpenAPIOperation {
  operationId?: string;
  summary?: string;
  description?: string;
  parameters?: OpenAPIParameter[];
  requestBody?: any;
  security?: Record<string, string[]>[];
  [key: string]: any;
}

export interface OpenAPIParameter {
  name: string;
  in: 'query' | 'header' | 'path' | 'cookie';
  description?: string;
  required?: boolean;
  schema?: any;
}

export interface AITool {
  name: string;
  description: string;
  parameters: Record<string, any>; // JSON schema
}

export interface PluginExecutionResult {
  status: number;
  data: any;
  headers: Record<string, string>;
}

/**
 * UniversalPluginEngine
 * 
 * The core engine for natively ingesting OpenAPI specifications and translating
 * them into dynamic AI tool functions, natively matching the architecture used
 * by systems like ChatGPT, Gemini, and Grok.
 * 
 * This allows UMAR OS to connect to ANY real-world API dynamically and infinitely.
 * ZERO MOCK PLUGINS.
 */
export class UniversalPluginEngine {
  private spec: OpenAPISpec;
  private authCredentials: Record<string, string>;

  /**
   * Initialize the engine with an OpenAPI specification and optional credentials.
   * @param spec The parsed OpenAPI 3.0+ specification.
   * @param authCredentials Map of security scheme names to credential values (e.g., Bearer tokens, API keys).
   */
  constructor(spec: OpenAPISpec, authCredentials: Record<string, string> = {}) {
    this.spec = spec;
    this.authCredentials = authCredentials;
  }

  /**
   * Generates an array of LLM-compatible tool definitions from the OpenAPI paths.
   */
  public generateTools(): AITool[] {
    const tools: AITool[] = [];

    for (const [path, pathItem] of Object.entries(this.spec.paths)) {
      for (const [method, operation] of Object.entries(pathItem)) {
        if (!['get', 'post', 'put', 'delete', 'patch'].includes(method.toLowerCase())) {
          continue;
        }

        const operationId = operation.operationId || `${method}_${path.replace(/[^a-zA-Z0-9]/g, '_')}`;
        
        const parametersSchema: Record<string, any> = {
          type: "object",
          properties: {},
          required: []
        };

        // Extract Path, Query, and Header parameters
        if (operation.parameters) {
          for (const param of operation.parameters) {
            parametersSchema.properties[param.name] = {
              ...(param.schema || { type: "string" }),
              description: param.description || `Parameter ${param.name} in ${param.in}`
            };
            if (param.required) {
              parametersSchema.required.push(param.name);
            }
          }
        }

        // Extract Request Body parameters
        if (operation.requestBody?.content?.['application/json']?.schema) {
          const bodySchema = operation.requestBody.content['application/json'].schema;
          // Flatten body properties into the tool parameters for LLM ease of use,
          // or encapsulate under a 'body' parameter if it's complex.
          parametersSchema.properties['requestBody'] = bodySchema;
          if (operation.requestBody.required) {
            parametersSchema.required.push('requestBody');
          }
        }

        tools.push({
          name: operationId,
          description: operation.summary || operation.description || `Execute ${method.toUpperCase()} request to ${path}`,
          parameters: parametersSchema
        });
      }
    }

    return tools;
  }

  /**
   * Dynamically executes a given tool (API operation) with the parameters provided by the AI.
   * Translates the tool call back into a raw HTTP request.
   */
  public async executeTool(operationId: string, args: Record<string, any>): Promise<PluginExecutionResult> {
    const operationData = this.findOperation(operationId);
    if (!operationData) {
      throw new Error(`Operation '${operationId}' not found in OpenAPI specification.`);
    }

    const { path, method, operation } = operationData;
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    let targetUrl = this.getBaseUrl() + normalizedPath;
    
    const queryParams = new URLSearchParams();
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };

    // Map AI arguments to HTTP parameters FIRST to prevent AI from overriding security
    if (operation.parameters) {
      for (const param of operation.parameters) {
        const value = args[param.name];
        if (value !== undefined) {
          if (param.in === 'path') {
            targetUrl = targetUrl.replace(`{${param.name}}`, encodeURIComponent(String(value)));
          } else if (param.in === 'query') {
            queryParams.append(param.name, String(value));
          } else if (param.in === 'header') {
            headers[param.name] = String(value);
          }
        }
      }
    }

    // Apply Authentication based on OpenAPI Security Schemes
    this.applySecurity(operation, headers, queryParams);

    // SSRF & URL absolute format protection
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      throw new Error(`Target URL must be absolute (http/https). Resolved URL: ${targetUrl}`);
    }

    const queryString = queryParams.toString();
    if (queryString) {
      targetUrl += `?${queryString}`;
    }

    const requestInit: RequestInit = {
      method: method.toUpperCase(),
      headers
    };

    if (args.requestBody && ['post', 'put', 'patch', 'delete'].includes(method.toLowerCase())) {
      requestInit.body = typeof args.requestBody === 'string' ? args.requestBody : JSON.stringify(args.requestBody);
    }

    try {
      const response = await fetch(targetUrl, requestInit);
      const isJson = response.headers.get('content-type')?.includes('application/json');
      const responseData = isJson ? await response.json() : await response.text();
      
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      return {
        status: response.status,
        data: responseData,
        headers: responseHeaders
      };
    } catch (error: any) {
      throw new Error(`Failed to execute API call to ${targetUrl}: ${error.message}`);
    }
  }

  /**
   * Resolves the base URL from the OpenAPI specification servers array.
   */
  private getBaseUrl(): string {
    if (this.spec.servers && this.spec.servers.length > 0) {
      // Defaulting to the first server.
      let url = this.spec.servers[0].url;
      if (url.endsWith('/')) {
        url = url.slice(0, -1);
      }
      return url;
    }
    return ''; // Assume relative or host provided elsewhere if not specified
  }

  /**
   * Helper to locate the HTTP method and path for a given operation ID.
   */
  private findOperation(operationId: string): { path: string, method: string, operation: OpenAPIOperation } | null {
    for (const [path, pathItem] of Object.entries(this.spec.paths)) {
      for (const [method, operation] of Object.entries(pathItem)) {
        if (operation.operationId === operationId || `${method}_${path.replace(/[^a-zA-Z0-9]/g, '_')}` === operationId) {
          return { path, method, operation };
        }
      }
    }
    return null;
  }

  /**
   * Injects authentication credentials into headers or query params based on the
   * operation's active security requirements and the spec's securitySchemes.
   */
  private applySecurity(operation: OpenAPIOperation, headers: Record<string, string>, queryParams: URLSearchParams): void {
    const activeSecurity = operation.security || this.spec.security || [];
    const securitySchemes = this.spec.components?.securitySchemes;
    
    if (activeSecurity.length === 0 || !securitySchemes) {
      return; // No security required
    }

    // Attempt to satisfy at least one security requirement (OR logic)
    for (const requirement of activeSecurity) {
      let requirementSatisfied = true;
      const appliedHeaders: Record<string, string> = {};
      const appliedQuery = new URLSearchParams();

      for (const schemeName of Object.keys(requirement)) {
        const credential = this.authCredentials[schemeName];
        if (!credential) {
          requirementSatisfied = false;
          break;
        }

        const scheme = securitySchemes[schemeName];
        if (!scheme) continue;

        if (scheme.type === 'http' && scheme.scheme?.toLowerCase() === 'bearer') {
          appliedHeaders['Authorization'] = `Bearer ${credential}`;
        } else if (scheme.type === 'apiKey') {
          if (scheme.in === 'header') {
            appliedHeaders[scheme.name] = credential;
          } else if (scheme.in === 'query') {
            appliedQuery.append(scheme.name, credential);
          }
        }
        // OAuth2 / OpenID Connect can often be passed as Bearer tokens in actual execution.
        else if (scheme.type === 'oauth2' || scheme.type === 'openIdConnect') {
          appliedHeaders['Authorization'] = `Bearer ${credential}`;
        }
      }

      if (requirementSatisfied) {
        // Commit the security headers and query params
        Object.assign(headers, appliedHeaders);
        appliedQuery.forEach((val, key) => queryParams.append(key, val));
        break; // Stop after satisfying one complete requirement group
      }
    }
  }
}
