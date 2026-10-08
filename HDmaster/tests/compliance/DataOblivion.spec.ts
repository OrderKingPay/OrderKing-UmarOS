import assert from "node:assert/strict";
import { describe, it, before, after } from "node:test";
import { createHash } from "crypto";
import pg from "pg";
import { RightToOblivionEngine } from "../../src/lib/orderking/compliance/privacy/RightToOblivionEngine.ts";

function hashData(data: string): string {
  if (!data) return '';
  return createHash('sha256').update(data).digest('hex');
}

describe("Data Oblivion / Right to Be Forgotten", () => {
  let pool: pg.Pool;

  before(async () => {
    // Connect directly using pg to control the search path and isolation
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is missing");
    pool = new pg.Pool({ connectionString: url });

    // Setup an isolated schema for testing
    await pool.query(`DROP SCHEMA IF EXISTS temp_oblivion_test CASCADE`);
    await pool.query(`CREATE SCHEMA temp_oblivion_test`);
    
    // Create tables exactly as RightToOblivionEngine expects them
    await pool.query(`
      CREATE TABLE temp_oblivion_test.profiles (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        first_name TEXT,
        last_name TEXT,
        email TEXT,
        phone TEXT,
        address TEXT
      )
    `);

    await pool.query(`
      CREATE TABLE temp_oblivion_test.orders (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        customer_name TEXT,
        shipping_address TEXT,
        total_amount INTEGER,
        status TEXT
      )
    `);

    await pool.query(`
      CREATE TABLE temp_oblivion_test.ledger_transactions (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        amount INTEGER,
        type TEXT,
        status TEXT
      )
    `);
  });

  after(async () => {
    if (pool) {
      await pool.query(`DROP SCHEMA IF EXISTS temp_oblivion_test CASCADE`);
      await pool.end();
    }
  });

  it("should shred user PII via SHA-256 but leave ledger_transactions intact", async () => {
    const client = await pool.connect();
    
    try {
      const wrappedDb = {
        query: async (text: string, params: any[]) => {
          // Force it to use the isolated schema by rewriting the table names
          let rewritten = text
            .replace(/\bprofiles\b/g, 'temp_oblivion_test.profiles')
            .replace(/\borders\b/g, 'temp_oblivion_test.orders');
          return client.query(rewritten, params);
        }
      };

      const engine = new RightToOblivionEngine(wrappedDb);

      const testUserId = "user_oblivion_123";
      const pii = {
        first_name: "John",
        last_name: "Doe",
        email: "john.doe@example.com",
        phone: "+919876543210",
        address: "123 Secret Street, Secret City"
      };

      await client.query(`
        INSERT INTO temp_oblivion_test.profiles (id, user_id, first_name, last_name, email, phone, address)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        "prof_123", testUserId, pii.first_name, pii.last_name, pii.email, pii.phone, pii.address
      ]);

      await client.query(`
        INSERT INTO temp_oblivion_test.orders (id, user_id, customer_name, shipping_address, total_amount, status)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        "ord_123", testUserId, `${pii.first_name} ${pii.last_name}`, pii.address, 1000, "DELIVERED"
      ]);

      await client.query(`
        INSERT INTO temp_oblivion_test.ledger_transactions (id, user_id, amount, type, status)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        "tx_123", testUserId, 100000, "CREDIT", "SETTLED"
      ]);

      // Execute engine
      await engine.processDeletionRequest(testUserId);
      
      // Verification
      const profileRows = await client.query(`SELECT * FROM temp_oblivion_test.profiles WHERE user_id = $1`, [testUserId]);
      assert.equal(profileRows.rows.length, 1);
      const profile = profileRows.rows[0] as any;
      
      assert.equal(profile.first_name, hashData(pii.first_name));
      assert.equal(profile.last_name, hashData(pii.last_name));
      assert.equal(profile.email, hashData(pii.email));
      assert.equal(profile.phone, hashData(pii.phone));
      assert.equal(profile.address, hashData(pii.address));

      const orderRows = await client.query(`SELECT * FROM temp_oblivion_test.orders WHERE user_id = $1`, [testUserId]);
      assert.equal(orderRows.rows.length, 1);
      const order = orderRows.rows[0] as any;
      
      assert.equal(order.customer_name, `${hashData(pii.first_name)} ${hashData(pii.last_name)}`.trim());
      assert.equal(order.shipping_address, hashData(pii.address));

      const ledgerRows = await client.query(`SELECT * FROM temp_oblivion_test.ledger_transactions WHERE user_id = $1`, [testUserId]);
      assert.equal(ledgerRows.rows.length, 1);
      const ledger = ledgerRows.rows[0] as any;
      
      assert.equal(ledger.user_id, testUserId);
      assert.equal(Number(ledger.amount), 100000);
      assert.equal(ledger.status, "SETTLED");
      
    } finally {
      client.release();
    }
  });
});
