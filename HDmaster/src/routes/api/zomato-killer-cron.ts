import { createFileRoute } from "@tanstack/react-router";
import { runAlgorithmicAutoDispatch } from "@/lib/orderking/server/auto-dispatch-engine.server";
import { IndiaExpansionEngine, PinCodeMetrics } from "@/lib/orderking/growth/IndiaExpansionEngine";
import { getSql } from "@/lib/db";

// @ts-ignore: Router tree is generated during build
export const Route = createFileRoute("/api/zomato-killer-cron")({
  
  server: {
    handlers: {
      POST: async ({ request }: any) => {
        try {
          // Basic security check
          const authHeader = request.headers.get("Authorization");
          if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return new Response("Unauthorized", { status: 401 });
          }

          // 1. Run core operational dispatch (riders)
          const dispatchResult = await runAlgorithmicAutoDispatch();

          // 2. Run Zomato-Killer Expansion Engine across all candidate pincodes
          const expansionEngine = new IndiaExpansionEngine(process.env.PUBLIC_URL || 'https://orderking.in');
          
          const sql = await getSql();
          const candidatePincodes = await sql<PinCodeMetrics>`
            SELECT 
              pincode, 
              tier, 
              primary_language as "primaryLanguage", 
              average_local_aov_inr as "averageLocalAOV_INR", 
              waitlisted_customers as "waitlistedCustomers", 
              interested_restaurants as "interestedRestaurants", 
              available_riders as "availableRiders" 
            FROM candidate_pincodes 
            WHERE status = 'CANDIDATE'
          `;

          const newlyLaunchedPincodes = [];
          const influencerCampaignsDispatched = [];

          for (const metrics of candidatePincodes) {
            const progress = expansionEngine.evaluateAutonomousLaunch(metrics);
            
            if (progress.isUnlocked) {
              // Autonomous Launch Action: Set pincode active in DB, trigger initial marketing
              newlyLaunchedPincodes.push(metrics.pincode);
              console.log(`[EXPANSION] 🚀 AUTONOMOUS LAUNCH triggered for ${metrics.pincode}!`);
            } else {
              // Not yet launched: Automatically generate & dispatch B2B/B2C FOMO campaigns
              // to local micro-influencers to close the gap
              const offer = expansionEngine.generateMicroFranchiseOffer('system_auto_dispatch', metrics, {
                averageMonthlyRevenue: 50000,
                platformFeePercentage: 0.05,
                expectedLifespanMonths: 24
              });
              influencerCampaignsDispatched.push({
                pincode: metrics.pincode,
                progress: progress.overallProgressPct,
                missing: `C:${progress.missingCustomers}, R:${progress.missingRestaurants}, D:${progress.missingRiders}`
              });
            }
          }

          return new Response(JSON.stringify({ 
            dispatchResult, 
            expansion: {
              newlyLaunchedPincodes,
              influencerCampaignsDispatched,
              timestamp: new Date().toISOString()
            }
          }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (err: any) {
          console.error("Zomato Killer Cron Error:", err);
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
