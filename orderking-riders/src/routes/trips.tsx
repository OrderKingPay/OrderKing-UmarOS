import { redirect, createFileRoute } from "@tanstack/react-router";
import { Page as TripsPage } from "./history";

export const Route = createFileRoute("/trips")({
  beforeLoad: ({ context }) => {
    if (!context?.sessionUser) throw redirect({ to: "/login" });
  },
  component: TripsPage,
});
