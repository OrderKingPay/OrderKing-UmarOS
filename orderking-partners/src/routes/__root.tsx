import { createRootRoute, HeadContent, Outlet, Scripts, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { ErrorBoundary } from "@/components/error-boundary";
import { OfflineDetector } from "@/components/offline-detector";
import { platformConfig } from "@/lib/platform-config";
import { flushQueue, registerDefaultTransitionFn } from "@/lib/offline/durable-queue";
import { transitionOrderViaHDmaster } from "@/lib/server/hdmaster-order-transition";
import { CustomizationProvider, useCustomizationSync } from "@orderking/ui";
import { useVendor } from "@/components/use-vendor";
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
      { rel: "icon", type: 'image/png', href: '/icon-192.png' },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/icon-192.png" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,500;600&family=Hind+Siliguri:wght@400;500;600;700&family=Noto+Serif+Bengali:wght@500;600&display=swap",
      },
    ],
  }),
  component: Root,
});

import { useEffect, useMemo } from "react";
import { supabaseCloud } from "@/lib/db-cloud";

function Root() {
  const location = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => {
    registerDefaultTransitionFn(transitionOrderViaHDmaster);
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
          queryClient.invalidateQueries({ queryKey: ["menu"] });
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

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    let refreshing = false;
    const handleControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        reg.update().catch(() => {});
        if (reg.waiting) {
          reg.waiting.postMessage({ type: "SKIP_WAITING" });
        }
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                newWorker.postMessage({ type: "SKIP_WAITING" });
              }
            });
          }
        });
      })
      .catch(() => {});
    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
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
            <PartnerCustomizationBridge>
              <ErrorBoundary>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={location}
                    initial={{ opacity: 0, scale: 0.98, filter: "blur(5px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: 1.02, filter: "blur(5px)" }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
                  >
                    <Outlet />
                  </motion.div>
                </AnimatePresence>
              </ErrorBoundary>
            </PartnerCustomizationBridge>
          </QueryClientProvider>
        </AuthProvider>
        <Scripts />
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){let refreshing=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!refreshing){refreshing=true;window.location.reload();}});window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js',{scope:'/'}).then(r=>{r.update().catch(()=>{});if(r.waiting){r.waiting.postMessage({type:'SKIP_WAITING'});}r.addEventListener('updatefound',()=>{const w=r.installing;if(w){w.addEventListener('statechange',()=>{if(w.state==='installed'&&navigator.serviceWorker.controller){w.postMessage({type:'SKIP_WAITING'});}});}});}).catch(()=>{}));}if('caches' in window){caches.keys().then(k=>k.forEach(c=>{if(!c.includes('live-truth'))caches.delete(c);})).catch(()=>{});}`,
          }}
        />
      </body>
    </html>
  );
}

function PartnerCustomizationBridge({ children }: { children: React.ReactNode }) {
  const vendor = useVendor();

  // Mount Live SSE Customization Sync to /api/sync/customizations
  // Order King central platform commission tiers and dining settings update live in real-time
  const sync = useCustomizationSync({
    url: "/api/sync/customizations",
    latestUrl: "/api/sync/customizations/latest",
    platform: "partner_app",
    autoConnect: true,
  });

  const mergedCustomization = useMemo(() => {
    const base: any = vendor.customization ?? {};
    const live: any = sync.state ?? {};
    return {
      ...base,
      ...live,
      commissionConfig: live.commissionConfig ?? base.commissionConfig,
      diningSettings: live.diningSettings ?? base.diningSettings,
      merchantEconomics: live.merchantEconomics ?? base.merchantEconomics,
      merchantBranding: live.merchantBranding ?? base.merchantBranding,
    };
  }, [vendor.customization, sync.state]);

  return (
    <CustomizationProvider customization={mergedCustomization}>
      {children}
    </CustomizationProvider>
  );
}
