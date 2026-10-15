import { createRouter } from "@tanstack/react-router";
import { AppErrorComponent } from "@/lib/error-component";
import { routeTree } from "./routeTree.gen";
import { CustomerAppSkeleton } from "./routes/__root";
import { Compass, Home } from "lucide-react";

function CustomerNotFoundComponent() {
  return (
    <main
      role="alert"
      className="min-h-screen w-full bg-[#FAF7F2] text-gray-900 flex flex-col items-center justify-center p-6 select-none"
    >
      <div className="w-full max-w-md rounded-3xl bg-white border border-amber-200/90 p-8 text-center shadow-[0_20px_50px_rgba(245,158,11,0.12)] space-y-5">
        <div className="relative mx-auto flex size-16 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-300 text-amber-700 shadow-sm">
          <Compass className="size-8 stroke-[2.2]" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black text-gray-950 tracking-tight">Page Not Found</h2>
          <p className="text-xs text-gray-600 leading-relaxed">
            The dish or page you are looking for has moved or does not exist.
          </p>
        </div>
        <div className="pt-2">
          <a
            href="/"
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-amber-500/25 transition-all hover:brightness-105 active:scale-98 cursor-pointer"
          >
            <Home className="size-4 stroke-[2.2]" />
            Back to Food Delivery
          </a>
        </div>
      </div>
    </main>
  );
}

export function getRouter() {
  return createRouter({
    routeTree,
    defaultErrorComponent: AppErrorComponent,
    defaultPendingComponent: CustomerAppSkeleton,
    defaultPendingMs: 0,
    defaultPendingMinMs: 300,
    defaultNotFoundComponent: CustomerNotFoundComponent,
    defaultViewTransition: false,
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 1000 * 60 * 5,
  });
}
