import { describe, it, expect, vi, beforeEach } from "vitest";
import { tryExecutePartnerAiCommand, type PartnerAiCommandContext } from "../lib/ai/partner-ai-actions.ts";
import * as apiSupport from "../lib/server/api-support.ts";
import * as apiMenu from "../lib/server/api-menu.ts";

describe("Partner King AI Autonomous Multilingual Action Dispatcher", () => {
  const baseContext: PartnerAiCommandContext = {
    restaurantId: "rest_test_123",
    languageCode: "en",
    canEditMenu: true,
    canEditAvailability: true,
    canEditHours: true,
    canEditPromotions: true,
    categories: [
      { id: "cat_main", name: "Main Course" },
      { id: "cat_starters", name: "Starters" },
      { id: "cat_breads", name: "Breads" },
    ],
    items: [
      {
        id: "item_pt",
        name: "Paneer Tikka",
        category_id: "cat_starters",
        diet: "VEG",
        variants: [{ id: "v_1", name: "Regular", pricePaise: 22000 }],
      },
      {
        id: "item_bc",
        name: "Butter Chicken",
        category_id: "cat_main",
        diet: "NONVEG",
        variants: [{ id: "v_2", name: "Regular", pricePaise: 34000 }],
      },
    ],
    dashboard: {
      isOpen: true,
      today: {
        orders: 14,
        delivered: 12,
        pending: 2,
        salesPaise: 540000,
        settlementPaise: 513000,
      },
    },
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("handles sales queries accurately in English, Hindi, and Bengali", async () => {
    const enRes = await tryExecutePartnerAiCommand("What are today's sales and order stats?", baseContext);
    expect(enRes.handled).toBe(true);
    expect(enRes.action).toBe("SALES_QUERY");
    expect(enRes.replyText).toContain("12 orders fulfilled");
    expect(enRes.replyText).toContain("₹5,400");

    const hiRes = await tryExecutePartnerAiCommand("आज की बिक्री कितनी है?", {
      ...baseContext,
      languageCode: "hi",
    });
    expect(hiRes.handled).toBe(true);
    expect(hiRes.action).toBe("SALES_QUERY");
    expect(hiRes.replyText).toContain("आज का लाइव किचन प्रदर्शन");

    const bnRes = await tryExecutePartnerAiCommand("আজকের মোট বিক্রি এবং অর্ডার কত?", {
      ...baseContext,
      languageCode: "bn",
    });
    expect(bnRes.handled).toBe(true);
    expect(bnRes.action).toBe("SALES_QUERY");
    expect(bnRes.replyText).toContain("আজকের লাইভ কিচেন পারফরম্যান্স");
  });

  it("handles instant dish price updates", async () => {
    const spySaveItem = vi.spyOn(apiMenu, "saveItem").mockResolvedValue({ id: "item_pt" } as any);

    const res = await tryExecutePartnerAiCommand("Update price of Paneer Tikka to ₹260", baseContext);
    expect(res.handled).toBe(true);
    expect(res.action).toBe("UPDATE_PRICE");
    expect(res.replyText).toContain("Paneer Tikka");
    expect(res.replyText).toContain("₹260");
    expect(spySaveItem).toHaveBeenCalled();
  });

  it("handles instant stockout and restock commands", async () => {
    const spySetAvailability = vi.spyOn(apiMenu, "setAvailability").mockResolvedValue({ ok: true } as any);

    const outRes = await tryExecutePartnerAiCommand("Mark Butter Chicken out of stock", baseContext);
    expect(outRes.handled).toBe(true);
    expect(outRes.action).toBe("STOCKOUT");
    expect(outRes.replyText).toContain("Butter Chicken");

    const inRes = await tryExecutePartnerAiCommand("Restock Butter Chicken back in stock", baseContext);
    expect(inRes.handled).toBe(true);
    expect(inRes.action).toBe("RESTOCK");
    expect(spySetAvailability).toHaveBeenCalled();
  });

  it("dispatches Support Ticket creation on natural language help desk request", async () => {
    const spyCreateTicket = vi.spyOn(apiSupport, "createPartnerTicket").mockResolvedValue({
      ok: true,
      ticketId: "tkt_12345",
      ticketNumber: "TKT-2026-9999",
      status: "AI_INVESTIGATING",
      aiResolutionSummary: "Your T+1 bank payout of ₹5,130 is in transit to your linked settlement bank account.",
    } as any);

    const res = await tryExecutePartnerAiCommand(
      "Raise a support ticket regarding delayed bank payout settlement for yesterday",
      baseContext
    );

    expect(res.handled).toBe(true);
    expect(res.action).toBe("CREATE_SUPPORT_TICKET");
    expect(res.createdTicketId).toBe("tkt_12345");
    expect(res.replyText).toContain("TKT-2026-9999");
    expect(res.replyText).toContain("AI Resolution");
    expect(spyCreateTicket).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          category: "PAYOUT_ISSUE",
          priority: "HIGH",
          restaurantId: "rest_test_123",
        }),
      })
    );
  });

  it("handles storefront status check and why no orders queries with authentic diagnostics", async () => {
    const res = await tryExecutePartnerAiCommand(
      "Why am I not receiving orders right now? Check my storefront status.",
      baseContext
    );

    expect(res.handled).toBe(true);
    expect(res.action).toBe("STOREFRONT_STATUS");
    expect(res.replyText).toContain("Storefront Status Check");
    expect(res.replyText).toContain("ONLINE & ACCEPTING ORDERS");
    expect(res.replyText).toContain("2 active dish(es) listed");

    const hiRes = await tryExecutePartnerAiCommand(
      "order kyu nahi aa raha hai? storefront status check karo",
      {
        ...baseContext,
        languageCode: "hi",
      }
    );
    expect(hiRes.handled).toBe(true);
    expect(hiRes.action).toBe("STOREFRONT_STATUS");
    expect(hiRes.replyText).toContain("स्टोर स्थिति जांच");
  });
});
