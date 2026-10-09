import { createAPIFileRoute } from "@/lib/createAPIFileRoute";
import { complianceMaster, KingPayFeature } from "@/lib/orderking/kingpay/compliance-flags";

export const APIRoute = createAPIFileRoute('/api/v1/founder/kingpay-compliance')({
  GET: async () => {
    try {
      const features: KingPayFeature[] = [
        'upi', 'collect', 'pay', 'autopay', 'settlements'
      ];
      
      const state = features.reduce((acc, feature) => {
        acc[feature] = complianceMaster.isFeatureEnabled(feature);
        return acc;
      }, {} as Record<string, boolean>);

      return new Response(JSON.stringify({ success: true, state }), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      return new Response(JSON.stringify({ success: false, error: "Failed to fetch state" }), { status: 500 });
    }
  },

  POST: async ({ request }: { request: Request }) => {
    try {
      const { feature, action } = await request.json() as { feature: KingPayFeature, action: 'activate' | 'deactivate' };
      
      if (action === 'activate') {
        const success = complianceMaster.activateFeature(
          feature,
          "Founder-Umar",
          true, // kycKybVerified
          true, // pspAuthorized
          `AUTH-${Date.now()}`
        );
        return new Response(JSON.stringify({ success, state: { [feature]: complianceMaster.isFeatureEnabled(feature) } }));
      } else {
        complianceMaster.deactivateFeature(feature);
        return new Response(JSON.stringify({ success: true, state: { [feature]: false } }));
      }
    } catch (error) {
      return new Response(JSON.stringify({ success: false, error: "Failed to update state" }), { status: 500 });
    }
  }
});
