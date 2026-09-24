import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  generateViralShareUrl,
  GENUINE_SUBSIDIES_REGISTRY,
  PRESTIGE_AWARDS_REGISTRY,
  ACADEMIC_INVITATIONS_REGISTRY,
  generateMetaAdCampaignSpec,
  generateGoogleLocalSeoSchema,
  generateInstitutionalPitchDossier,
  OPPORTUNITY_RADAR_REGISTRY,
  scanAndRankOpportunities,
  generateAutoBookingDossier,
  generateMetaMarketingApiPayload,
  generateGoogleAdsPMaxPayload,
  generateViralReelsScripts,
  generateLocalInfluencerBarterPitch,
  type ViralSharePayload,
} from "./viral-growth.ts";

describe("OrderKing Omni-Prestige, Subsidies & Hyper-Viral Engine", () => {
  const payload: ViralSharePayload = {
    orderId: "ord_test_881",
    customerName: "Hasan",
    restaurantName: "Biryani Darbar",
    goldMgWon: 1.5,
    savingsPaise: 8500, // ₹85 saved
    referralCode: "HASAN777",
    townName: "Karimganj",
  };

  it("generates WhatsApp Status viral share URL with encoded text and referral UTM", () => {
    const url = generateViralShareUrl(payload, "WHATSAPP_STATUS");
    assert.ok(url.startsWith("https://api.whatsapp.com/send?text="));
    assert.ok(url.includes("1.5mg%2024K%20Pure%20Digital%20Gold"));
    assert.ok(url.includes("Saved%20%E2%82%B985%20with%20Fair%20Pricing"));
    assert.ok(url.includes("ref%3DHASAN777"));
    assert.ok(url.includes("utm_source%3Dwhatsapp_status"));
  });

  it("generates Facebook & Twitter sharing URLs with appropriate parameters", () => {
    const fbUrl = generateViralShareUrl(payload, "FACEBOOK");
    assert.ok(fbUrl.startsWith("https://www.facebook.com/sharer/sharer.php"));
    assert.ok(fbUrl.includes("HASAN777"));

    const xUrl = generateViralShareUrl(payload, "TWITTER_X");
    assert.ok(xUrl.startsWith("https://twitter.com/intent/tweet?text="));
    assert.ok(xUrl.includes("HASAN777"));
  });

  it("registers real, genuine Indian government and cloud subsidies", () => {
    assert.ok(GENUINE_SUBSIDIES_REGISTRY.length >= 10);

    const assamStartup = GENUINE_SUBSIDIES_REGISTRY.find((s) => s.id === "sub_assam_startup_mas");
    assert.ok(assamStartup);
    assert.ok(assamStartup?.maxBenefitInr.includes("₹50,00,000"));
    assert.equal(assamStartup?.status, "ELIGIBLE_NOW");
    assert.ok(assamStartup?.directBankPayoutMethod.includes("RTGS"));

    const googleCloud = GENUINE_SUBSIDIES_REGISTRY.find((s) => s.id === "sub_google_cloud_for_startups");
    assert.ok(googleCloud);
    assert.ok(googleCloud?.maxBenefitInr.includes("$100,000"));

    const sisfs = GENUINE_SUBSIDIES_REGISTRY.find((s) => s.id === "sub_dpiit_sisfs");
    assert.ok(sisfs);
    assert.ok(sisfs?.maxBenefitInr.includes("₹20,00,000"));

    const prayas = GENUINE_SUBSIDIES_REGISTRY.find((s) => s.id === "sub_dst_nidhi_prayas");
    assert.ok(prayas);
    assert.ok(prayas?.maxBenefitInr.includes("₹10,00,000"));
  });

  it("registers prestigious national and regional award pathways for the founder", () => {
    assert.ok(PRESTIGE_AWARDS_REGISTRY.length >= 5);

    const nationalStartup = PRESTIGE_AWARDS_REGISTRY.find((a) => a.id === "award_national_startup");
    assert.ok(nationalStartup);
    assert.equal(nationalStartup?.prestigeLevel, "NATIONAL");
    assert.ok(nationalStartup?.institutionalPerks.length > 0);

    const assamYouth = PRESTIGE_AWARDS_REGISTRY.find((a) => a.id === "award_assam_youth_icon");
    assert.ok(assamYouth);
    assert.equal(assamYouth?.prestigeLevel, "STATE_EXCELLENCE");

    const msmeAward = PRESTIGE_AWARDS_REGISTRY.find((a) => a.id === "award_msme_national");
    assert.ok(msmeAward);
    assert.ok(msmeAward?.institutionalPerks[1].includes("₹3,00,000"));
  });

  it("registers academic institution keynote speaker pathways (IIT, NIT, IIM CIP)", () => {
    assert.ok(ACADEMIC_INVITATIONS_REGISTRY.length >= 6);

    const iit = ACADEMIC_INVITATIONS_REGISTRY.find((i) => i.id === "inv_iit_guwahati");
    assert.ok(iit);
    assert.equal(iit?.institution, "Indian Institute of Technology (IIT) Guwahati");
    assert.equal(iit?.invitationStatus, "READY_FOR_FOUNDER_PITCH");

    const nit = ACADEMIC_INVITATIONS_REGISTRY.find((i) => i.id === "inv_nit_silchar");
    assert.ok(nit);
    assert.equal(nit?.institution, "National Institute of Technology (NIT) Silchar");

    const iitb = ACADEMIC_INVITATIONS_REGISTRY.find((i) => i.id === "inv_iit_bombay_esummit");
    assert.ok(iitb);
    assert.equal(iitb?.institution, "Indian Institute of Technology (IIT) Bombay");
  });

  it("generates Meta Ads campaign JSON specifications with local geofence", () => {
    const metaSpec = generateMetaAdCampaignSpec("Karimganj", 200);
    assert.equal(metaSpec.objective, "OUTCOME_SALES");
    assert.equal(metaSpec.targetGeo.townName, "Karimganj");
    assert.equal(metaSpec.targetGeo.radiusKm, 5.0);
    assert.equal(metaSpec.dailyBudgetInr, 200);
    assert.ok(metaSpec.adCreatives.length >= 2);
    assert.ok(metaSpec.adCreatives[0].headline.includes("Karimganj"));
  });

  it("generates Google Local SEO Schema for map and search domination", () => {
    const seoSchema = generateGoogleLocalSeoSchema("Karimganj");
    assert.equal(seoSchema.type, "FoodDeliveryService");
    assert.equal(seoSchema.context, "https://schema.org");
    assert.ok(seoSchema.name.includes("Karimganj"));
    assert.ok(seoSchema.areaServed.includes("Assam, India"));
  });

  it("generates formal institutional pitch dossiers for university invitations", () => {
    const dossier = generateInstitutionalPitchDossier("IIT Guwahati", "Hasan");
    assert.ok(dossier.subject.includes("Hasan"));
    assert.ok(dossier.salutation.includes("IIT Guwahati"));
    assert.ok(dossier.body.includes("Barak Valley of Assam"));
    assert.ok(dossier.keyStats.length >= 3);
  });

  it("scans and ranks opportunities in the Opportunity Radar", () => {
    assert.ok(OPPORTUNITY_RADAR_REGISTRY.length >= 15);
    const ranked = scanAndRankOpportunities({ minCashInr: 1000000 });
    assert.ok(ranked.length > 0);
    // Verified descending sort by cash benefit
    assert.ok(ranked[0].cashBenefitInr >= ranked[ranked.length - 1].cashBenefitInr);
  });

  it("generates 1-Click Auto-Booking Dossiers with complete statutory and banking details", () => {
    const dossier = generateAutoBookingDossier("opp_assam_mas", {
      name: "Hasan",
      entityName: "OrderKing Technologies Private Limited",
      email: "founder@orderking.in",
      phone: "+91 98765 43210",
      bankAccount: {
        accountNumber: "123456789012",
        ifsc: "SBIN0000123",
        bankName: "State Bank of India",
      },
    });
    assert.equal(dossier.opportunityId, "opp_assam_mas");
    assert.equal(dossier.applicant.founderName, "Hasan");
    assert.equal(dossier.submissionStatus, "READY_FOR_ONE_CLICK_DISPATCH");
    assert.ok(dossier.directPayoutChannel.includes("RTGS"));
    assert.ok(dossier.formPayload.statutoryDeclarations.length >= 3);
  });

  it("generates Meta Marketing API v21.0 payload with pin code geofencing", () => {
    const metaPayload = generateMetaMarketingApiPayload("Karimganj", 250);
    assert.equal(metaPayload.campaign.objective, "OUTCOME_SALES");
    assert.equal(metaPayload.adset.daily_budget_inr, 250);
    assert.ok(metaPayload.adset.targeting.geo_locations.zip.includes("788710"));
    assert.equal(metaPayload.creative.call_to_action.type, "ORDER_NOW");
  });

  it("generates Google Ads PMax payload and viral video scripts", () => {
    const pmax = generateGoogleAdsPMaxPayload("Karimganj", 300);
    assert.equal(pmax.campaign.advertising_channel_type, "PERFORMANCE_MAX");
    assert.equal(pmax.campaign.daily_budget_micros, 300_000_000);
    assert.ok(pmax.asset_group.headlines.length >= 3);

    const scripts = generateViralReelsScripts("Karimganj");
    assert.ok(scripts.length >= 3);
    assert.ok(scripts[0].audioHook.includes("Karimganj"));

    const barter = generateLocalInfluencerBarterPitch("@karimganj_vibes", "Karimganj");
    assert.equal(barter.influencerHandle, "@karimganj_vibes");
    assert.ok(barter.dmMessage.includes("OrderKing"));
  });
});

