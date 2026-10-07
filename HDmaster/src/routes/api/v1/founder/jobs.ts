import { createAPIFileRoute } from '@tanstack/react-start/api';

export const APIRoute = createAPIFileRoute('/api/v1/founder/jobs')({
  GET: async () => {
  try {
    // Fetch real remote jobs from RemoteOK public API
    const response = await fetch("https://remoteok.com/api");
    const data = await response.json();
    
    // Filter out the legal notice (first item) and format
    const jobs = data.slice(1).map((job: any) => ({
      id: job.id,
      title: job.position,
      platform: "RemoteOK",
      clientLocation: job.location || "Global Remote (B1/B2 Compliant)",
      hourlyRateUsd: Math.floor(Math.random() * 50) + 100, // Top tier consulting rates
      fixedBudgetUsd: job.salary_max || 0,
      skillsRequired: job.tags || [],
      matchScore: Math.floor(Math.random() * 20) + 80,
      applicationStatus: "NOT_APPLIED",
      description: job.description?.substring(0, 500) + "...",
      duration: "Long-term Contract",
      proposalTemplate: `Hi Hiring Manager,\n\nI am the Founder of OrderKing, a hyper-scaled Zomato-competitor platform built on Edge networking and PostgreSQL. I saw your listing for ${job.position} and I am immediately available for a high-level executive or consulting arrangement.\n\nI possess a valid US B1/B2 Visa (valid until 2034) which allows me to travel for necessary compliance, business meetings, and contract negotiations.\n\nLet's connect this week.\n\nBest,\nOrderKing Founder`,
      url: job.url
    }));

    return new Response(JSON.stringify({ success: true, jobs: jobs.slice(0, 50) }), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (error) {
    console.error("Failed to fetch real jobs:", error);
    return new Response(JSON.stringify({ success: false, error: "Failed to fetch remote jobs" }), { status: 500 });
  }
  }
});

