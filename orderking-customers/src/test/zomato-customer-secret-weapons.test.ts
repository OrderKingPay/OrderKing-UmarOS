import { describe, it, expect, beforeEach } from "vitest";
import {
  TIP_PRESETS,
  FEEDING_INDIA_DONATION_PAISE,
  MAX_TIP_PAISE,
  parseCustomTip,
  calculateTipPayout,
  calculateDonationLedger,
  calculateCheckoutTotal,
} from "@/lib/orders/tips-and-donations";
import {
  useCartStore,
  detectCartConflict,
  canAddToCart,
  toCartItem,
  cartKey,
} from "@/lib/stores/cart";
import {
  matchesMenuQuery,
  getHighlightedSegments,
  filterMenuCategories,
  type MenuCategoryWithItems,
} from "@/lib/menu/search-and-filter";
import type { CartLineInput, MenuItemView } from "@/lib/market-types";

describe("1. Pre-Order Delivery Partner Tip Selector (100% to Rider)", () => {
  it("provides authentic Zomato preset tip chips with tags and rupee values", () => {
    expect(TIP_PRESETS).toHaveLength(3);

    const [chip20, chip30, chip50] = TIP_PRESETS;
    expect(chip20).toEqual({
      label: "₹20",
      valuePaise: 2000,
      tag: "Thank you 🙏",
      emoji: "🙏",
    });
    expect(chip30).toEqual({
      label: "₹30",
      valuePaise: 3000,
      tag: "Most Popular ⭐",
      emoji: "⭐",
    });
    expect(chip50).toEqual({
      label: "₹50",
      valuePaise: 5000,
      tag: "Super Hero 🦸",
      emoji: "🦸",
    });
  });

  it("accurately parses and bounds custom tip amounts in rupees into integer paise", () => {
    // Valid numbers and strings
    expect(parseCustomTip("25")).toBe(2500);
    expect(parseCustomTip(40)).toBe(4000);
    expect(parseCustomTip("₹75")).toBe(7500);
    expect(parseCustomTip(" 100 ")).toBe(10000);

    // Decimal amounts
    expect(parseCustomTip("15.50")).toBe(1550);

    // Caps to MAX_TIP_PAISE (₹1,000.00 / 100,000 paise)
    expect(parseCustomTip("1500")).toBe(MAX_TIP_PAISE);
    expect(parseCustomTip(2500)).toBe(MAX_TIP_PAISE);

    // Invalid or negative amounts resolve safely to 0
    expect(parseCustomTip("-50")).toBe(0);
    expect(parseCustomTip("")).toBe(0);
    expect(parseCustomTip("abc")).toBe(0);
  });

  it("strictly enforces 0% platform commission/fee on tips with 100% rider payout", () => {
    const presetTip = calculateTipPayout(3000); // ₹30 tip
    expect(presetTip.tipPaise).toBe(3000);
    expect(presetTip.platformFeePaise).toBe(0);
    expect(presetTip.platformCommissionBps).toBe(0);
    expect(presetTip.riderPayoutPaise).toBe(3000);
    expect(presetTip.note).toContain("100% of your tip goes directly to your delivery partner");
    expect(presetTip.note).toContain("0% commission or fee on tips");

    const customTip = calculateTipPayout(7500); // ₹75 custom tip
    expect(customTip.tipPaise).toBe(7500);
    expect(customTip.platformFeePaise).toBe(0);
    expect(customTip.riderPayoutPaise).toBe(7500);
  });

  it("dynamically recalculates total payable with validated integer tip", () => {
    const foodSubtotal = 45000; // ₹450.00

    // No tip
    const resNoTip = calculateCheckoutTotal(foodSubtotal, 0, false);
    expect(resNoTip.totalPayablePaise).toBe(45000);

    // Preset ₹30 tip
    const resPreset = calculateCheckoutTotal(foodSubtotal, 3000, false);
    expect(resPreset.tipPaise).toBe(3000);
    expect(resPreset.totalPayablePaise).toBe(48000); // 450 + 30 = ₹480.00

    // Custom ₹65 tip
    const resCustom = calculateCheckoutTotal(foodSubtotal, 6500, false);
    expect(resCustom.tipPaise).toBe(6500);
    expect(resCustom.totalPayablePaise).toBe(51500); // 450 + 65 = ₹515.00
  });
});

describe("2. Multi-Restaurant Cart Conflict Shield ('Replace Cart Items' Modal)", () => {
  beforeEach(() => {
    useCartStore.getState().clear();
  });

  it("allows adding items when cart is empty without triggering conflict", () => {
    const itemA: CartLineInput = {
      itemId: "dish-biryani-1",
      variantId: null,
      addonIds: [],
      quantity: 1,
      instructions: "",
    };

    expect(detectCartConflict(null, 0, "rest-paradise")).toBe(false);
    expect(canAddToCart(null, 0, "rest-paradise")).toBe("ok");

    const addResult = useCartStore.getState().addItem(
      "rest-paradise",
      "Paradise Biryani",
      toCartItem(itemA)
    );
    expect(addResult).toBe("ok");
    expect(useCartStore.getState().restaurantId).toBe("rest-paradise");
    expect(useCartStore.getState().restaurantName).toBe("Paradise Biryani");
    expect(useCartStore.getState().items).toHaveLength(1);
  });

  it("allows adding more items from the same restaurant without conflict", () => {
    const item1: CartLineInput = {
      itemId: "dish-biryani-1",
      variantId: null,
      addonIds: [],
      quantity: 1,
      instructions: "",
    };
    useCartStore.getState().addItem("rest-paradise", "Paradise Biryani", toCartItem(item1));

    expect(detectCartConflict("rest-paradise", 1, "rest-paradise")).toBe(false);
    expect(canAddToCart("rest-paradise", 1, "rest-paradise")).toBe("ok");

    const item2: CartLineInput = {
      itemId: "dish-tikka-1",
      variantId: null,
      addonIds: [],
      quantity: 2,
      instructions: "",
    };
    const addResult = useCartStore.getState().addItem(
      "rest-paradise",
      "Paradise Biryani",
      toCartItem(item2)
    );
    expect(addResult).toBe("ok");
    expect(useCartStore.getState().items).toHaveLength(2);
  });

  it("detects multi-restaurant cart conflict and blocks silent overwriting", () => {
    // Cart has items from Paradise Biryani
    const itemA: CartLineInput = {
      itemId: "dish-biryani-1",
      variantId: null,
      addonIds: [],
      quantity: 1,
      instructions: "",
    };
    useCartStore.getState().addItem("rest-paradise", "Paradise Biryani", toCartItem(itemA));

    // Customer attempts to add a dish from Behrouz Biryani
    const hasConflict = detectCartConflict("rest-paradise", 1, "rest-behrouz");
    expect(hasConflict).toBe(true);

    const checkResult = canAddToCart("rest-paradise", 1, "rest-behrouz");
    expect(checkResult).toBe("replace");

    const itemB: CartLineInput = {
      itemId: "dish-dum-gosht",
      variantId: null,
      addonIds: [],
      quantity: 1,
      instructions: "",
    };
    const addResult = useCartStore.getState().addItem(
      "rest-behrouz",
      "Behrouz Biryani",
      toCartItem(itemB)
    );
    // Must return 'replace' instead of silently overwriting
    expect(addResult).toBe("replace");

    // Old cart remains intact and protected!
    expect(useCartStore.getState().restaurantId).toBe("rest-paradise");
    expect(useCartStore.getState().restaurantName).toBe("Paradise Biryani");
    expect(useCartStore.getState().items[0].itemId).toBe("dish-biryani-1");
  });

  it("atomically flushes old items and resets restaurant context on 'Clear Cart & Add New Dish'", () => {
    // Populate with Restaurant A items and a coupon
    const itemA: CartLineInput = {
      itemId: "dish-biryani-1",
      variantId: null,
      addonIds: [],
      quantity: 2,
      instructions: "Spicy",
    };
    useCartStore.getState().addItem("rest-paradise", "Paradise Biryani", toCartItem(itemA));
    useCartStore.getState().setCoupon("ROYAL50");
    expect(useCartStore.getState().coupon).toBe("ROYAL50");

    // Customer confirms atomic replacement for Restaurant B
    const itemB: CartLineInput = {
      itemId: "dish-dum-gosht",
      variantId: null,
      addonIds: [],
      quantity: 1,
      instructions: "",
    };
    useCartStore.getState().replaceAndAdd("rest-behrouz", "Behrouz Biryani", toCartItem(itemB));

    const state = useCartStore.getState();
    expect(state.restaurantId).toBe("rest-behrouz");
    expect(state.restaurantName).toBe("Behrouz Biryani");
    expect(state.coupon).toBe(""); // Coupon reset
    expect(state.items).toHaveLength(1);
    expect(state.items[0].itemId).toBe("dish-dum-gosht");
  });
});

describe("3. 1-Tap Quick Reorder Engine", () => {
  beforeEach(() => {
    useCartStore.getState().clear();
  });

  it("hydrates items from a past order directly into the cart", () => {
    const mockPastOrderLines: CartLineInput[] = [
      {
        itemId: "dish-butter-chicken",
        variantId: "var-half",
        addonIds: ["addon-extra-butter"],
        quantity: 2,
        instructions: "Mild spicy",
      },
      {
        itemId: "dish-garlic-naan",
        variantId: null,
        addonIds: [],
        quantity: 3,
        instructions: "Crispy",
      },
    ];

    useCartStore.getState().replaceCart(
      "rest-punjab-grill",
      "Punjab Grill",
      mockPastOrderLines
    );

    const state = useCartStore.getState();
    expect(state.restaurantId).toBe("rest-punjab-grill");
    expect(state.restaurantName).toBe("Punjab Grill");
    expect(state.items).toHaveLength(2);

    const [first, second] = state.items;
    expect(first.itemId).toBe("dish-butter-chicken");
    expect(first.variantId).toBe("var-half");
    expect(first.addonIds).toEqual(["addon-extra-butter"]);
    expect(first.quantity).toBe(2);
    expect(first.instructions).toBe("Mild spicy");
    expect(first.key).toBe(cartKey(first));

    expect(second.itemId).toBe("dish-garlic-naan");
    expect(second.quantity).toBe(3);
    expect(second.instructions).toBe("Crispy");
  });

  it("detects cross-restaurant conflict when reordering and shields cart", () => {
    // Current cart has an active selection from Kitchen A
    const activeLine: CartLineInput = {
      itemId: "dish-pizza-1",
      variantId: null,
      addonIds: [],
      quantity: 1,
      instructions: "",
    };
    useCartStore.getState().addItem("rest-dominos", "Domino's Pizza", toCartItem(activeLine));

    // Past order is from Kitchen B (Haldiram's)
    const pastOrderRestId = "rest-haldiram";
    const pastOrderRestName = "Haldiram's Express";
    const pastOrderLines: CartLineInput[] = [
      { itemId: "dish-chole-bhature", variantId: null, addonIds: [], quantity: 2, instructions: "" },
    ];

    const currentCart = useCartStore.getState();
    const hasConflict = detectCartConflict(
      currentCart.restaurantId,
      currentCart.items.length,
      pastOrderRestId
    );
    expect(hasConflict).toBe(true);

    // After user confirms replacement:
    useCartStore.getState().replaceCart(pastOrderRestId, pastOrderRestName, pastOrderLines);

    const updated = useCartStore.getState();
    expect(updated.restaurantId).toBe("rest-haldiram");
    expect(updated.restaurantName).toBe("Haldiram's Express");
    expect(updated.items).toHaveLength(1);
    expect(updated.items[0].itemId).toBe("dish-chole-bhature");
  });
});

describe("4. In-Menu Dish Search & Sticky Category Jump Navigation", () => {
  const sampleCategories: MenuCategoryWithItems[] = [
    {
      id: "cat-starters",
      name: "Starters",
      items: [
        {
          id: "dish-paneer-tikka",
          name: "Paneer Tikka Angara",
          description: "Smoky cottage cheese cubes charred in tandoor with aromatic spices",
          imageUrl: null,
          veg: true,
          spicyLevel: 2,
          bestseller: true,
          available: true,
          basePricePaise: 24900,
          variants: [],
          addonGroups: [],
        },
        {
          id: "dish-chicken-wings",
          name: "Fiery Chicken Wings",
          description: "Crispy fried wings tossed in hot peri-peri glaze",
          imageUrl: null,
          veg: false,
          spicyLevel: 3,
          bestseller: false,
          available: true,
          basePricePaise: 28900,
          variants: [],
          addonGroups: [],
        },
      ],
    },
    {
      id: "cat-biryani",
      name: "Biryani",
      items: [
        {
          id: "dish-dum-biryani",
          name: "Hyderabadi Dum Biryani",
          description: "Slow-cooked saffron basmati rice layered with fragrant herbs",
          imageUrl: null,
          veg: false,
          spicyLevel: 2,
          bestseller: true,
          available: true,
          basePricePaise: 34900,
          variants: [],
          addonGroups: [],
        },
        {
          id: "dish-veg-biryani",
          name: "Subz Shahi Biryani",
          description: "Seasonal garden vegetables infused with kewra and aged basmati",
          imageUrl: null,
          veg: true,
          spicyLevel: 1,
          bestseller: false,
          available: true,
          basePricePaise: 26900,
          variants: [],
          addonGroups: [],
        },
      ],
    },
  ];

  it("filters menu items in real-time matching dish name and description", () => {
    // Search by dish name
    const matchName = filterMenuCategories(sampleCategories, "Biryani");
    expect(matchName).toHaveLength(1);
    expect(matchName[0].id).toBe("cat-biryani");
    expect(matchName[0].items).toHaveLength(2);

    // Search by description keyword
    const matchDesc = filterMenuCategories(sampleCategories, "tandoor");
    expect(matchDesc).toHaveLength(1);
    expect(matchDesc[0].id).toBe("cat-starters");
    expect(matchDesc[0].items[0].name).toBe("Paneer Tikka Angara");

    // Empty search returns all categories
    const all = filterMenuCategories(sampleCategories, "");
    expect(all).toHaveLength(2);
  });

  it("combines in-menu search with dietary veg filter", () => {
    // Search "Biryani" + Pure Veg Only
    const vegBiryani = filterMenuCategories(sampleCategories, "Biryani", { vegOnly: true });
    expect(vegBiryani).toHaveLength(1);
    expect(vegBiryani[0].items).toHaveLength(1);
    expect(vegBiryani[0].items[0].name).toBe("Subz Shahi Biryani");
    expect(vegBiryani[0].items[0].veg).toBe(true);
  });

  it("combines in-menu search with bestsellers filter", () => {
    // Bestsellers only
    const bestsellers = filterMenuCategories(sampleCategories, "", { bestsellersOnly: true });
    expect(bestsellers[0].items.map((i) => i.name)).toEqual(["Paneer Tikka Angara"]);
    expect(bestsellers[1].items.map((i) => i.name)).toEqual(["Hyderabadi Dum Biryani"]);
  });

  it("splits text into matched and unmatched segments for visual highlighting", () => {
    const text = "Hyderabadi Dum Biryani Feast";
    const segments = getHighlightedSegments(text, "Biryani");

    expect(segments).toEqual([
      { text: "Hyderabadi Dum ", isMatch: false },
      { text: "Biryani", isMatch: true },
      { text: " Feast", isMatch: false },
    ]);

    // Case-insensitive highlighting
    const caseSegments = getHighlightedSegments(text, "dum");
    expect(caseSegments.some((s) => s.isMatch && s.text.toLowerCase() === "dum")).toBe(true);
  });
});

describe("5. Feeding India Micro-Donation Opt-in (₹2)", () => {
  it("provides exact ₹2 (200 paise) micro-donation ledger with 0% platform deductions", () => {
    const donation = calculateDonationLedger(true);
    expect(donation.donationPaise).toBe(FEEDING_INDIA_DONATION_PAISE);
    expect(donation.donationPaise).toBe(200);
    expect(donation.platformFeePaise).toBe(0);
    expect(donation.charityPayoutPaise).toBe(200);
    expect(donation.label).toContain("Donate ₹2 to Feeding India");
  });

  it("returns 0 donation paise when opted out", () => {
    const donation = calculateDonationLedger(false);
    expect(donation.donationPaise).toBe(0);
    expect(donation.charityPayoutPaise).toBe(0);
  });

  it("integrates tip, Feeding India donation, and quote total into atomic checkout payable", () => {
    const quoteTotal = 54900; // ₹549.00
    const tipPaise = 3000; // ₹30.00 preset tip
    const donateFeedingIndia = true; // ₹2.00 donation

    const breakdown = calculateCheckoutTotal(quoteTotal, tipPaise, donateFeedingIndia);

    expect(breakdown.quoteTotalPaise).toBe(54900);
    expect(breakdown.tipPaise).toBe(3000);
    expect(breakdown.donationPaise).toBe(200);
    // 549.00 + 30.00 + 2.00 = 581.00 (58,100 paise)
    expect(breakdown.totalPayablePaise).toBe(58100);
  });
});
