import { Buffer } from "buffer";
if (typeof globalThis !== "undefined" && !(globalThis as any).Buffer) {
  (globalThis as any).Buffer = Buffer;
}
if (typeof window !== "undefined" && !(window as any).Buffer) {
  (window as any).Buffer = Buffer;
}
import { Suspense, useEffect, useMemo } from "react";
import {
  CustomizationProvider,
  DEFAULT_CUSTOMIZATION_STATE,
  useCustomizationSync,
  useUmarOsLiveConfig,
  toDynamicCustomizationState,
  type DynamicCustomizationState,
} from "@orderking/ui";
import { createServerFn } from "@tanstack/react-start";
import { createRootRoute, HeadContent, Outlet, Scripts, useRouterState } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { AppProviders } from "@/components/providers";
import { DEFAULT_CONFIG } from "@/lib/config/defaults";
import { ErrorBoundary } from "@/components/error-boundary";
import { OfflineDetector } from "@/components/offline-detector";
import { PwaInstallPrompt } from "@/components/pwa/install-prompt";
import appCss from "../styles.css?url";
import { NextGenSeo } from "@/components/seo/NextGenSeo";
import { installChunkErrorRecovery, isChunkLoadError, triggerSelfHealingReload } from "@/lib/lazy-retry";
import { ResilientRouteOutlet } from "@/components/common/resilient-route-outlet";
import { AlertCircle, RotateCcw, Home, RefreshCw, ShieldCheck } from "lucide-react";

/**
 * Travelpayouts Drive installation — issued for the OrderKing Travelpayouts project.
 * Their verification bot checks the website root, not only /travel.
 * Keep the exact vendor-provided loader in the SSR <head> of every customer page.
 * Async external loading prevents blocking the first application render.
 * Configure monetization functions in the Travelpayouts account after verification.
 */
const travelpayoutsDriveLoader = `
(function () {
    var script = document.createElement("script");
    script.async = 1;
    script.setAttribute("data-cmp-ab","2");
    script.src = 'https://tpembars.com/NTg5NTU0.js?t=589554';
    document.head.appendChild(script);
})();
`;

function TravelpayoutsDriveHead() {
  return (
    <script
      id="orderking-travelpayouts-drive-loader"
      {...{ nowprocket: "" }}
      data-noptimize="1"
      data-cfasync="false"
      data-wpfc-render="false"
      seraph-accel-crit="1"
      data-no-defer="1"
      data-cmp-ab="2"
      dangerouslySetInnerHTML={{ __html: travelpayoutsDriveLoader }}
    />
  );
}


const fetchSessionUser = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { getSessionUser } = await import("@/lib/auth/verify.server");
    const u = await getSessionUser();
    return u ? { id: u.id, email: u.email } : null;
  } catch (err) {
    console.error("fetchSessionUser error:", err);
    return null;
  }
});

const fetchConfig = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { loadConfig } = await import("@/lib/server/load-config");
    return await loadConfig();
  } catch (err) {
    console.error("fetchConfig error:", err);
    return null;
  }
});

export const Route = createRootRoute({
  beforeLoad: async () => {
    let sessionUser = null;
    let config = null;
    try {
      const [su, c] = await Promise.all([fetchSessionUser(), fetchConfig()]);
      sessionUser = su;
      config = c;
    } catch (err) {
      console.error("beforeLoad Promise.all error:", err);
    }
    return { sessionUser, config };
  },
  pendingComponent: CustomerAppSkeleton,
  errorComponent: ({ error }) => {
    const isChunk = isChunkLoadError(error);
    const errorMessage = (error as Error)?.message || String(error);

    const handleClearCacheAndReload = async () => {
      try {
        if (typeof window !== "undefined") {
          if ("caches" in window) {
            const keys = await window.caches.keys();
            await Promise.all(keys.map((k) => window.caches.delete(k)));
          }
          sessionStorage.clear();
          localStorage.removeItem("orderking_chunk_reload_lock");
          window.location.reload();
        }
      } catch {
        if (typeof window !== "undefined") window.location.reload();
      }
    };

    return (
      <html lang="en" className="antialiased bg-[#FCFAF7] text-gray-900" suppressHydrationWarning>
        <head>
          <HeadContent />
          <TravelpayoutsDriveHead />
        </head>
        <body className="bg-[#FCFAF7] text-gray-900 min-h-screen">
          <main
            role="alert"
            className="min-h-screen w-full bg-[#FAF7F2] text-gray-900 flex flex-col items-center justify-center p-6 select-none"
          >
            <div className="w-full max-w-md rounded-3xl bg-white border border-amber-200/90 p-8 text-center shadow-[0_20px_50px_rgba(245,158,11,0.12)] space-y-5">
              <div className="relative mx-auto flex size-16 items-center justify-center">
                <div className="absolute inset-0 rounded-2xl bg-amber-400/25 blur-md animate-pulse" />
                <div className="relative flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 via-orange-500/15 to-amber-600/20 border border-amber-300 text-amber-700 shadow-sm">
                  <AlertCircle className="size-8 stroke-[2.2]" />
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-black text-gray-950 tracking-tight">
                  {isChunk ? "Platform Update Detected" : "OrderKing Core Recovery"}
                </h2>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {isChunk
                    ? "A newer version of the OrderKing customer app was deployed. Tap below to synchronize instantly."
                    : "OrderKing encountered a startup or network interruption. SafeShield is protecting your cart and profile."}
                </p>
              </div>

              {errorMessage && (
                <div className="rounded-2xl bg-red-50/80 border border-red-200/70 p-3 text-left">
                  <p className="text-[11px] font-mono text-red-900 break-words line-clamp-3">
                    {errorMessage}
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== "undefined") window.location.reload();
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-amber-500/25 transition-all hover:brightness-105 active:scale-98 cursor-pointer"
                >
                  <RotateCcw className="size-4 stroke-[2.2]" />
                  Reload OrderKing
                </button>

                <button
                  type="button"
                  onClick={handleClearCacheAndReload}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-50 hover:bg-amber-100/80 border border-amber-200/70 px-5 py-3 text-sm font-bold text-amber-900 transition-all active:scale-98 cursor-pointer"
                >
                  <RefreshCw className="size-4 stroke-[2]" />
                  Clear Cache & Refresh
                </button>

                <a
                  href="/"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-stone-100 hover:bg-stone-200/80 px-5 py-3 text-sm font-semibold text-stone-800 transition-all active:scale-98 cursor-pointer"
                >
                  <Home className="size-4 stroke-[2]" />
                  Back to Food Delivery
                </a>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-emerald-700 pt-1">
                <ShieldCheck className="size-4 text-emerald-600 stroke-[2.2]" />
                <span>OrderKing Zero-White-Screen SafeShield</span>
              </div>
            </div>
          </main>
          <Scripts />
        </body>
      </html>
    );
  },
  head: ({ loaderData, match }) => {
    const config = (match?.context as { config?: typeof DEFAULT_CONFIG } | undefined)?.config ?? DEFAULT_CONFIG;
    void loaderData;
    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
        { title: config.brand.seoTitle },
        { name: "description", content: config.brand.seoDescription },
        { name: "theme-color", content: "#FCFAF7" },
        { name: "mobile-web-app-capable", content: "yes" },
        { name: "apple-mobile-web-app-capable", content: "yes" },
        { name: "apple-mobile-web-app-status-bar-style", content: "default" },
        { name: "application-name", content: "OrderKing" },
        { property: "og:description", content: config.brand.seoDescription },
        { property: "og:image", content: config.brand.ogImageUrl },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: config.brand.seoTitle },
        { name: "twitter:description", content: config.brand.seoDescription },
        { name: "twitter:image", content: config.brand.ogImageUrl },
      ],
      links: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
        { rel: "preconnect", href: "https://xezsqsptomcndbksxrvu.supabase.co" },
        { rel: "icon", type: "image/png", href: "/icon-192.png" },
        { rel: "stylesheet", href: appCss },
        { rel: "manifest", href: "/manifest.json" },
        { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap",
        },
      ],
    };
  },
  component: Root,
});

export function CustomerAppSkeleton() {
  return (
    <div
      className="mx-auto flex min-h-dvh w-full max-w-lg flex-col bg-[#FCFAF7] pb-24 md:max-w-5xl"
      aria-busy="true"
      aria-label="Loading OrderKing"
    >
      {/* Luxury Golden Header Skeleton */}
      <div className="sticky top-0 z-30 bg-gradient-to-b from-[#FFFDF9] via-[#FAF6F0] to-[#F5EFEB] border-b border-amber-900/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-xl bg-gradient-to-tr from-amber-400/40 via-yellow-300/30 to-amber-500/20 animate-pulse flex items-center justify-center">
            <span className="text-sm">👑</span>
          </div>
          <div className="space-y-1">
            <div className="h-4 w-24 bg-amber-200/50 rounded-md animate-pulse" />
            <div className="h-2 w-14 bg-amber-200/30 rounded-xs animate-pulse" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-7 w-20 bg-amber-200/40 rounded-full animate-pulse" />
          <div className="size-7 bg-amber-200/40 rounded-full animate-pulse" />
        </div>
      </div>

      {/* Main Body Skeleton */}
      <div className="px-4 py-4 space-y-4">
        {/* Search Bar Skeleton */}
        <div className="h-10 w-full bg-white/80 rounded-xl border border-amber-200/60 shadow-2xs flex items-center px-3 gap-2">
          <div className="size-4 rounded-full bg-amber-200/50 animate-pulse" />
          <div className="h-3 w-40 bg-amber-100 rounded animate-pulse" />
        </div>

        {/* Categories Circular Skeletons */}
        <div className="flex gap-3 overflow-hidden py-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 shrink-0">
              <div className="size-16 rounded-full bg-gradient-to-tr from-amber-200/60 to-yellow-100/60 p-0.5 animate-pulse">
                <div className="size-full rounded-full bg-white/90" />
              </div>
              <div className="h-2.5 w-12 bg-amber-200/40 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Card Grid Skeletons */}
        <div className="grid gap-4 md:grid-cols-2 pt-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-3xl border border-amber-900/10 bg-white shadow-xs flex flex-col"
            >
              <div className="aspect-[16/10] w-full bg-gradient-to-r from-amber-100/60 via-amber-50 to-amber-100/60 animate-pulse" />
              <div className="p-4 space-y-2 bg-gradient-to-b from-white to-amber-50/20">
                <div className="flex justify-between items-center">
                  <div className="h-4 w-3/5 bg-amber-200/60 rounded animate-pulse" />
                  <div className="h-4 w-10 bg-amber-200/40 rounded animate-pulse" />
                </div>
                <div className="h-3 w-2/5 bg-amber-100/80 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Root() {
  const context = Route.useRouteContext();
  const config = context.config ?? DEFAULT_CONFIG;
  const location = useRouterState({ select: (s) => s?.location });

  const { state: liveSyncState } = useCustomizationSync({
    url: "/api/sync/customizations",
    latestUrl: "/api/sync/customizations/latest",
    autoConnect: true,
  });

  const { config: realtimeConfig } = useUmarOsLiveConfig({
    latestUrl: "/api/sync/customizations/latest",
  });

  const realtimeState = useMemo<Partial<DynamicCustomizationState>>(() => {
    return toDynamicCustomizationState(realtimeConfig);
  }, [realtimeConfig]);

  const staticCustomizationState = useMemo<Partial<DynamicCustomizationState>>(() => {
    if (!config?.brand) return {};
    const isDark = config.brand.themeMode === "dark";
    return {
      designTokens: {
        palette: {
          primary: config.brand.primaryColor || "#E23744",
          primaryForeground: "#FFFFFF",
          accent: config.brand.accentColor || config.brand.primaryColor || "#E23744",
          background: isDark ? "#0f172a" : (config.brand.backgroundColor || "#FCFAF7"),
          surface: isDark ? "#1e293b" : (config.brand.surfaceColor || "#FCFAF7"),
          surfaceElevated: isDark ? "#334155" : "#FFFFFF",
          foreground: isDark ? "#f8fafc" : (config.brand.textColor || "#1C1C1C"),
          muted: isDark ? "#94a3b8" : (config.brand.mutedColor || "#6B7280"),
          subtle: "#9CA3AF",
          border: isDark ? "#334155" : "#E5E7EB",
          danger: "#EF4444",
          success: "#24963F",
        },
        radius: {
          xsPx: 4,
          smPx: 8,
          mdPx: config.brand.radiusPx ? Math.min(config.brand.radiusPx, 12) : 12,
          lgPx: config.brand.radiusPx || 16,
          xlPx: 20,
        },
      },
    };
  }, [config]);

  const customizationState = useMemo<Partial<DynamicCustomizationState>>(() => {
    const base = staticCustomizationState || {};
    const sse = liveSyncState || {};
    const live = realtimeState || {};

    return {
      ...base,
      ...sse,
      ...live,
      designTokens: {
        ...base.designTokens,
        ...sse.designTokens,
        ...live.designTokens,
        palette: {
          ...base.designTokens?.palette,
          ...sse.designTokens?.palette,
          ...live.designTokens?.palette,
        },
        radius: {
          ...base.designTokens?.radius,
          ...sse.designTokens?.radius,
          ...live.designTokens?.radius,
        },
        shadows: {
          ...base.designTokens?.shadows,
          ...sse.designTokens?.shadows,
          ...live.designTokens?.shadows,
        },
        elementOverrides: {
          ...base.designTokens?.elementOverrides,
          ...sse.designTokens?.elementOverrides,
          ...live.designTokens?.elementOverrides,
        },
      },
      pageLayouts: {
        ...base.pageLayouts,
        ...sse.pageLayouts,
        ...live.pageLayouts,
      },
      customerPricing: {
        ...DEFAULT_CUSTOMIZATION_STATE.customerPricing!,
        ...(base.customerPricing || {}),
        ...(sse.customerPricing || {}),
        ...(live.customerPricing || {}),
      },
      featureSwitches: {
        ...(sse.featureSwitches || {}),
        ...(live.featureSwitches || {}),
      },
      layout: (live as any).layout || (sse as any).layout || (base as any).layout,
    };
  }, [staticCustomizationState, liveSyncState, realtimeState]);

  useEffect(() => {
    // Install self-healing chunk error listeners for zero-white-screens
    const cleanup = installChunkErrorRecovery();
    return cleanup;
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
        // Immediately check for SW updates on mount to eradicate stale cache traps
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const params = new URLSearchParams(window.location.search);
      const utmSource = params.get("utm_source");
      const utmMedium = params.get("utm_medium");
      const utmCampaign = params.get("utm_campaign");
      const tableNo = params.get("table");
      const mode = params.get("mode");
      const ref = params.get("ref");

      if (utmSource || utmMedium || utmCampaign || tableNo || mode || ref) {
        const attribution = {
          utm_source: utmSource,
          utm_medium: utmMedium,
          utm_campaign: utmCampaign,
          table_no: tableNo,
          order_mode: mode || "delivery",
          referral_code: ref,
          captured_at: new Date().toISOString(),
        };
        sessionStorage.setItem("orderking_attribution", JSON.stringify(attribution));
      }
    } catch {}
  }, [location?.search]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.style.transition = "background-color 0.25s ease";
      document.body.style.transition = "background-color 0.25s ease";
      if (!window.location.pathname.startsWith("/king-pay")) {
        document.documentElement.style.backgroundColor = "var(--color-bg, #FCFAF7)";
        document.body.style.backgroundColor = "var(--color-bg, #FCFAF7)";
      }
    }
  }, [location?.pathname]);

  return (
    <html lang="en" className="antialiased bg-[#FCFAF7] text-gray-900" suppressHydrationWarning>
      <head>
        <HeadContent />
        <TravelpayoutsDriveHead />
        <NextGenSeo config={config} />
        <script src="https://checkout.razorpay.com/v1/checkout.js" defer></script>
      </head>
      <body className="bg-[#FCFAF7] text-gray-900 min-h-screen pb-20">
        <PreviewHostBridge />
        <OfflineDetector />
        <PwaInstallPrompt />
        {/* Outer boundary protecting all top-level providers */}
        <ErrorBoundary sectionName="Root Providers">
          <CustomizationProvider customization={customizationState}>
            <AuthProvider>
            <AppProviders config={config}>
              {/* Inner boundary protecting route transitions and children */}
              <ErrorBoundary sectionName="App Outlet">
                <div className="min-h-screen flex flex-col w-full relative">
                  <ResilientRouteOutlet fallback={<CustomerAppSkeleton />} />
                </div>
              </ErrorBoundary>
            </AppProviders>
          </AuthProvider>
          </CustomizationProvider>
        </ErrorBoundary>
        <Scripts />
        <script dangerouslySetInnerHTML={{ __html: `if('serviceWorker' in navigator){let refreshing=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!refreshing){refreshing=true;window.location.reload();}});window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js', { scope: '/' }).then(r=>{r.update().catch(()=>{});if(r.waiting){r.waiting.postMessage({type:'SKIP_WAITING'});}r.addEventListener('updatefound',()=>{const w=r.installing;if(w){w.addEventListener('statechange',()=>{if(w.state==='installed'&&navigator.serviceWorker.controller){w.postMessage({type:'SKIP_WAITING'});}});}});}).catch(()=>{}))}if('caches' in window){caches.keys().then(k=>k.forEach(c=>{if(!c.includes('v5.5.3-error1101-immune'))caches.delete(c);})).catch(()=>{});}` }} />
      </body>
    </html>
  );
}
