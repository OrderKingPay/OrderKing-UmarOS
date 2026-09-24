
const fs = require('fs');
let text = fs.readFileSync('C:/Users/hasan/OrderKing/HDmaster/src/lib/orderking/server/queries.server.ts', 'utf8');

text = text.replace(/(\n\s+)select(\n\s+count\(\*\)::int as orders,\n[\s\S]*?from orders where restaurant_id = \\ and placed_at >= date_trunc\('day', now\(\)\) and org_id = \\)(,)/, '\\select\\\');

text = text.replace(/(\n\s+)select o\.id, o\.id as order_number,([\s\S]*?order by o\.placed_at desc limit 80)\n  ,/, '\\select o.id, o.id as order_number,\\\n  ,');

text = text.replace(/(\n\s+)select id, order_id, name as item_name,([\s\S]*?from order_items where order_id = ANY\(\\\))(,)/, '\\select id, order_id, name as item_name,\\\');

text = text.replace(/(\n\s+)select id, order_id, from_status as previous_state,([\s\S]*?from order_events where order_id = ANY\(\\\) order by created_at asc)(,)/, '\\select id, order_id, from_status as previous_state,\\\');

fs.writeFileSync('C:/Users/hasan/OrderKing/HDmaster/src/lib/orderking/server/queries.server.ts', text);

