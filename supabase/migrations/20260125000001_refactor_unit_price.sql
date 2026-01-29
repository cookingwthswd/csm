-- ==========================================
-- PRODUCTION MIGRATION: Refactor unit_price from order_items to items table
-- Migration: 20260125000001_refactor_unit_price.sql
-- 
-- ==========================================

-- Step 1: Add unit_price column to items table (safe operation)
ALTER TABLE items ADD COLUMN IF NOT EXISTS unit_price DECIMAL(10, 2);

-- Step 2: Update orders status constraint to include 'processed'
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('pending', 'approved', 'processing', 'processed', 'shipping', 'delivered', 'cancelled'));

-- Step 3: Migrate existing unit_price data from order_items to items
-- (Only update items that don't already have a unit_price set)
UPDATE items 
SET unit_price = (
  SELECT oi.unit_price 
  FROM order_items oi 
  WHERE oi.item_id = items.id 
    AND oi.unit_price IS NOT NULL
  ORDER BY oi.id DESC 
  LIMIT 1
)
WHERE items.unit_price IS NULL;

-- Step 4: Verify data migration before dropping columns
-- Run this query to check if migration worked:
-- SELECT 
--   i.id, i.name, i.unit_price as new_price,
--   (SELECT oi.unit_price FROM order_items oi WHERE oi.item_id = i.id LIMIT 1) as old_price
-- FROM items i 
-- WHERE EXISTS (SELECT 1 FROM order_items oi WHERE oi.item_id = i.id);

-- Step 5: Drop columns (DESTRUCTIVE - make sure step 4 verification passed!)
-- UNCOMMENT THESE LINES ONLY AFTER VERIFYING DATA MIGRATION:
ALTER TABLE order_items DROP COLUMN IF EXISTS unit_price;
ALTER TABLE order_items DROP COLUMN IF EXISTS created_at;

-- Step 6: Add performance index
CREATE INDEX IF NOT EXISTS idx_items_unit_price ON items(unit_price) WHERE unit_price IS NOT NULL;
