import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";
import { OrderKingMark } from "@/components/mark";
import { useT } from "@/components/use-t";
import { platformConfig } from "@/lib/platform-config";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const t = useT();
  const { user } = useCurrentUserState();
  if (user) return <Navigate to="/dashboard" />;

  return (
    <main className="min-h-dvh bg-slate-950 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-950/40 via-slate-950 to-slate-950">
      <div className="mx-auto flex min-h-dvh max-w-3xl flex-col px-5 py-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <OrderKingMark className="size-9 text-chili" />
            <span className="font-display text-xl">{platformConfig.brand.appName}</span>
          </div>
          <Link to="/login" className="inline-flex min-h-11 items-center text-sm font-medium text-chili">
            {t("auth.signIn")}
          </Link>
        </header>
        <div className="flex flex-1 flex-col justify-center py-12">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-chili">{t("landing.kicker")}</p>
          <h1 className="mt-3 max-w-xl font-display text-4xl leading-[1.1] md:text-5xl">{t("landing.title")}</h1>
          <p className="mt-4 max-w-lg text-lg text-slate-400">{t("landing.body")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/login">{t("landing.cta")}</Link>
            </Button>
          </div>
          <p className="mt-10 max-w-md text-sm text-slate-400">{t("landing.forOwners")}</p>
        </div>
      </div>
    </main>
  );
}

