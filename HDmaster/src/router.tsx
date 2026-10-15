import { createRouter } from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";
import { AppErrorComponent } from "@/lib/error-component";
import { routeTree } from "./routeTree.gen";
import { AdminRootSkeleton } from "./routes/__root";
import { Compass, LayoutDashboard } from "lucide-react";

function AdminNotFoundComponent() {
  return (
    <main
      role="alert"
      className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-zinc-50 dark:bg-zinc-950 select-none"
    >
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 text-center shadow-2xl space-y-5">
        <div className="relative mx-auto flex size-16 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-400 text-amber-600 dark:text-amber-400 shadow-sm">
          <Compass className="size-8 stroke-[2.2]" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Administrative Route Not Found
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            The requested control module or URL does not exist in Umar OS.
          </p>
        </div>
        <div className="pt-2">
          <a
            href="/app"
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-600 hover:bg-amber-700 px-5 py-3 text-sm font-bold text-white shadow-md transition cursor-pointer"
          >
            <LayoutDashboard className="size-4 stroke-[2]" />
            Return to Command Hub
          </a>
        </div>
      </div>
    </main>
  );
}

import { WorldSkeleton } from "@/components/skeletons/world-skeleton";

export function getRouter() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: 15_000, retry: 1 } },
  });
  return createRouter({
    routeTree,
    defaultErrorComponent: AppErrorComponent,
    defaultPendingComponent: WorldSkeleton,
    defaultPendingMs: 0,
    defaultPendingMinMs: 300,
    defaultNotFoundComponent: AdminNotFoundComponent,
    defaultViewTransition: false,
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 1000 * 60 * 5,
    context: { queryClient },
  });
}
