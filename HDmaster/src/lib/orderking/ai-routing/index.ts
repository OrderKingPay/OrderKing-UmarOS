export interface RoutingConstraints {
  maxCost: number;
  requiresVision?: boolean;
}

export interface ModelResponse {
  content: string;
  provider: string;
  cost: number;
}

export interface VirtualEndpoint {
  name: string;
  supportsVision: boolean;
  costPerRequest: number;
  execute: (prompt: string) => Promise<string>;
}

export class ModelRouter {
  public endpoints: VirtualEndpoint[];

  constructor(endpoints?: VirtualEndpoint[]) {
    this.endpoints = endpoints || [
      {
        name: 'gemini',
        supportsVision: true,
        costPerRequest: 0.005,
        execute: async (prompt: string) => {
          return `[Gemini] Response to: ${prompt}`;
        }
      },
      {
        name: 'anthropic',
        supportsVision: false,
        costPerRequest: 0.015,
        execute: async (prompt: string) => {
          return `[Anthropic] Response to: ${prompt}`;
        }
      },
      {
        name: 'openai',
        supportsVision: true,
        costPerRequest: 0.03,
        execute: async (prompt: string) => {
          return `[OpenAI] Response to: ${prompt}`;
        }
      }
    ];
  }

  async route(prompt: string, constraints: RoutingConstraints): Promise<ModelResponse> {
    // 1. Filter by constraints
    const validEndpoints = this.endpoints.filter((ep) => {
      if (constraints.requiresVision && !ep.supportsVision) return false;
      if (ep.costPerRequest > constraints.maxCost) return false;
      return true;
    });

    if (validEndpoints.length === 0) {
      throw new Error('No models available meeting the given constraints.');
    }

    // 2. Sort by cost (lowest first)
    validEndpoints.sort((a, b) => a.costPerRequest - b.costPerRequest);

    // 3. Execute with fallback
    let lastError: Error | null = null;
    for (const ep of validEndpoints) {
      try {
        const content = await ep.execute(prompt);
        return {
          content,
          provider: ep.name,
          cost: ep.costPerRequest
        };
      } catch (err: any) {
        lastError = err;
        console.warn(`[ModelRouter] Endpoint ${ep.name} failed: ${err.message}. Retrying next available endpoint...`);
      }
    }

    throw new Error(`All suitable endpoints failed. Last error: ${lastError?.message || 'Unknown'}`);
  }
}
