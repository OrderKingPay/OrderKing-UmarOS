import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/rider/app-shell";
import { HomeView } from "@/components/rider/home-view";

export const Route = createFileRoute("/duty")({
  beforeLoad: ({ context }) => {
    if (!context.sessionUser) throw redirect({ to: "/login" });
  },
  component: DutyPage,
});

function DutyPage() {
  return (
    <AppShell>
      <HomeView />
    </AppShell>
  );
}
