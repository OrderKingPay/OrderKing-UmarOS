-- HDmaster/migrations/0019_verified_fk_indexes.sql
-- Applied to the production Supabase database.
CREATE INDEX IF NOT EXISTS idx_addons_group_id ON public.addons(group_id);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_city_id ON public.customer_addresses(city_id);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_zone_id ON public.customer_addresses(zone_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_assignments_org_id ON public.dispatch_assignments(org_id);
CREATE INDEX IF NOT EXISTS idx_kingpay_transactions_user_id ON public.kingpay_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_programs_org_id ON public.loyalty_programs(org_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON public.menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_platform_category_id ON public.menu_items(platform_category_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant_id ON public.menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_order_events_order_id ON public.order_events(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_price_lines_order_id ON public.order_price_lines(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_outlet_id ON public.orders(outlet_id);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON public.orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_promotion_redemptions_promotion_id ON public.promotion_redemptions(promotion_id);
CREATE INDEX IF NOT EXISTS idx_refunds_payment_id ON public.refunds(payment_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_outlets_restaurant_id ON public.restaurant_outlets(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_outlets_zone_id ON public.restaurant_outlets(zone_id);
