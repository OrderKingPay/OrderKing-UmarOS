// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/auth/server";

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }: any) => auth.handler(request),
      POST: ({ request }: any) => auth.handler(request),
    },
  },
});
