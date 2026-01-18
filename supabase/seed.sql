-- ==========================================
-- CKMS Seed Data
-- ==========================================

-- ==========================================
-- 1. STORES (1 CK + 3 Franchise)
-- ==========================================
INSERT INTO stores (id, name, type, address, phone) VALUES
  (1, 'Bếp Trung Tâm', 'central_kitchen', '123 Nguyễn Huệ, Quận 1, TP.HCM', '028-1234-5678'),
  (2, 'Chi nhánh Quận 1', 'franchise', '456 Lê Lợi, Quận 1, TP.HCM', '028-1111-2222'),
  (3, 'Chi nhánh Quận 3', 'franchise', '789 Võ Văn Tần, Quận 3, TP.HCM', '028-3333-4444'),
  (4, 'Chi nhánh Quận 7', 'franchise', '321 Nguyễn Thị Thập, Quận 7, TP.HCM', '028-5555-6666');

-- ==========================================
-- 2. CATEGORIES
-- ==========================================
INSERT INTO categories (id, name, description) VALUES
  (1, 'Nguyên liệu', 'Nguyên liệu thô đầu vào'),
  (2, 'Bán thành phẩm', 'Sản phẩm đã sơ chế'),
  (3, 'Thành phẩm', 'Sản phẩm hoàn chỉnh');

-- ==========================================
-- 3. ITEMS (15 items across all types)
-- ==========================================
INSERT INTO items (id, name, sku, category_id, unit, type, description) VALUES
  -- Nguyên liệu (material)
  (1, 'Bột mì', 'NL001', 1, 'kg', 'material', 'Bột mì đa dụng'),
  (2, 'Đường cát', 'NL002', 1, 'kg', 'material', 'Đường cát trắng'),
  (3, 'Muối', 'NL003', 1, 'kg', 'material', 'Muối tinh'),
  (4, 'Bơ', 'NL004', 1, 'kg', 'material', 'Bơ lạt'),
  (5, 'Trứng gà', 'NL005', 1, 'pcs', 'material', 'Trứng gà tươi'),
  (6, 'Sữa tươi', 'NL006', 1, 'l', 'material', 'Sữa tươi nguyên kem'),
  (7, 'Thịt heo xay', 'NL007', 1, 'kg', 'material', 'Thịt heo xay nhuyễn'),
  (8, 'Pate gan', 'NL008', 1, 'kg', 'material', 'Pate gan heo'),

  -- Bán thành phẩm (semi_finished)
  (9, 'Bột bánh mì', 'BTP001', 2, 'kg', 'semi_finished', 'Bột đã nhào sẵn'),
  (10, 'Nhân thịt', 'BTP002', 2, 'kg', 'semi_finished', 'Nhân thịt đã ướp'),
  (11, 'Nước sốt đặc biệt', 'BTP003', 2, 'l', 'semi_finished', 'Nước sốt gia truyền'),

  -- Thành phẩm (finished_product)
  (12, 'Bánh mì thịt', 'TP001', 3, 'pcs', 'finished_product', 'Bánh mì thịt nguội'),
  (13, 'Bánh mì pate', 'TP002', 3, 'pcs', 'finished_product', 'Bánh mì pate gan'),
  (14, 'Bánh mì đặc biệt', 'TP003', 3, 'pcs', 'finished_product', 'Bánh mì đặc biệt full topping'),
  (15, 'Bánh mì chả', 'TP004', 3, 'pcs', 'finished_product', 'Bánh mì chả lụa');

-- ==========================================
-- 4. RECIPE DETAILS (công thức sản xuất)
-- ==========================================
-- Bánh mì thịt = Bột bánh mì + Nhân thịt + Nước sốt
INSERT INTO recipe_details (product_id, material_id, quantity) VALUES
  (12, 9, 0.15),   -- 150g bột bánh mì
  (12, 10, 0.05),  -- 50g nhân thịt
  (12, 11, 0.02);  -- 20ml nước sốt

-- Bánh mì pate = Bột bánh mì + Pate
INSERT INTO recipe_details (product_id, material_id, quantity) VALUES
  (13, 9, 0.15),   -- 150g bột bánh mì
  (13, 8, 0.03);   -- 30g pate

-- Bột bánh mì = Bột mì + Đường + Muối + Bơ + Trứng + Sữa
INSERT INTO recipe_details (product_id, material_id, quantity) VALUES
  (9, 1, 0.8),     -- 800g bột mì
  (9, 2, 0.05),    -- 50g đường
  (9, 3, 0.01),    -- 10g muối
  (9, 4, 0.05),    -- 50g bơ
  (9, 5, 2),       -- 2 trứng
  (9, 6, 0.1);     -- 100ml sữa

-- ==========================================
-- 5. BATCHES (lô sản xuất)
-- ==========================================
INSERT INTO batches (id, batch_code, item_id, manufacture_date, expiry_date, initial_quantity, current_quantity, status) VALUES
  -- Nguyên liệu batches
  (1, 'NL001-260115-001', 1, '2026-01-15', '2026-07-15', 100, 85, 'active'),
  (2, 'NL002-260115-001', 2, '2026-01-15', '2026-12-31', 50, 45, 'active'),
  (3, 'NL007-260116-001', 7, '2026-01-16', '2026-01-20', 20, 18, 'active'),
  (4, 'NL008-260116-001', 8, '2026-01-16', '2026-01-23', 10, 8, 'active'),

  -- Bán thành phẩm batches
  (5, 'BTP001-260116-001', 9, '2026-01-16', '2026-01-17', 30, 25, 'active'),
  (6, 'BTP002-260116-001', 10, '2026-01-16', '2026-01-18', 15, 12, 'active'),

  -- Batch sắp hết hạn (test alert)
  (7, 'NL007-260110-001', 7, '2026-01-10', '2026-01-17', 10, 3, 'active');

-- ==========================================
-- 6. INVENTORY (tồn kho tại mỗi store)
-- ==========================================
-- Central Kitchen inventory
INSERT INTO inventory (store_id, item_id, quantity, min_stock_level, max_stock_level) VALUES
  (1, 1, 85, 20, 200),   -- Bột mì
  (1, 2, 45, 10, 100),   -- Đường
  (1, 3, 20, 5, 50),     -- Muối
  (1, 7, 21, 10, 50),    -- Thịt heo
  (1, 8, 8, 5, 20),      -- Pate
  (1, 9, 25, 10, 50),    -- Bột bánh mì
  (1, 10, 12, 5, 30);    -- Nhân thịt

-- Franchise stores inventory (thành phẩm)
INSERT INTO inventory (store_id, item_id, quantity, min_stock_level, max_stock_level) VALUES
  (2, 12, 50, 20, 100),  -- Chi nhánh Q1 - Bánh mì thịt
  (2, 13, 30, 15, 80),   -- Chi nhánh Q1 - Bánh mì pate
  (3, 12, 40, 20, 100),  -- Chi nhánh Q3 - Bánh mì thịt
  (3, 13, 25, 15, 80),   -- Chi nhánh Q3 - Bánh mì pate
  (4, 12, 35, 20, 100),  -- Chi nhánh Q7 - Bánh mì thịt
  (4, 13, 20, 15, 80);   -- Chi nhánh Q7 - Bánh mì pate

-- ==========================================
-- 7. ORDERS (đơn đặt hàng từ franchise)
-- ==========================================
INSERT INTO orders (id, order_code, store_id, status, total_amount, delivery_date, notes, created_at) VALUES
  (1, 'ORD-260116-001', 2, 'delivered', 2500000, '2026-01-16', 'Giao buổi sáng', '2026-01-15 14:00:00'),
  (2, 'ORD-260116-002', 3, 'shipping', 1800000, '2026-01-16', NULL, '2026-01-15 15:30:00'),
  (3, 'ORD-260117-001', 2, 'processing', 3000000, '2026-01-17', 'Đơn lớn cuối tuần', '2026-01-16 10:00:00'),
  (4, 'ORD-260117-002', 4, 'approved', 2200000, '2026-01-17', NULL, '2026-01-16 11:00:00'),
  (5, 'ORD-260117-003', 3, 'pending', 1500000, '2026-01-18', NULL, '2026-01-16 14:00:00');

INSERT INTO order_items (order_id, item_id, quantity_ordered, unit_price) VALUES
  -- Order 1
  (1, 12, 100, 15000),
  (1, 13, 50, 12000),
  -- Order 2
  (2, 12, 80, 15000),
  (2, 14, 20, 25000),
  -- Order 3
  (3, 12, 150, 15000),
  (3, 13, 50, 12000),
  -- Order 4
  (4, 12, 100, 15000),
  (4, 13, 40, 12000),
  -- Order 5
  (5, 12, 60, 15000),
  (5, 13, 30, 12000);

-- ==========================================
-- 8. SHIPMENTS (giao hàng)
-- ==========================================
INSERT INTO shipments (id, shipment_code, order_id, status, driver_name, driver_phone, shipped_date, delivered_date) VALUES
  (1, 'SHP-260116-001', 1, 'delivered', 'Nguyễn Văn A', '0901234567', '2026-01-16 06:00:00', '2026-01-16 07:30:00'),
  (2, 'SHP-260116-002', 2, 'shipping', 'Trần Văn B', '0907654321', '2026-01-16 06:30:00', NULL);

INSERT INTO shipment_items (shipment_id, order_item_id, batch_id, quantity_shipped) VALUES
  (1, 1, 5, 100),  -- 100 bánh mì thịt từ batch 5
  (1, 2, 5, 50),   -- 50 bánh mì pate
  (2, 3, 5, 80);   -- 80 bánh mì thịt

-- ==========================================
-- 9. PRODUCTION PLANS
-- ==========================================
INSERT INTO production_plans (id, plan_code, start_date, end_date, status, notes) VALUES
  (1, 'PROD-260116', '2026-01-16', '2026-01-16', 'completed', 'Sản xuất cho đơn ngày 16'),
  (2, 'PROD-260117', '2026-01-17', '2026-01-17', 'in_progress', 'Sản xuất cho đơn ngày 17');

INSERT INTO production_details (plan_id, item_id, quantity_planned, quantity_produced, batch_id, status) VALUES
  (1, 9, 50, 50, 5, 'completed'),    -- Bột bánh mì
  (1, 10, 20, 20, 6, 'completed'),   -- Nhân thịt
  (2, 9, 80, 40, NULL, 'in_progress'),
  (2, 10, 30, 0, NULL, 'pending');

-- ==========================================
-- 10. ALERTS
-- ==========================================
INSERT INTO alerts (store_id, item_id, batch_id, alert_type, message, is_resolved) VALUES
  (1, 7, 7, 'expiring_soon', 'Lô thịt heo NL007-260110-001 sắp hết hạn (17/01)', false),
  (2, 12, NULL, 'low_stock', 'Tồn kho bánh mì thịt tại Q1 đang thấp (50 < min 60)', false),
  (1, 3, NULL, 'low_stock', 'Muối sắp hết (20 gần min 15)', true);

-- ==========================================
-- 11. INVENTORY TRANSACTIONS (sample)
-- ==========================================
INSERT INTO inventory_transactions (store_id, item_id, batch_id, quantity_change, transaction_type, reference_type, reference_id, note) VALUES
  (1, 1, 1, 100, 'import', NULL, NULL, 'Nhập kho bột mì'),
  (1, 1, 1, -15, 'production', 'production_plan', 1, 'Xuất sản xuất'),
  (1, 7, 3, 20, 'import', NULL, NULL, 'Nhập thịt heo'),
  (1, 7, 3, -2, 'production', 'production_plan', 1, 'Xuất sản xuất nhân'),
  (2, 12, NULL, 100, 'import', 'shipment', 1, 'Nhận hàng từ CK'),
  (2, 12, NULL, -50, 'export', NULL, NULL, 'Bán hàng');

-- ==========================================
-- 12. RESET SEQUENCES
-- ==========================================
SELECT setval('stores_id_seq', 4);
SELECT setval('categories_id_seq', 3);
SELECT setval('items_id_seq', 15);
SELECT setval('batches_id_seq', 7);
SELECT setval('orders_id_seq', 5);
SELECT setval('shipments_id_seq', 2);
SELECT setval('production_plans_id_seq', 2);

-- ==========================================
-- 13. TEST USERS
-- ==========================================
-- NOTE: Do NOT insert directly into auth.users - it will break Supabase Auth!
-- Instead, create users via Supabase Studio:
-- 1. Open http://127.0.0.1:54323
-- 2. Go to Authentication > Users
-- 3. Click "Add User" and create with email/password
-- 4. Then run the SQL below to link to public.users

-- After creating user in Studio, get the UUID and run:
-- INSERT INTO public.users (id, email, full_name, role, store_id, is_active) VALUES
--   ('<uuid-from-studio>', 'admin@ckms.local', 'Admin User', 'admin', NULL, true);
