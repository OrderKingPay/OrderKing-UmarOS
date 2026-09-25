import { createServerFn } from "@tanstack/react-start";
import { createRootRoute, Meta, Links, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { AppProviders } from "@/components/providers";
import { DEFAULT_CONFIG } from "@/lib/config/defaults";
import { ErrorBoundary } from "@/components/error-boundary";
import { OfflineDetector } from "@/components/offline-detector";
import appCss from "../styles.css?url";

const fetchSessionUser = createServerFn({ method: "GET" }).handler(async () => {
  const { getSessionUser } = await import("@/lib/auth/verify.server");
  const u = await getSessionUser();
  return u ? { id: u.id, email: u.email } : null;
});

const fetchConfig = createServerFn({ method: "GET" }).handler(async () => {
  const { loadConfig } = await import("@/lib/server/load-config");
  return loadConfig();
});

export const Route = createRootRoute({
  beforeLoad: async () => {
    const [sessionUser, config] = await Promise.all([fetchSessionUser(), fetchConfig()]);
    return { sessionUser, config };
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
        { name: "theme-color", content: config.brand.primaryColor },

          { property: "og:title", content: config.brand.seoTitle },
          { property: "og:description", content: config.brand.seoDescription },
          { property: "og:image", content: config.brand.ogImageUrl },
          { property: "og:type", content: "website" },
          { name: "twitter:card", content: "summary_large_image" },
          { name: "twitter:title", content: config.brand.seoTitle },
          { name: "twitter:description", content: config.brand.seoDescription },
          { name: "twitter:image", content: config.brand.ogImageUrl },
        
      ],
      links: [
        { rel: "preconnect", href: "https://vitals.vercel-insights.com" },
        { rel: "preconnect", href: "https://xezsqsptomcndbksxrvu.supabase.co" },
        { rel: "icon", type: "image/jpeg", href: "/logo.jpg" },
        { rel: "stylesheet", href: appCss },
        { rel: "manifest", href: "/__grok/manifest.webmanifest" },
        { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Figtree:ital,wght@0,400;0,500;0,600;1,400&family=Fraunces:opsz,wght@9..144,500;9..144,600&display=swap",
        },
      ],
    };
  },
  component: Root,
});

function Root() {
  const context = Route.useRouteContext();
  const config = context.config ?? DEFAULT_CONFIG;
  return (
    <html lang="en" className="antialiased" suppressHydrationWarning>
      <head>
        <Meta />
          <Links />
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
      </head>
      <body>
        <PreviewHostBridge />
        <OfflineDetector />
        <AuthProvider>
          <AppProviders config={config}>
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </AppProviders>
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  );
}
