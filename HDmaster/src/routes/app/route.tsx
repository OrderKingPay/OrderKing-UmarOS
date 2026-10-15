import { createFileRoute } from "@tanstack/react-router";
import { CommandShell } from "@/components/command/shell";
import { WorldSkeleton } from "@/components/skeletons/world-skeleton";
import { AppErrorComponent } from "@/lib/error-component";

export const Route = createFileRoute("/app")({
  component: CommandShell,
  pendingComponent: WorldSkeleton,
  errorComponent: AppErrorComponent,
});
