import { createRootRoute, HeadContent, Outlet, Scripts, useRouterState, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { AnimatePresence, motion } from "framer-motion";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/lib/auth/provider";
import { ErrorBoundary } from "@/components/error-boundary";
import { platformConfig } from "@/lib/platform-config";
import { flushQueue, registerDefaultTransitionFn } from "@/lib/offline/durable-queue";
import { transitionOrderViaHDmaster } from "@/lib/server/hdmaster-order-transition";
import { CustomizationProvider } from "@orderking/ui";
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

const fetchSessionUser = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { getSessionUser } = await import("@/lib/auth/verify.server");
    const u = await getSessionUser();
    return u ? { id: u.id, email: u.email } : null;
  } catch {
    return null;
  }
});

export const Route = createRootRoute({
  beforeLoad: async ({ location }) => {
    const pathname = location.pathname;
    const isPublic =
      pathname === "/" ||
      pathname === "/login" ||
      pathname === "/onboarding" ||
      pathname === "/privacy" ||
      pathname === "/terms" ||
      pathname.startsWith("/api");

    if (isPublic) {
      try {
        const sessionUser = await fetchSessionUser();
        return { sessionUser: sessionUser || null };
      } catch {
        return { sessionUser: null };
      }
    }

    try {
      let sessionUser = await fetchSessionUser();
      if (!sessionUser && typeof window !== "undefined") {
        try {
          const { getPhoneSession } = await import("@/lib/auth/client");
          const local = getPhoneSession();
          if (local?.user?.id) {
            sessionUser = { id: local.user.id, email: local.user.email };
            try {
              const cookieVal = encodeURIComponent(JSON.stringify(local.user));
              const sec = window.location.protocol === "https:" ? "; Secure" : "";
              document.cookie = `orderking_partner_session=${cookieVal}; path=/; max-age=2592000; SameSite=Lax${sec}`;
            } catch {}
          }
        } catch {}
      }
      if (!sessionUser) {
        if (typeof window !== "undefined") {
          throw redirect({ to: "/login" });
        }
        return { sessionUser: null };
      }
      return { sessionUser };
    } catch (err) {
      if ((err as any)?.to || (err as any)?.status === 307 || (err as any)?.status === 302) {
        throw err;
      }
      if (typeof window !== "undefined") {
        throw redirect({ to: "/login" });
      }
      return { sessionUser: null };
    }
  },
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
      { rel: "manifest", href: "/manifest.json" },
      { rel: "apple-touch-icon", href: "/icon-192.png" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800;900&display=swap",
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
    if (typeof window === "undefined") return;
    const isPublic =
      location === "/" ||
      location === "/login" ||
      location === "/onboarding" ||
      location === "/privacy" ||
      location === "/terms" ||
      location.startsWith("/api");
    const hasStorage = Boolean(
      window.localStorage.getItem("orderking.phone.session") ||
      window.localStorage.getItem("orderking_phone_session") ||
      window.localStorage.getItem("orderking_user")
    );
    const hasCookie = document.cookie.includes("orderking_partner_session");
    if (!isPublic && !hasStorage && !hasCookie) {
      window.location.replace("/login");
    }
  }, [location]);
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
                        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <PartnerCustomizationBridge>
              <ErrorBoundary>
                <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
                  <Outlet />
                </div>
              </ErrorBoundary>
            </PartnerCustomizationBridge>
          </QueryClientProvider>
        </AuthProvider>
        <Scripts />
        <script
          dangerouslySetInnerHTML={{
            __html: `if('caches' in window){caches.keys().then(keys=>Promise.all(keys.filter(k=>!k.includes('ok-partner-v7-live')).map(k=>caches.delete(k)))).catch(()=>{});}if('serviceWorker' in navigator){let refreshing=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!refreshing){refreshing=true;window.location.reload();}});window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js?v=7',{scope:'/'}).then(r=>{r.update().catch(()=>{});if(r.waiting){r.waiting.postMessage({type:'SKIP_WAITING'});}r.addEventListener('updatefound',()=>{const w=r.installing;if(w){w.addEventListener('statechange',()=>{if(w.state==='installed'&&navigator.serviceWorker.controller){w.postMessage({type:'SKIP_WAITING'});}});}});}).catch(()=>{}));}`,
          }}
        />
      </body>
    </html>
  );
}

function PartnerCustomizationBridge({ children }: { children: React.ReactNode }) {
  const vendor = useVendor();

  const mergedCustomization = useMemo(() => {
    const base: any = vendor.customization ?? {};
    return {
      ...base,
      commissionConfig: base.commissionConfig,
      diningSettings: base.diningSettings,
      merchantEconomics: base.merchantEconomics,
      merchantBranding: base.merchantBranding,
    };
  }, [vendor.customization]);

  return (
    <CustomizationProvider customization={mergedCustomization}>
      {children}
    </CustomizationProvider>
  );
}
