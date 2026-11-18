import { z } from 'zod';

export type Role = 'GUEST' | 'USER' | 'ADMIN' | 'FOUNDER';

export interface FabricRequest<T = any> {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  headers: Record<string, string | undefined>;
  body?: T;
  query?: Record<string, string | undefined>;
}

export interface FabricResponse<T = any> {
  status: number;
  data?: T;
  error?: string;
  headers?: Record<string, string>;
}

export interface FabricContext {
  userId?: string;
  role: Role;
  requestId: string;
}

export type FabricHandler<TBody = any, TQuery = any, TRes = any> = (
  req: Omit<FabricRequest<TBody>, 'body' | 'query'> & { body: TBody; query: TQuery },
  ctx: FabricContext
) => Promise<FabricResponse<TRes>>;

export interface RouteDefinition {
  path: string;
  method: string;
  handler: FabricHandler;
  schema?: {
    body?: z.ZodSchema;
    query?: z.ZodSchema;
  };
  requiredRole?: Role;
}

export class UniversalConnectorFabric {
  private routes: RouteDefinition[] = [];

  public registerRoute<TBody, TQuery, TRes>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS',
    path: string,
    options: {
      schema?: { body?: z.ZodType<TBody>; query?: z.ZodType<TQuery> };
      requiredRole?: Role;
    },
    handler: FabricHandler<TBody, TQuery, TRes>
  ) {
    this.routes.push({
      method,
      path,
      schema: options.schema,
      requiredRole: options.requiredRole,
      handler: handler as FabricHandler,
    });
  }

  private authenticate(headers: Record<string, string | undefined>): FabricContext {
    const authHeader = headers['authorization'] || headers['Authorization'];
    const requestId = headers['x-request-id'] || crypto.randomUUID();

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { role: 'GUEST', requestId };
    }

    const token = authHeader.slice('Bearer '.length).trim();
    const expectedSecret = process.env.FABRIC_SERVICE_TOKEN?.trim();

    // Fail-closed: zero hardcoded backdoor tokens or dummy prefix accounts.
    if (!expectedSecret || token.length === 0 || token.length !== expectedSecret.length) {
      return { role: 'GUEST', requestId };
    }

    let diff = 0;
    for (let i = 0; i < token.length; i++) {
      diff |= token.charCodeAt(i) ^ expectedSecret.charCodeAt(i);
    }

    if (diff === 0) {
      return { userId: 'service_verified', role: 'ADMIN', requestId };
    }

    return { role: 'GUEST', requestId };
  }

  private hasPermission(userRole: Role, requiredRole?: Role): boolean {
    if (!requiredRole) return true;
    const roles: Role[] = ['GUEST', 'USER', 'ADMIN', 'FOUNDER'];
    return roles.indexOf(userRole) >= roles.indexOf(requiredRole);
  }

  public async dispatch(req: FabricRequest): Promise<FabricResponse> {
    try {
      const ctx = this.authenticate(req.headers);

      // Simple exact match routing (in production, use path-to-regexp)
      const route = this.routes.find(
        (r) => r.method === req.method && r.path === req.path
      );

      if (!route) {
        return { status: 404, error: 'Route not found in Universal Connector Fabric.' };
      }

      if (!this.hasPermission(ctx.role, route.requiredRole)) {
        return {
          status: 403,
          error: `Access denied. Endpoint requires ${route.requiredRole} privileges.`,
        };
      }

      // Validation
      let parsedBody = req.body;
      let parsedQuery = req.query;

      if (route.schema?.body) {
        const bodyResult = route.schema.body.safeParse(req.body);
        if (!bodyResult.success) {
          return { status: 400, error: 'Invalid request body', data: (bodyResult.error as z.ZodError).issues };
        }
        parsedBody = bodyResult.data;
      }

      if (route.schema?.query) {
        const queryResult = route.schema.query.safeParse(req.query);
        if (!queryResult.success) {
          return { status: 400, error: 'Invalid request query parameters', data: (queryResult.error as z.ZodError).issues };
        }
        parsedQuery = queryResult.data as Record<string, string | undefined> | undefined;
      }

      const validatedReq = { ...req, body: parsedBody, query: parsedQuery };

      // Dispatch to handler
      const response = await route.handler(validatedReq, ctx);
      
      return {
        ...response,
        headers: {
          ...response.headers,
          'x-fabric-request-id': ctx.requestId,
        }
      };
    } catch (error: any) {
      console.error('[UniversalConnectorFabric] Internal Engine Error:', error);
      return {
        status: 500,
        error: 'Internal Server Error in Universal Connector Fabric',
      };
    }
  }
}

// Singleton instance
export const fabric = new UniversalConnectorFabric();
