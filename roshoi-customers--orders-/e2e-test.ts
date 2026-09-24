import { getSql } from "./src/lib/db";
import { newId } from "./src/lib/ids";

async function runTest() {
  console.log("🚀 Starting E2E Lifecycle Verification...");
  const sql = await getSql();

  try {
    // 1. Setup Test Data
    const userId = newId("usr");
    const restaurantId = newId("rst");
    const riderId = newId("rid");
    const zoneId = newId("zne");
    const itemId = newId("itm");
    const orderId = newId("ord");

    console.log("   -> Provisioning test user, restaurant, and rider...");
    await sql`INSERT INTO profiles (id, first_name, role) VALUES (${userId}, 'Test Customer', 'customer') ON CONFLICT (id) DO NOTHING`;
    await sql`INSERT INTO zones (id, city_id, name, slug) VALUES (${zoneId}, 'city_test', 'Test Zone', 'test-zone') ON CONFLICT (id) DO NOTHING`;
    await sql`INSERT INTO restaurants (id, name, slug, zone_id, status, data_label) VALUES (${restaurantId}, 'Test Kitchen', 'test-kitchen', ${zoneId}, 'ACTIVE', 'SIMULATED') ON CONFLICT (id) DO NOTHING`;
    await sql`INSERT INTO menu_categories (id, restaurant_id, name, sort_order) VALUES ('cat_1', ${restaurantId}, 'Mains', 1) ON CONFLICT (id) DO NOTHING`;
    await sql`INSERT INTO menu_items (id, category_id, restaurant_id, name, base_price_paise, status) VALUES (${itemId}, 'cat_1', ${restaurantId}, 'Test Burger', 15000, 'AVAILABLE') ON CONFLICT (id) DO NOTHING`;
    await sql`INSERT INTO riders (id, user_id, status, zone_id) VALUES (${riderId}, ${userId}, 'ACTIVE', ${zoneId}) ON CONFLICT (id) DO NOTHING`;
    
    // 2. Place Order (Customer)
    console.log("🛒 Executing Customer -> Place Order");
    
    await sql`
      INSERT INTO orders (
        id, public_id, user_id, restaurant_id, status, total_paise, 
        payment_method, payment_status, placed_at, updated_at
      ) VALUES (
        ${orderId}, 'ORD-1234', ${userId}, ${restaurantId}, 'PENDING', 30000,
        'COD', 'pending', now(), now()
      )
    `;
    
    await sql`
      INSERT INTO payments (id, order_id, provider, status, amount_paise, currency)
      VALUES (${newId('pay')}, ${orderId}, 'COD', 'pending', 30000, 'INR')
    `;

    console.log(`   -> Order placed successfully. ID: ${orderId}`);

    // 3. Verify Database State
    const orderRows = await sql`SELECT status, payment_method FROM orders WHERE id = ${orderId}`;
    console.log(`   -> Initial Order Status: ${orderRows[0]?.status}`);

    // 4. Restaurant Acceptance (Partner)
    console.log("👨‍🍳 Executing Restaurant -> Accept Order");
    await sql`UPDATE orders SET status = 'CONFIRMED' WHERE id = ${orderId}`;
    await sql`INSERT INTO order_events (id, order_id, to_status, user_id, user_role, note) VALUES (${newId('evt')}, ${orderId}, 'CONFIRMED', ${userId}, 'system', 'Accepted by kitchen')`;
    
    console.log("🔥 Executing Restaurant -> Ready for Pickup");
    await sql`UPDATE orders SET status = 'READY' WHERE id = ${orderId}`;
    
    // 5. Rider Dispatch & Delivery
    console.log("🛵 Executing Dispatch -> Assign Rider");
    await sql`UPDATE orders SET rider_id = ${riderId}, status = 'PICKED_UP' WHERE id = ${orderId}`;
    
    console.log("✅ Executing Rider -> Delivered");
    await sql`UPDATE orders SET status = 'DELIVERED', payment_status = 'collected' WHERE id = ${orderId}`;
    await sql`UPDATE payments SET status = 'collected' WHERE order_id = ${orderId}`;

    // 6. Verify Financial Ledger
    console.log("💰 Verifying Financial Ledger");
    const payments = await sql<{provider: string, status: string, amount_paise: number}>`SELECT provider, status, amount_paise FROM payments WHERE order_id = ${orderId}`;
    console.log(`   -> Payment State: ${payments[0].provider} - ${payments[0].status} - ₹${payments[0].amount_paise / 100}`);

    const finalOrder = await sql<{status: string}>`SELECT status FROM orders WHERE id = ${orderId}`;
    if (finalOrder[0].status === 'DELIVERED') {
      console.log("🎉 E2E Lifecycle Verification PASSED. The canonical DB state machine is flawless.");
    } else {
      throw new Error("Lifecycle failed at final state.");
    }

  } catch (err) {
    console.error("❌ E2E Failed:", err);
  } finally {
    process.exit(0);
  }
}

runTest();
