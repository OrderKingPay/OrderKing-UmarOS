import '@tanstack/react-router';
import '@tanstack/router-core';

declare module '@tanstack/router-core' {
  interface FilebaseRouteOptionsInterface<TRegister, TParentRoute, TId, TPath, TSearchValidator, TParams, TLoaderDeps, TLoaderFn, TRouterContext, TRouteContextFn, TBeforeLoadFn, TRemountDepsFn, TSSR, TServerMiddlewares, THandlers> {
    server?: {
      handlers?: {
        GET?: (ctx: { request: Request; params: any }) => any;
        POST?: (ctx: { request: Request; params: any }) => any;
        PUT?: (ctx: { request: Request; params: any }) => any;
        PATCH?: (ctx: { request: Request; params: any }) => any;
        DELETE?: (ctx: { request: Request; params: any }) => any;
      };
    };
  }
}

declare module '@tanstack/react-router' {
  interface FilebaseRouteOptionsInterface<TRegister, TParentRoute, TId, TPath, TSearchValidator, TParams, TLoaderDeps, TLoaderFn, TRouterContext, TRouteContextFn, TBeforeLoadFn, TRemountDepsFn, TSSR, TServerMiddlewares, THandlers> {
    server?: {
      handlers?: {
        GET?: (ctx: { request: Request; params: any }) => any;
        POST?: (ctx: { request: Request; params: any }) => any;
        PUT?: (ctx: { request: Request; params: any }) => any;
        PATCH?: (ctx: { request: Request; params: any }) => any;
        DELETE?: (ctx: { request: Request; params: any }) => any;
      };
    };
  }
}
