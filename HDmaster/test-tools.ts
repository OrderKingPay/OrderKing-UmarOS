import { FOUNDER_TOOLS } from './src/lib/orderking/ai/founder-tools.server.ts';

async function run() {
  console.log("🛠️ Testing Founder AI Tools Execution...");
  try {
    for (const tool of FOUNDER_TOOLS) {
      console.log(\\nExecuting tool: \\);
      let args = {};
      if (tool.name === 'get_order_details') args = { order_id: 'ord_e2e_123' };
      if (tool.name === 'get_restaurant_performance') args = { restaurant_id: 'rst_e2e_123' };
      
      const result = await tool.execute(args);
      console.log(\Result: \, result);
    }
    console.log("\n✅ All Tools executed successfully against REAL DB.");
  } catch(e) {
    console.error(e);
  }
}
run();
