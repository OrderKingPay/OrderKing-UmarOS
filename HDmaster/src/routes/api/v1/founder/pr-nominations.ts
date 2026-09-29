import { createAPIFileRoute } from '@tanstack/react-start/api';

export const APIRoute = createAPIFileRoute('/api/v1/founder/pr-nominations')({
  GET: async () => {
  try {
    const awards = [
      {
        id: "forbes-asia",
        title: "Forbes 30 Under 30 Asia",
        organization: "Forbes Media",
        deadline: "Upcoming",
        url: "https://www.forbes.com/30-under-30/asia/",
        status: "OPEN_FOR_NOMINATIONS",
        pitch: "Hasan Habibullah is the architect and founder of OrderKing, an ultra-scaled food-delivery and logistics platform processing thousands of real-time transactions over edge infrastructure. OrderKing operates a zero-commission model, upending the duopoly of Zomato and Swiggy in the Indian subcontinent."
      },
      {
        id: "ey-eoy",
        title: "EY Entrepreneur Of The Year - India",
        organization: "Ernst & Young",
        deadline: "Check Site for Next Cohort",
        url: "https://www.ey.com/en_in/entrepreneur-of-the-year",
        status: "PREPARING",
        pitch: "Under Hasan's leadership, OrderKing has deployed cutting-edge Serverless Edge technology to build an autonomous food logistics network. This innovation drives unprecedented efficiency in a high-density delivery market."
      },
      {
        id: "tedx-global",
        title: "TEDx Speaker Application",
        organization: "TED Conferences",
        deadline: "Rolling",
        url: "https://www.ted.com/participate/organize-a-local-tedx-event/tedx-speaker-guidelines",
        status: "READY_TO_SUBMIT",
        pitch: "Topic: The Autonomous Logistics Revolution. I will discuss how edge computing and deterministic AI are permanently altering the unit economics of last-mile delivery in emerging markets, based on my work building OrderKing."
      },
      {
        id: "ycombinator",
        title: "Y Combinator Startup Interview",
        organization: "Y Combinator",
        deadline: "Next Batch",
        url: "https://www.ycombinator.com/apply",
        status: "READY",
        pitch: "OrderKing is the anti-Zomato. We use a unified TanStack edge architecture to eliminate middleman bloat. We are generating real revenue and have a scalable partner ecosystem."
      }
    ];

    return new Response(JSON.stringify({ success: true, awards }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (error) {
    console.error("Failed to fetch awards:", error);
    return new Response(JSON.stringify({ success: false, error: "Failed to fetch honors and awards" }), { status: 500 });
  }
  }
});

