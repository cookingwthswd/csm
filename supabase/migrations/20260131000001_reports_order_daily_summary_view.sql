-- Optional: View for common report queries (FS5 Reports & Dashboard)
-- Run this migration if you want to use the view for order analytics
-- The API currently aggregates in-memory; this view can be used for RPC or future optimization

CREATE OR REPLACE VIEW order_daily_summary AS
SELECT
  DATE(created_at AT TIME ZONE 'UTC') AS date,
  COUNT(*) AS total_orders,
  SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) AS completed,
  SUM(COALESCE(total_amount, 0)) AS revenue
FROM orders
GROUP BY DATE(created_at AT TIME ZONE 'UTC');

COMMENT ON VIEW order_daily_summary IS 'FS5: Daily order aggregates for reports (optional)';
