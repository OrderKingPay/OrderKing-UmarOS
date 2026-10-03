import { createFileRoute } from "@tanstack/react-router";

type Handler = (ctx: { request: Request; params?: Record<string, string | undefined> }) => unknown;

type APIOptions = {
  server?: { handlers?: Record<string, Handler> };
  [method: string]: unknown;
};

const HTTP_METHODS = new Set([
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
]);

export function createAPIFileRoute(path: string) {
  return (options: APIOptions) => {
    const handlers =
      options.server?.handlers ??
      Object.fromEntries(
        Object.entries(options).filter(([key, value]) => HTTP_METHODS.has(key) && typeof value === "function"),
      );

    return createFileRoute(path as never)({
      // @ts-expect-error TanStack's generated route types are narrower than the legacy API wrapper.
      server: { handlers },
    });
  };
}
