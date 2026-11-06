import { FleetRunnerPlatformApp } from "../components/fleet-runner/FleetRunnerPlatformApp";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/rider/app-shell";
import { HomeView } from "@/components/rider/home-view";

export const Route = createFileRoute("/")({
  component: FleetRunnerPlatformApp,
});

export function Home() {
  return (
    <AppShell>
      <HomeView />
    </AppShell>
  );
}
