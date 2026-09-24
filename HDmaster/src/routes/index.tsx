import { createFileRoute, Link } from "@tanstack/react-router";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Navigate } from "@tanstack/react-router";
import { OrderKingMark } from "@/components/brand/mark";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { user } = useCurrentUserState();
  if (user) return <Navigate to="/app" />;

  return (
    <main className="min-h-screen bg-bg text-fg">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <OrderKingMark className="size-9" />
            <div>
              <p className="font-display text-lg leading-none">Umar OS</p>
              <p className="text-xs tracking-wide text-amber-400 font-semibold">Founder Command</p>
            </div>
          </div>
          <Link to="/login">
            <Button size="sm">Enter Umar OS</Button>
          </Link>
        </header>
        <section className="flex flex-1 flex-col justify-center py-16">
          <p className="text-sm uppercase tracking-[0.18em] text-amber-400 font-bold">Window 4 · Umar Sovereign Command</p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl leading-tight sm:text-6xl">
            The single founder operating system for life.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted">
            Execute any business, build any software, orchestrate connected platforms, and control every market operation from one sovereign terminal.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link to="/login">
              <Button size="lg">Sign in to Umar OS</Button>
            </Link>
          </div>
          <dl className="mt-16 grid gap-6 sm:grid-cols-3">
            {[
              ["See", "Live orders, delays, rider gaps, support load."],
              ["Understand", "Contribution, settlements, and alerts with sources."],
              ["Act", "Role-aware tools. High-risk changes need a reason."],
            ].map(([k, v]) => (
              <div key={k} className="rounded-[24px] border border-border bg-surface p-6">
                <dt className="font-display text-2xl">{k}</dt>
                <dd className="mt-2 text-sm text-muted">{v}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </main>
  );
}
