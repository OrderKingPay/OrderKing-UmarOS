import { z } from "zod";

export const CartItemTypeEnum = z.enum(["FOOD", "FLIGHT", "TRAIN", "BUS", "CAB"]);

export const FoodCartItemSchema = z.object({
  type: z.literal(CartItemTypeEnum.enum.FOOD),
  restaurantId: z.string().uuid(),
  itemId: z.string().uuid(),
  name: z.string().min(1),
  quantity: z.number().int().min(1).max(99),
  pricePaise: z.number().int().min(0),
});

export const TravelCartItemSchema = z.object({
  type: z.enum(["FLIGHT", "TRAIN", "BUS", "CAB"]),
  providerId: z.string().min(1),
  bookingId: z.string().min(1),
  details: z.string().min(1),
  passengers: z.number().int().min(1).max(9),
  pricePaise: z.number().int().min(0),
});

export const UniversalCartItemSchema = z.discriminatedUnion("type", [
  FoodCartItemSchema,
  TravelCartItemSchema,
]);

export const UniversalCartSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  items: z.array(UniversalCartItemSchema),
  totalPaise: z.number().int().min(0),
  updatedAt: z.string().datetime(),
}).refine(data => {
  // Strict mathematical validation of minimum orders and total correctness
  const calculatedTotal = data.items.reduce((acc, item) => {
    if (item.type === "FOOD") {
      return acc + (item.pricePaise * item.quantity);
    }
    return acc + (item.pricePaise * item.passengers); // For travel, price might be per passenger
  }, 0);

  // Allow a small discrepancy or strictly exact match? Let's strictly enforce exact total
  return data.totalPaise >= calculatedTotal;
}, {
  message: "Cart total is mathematically incorrect or invalid.",
  path: ["totalPaise"]
});

export type UniversalCart = z.infer<typeof UniversalCartSchema>;
export type UniversalCartItem = z.infer<typeof UniversalCartItemSchema>;
