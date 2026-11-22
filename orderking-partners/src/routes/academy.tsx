import { redirect, createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/academy")({
  beforeLoad: ({ context }) => {
    if (typeof window !== "undefined") {
      let hasUser = Boolean(context?.sessionUser);
      if (!hasUser) {
        try {
          const raw = window.localStorage.getItem("orderking.phone.session");
          if (raw && JSON.parse(raw)?.user?.id) hasUser = true;
        } catch {}
      }
      if (!hasUser) throw redirect({ to: "/login" });
    }
  },
  component: AcademyPage
});

function AcademyPage() {
  return <Navigate to="/support" replace />;
}
