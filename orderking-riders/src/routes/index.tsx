import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { AppShell } from "@/components/rider/app-shell";
import { HomeView } from "@/components/rider/home-view";

export const Route = createFileRoute("/")({
  beforeLoad: ({ context }) => {
    if (!context.sessionUser) {
      throw redirect({ to: "/login" });
    }
  },
  component: RiderEntry,
});

export function RiderEntry() {
  const { user, isPending } = useCurrentUserState();

  useEffect(() => {
    if (!isPending && !user && typeof window !== "undefined") {
      window.location.replace("/login");
    }
  }, [user, isPending]);

  if (isPending) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="size-8 border-4 border-[#E23744]/20 border-t-[#E23744] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AppShell>
      <HomeView />
    </AppShell>
  );
}
