import { getSql } from '../../db';

export interface CartItem {
  id: string;
  quantity: number;
}

export async function processCart(customerId: string, items: CartItem[], promoCode?: string) {
  const sql = await getSql();

  let subtotal = 0;
  for (const item of items) {
    const dbItem = await sql`
      SELECT price, is_available 
      FROM menu_items 
      WHERE id = ${item.id}
    `;
    
    if (dbItem.length === 0 || !(dbItem[0] as any).is_available) {
      throw new Error(`Item ${item.id} is unavailable or invalid.`);
    }
    
    subtotal += (dbItem[0] as any).price * item.quantity;
  }

  let discount = 0;
  if (promoCode) {
    const promo = await sql`
      SELECT discount_percentage, max_discount, valid_until 
      FROM promo_codes 
      WHERE code = ${promoCode} AND is_active = true
    `;
    
    if (promo.length > 0 && new Date((promo[0] as any).valid_until) >= new Date()) {
      const p = promo[0] as any;
      let calcDiscount = subtotal * (p.discount_percentage / 100);
      if (p.max_discount && calcDiscount > p.max_discount) {
        calcDiscount = p.max_discount;
      }
      discount = calcDiscount;
    } else {
      throw new Error('Invalid or expired promo code.');
    }
  }

  const taxRate = 0.08; // Fixed 8% tax for example
  const subtotalAfterDiscount = subtotal - discount;
  const taxAmount = subtotalAfterDiscount * taxRate;
  const finalTotal = subtotalAfterDiscount + taxAmount;

  return {
    subtotal,
    discount,
    taxAmount,
    finalTotal
  };
}
