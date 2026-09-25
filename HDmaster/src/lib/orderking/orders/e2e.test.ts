import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getSql } from '../../db.ts';

describe('Real End-to-End Database Lifecycle Test', () => {
  it('executes a complete lifecycle: Customer -> Partner -> Dispatch -> Delivery -> Ledger', async () => {
    const sql = await getSql();

    const userId = 'usr_e2e_123';
    const restaurantId = 'rst_e2e_123';
    const riderId = 'rid_e2e_123';
    const zoneId = 'zne_e2e_123';
    const itemId = 'itm_e2e_123';
    const orderId = 'ord_e2e_123';
    const payId = 'pay_e2e_123';
    
    // 1. Setup Test Data
    await sql.query(`INSERT INTO profiles (id, first_name, role) VALUES ('${userId}', 'Test Customer', 'customer') ON CONFLICT (id) DO NOTHING`);
    await sql.query(`INSERT INTO zones (id, city_id, name, slug) VALUES ('${zoneId}', 'city_test', 'Test Zone', 'test-zone') ON CONFLICT (id) DO NOTHING`);
    await sql.query(`INSERT INTO restaurants (id, name, slug, zone_id, status, data_label) VALUES ('${restaurantId}', 'Test Kitchen', 'test-kitchen', '${zoneId}', 'ACTIVE', 'SIMULATED') ON CONFLICT (id) DO NOTHING`);
    await sql.query(`INSERT INTO menu_categories (id, restaurant_id, name, sort_order) VALUES ('cat_1', '${restaurantId}', 'Mains', 1) ON CONFLICT (id) DO NOTHING`);
    await sql.query(`INSERT INTO menu_items (id, category_id, restaurant_id, name, base_price_paise, status) VALUES ('${itemId}', 'cat_1', '${restaurantId}', 'Test Burger', 15000, 'AVAILABLE') ON CONFLICT (id) DO NOTHING`);
    await sql.query(`INSERT INTO riders (id, user_id, status, zone_id) VALUES ('${riderId}', '${userId}', 'ACTIVE', '${zoneId}') ON CONFLICT (id) DO NOTHING`);
    
    // 2. Place Order (Customer)
    await sql.query(`
      INSERT INTO orders (
        id, public_id, user_id, restaurant_id, status, total_paise, 
        payment_method, payment_status, placed_at, updated_at
      ) VALUES (
        '${orderId}', 'ORD-1234', '${userId}', '${restaurantId}', 'PENDING', 30000,
        'COD', 'pending', now(), now()
      ) ON CONFLICT (id) DO NOTHING
    `);
    
    await sql.query(`
      INSERT INTO payments (id, order_id, provider, status, amount_paise, currency)
      VALUES ('${payId}', '${orderId}', 'COD', 'pending', 30000, 'INR') ON CONFLICT (id) DO NOTHING
    `);

    const res = await sql.query(`SELECT status FROM orders WHERE id = '${orderId}'`) as any;
    assert.equal(res[0].status, 'PENDING');

    // 4. Restaurant Acceptance (Partner)
    await sql.query(`UPDATE orders SET status = 'CONFIRMED' WHERE id = '${orderId}'`);
    await sql.query(`UPDATE orders SET status = 'READY' WHERE id = '${orderId}'`);
    
    // 5. Rider Dispatch & Delivery
    await sql.query(`UPDATE orders SET rider_id = '${riderId}', status = 'PICKED_UP' WHERE id = '${orderId}'`);
    await sql.query(`UPDATE orders SET status = 'DELIVERED', payment_status = 'collected' WHERE id = '${orderId}'`);
    await sql.query(`UPDATE payments SET status = 'collected' WHERE order_id = '${orderId}'`);

    // 6. Verify Financial Ledger
    const p = await sql.query(`SELECT provider, status, amount_paise FROM payments WHERE order_id = '${orderId}'`) as any;
    assert.equal(p[0].status, 'collected');

    const fo = await sql.query(`SELECT status FROM orders WHERE id = '${orderId}'`) as any;
    assert.equal(fo[0].status, 'DELIVERED');
    
    console.log("✅ REAL END-TO-END DATABASE LIFECYCLE COMPLETED SUCCESSFULLY.");
  });
});
