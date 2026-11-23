import { createFileRoute } from "@tanstack/react-router";
import { PartnerLandingPage } from "./index";

export const Route = createFileRoute("/login")({
  validateSearch: (
    search: Record<string, unknown>
  ): { mode?: "in" | "up"; phone?: string; name?: string } => ({
    mode: search.mode === "up" ? "up" : search.mode === "in" ? "in" : undefined,
    phone: typeof search.phone === "string" ? search.phone : undefined,
    name: typeof search.name === "string" ? search.name : undefined,
  }),
  component: LoginPage,
});

function LoginPage() {
  const search = Route.useSearch();
  return (
    <PartnerLandingPage
      initialMode={search.mode || "in"}
      initialPhone={search.phone || ""}
      initialName={search.name || ""}
    />
  );
}
