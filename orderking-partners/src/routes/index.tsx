import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getPhoneSession } from "@/lib/auth/client";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { user } = useCurrentUserState();
  const phoneSession = typeof window !== "undefined" ? getPhoneSession() : null;

  if (user || phoneSession?.user?.id) {
    return <Navigate to="/kitchen" replace />;
  }

  return <Navigate to="/login" replace />;
}
