-- 1. Add current_price to items
ALTER TABLE items
ADD COLUMN IF NOT EXISTS current_price DECIMAL(10,2);

-- 2. Add unit_price back to order_items
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS unit_price DECIMAL(10,2);

-- 4. Remove unit_price from items if it exists
ALTER TABLE items
DROP COLUMN IF EXISTS unit_price;