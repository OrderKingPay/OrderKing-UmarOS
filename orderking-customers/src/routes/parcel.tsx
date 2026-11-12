import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/parcel")({
  beforeLoad: () => {
    throw redirect({ to: "/account" });
  },
});
