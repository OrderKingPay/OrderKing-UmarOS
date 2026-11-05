import { ZomatoRiderPlatformApp } from "../components/zomato-rider/ZomatoRiderPlatformApp";
import { FleetRunnerPlatformApp } from "../components/fleet-runner/FleetRunnerPlatformApp";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/rider/app-shell";
import { HomeView } from "@/components/rider/home-view";

export const Route = createFileRoute("/")({
  beforeLoad: ({ context }) => {
    if (!context.sessionUser) throw redirect({ to: "/login" });
  },
  component: ZomatoRiderPlatformApp,
});

function Home() {
  return (
    <AppShell>
      <HomeView />
    </AppShell>
  );
}
