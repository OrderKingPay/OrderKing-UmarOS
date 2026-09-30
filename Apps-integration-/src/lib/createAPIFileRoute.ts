import { createFileRoute } from '@tanstack/react-router';

export function createAPIFileRoute(path: string) {
  return (options: {
    server?: {
      handlers?: {
        GET?: (ctx: { request: Request; params: any }) => any;
        POST?: (ctx: { request: Request; params: any }) => any;
        PUT?: (ctx: { request: Request; params: any }) => any;
        PATCH?: (ctx: { request: Request; params: any }) => any;
        DELETE?: (ctx: { request: Request; params: any }) => any;
      };
    };
  }) => createFileRoute(path as any)(options as any);
}
