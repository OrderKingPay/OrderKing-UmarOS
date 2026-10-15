import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/components/command/pages";
import { WorldSkeleton } from "@/components/skeletons/world-skeleton";
import { AppErrorComponent } from "@/lib/error-component";

export const Route = createFileRoute("/app/")({
  component: DashboardPage,
  pendingComponent: WorldSkeleton,
  errorComponent: AppErrorComponent,
});
