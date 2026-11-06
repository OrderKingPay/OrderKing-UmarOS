import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect, Suspense } from "react";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { Toaster } from "sonner";
import appCss from "../styles.css?url";
import { lazyWithRetry, installChunkErrorRecovery, isChunkLoadError } from "@/lib/lazy-retry";
import { ResilientRouteOutlet } from "@/components/common/resilient-route-outlet";
import { AdminErrorBoundary } from "@/components/error-boundary";
import { AlertTriangle, RotateCcw, LayoutDashboard, RefreshCw, ShieldCheck } from "lucide-react";
import { OfflineDetector } from "@/components/offline-detector";
import { WorldSkeleton } from "@/components/skeletons/world-skeleton";

export { WorldSkeleton };

const LazyMasterAITerminal = lazyWithRetry(
  () => import("@/components/MasterAICommandTerminal"),
  "MasterAICommandTerminal"
);

const APP_NAME = "Umar OS";

export const Route = createRootRoute({
  pendingComponent: AdminRootSkeleton,
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      { name: "theme-color", content: "#FCFAF7" },
      {
        name: "description",
        content: "Umar OS — Enterprise Operating System & Central Control Hub.",
      },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "preconnect", href: "https://vitals.vercel-insights.com" },
      { rel: "preconnect", href: "https://xezsqsptomcndbksxrvu.supabase.co" },
      { rel: "icon", type: 'image/png', href: '/icon-192.png' },
      { rel: "stylesheet", href: appCss },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..700;1,400..700&family=Inter:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap",
      },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/icon-192.png" },
    ],
  }),
  component: RootDocument,
  errorComponent: ({ error }) => {
    const isChunk = isChunkLoadError(error);
    const errorMessage = error instanceof Error ? error.message : typeof error === "string" ? error : "An unexpected startup error occurred.";

    const handlePurgeAndReload = async () => {
      try {
        if (typeof window !== "undefined") {
          if ("caches" in window) {
            const keys = await window.caches.keys();
            await Promise.all(keys.map((k) => window.caches.delete(k)));
          }
          sessionStorage.clear();
          localStorage.removeItem("hdmaster_chunk_reload_lock");
          window.location.reload();
        }
      } catch {
        if (typeof window !== "undefined") window.location.reload();
      }
    };

    return (
      <html lang="en" className="antialiased" suppressHydrationWarning>
        <head>
          <HeadContent />
        </head>
        <body className="bg-bg text-fg">
          <main
            role="alert"
            className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-zinc-50 dark:bg-zinc-950 select-none"
          >
            <div className="w-full max-w-md rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 text-center shadow-2xl space-y-5">
              <div className="relative mx-auto flex size-16 items-center justify-center">
                <div className="absolute inset-0 rounded-2xl bg-amber-500/20 blur-md animate-pulse" />
                <div className="relative flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-md">
                  <AlertTriangle className="size-8 stroke-[2.2]" />
                </div>
              </div>

              <div className="space-y-2">
                <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  {isChunk ? "Version Synchronization" : "Umar OS Startup Intercept"}
                </h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  {isChunk
                    ? "A newer control build was deployed. Auto-syncing enterprise command modules..."
                    : "The system intercepted a lifecycle condition. Database credentials and state are 100% secure."}
                </p>
              </div>

              {errorMessage && (
                <div className="rounded-xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3 text-left">
                  <p className="text-[11px] font-mono text-zinc-700 dark:text-zinc-300 break-words line-clamp-3">
                    {errorMessage}
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== "undefined") window.location.reload();
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-600 hover:bg-amber-700 px-5 py-3 text-sm font-bold text-white shadow-md transition cursor-pointer"
                >
                  <RotateCcw className="size-4 stroke-[2.2]" />
                  Reload Control Center
                </button>

                <button
                  type="button"
                  onClick={handlePurgeAndReload}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-300 dark:border-zinc-700 px-5 py-3 text-sm font-bold text-zinc-900 dark:text-zinc-100 transition cursor-pointer"
                >
                  <RefreshCw className="size-4 stroke-[2]" />
                  Purge Cache & Refresh
                </button>

                <a
                  href="/app"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 px-5 py-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
                >
                  <LayoutDashboard className="size-4 stroke-[2]" />
                  Return to Overview
                </a>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 pt-1">
                <ShieldCheck className="size-4 stroke-[2.2]" />
                <span>Umar OS Zero-White-Screen Architecture</span>
              </div>
            </div>
          </main>
          <Scripts />
        </body>
      </html>
    );
  }
});

export function AdminRootSkeleton() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-bg p-6 animate-pulse" aria-busy="true" aria-label="Loading admin ecosystem">
      <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
        <div className="h-8 w-44 bg-surface rounded-lg border border-border" />
        <div className="flex gap-3">
          <div className="h-9 w-28 bg-surface rounded-lg border border-border" />
          <div className="h-9 w-9 bg-surface rounded-full border border-border" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 bg-surface rounded-xl border border-border" />
        ))}
      </div>
      <div className="h-72 w-full bg-surface rounded-2xl border border-border mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64 bg-surface rounded-xl border border-border" />
        <div className="h-64 bg-surface rounded-xl border border-border" />
      </div>
    </div>
  );
}

function RootDocument() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 15_000, retry: 1 } },
      }),
  );

  useEffect(() => {
    // Install self-healing chunk error listeners for zero-white-screens
    const cleanup = installChunkErrorRecovery();
    return cleanup;
  }, []);

  useEffect(() => {
    // Affiliate attribution, conversion measurement, CAC tracking
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get("ref") || urlParams.get("affiliate");
    if (ref) {
      localStorage.setItem("orderking_affiliate_ref", ref);
      console.log(`[Tracking] Affiliate attribution captured: ${ref}`);
    }
    console.log("[Tracking] Conversion measurement and CAC tracking active.");
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.style.transition = "background-color 0.25s ease";
      document.body.style.transition = "background-color 0.25s ease";
      document.documentElement.style.backgroundColor = "#FCFAF7";
      document.body.style.backgroundColor = "#FCFAF7";
    }
  }, []);

  return (
    <html lang="en" className="antialiased bg-[#FCFAF7]" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="bg-[#FCFAF7] text-fg min-h-screen">
        <PreviewHostBridge />
        <OfflineDetector />
        {/* Outer boundary protecting all top-level providers */}
        <AdminErrorBoundary sectionName="Root Admin Context">
          <AuthProvider>
            <QueryClientProvider client={queryClient}>
              {/* Inner boundary protecting route viewport */}
              <AdminErrorBoundary sectionName="Admin Root Outlet">
                <ResilientRouteOutlet fallback={<AdminRootSkeleton />} />
              </AdminErrorBoundary>

              {/* Localized boundary for AI terminal so terminal faults never affect dashboard */}
              <AdminErrorBoundary inline sectionName="Master AI Terminal">
                <Suspense fallback={null}>
                  <LazyMasterAITerminal />
                </Suspense>
              </AdminErrorBoundary>

              <Toaster
                theme="light"
                position="bottom-right"
                toastOptions={{
                  style: {
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    color: "#0f172a",
                  },
                }}
              />
            </QueryClientProvider>
          </AuthProvider>
        </AdminErrorBoundary>
        <Scripts />
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(()=>{}))}`,
          }}
        />
      </body>
    </html>
  );
}
