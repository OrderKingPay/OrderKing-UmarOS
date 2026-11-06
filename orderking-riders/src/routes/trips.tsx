import { createFileRoute } from "@tanstack/react-router";
import { Page as TripsPage } from "./history";

export const Route = createFileRoute("/trips")({
  component: TripsPage,
});
