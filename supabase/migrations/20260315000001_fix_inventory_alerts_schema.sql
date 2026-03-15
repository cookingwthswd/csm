-- ==========================================
-- Fix Inventory & Alerts Schema
-- Migration: 20260315000001_fix_inventory_alerts_schema.sql
--
-- Aligns DB schema with NestJS service code expectations:
-- 1. inventory.last_updated → updated_at
-- 2. alerts.alert_type → type
-- 3. alerts.is_resolved (bool) → status (varchar enum)
-- 4. Add alerts.metadata (JSONB)
-- 5. Add alerts.resolution_note (TEXT)
-- 6. Add update_inventory_stock RPC function
-- ==========================================

-- ═══════════════════════════════════════════════════════════
-- 1. INVENTORY TABLE: Rename last_updated → updated_at
-- ═══════════════════════════════════════════════════════════

ALTER TABLE inventory RENAME COLUMN last_updated TO updated_at;

-- Add auto-update trigger (like other tables)
CREATE TRIGGER tr_inventory_updated BEFORE UPDATE ON inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ═══════════════════════════════════════════════════════════
-- 2. ALERTS TABLE: Fix column names and types
-- ═══════════════════════════════════════════════════════════

-- 2a. Rename alert_type → type
ALTER TABLE alerts RENAME COLUMN alert_type TO type;

-- 2b. Add status column (varchar enum) to replace is_resolved
ALTER TABLE alerts ADD COLUMN status VARCHAR(20) DEFAULT 'unresolved'
  CHECK (status IN ('unresolved', 'acknowledged', 'resolved'));

-- Migrate existing data: is_resolved=true → 'resolved', false → 'unresolved'
UPDATE alerts SET status = CASE
  WHEN is_resolved = true THEN 'resolved'
  ELSE 'unresolved'
END;

-- Make status NOT NULL after migration
ALTER TABLE alerts ALTER COLUMN status SET NOT NULL;

-- Drop old is_resolved column
ALTER TABLE alerts DROP COLUMN is_resolved;

-- 2c. Add metadata JSONB column
ALTER TABLE alerts ADD COLUMN metadata JSONB DEFAULT NULL;

-- 2d. Add resolution_note TEXT column
ALTER TABLE alerts ADD COLUMN resolution_note TEXT DEFAULT NULL;

-- ═══════════════════════════════════════════════════════════
-- 3. UPDATE INDEXES for renamed columns
-- ═══════════════════════════════════════════════════════════

-- Drop old index that references is_resolved
DROP INDEX IF EXISTS idx_alerts_unresolved;

-- Create new index using status column
CREATE INDEX idx_alerts_unresolved ON alerts(created_at DESC)
  WHERE status != 'resolved';

-- ═══════════════════════════════════════════════════════════
-- 4. ADD update_inventory_stock RPC FUNCTION
-- ═══════════════════════════════════════════════════════════

-- Upsert pattern: update existing inventory or create with the change
CREATE OR REPLACE FUNCTION update_inventory_stock(
  p_store_id INTEGER,
  p_item_id INTEGER,
  p_quantity_change DECIMAL(10, 2)
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Try to update existing inventory record
  UPDATE inventory
  SET quantity = quantity + p_quantity_change,
      updated_at = NOW()
  WHERE store_id = p_store_id AND item_id = p_item_id;

  -- If no row was updated, insert a new record
  IF NOT FOUND THEN
    INSERT INTO inventory (store_id, item_id, quantity, min_stock_level, max_stock_level, updated_at)
    VALUES (p_store_id, p_item_id, p_quantity_change, 0, NULL, NOW());
  END IF;
END;
$$;
