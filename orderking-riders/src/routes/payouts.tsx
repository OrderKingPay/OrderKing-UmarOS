import { redirect, createFileRoute } from "@tanstack/react-router";
import { SettlementsDesk } from "./settlements";

export const Route = createFileRoute("/payouts")({
  beforeLoad: ({ context }) => {
    if (!context?.sessionUser) throw redirect({ to: "/login" });
  },
  component: SettlementsDesk,
});
