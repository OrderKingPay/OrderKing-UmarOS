import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { ErrorBoundary } from "@/components/error-boundary";
import { OfflineDetector } from "@/components/offline-detector";
import { I18nProvider } from "@/lib/rider/i18n-context";
import { DEFAULT_BRANDING } from "@/lib/rider/config";
import {
  CustomizationProvider,
  DEFAULT_RIDER_CUSTOMIZATION_STATE,
  useUmarOsLiveConfig,
  toDynamicCustomizationState,
  type DynamicCustomizationState,
} from "@orderking/ui";
import { useMemo } from "react";
import { Toaster } from "sonner";
import appCss from "../styles.css?url";

const APP_NAME = DEFAULT_BRANDING.appName;

function RiderLiveCustomizationProvider({ children }: { children: React.ReactNode }) {
  const { config: liveConfig } = useUmarOsLiveConfig({
    platform: "rider_app",
    latestUrl: "/api/sync/customizations/latest",
  });

  const liveCustomizationState = useMemo<Partial<DynamicCustomizationState>>(() => {
    const dynamic = toDynamicCustomizationState(liveConfig);
    return {
      ...DEFAULT_RIDER_CUSTOMIZATION_STATE,
      ...dynamic,
      payoutPolicy: {
        ...DEFAULT_RIDER_CUSTOMIZATION_STATE.payoutPolicy,
        ...dynamic.payoutPolicy,
      },
      designTokens: {
        ...DEFAULT_RIDER_CUSTOMIZATION_STATE.designTokens,
        ...dynamic.designTokens,
        palette: {
          ...DEFAULT_RIDER_CUSTOMIZATION_STATE.designTokens.palette,
          ...dynamic.designTokens?.palette,
        },
      },
    };
  }, [liveConfig]);

  return (
    <CustomizationProvider
      initialState={DEFAULT_RIDER_CUSTOMIZATION_STATE}
      customization={liveCustomizationState}
    >
      {children}
    </CustomizationProvider>
  );
}

const fetchSessionUser = createServerFn({ method: "GET" }).handler(async () => {
  const { getSessionUser } = await import("@/lib/auth/verify.server");
  const u = await getSessionUser();
  return u ? { id: u.id, email: u.email } : null;
});

export const Route = createRootRoute({
  beforeLoad: async () => ({ sessionUser: await fetchSessionUser() }),
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: APP_NAME },
      { name: "theme-color", content: DEFAULT_BRANDING.colors.primary },
      { name: "description", content: "OrderKing Delivery Partner Fleet & Logistics" },
    ],
    links: [
      { rel: "icon", type: "image/png", href: "/icon-192.png" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Figtree:ital,wght@0,400;0,500;0,600;0,700&family=Fraunces:opsz,wght@9..144,500;9..144,600&display=swap",
      },
    ],
  }),
  component: () => (
    <html lang="en" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="bg-bg text-fg">
        <PreviewHostBridge />
        <OfflineDetector />
        <AuthProvider>
          <I18nProvider>
            <RiderLiveCustomizationProvider>
              <ErrorBoundary>
                <Outlet />
              </ErrorBoundary>
              <Toaster position="top-center" richColors={false} />
            </RiderLiveCustomizationProvider>
          </I18nProvider>
        </AuthProvider>
        <Scripts />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                let refreshing = false;
                navigator.serviceWorker.addEventListener('controllerchange', () => {
                  if (!refreshing) {
                    refreshing = true;
                    window.location.reload();
                  }
                });
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js', { scope: '/' }).then(reg => {
                    reg.update().catch(() => {});
                  }).catch(err => {
                    console.log('SW registration failed: ', err);
                  });
                });
              }
              if ('caches' in window) {
                caches.keys().then(keys => {
                  keys.forEach(k => {
                    if (k !== 'orderking-rider-v4') {
                      caches.delete(k);
                    }
                  });
                }).catch(() => {});
              }
            `,
          }}
        />
      </body>
    </html>
  ),
});
