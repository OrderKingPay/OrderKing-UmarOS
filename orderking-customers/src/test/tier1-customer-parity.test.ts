import { describe, it, expect, beforeEach } from "vitest";
import {
  calculateGraceTimeRemaining,
  calculateRefundDetails,
  GRACE_WINDOW_SECONDS,
} from "@/lib/orders/cancellation";
import {
  canTransition,
  customerMayCancel,
  isTerminal,
} from "@/lib/orders/state";
import {
  calculateModifierPricing,
  extractEffectiveAddonGroups,
  validateModifierSelections,
} from "@/lib/modifiers/nested-modifiers";
import type { AddonGroupView, MenuItemView } from "@/lib/market-types";
import {
  MAX_VOICE_NOTE_DURATION_SECONDS,
  useVoiceNoteStore,
  type VoiceNoteItem,
} from "@/lib/stores/voice-notes";

describe("1. 60-Second Order Cancellation Grace Window & 100% Refund Parity", () => {
  const MOCK_PLACED_TIME = 1_700_000_000_000; // Fixed timestamp ms

  it("calculates remaining seconds accurately within grace window", () => {
    // 0s elapsed
    const t0 = calculateGraceTimeRemaining(MOCK_PLACED_TIME, MOCK_PLACED_TIME);
    expect(t0.secondsRemaining).toBe(60);
    expect(t0.isWithinGraceWindow).toBe(true);
    expect(t0.elapsedSeconds).toBe(0);
    expect(t0.percentRemaining).toBe(100);

    // 15s elapsed
    const t15 = calculateGraceTimeRemaining(MOCK_PLACED_TIME, MOCK_PLACED_TIME + 15_000);
    expect(t15.secondsRemaining).toBe(45);
    expect(t15.isWithinGraceWindow).toBe(true);
    expect(t15.elapsedSeconds).toBe(15);
    expect(t15.percentRemaining).toBe(75);

    // 30s elapsed (halfway)
    const t30 = calculateGraceTimeRemaining(MOCK_PLACED_TIME, MOCK_PLACED_TIME + 30_000);
    expect(t30.secondsRemaining).toBe(30);
    expect(t30.isWithinGraceWindow).toBe(true);
    expect(t30.elapsedSeconds).toBe(30);
    expect(t30.percentRemaining).toBe(50);

    // 59s elapsed (last second of grace)
    const t59 = calculateGraceTimeRemaining(MOCK_PLACED_TIME, MOCK_PLACED_TIME + 59_000);
    expect(t59.secondsRemaining).toBe(1);
    expect(t59.isWithinGraceWindow).toBe(true);
    expect(t59.elapsedSeconds).toBe(59);
  });

  it("expires cleanly at exactly 60 seconds and post-grace", () => {
    // Exactly 60s boundary
    const t60 = calculateGraceTimeRemaining(MOCK_PLACED_TIME, MOCK_PLACED_TIME + 60_000);
    expect(t60.secondsRemaining).toBe(0);
    expect(t60.isWithinGraceWindow).toBe(false);
    expect(t60.percentRemaining).toBe(0);

    // 75s (grace expired, order confirmed with kitchen)
    const t75 = calculateGraceTimeRemaining(MOCK_PLACED_TIME, MOCK_PLACED_TIME + 75_000);
    expect(t75.secondsRemaining).toBe(0);
    expect(t75.isWithinGraceWindow).toBe(false);
    expect(t75.elapsedSeconds).toBe(75);
  });

  it("safely handles invalid or zero placedAt timestamps", () => {
    const invalid = calculateGraceTimeRemaining("invalid-date-string");
    expect(invalid.secondsRemaining).toBe(0);
    expect(invalid.isWithinGraceWindow).toBe(false);

    const zero = calculateGraceTimeRemaining(0);
    expect(zero.secondsRemaining).toBe(0);
    expect(zero.isWithinGraceWindow).toBe(false);
  });

  it("calculates 100% instant refund for KingPay wallet payments during grace window", () => {
    const refund = calculateRefundDetails(
      {
        totalPaise: 45_000, // ₹450.00
        paymentMethod: "KING_PAY",
        paymentStatus: "wallet_paid",
      },
      true // within 60s
    );

    expect(refund.isFullRefund).toBe(true);
    expect(refund.refundPaise).toBe(45_000);
    expect(refund.refundDestination).toBe("KINGPAY_WALLET");
    expect(refund.zeroDeduction).toBe(true);
    expect(refund.instantApproval).toBe(true);
  });

  it("calculates 100% instant refund for UPI/Razorpay payments during grace window", () => {
    const refund = calculateRefundDetails(
      {
        totalPaise: 89_900, // ₹899.00
        paymentMethod: "RAZORPAY_ONLINE",
        paymentStatus: "captured",
      },
      true // within 60s
    );

    expect(refund.isFullRefund).toBe(true);
    expect(refund.refundPaise).toBe(89_900);
    expect(refund.refundDestination).toBe("UPI_SOURCE");
    expect(refund.zeroDeduction).toBe(true);
    expect(refund.instantApproval).toBe(true);
  });

  it("handles COD cancellation without fee during grace window", () => {
    const refund = calculateRefundDetails(
      {
        totalPaise: 35_000,
        paymentMethod: "COD",
        paymentStatus: "pending",
      },
      true // within 60s
    );

    expect(refund.isFullRefund).toBe(true);
    expect(refund.refundPaise).toBe(0);
    expect(refund.refundDestination).toBe("COD_NO_CHARGE");
    expect(refund.instantApproval).toBe(true);
  });

  it("denies instant zero-dispute refund once 60s grace window has elapsed", () => {
    const refund = calculateRefundDetails(
      {
        totalPaise: 45_000,
        paymentMethod: "KING_PAY",
      },
      false // grace window elapsed
    );

    expect(refund.isFullRefund).toBe(false);
    expect(refund.refundPaise).toBe(0);
    expect(refund.instantApproval).toBe(false);
  });

  it("verifies state machine transitions for CANCELLED_BY_CUSTOMER", () => {
    expect(canTransition("PLACED", "CANCELLED_BY_CUSTOMER")).toBe(true);
    expect(canTransition("ACCEPTED", "CANCELLED_BY_CUSTOMER")).toBe(true);
    expect(canTransition("PREPARING", "CANCELLED_BY_CUSTOMER")).toBe(false);
    expect(isTerminal("CANCELLED_BY_CUSTOMER")).toBe(true);
    expect(customerMayCancel("PLACED")).toBe(true);
    expect(customerMayCancel("ACCEPTED")).toBe(true);
  });
});

describe("2. Multi-Level Nested Modifiers & Live Pricing Parity", () => {
  // Complex multi-level customized pizza item:
  // Level 1: Choice of Size (Variants: Regular, Medium, Large)
  // Level 2: Choice of Crust (Classic Pan, Cheese Burst +₹60 [with nested cheese blend sub-group])
  // Level 3: Choice of Toppings (min: 0, max: 4)
  // Level 4: Choice of Dips (min: 0, max: 2)
  const mockPizzaItem: MenuItemView = {
    id: "dish-gourmet-pizza",
    name: "Supreme Farmhouse Pizza",
    description: "Handcrafted Italian sourdough with rich mozzarella",
    imageUrl: null,
    veg: true,
    spicyLevel: 1,
    bestseller: true,
    available: true,
    basePricePaise: 19_900, // ₹199.00
    variants: [
      { id: "size-regular", name: "Regular (7 inch)", pricePaise: 19_900, isDefault: true, available: true },
      { id: "size-medium", name: "Medium (10 inch)", pricePaise: 34_900, isDefault: false, available: true },
      { id: "size-large", name: "Large (12 inch)", pricePaise: 49_900, isDefault: false, available: true },
    ],
    addonGroups: [
      {
        id: "group-crust",
        name: "Choice of Crust",
        required: true,
        minSelect: 1,
        maxSelect: 1,
        addons: [
          { id: "crust-pan", name: "Classic Pan Crust", pricePaise: 0, available: true },
          { id: "crust-thin", name: "Thin Wheat Crust", pricePaise: 3_000, available: true },
          {
            id: "crust-cheese-burst",
            name: "Cheese Burst",
            pricePaise: 6_000, // +₹60
            available: true,
            // Nested sub-group inside Cheese Burst!
            nestedGroups: [
              {
                id: "group-cheese-blend",
                name: "Choice of Cheese Blend",
                required: false,
                minSelect: 0,
                maxSelect: 1,
                addons: [
                  { id: "blend-mozzarella", name: "Gouda & Mozzarella Blend", pricePaise: 2_000, available: true },
                  { id: "blend-cheddar", name: "Sharp Cheddar Infill", pricePaise: 3_000, available: true },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "group-toppings",
        name: "Choice of Toppings",
        required: false,
        minSelect: 0,
        maxSelect: 4,
        addons: [
          { id: "top-paneer", name: "Fresh Paneer", pricePaise: 3_500, available: true }, // +₹35
          { id: "top-olives", name: "Black Olives", pricePaise: 3_000, available: true }, // +₹30
          { id: "top-corn", name: "Golden Corn", pricePaise: 2_500, available: true }, // +₹25
          { id: "top-capsicum", name: "Crisp Capsicum", pricePaise: 2_500, available: true }, // +₹25
          { id: "top-cheese", name: "Extra Mozzarella", pricePaise: 4_500, available: true }, // +₹45
        ],
      },
      {
        id: "group-dips",
        name: "Choice of Dips",
        required: false,
        minSelect: 0,
        maxSelect: 2,
        addons: [
          { id: "dip-garlic", name: "Cheesy Garlic Dip", pricePaise: 2_500, available: true },
          { id: "dip-peri", name: "Peri Peri Dip", pricePaise: 2_500, available: true },
        ],
      },
    ],
  };

  it("fails validation when a required multi-level modifier group is not selected", () => {
    // Size is Regular, but no crust selected
    const validation = validateModifierSelections(mockPizzaItem, "size-regular", []);
    expect(validation.isValid).toBe(false);
    expect(validation.missingRequiredGroups).toContain("Choice of Crust");
    expect(validation.errors[0]).toMatch(/Please select an option for 'Choice of Crust'/);
  });

  it("calculates accurate live pricing with base variant and added extras", () => {
    // Select Medium (₹349) + Cheese Burst (+₹60) + Paneer (+₹35) + Olives (+₹30)
    const selectedVariantId = "size-medium";
    const selectedAddonIds = ["crust-cheese-burst", "top-paneer", "top-olives"];

    const pricing = calculateModifierPricing(mockPizzaItem, selectedVariantId, selectedAddonIds, 1);

    expect(pricing.variantPricePaise).toBe(34_900); // ₹349.00
    expect(pricing.extrasPricePaise).toBe(12_500); // 60 + 35 + 30 = ₹125.00
    expect(pricing.unitPricePaise).toBe(47_400); // ₹474.00
    expect(pricing.totalPricePaise).toBe(47_400);

    // Verify clear visual indication of itemized added extras
    expect(pricing.addedExtras).toHaveLength(3);
    expect(pricing.addedExtras.map((e) => e.name)).toEqual([
      "Cheese Burst",
      "Fresh Paneer",
      "Black Olives",
    ]);
  });

  it("calculates live updated total price when quantity is changed", () => {
    const selectedVariantId = "size-medium";
    const selectedAddonIds = ["crust-cheese-burst", "top-paneer", "top-olives"];

    // Quantity = 2
    const pricing = calculateModifierPricing(mockPizzaItem, selectedVariantId, selectedAddonIds, 2);

    expect(pricing.unitPricePaise).toBe(47_400); // ₹474.00
    expect(pricing.totalPricePaise).toBe(94_800); // ₹948.00 (2 × ₹474)
  });

  it("enforces max limit bounds on multi-select groups (e.g. toppings max: 4)", () => {
    const selectedVariantId = "size-regular";
    // 5 toppings selected when max is 4
    const selectedAddonIds = [
      "crust-pan",
      "top-paneer",
      "top-olives",
      "top-corn",
      "top-capsicum",
      "top-cheese",
    ];

    const validation = validateModifierSelections(mockPizzaItem, selectedVariantId, selectedAddonIds);
    expect(validation.isValid).toBe(false);
    expect(validation.errors.some((e) => e.includes("Maximum 4 options allowed"))).toBe(true);
  });

  it("dynamically extracts nested sub-groups when parent option is selected", () => {
    // 1. Without Cheese Burst: only top-level groups active
    const groupsWithout = extractEffectiveAddonGroups(mockPizzaItem, "size-regular", ["crust-pan"]);
    expect(groupsWithout.map((g) => g.id)).not.toContain("group-cheese-blend");

    // 2. With Cheese Burst: nested sub-group 'group-cheese-blend' is automatically unlocked!
    const groupsWith = extractEffectiveAddonGroups(mockPizzaItem, "size-regular", ["crust-cheese-burst"]);
    expect(groupsWith.map((g) => g.id)).toContain("group-cheese-blend");

    // 3. Pricing includes nested sub-group option
    const pricing = calculateModifierPricing(
      mockPizzaItem,
      "size-regular",
      ["crust-cheese-burst", "blend-mozzarella"], // 199 + 60 + 20
      1
    );
    expect(pricing.unitPricePaise).toBe(27_900); // ₹279.00
    expect(pricing.extrasPricePaise).toBe(8_000); // ₹80.00 extras
  });
});

describe("3. Native Audio Cooking & Delivery Partner Voice Note State Management", () => {
  beforeEach(() => {
    useVoiceNoteStore.getState().clearAll();
  });

  it("stores and formats a 15-second delivery partner voice note", () => {
    const deliveryNote: VoiceNoteItem = {
      id: "vn-del-1",
      target: "delivery",
      audioUrl: "blob:http://localhost:3000/mock-audio-del-1",
      durationSeconds: 12,
      recordedAt: new Date().toISOString(),
      sampleTranscript: "Ghar ke gate par black bell hai, bell mat bajana baby so raha hai",
    };

    useVoiceNoteStore.getState().setVoiceNote("delivery", deliveryNote);

    const stored = useVoiceNoteStore.getState().notes.delivery;
    expect(stored).not.toBeNull();
    expect(stored?.durationSeconds).toBe(12);
    expect(stored?.sampleTranscript).toBe(
      "Ghar ke gate par black bell hai, bell mat bajana baby so raha hai"
    );

    // Formatted note for checkout instructions
    const formatted = useVoiceNoteStore.getState().getFormattedNoteText("delivery");
    expect(formatted).toContain("🛵 Delivery Voice Note (12s)");
    expect(formatted).toContain("Ghar ke gate par black bell hai");
  });

  it("strictly caps voice note duration to MAX_VOICE_NOTE_DURATION_SECONDS (15s)", () => {
    const overDurationNote: VoiceNoteItem = {
      id: "vn-kitchen-1",
      target: "kitchen",
      audioUrl: "blob:http://localhost:3000/mock-audio-kitchen-1",
      durationSeconds: 25, // Greater than 15s
      recordedAt: new Date().toISOString(),
      sampleTranscript: "Extra crispy crust and please cut into 8 slices",
    };

    useVoiceNoteStore.getState().setVoiceNote("kitchen", overDurationNote);

    const stored = useVoiceNoteStore.getState().notes.kitchen;
    expect(stored?.durationSeconds).toBe(MAX_VOICE_NOTE_DURATION_SECONDS); // Capped to 15
  });

  it("supports 1-tap re-record replacing previous audio note", () => {
    const firstTake: VoiceNoteItem = {
      id: "vn-take-1",
      target: "delivery",
      audioUrl: "blob:http://localhost:3000/take-1",
      durationSeconds: 6,
      recordedAt: new Date().toISOString(),
      sampleTranscript: "Call when you reach gate",
    };

    useVoiceNoteStore.getState().setVoiceNote("delivery", firstTake);
    expect(useVoiceNoteStore.getState().notes.delivery?.id).toBe("vn-take-1");

    // 1-tap re-record with new audio
    const secondTake: VoiceNoteItem = {
      id: "vn-take-2",
      target: "delivery",
      audioUrl: "blob:http://localhost:3000/take-2",
      durationSeconds: 14,
      recordedAt: new Date().toISOString(),
      sampleTranscript: "Ghar ke gate par black bell hai, bell mat bajana baby so raha hai",
    };

    useVoiceNoteStore.getState().setVoiceNote("delivery", secondTake);
    const updated = useVoiceNoteStore.getState().notes.delivery;
    expect(updated?.id).toBe("vn-take-2");
    expect(updated?.durationSeconds).toBe(14);
    expect(updated?.sampleTranscript).toContain("baby so raha hai");
  });

  it("supports 1-tap delete removing the audio note cleanly", () => {
    const note: VoiceNoteItem = {
      id: "vn-to-delete",
      target: "kitchen",
      audioUrl: "blob:http://localhost:3000/delete-me",
      durationSeconds: 9,
      recordedAt: new Date().toISOString(),
    };

    useVoiceNoteStore.getState().setVoiceNote("kitchen", note);
    expect(useVoiceNoteStore.getState().notes.kitchen).not.toBeNull();

    // 1-tap delete
    useVoiceNoteStore.getState().deleteVoiceNote("kitchen");
    expect(useVoiceNoteStore.getState().notes.kitchen).toBeNull();
    expect(useVoiceNoteStore.getState().getFormattedNoteText("kitchen")).toBe("");
  });
});
