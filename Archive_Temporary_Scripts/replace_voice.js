const fs = require('fs');
let c = fs.readFileSync('Apps-integration-/src/routes/api/umar-voice.ts', 'utf8');

c = c.replace(/const tools: any\[\] = \[[\s\S]+?\}\n\];\n/,
\const tools: any[] = [{
  functionDeclarations: [
    { name: "get_platform_metrics", description: "Retrieves live count of users, restaurants, and today's orders.", parameters: { type: "OBJECT", properties: {} } },
    { name: "get_pending_restaurants", description: "Retrieves a list of restaurants awaiting KYC approval.", parameters: { type: "OBJECT", properties: {} } },
    { name: "update_delivery_fee", description: "Updates the platform's base delivery fee. REQUIRES FOUNDER APPROVAL.", parameters: { type: "OBJECT", properties: { newFeeInr: { type: "NUMBER", description: "The new base delivery fee in Indian Rupees (INR)." } }, required: ["newFeeInr"] } },
    { name: "approve_restaurant", description: "Approves a restaurant's KYC so they can start receiving orders. REQUIRES FOUNDER APPROVAL.", parameters: { type: "OBJECT", properties: { restaurantId: { type: "STRING", description: "The UUID of the restaurant to approve." } }, required: ["restaurantId"] } },
    { name: "check_integration_health", description: "Retrieves the real-time status of all external platform integrations (AI, Maps, Payments, etc).", parameters: { type: "OBJECT", properties: {} } },
    { name: "get_failed_payments", description: "Retrieves the count of recently failed payments/orders.", parameters: { type: "OBJECT", properties: {} } }
  ]
}];
\);

fs.writeFileSync('Apps-integration-/src/routes/api/umar-voice.ts', c, 'utf8');
