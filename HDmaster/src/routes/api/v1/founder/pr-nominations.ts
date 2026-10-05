import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/v1/founder/pr-nominations")({
  server: {
    handlers: {
      GET: async () =>
        Response.json({
          success: true,
          state: "OPPORTUNITY_LIST",
          awards: [
            { id: "forbes-asia", title: "Forbes 30 Under 30 Asia", organization: "Forbes Media", url: "https://www.forbes.com/30-under-30/asia/", verification: "External verification required" },
            { id: "ey-eoy", title: "EY Entrepreneur Of The Year - India", organization: "EY", url: "https://www.ey.com/en_in/entrepreneur-of-the-year", verification: "External verification required" },
            { id: "tedx", title: "TEDx", organization: "TED/TEDx organizers", url: "https://www.ted.com/participate/organize-a-local-tedx-event/tedx-speaker-guidelines", verification: "Organizer-specific process" },
            { id: "y-combinator", title: "Y Combinator", organization: "Y Combinator", url: "https://www.ycombinator.com/apply", verification: "Application eligibility/timing must be checked" },
          ],
        }),
    },
  },
});
