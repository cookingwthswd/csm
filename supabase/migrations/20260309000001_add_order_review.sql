-- Add review and rating fields to orders table
ALTER TABLE orders
ADD COLUMN review TEXT,
ADD COLUMN rating INTEGER CHECK (rating >= 1 AND rating <= 5);

-- Add index for faster queries on rating
CREATE INDEX idx_orders_rating ON orders(rating) WHERE rating IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN orders.review IS 'Customer review text after delivery confirmation';
COMMENT ON COLUMN orders.rating IS 'Customer rating (1-5 stars) after delivery confirmation';
