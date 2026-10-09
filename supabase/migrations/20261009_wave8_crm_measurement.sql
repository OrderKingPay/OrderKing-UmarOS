CREATE OR REPLACE VIEW crm_measurement_metrics AS
SELECT 
    DATE_TRUNC('day', e.created_at) as metric_date,
    e.event_type,
    a.affiliate_code,
    a.utm_source,
    a.utm_campaign,
    COUNT(e.id) as total_events,
    COUNT(DISTINCT e.user_id) as unique_users
FROM crm_tracking_events e
LEFT JOIN crm_affiliates a ON e.affiliate_id = a.id
GROUP BY 1, 2, 3, 4, 5;

CREATE OR REPLACE VIEW crm_retention_metrics AS
SELECT
    DATE_TRUNC('week', u.created_at) as cohort_week,
    DATE_TRUNC('week', e.created_at) as activity_week,
    e.event_type,
    COUNT(DISTINCT e.user_id) as active_users
FROM auth.users u
JOIN crm_tracking_events e ON e.user_id = u.id
GROUP BY 1, 2, 3;
