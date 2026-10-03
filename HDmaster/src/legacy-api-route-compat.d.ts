type LegacyApiRequest = { request: Request; params?: Record<string, string | undefined> };

type LegacyApiHandler = (ctx: LegacyApiRequest) => unknown | Promise<unknown>;

type LegacyApiRouteOptions = {
  server?: { handlers?: Record<string, LegacyApiHandler> };
  GET?: LegacyApiHandler;
  POST?: LegacyApiHandler;
  PUT?: LegacyApiHandler;
  PATCH?: LegacyApiHandler;
  DELETE?: LegacyApiHandler;
  HEAD?: LegacyApiHandler;
  OPTIONS?: LegacyApiHandler;
};

declare const createAPIFileRoute: (path: string) => (options: LegacyApiRouteOptions) => unknown;
