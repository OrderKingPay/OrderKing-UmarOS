const fs = require('fs');
const file = 'HDmaster/src/lib/orderking/platform-hardening.test.ts';
let code = fs.readFileSync(file, 'utf8');

const regex = /describe\("surge-pricing", \(\) => \{[\s\S]*?\}\);\n/g;

const replacement = \describe("surge-pricing", () => {
  it("returns no surge when supply exceeds demand", () => {
    const result = calculateSurge({
      hour: 10,
      activeOrders: 5,
      availableRiders: 15,
      totalRiders: 20,
      baseDeliveryFeePaise: 3000,
      baseMinOrderPaise: 10000,
    });
    assert.strictEqual(result.active, false);
  });

  it("applies surge when riders are scarce", () => {
    const result = calculateSurge({
      hour: 20,
      activeOrders: 20,
      availableRiders: 5,
      totalRiders: 30,
      baseDeliveryFeePaise: 3000,
      baseMinOrderPaise: 10000,
      badWeather: true,
    });
    assert.strictEqual(result.active, true);
  });

  it("caps surge at maximum 2.5x", () => {
    const result = calculateSurge({
      hour: 21,
      activeOrders: 100,
      availableRiders: 1,
      totalRiders: 50,
      baseDeliveryFeePaise: 3000,
      baseMinOrderPaise: 10000,
      badWeather: true,
      avgPrepMinutes: 40,
    });
    assert.ok(result.surgeBps <= 25000);
  });

  it("surgeForZone uses current hour", () => {
    const result = surgeForZone({
      hour: 12,
      activeOrders: 5,
      availableRiders: 10,
      totalRiders: 20,
      baseDeliveryFeePaise: 3000,
      baseMinOrderPaise: 10000,
    });
    assert.ok(typeof result.surgeBps === "number");
  });

  it("surgeForAllZones returns per-zone results", () => {
    const results = surgeForAllZones([
      { zoneId: "z1", hour: 12, activeOrders: 2, availableRiders: 8, totalRiders: 10, baseDeliveryFeePaise: 2500, baseMinOrderPaise: 9900 },
      { zoneId: "z2", hour: 12, activeOrders: 15, availableRiders: 3, totalRiders: 10, baseDeliveryFeePaise: 3000, baseMinOrderPaise: 9900 },
    ]);
    assert.strictEqual(results.length, 2);
  });
});
\;

code = code.replace(regex, replacement);
fs.writeFileSync(file, code);
