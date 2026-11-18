import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getPhoneSession } from "@/lib/auth/client";

export const Route = createFileRoute("/")({
  beforeLoad: ({ context }) => {
    if (!context?.sessionUser) {
      throw redirect({ to: "/login" });
    }
    throw redirect({ to: "/dashboard" });
  },
  component: PartnerIndexRedirect,
});

export function PartnerIndexRedirect() {
  const { user, isPending } = useCurrentUserState();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const s = getPhoneSession();
      if (s?.user?.id || user?.id) {
        window.location.replace("/dashboard");
      } else if (!isPending && !user) {
        window.location.replace("/login");
      }
    }
  }, [user, isPending]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="size-8 border-4 border-[#00B074]/20 border-t-[#00B074] rounded-full animate-spin" />
    </div>
  );
}
