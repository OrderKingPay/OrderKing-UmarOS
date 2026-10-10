import { createRootRoute, HeadContent, Outlet, Scripts, ErrorComponent } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect, lazy, Suspense } from "react";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { Toaster } from "sonner";
import appCss from "../styles.css?url";

const LazyMasterAITerminal = lazy(() =>
  import("@/components/MasterAICommandTerminal").then((m) => ({ default: m.MasterAICommandTerminal }))
);

const APP_NAME = "Umar OS";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      { name: "theme-color", content: "#ffffff" },
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
    return (
      <html lang="en" className="antialiased">
        <head>
          <HeadContent />
        </head>
        <body className="bg-bg text-fg">
          <div className="flex h-screen flex-col items-center justify-center p-8 text-center">
            <h1 className="text-2xl font-bold text-red-500 mb-2">Something went wrong</h1>
            <p className="text-muted-foreground mb-4">We encountered an unexpected error, but we're keeping the app running.</p>
            <pre className="text-xs bg-slate-100 p-4 rounded text-left max-w-2xl overflow-auto text-red-600 border border-slate-200">
              {error instanceof Error ? error.message : "Unknown error"}
            </pre>
          </div>
          <Scripts />
        </body>
      </html>
    );
  }
});

function AdminRootSkeleton() {
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
    // Affiliate attribution, conversion measurement, CAC tracking
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get("ref") || urlParams.get("affiliate");
    if (ref) {
      localStorage.setItem("orderking_affiliate_ref", ref);
      console.log(`[Tracking] Affiliate attribution captured: ${ref}`);
    }
    console.log("[Tracking] Conversion measurement and CAC tracking active.");
  }, []);
  return (
    <html lang="en" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="bg-bg text-fg">
        <PreviewHostBridge />
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <Suspense fallback={<AdminRootSkeleton />}>
              <Outlet />
            </Suspense>
            <Suspense fallback={null}>
              <LazyMasterAITerminal />
            </Suspense>
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
        <Scripts />
      </body>
    </html>
  );
}
