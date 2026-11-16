import { createFileRoute, redirect } from "@tanstack/react-router";
import { CommandShell } from "@/components/command/shell";
import { WorldSkeleton } from "@/components/skeletons/world-skeleton";
import { AppErrorComponent } from "@/lib/error-component";
import { verifyAdminSessionFn } from "@/lib/auth/server-session";

export const Route = createFileRoute("/app")({
  beforeLoad: async () => {
    try {
      const res = await verifyAdminSessionFn();
      if (!res?.ok) throw redirect({ to: "/login" });
    } catch {
      throw redirect({ to: "/login" });
    }
  },
  component: CommandShell,
  pendingComponent: WorldSkeleton,
  errorComponent: AppErrorComponent,
});
