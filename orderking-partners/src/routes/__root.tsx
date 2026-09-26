import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { ErrorBoundary } from "@/components/error-boundary";
import { OfflineDetector } from "@/components/offline-detector";
import { platformConfig } from "@/lib/platform-config";
import { flushQueue } from "@/lib/offline/durable-queue";
import { transitionOrderViaHDmaster } from "@/lib/server/hdmaster-order-transition";
import appCss from "../styles.css?url";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        const isNetworkError =
          error instanceof TypeError ||
          error.message.includes("fetch") ||
          error.message.includes("network");
        if (isNetworkError) return failureCount < 10;
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: (failureCount, error) => {
        const isNetworkError =
          error instanceof TypeError ||
          error.message.includes("fetch") ||
          error.message.includes("network");
        if (isNetworkError) return failureCount < 10;
        return failureCount < 1;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: platformConfig.brand.appName },
      { name: "description", content: platformConfig.brand.tagline },
      { name: "theme-color", content: platformConfig.theme.primary },
    ],
    links: [
      { rel: "icon", type: "image/jpeg", href: "/logo.jpg" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,500;600&family=Hind+Siliguri:wght@400;500;600;700&family=Noto+Serif+Bengali:wght@500;600&display=swap",
      },
    ],
  }),
  component: Root,
});

import { useEffect } from "react";
import { supabaseCloud } from "@/lib/db-cloud";

function Root() {
  useEffect(() => {
    flushQueue(transitionOrderViaHDmaster);
    
    const handleOnline = () => {
      flushQueue(transitionOrderViaHDmaster);
    };
    
    window.addEventListener("online", handleOnline);
    
    // Supabase Realtime WebSocket for inventory and orders
    const channel = supabaseCloud
      .channel("partner_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "item_availability" },
        () => {
          console.log("[Realtime] Inventory changed, invalidating catalog");
          queryClient.invalidateQueries({ queryKey: ["catalog"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          console.log("[Realtime] Order changed, invalidating orders");
          queryClient.invalidateQueries({ queryKey: ["orders"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener("online", handleOnline);
      supabaseCloud.removeChannel(channel);
    };
  }, []);

  return (
    <html lang="en" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <PreviewHostBridge />
        <OfflineDetector />
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </QueryClientProvider>
        </AuthProvider>
        <Scripts />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(err => {
                    console.log('SW registration failed: ', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
