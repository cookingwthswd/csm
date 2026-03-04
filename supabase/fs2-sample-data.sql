-- ==========================================
-- FS2 Complete Sample Data
-- Chạy 1 lần duy nhất trong Supabase Studio > SQL Editor
-- ==========================================

-- ==========================================
-- 1. CATEGORIES
-- ==========================================
INSERT INTO categories (name, description) VALUES
  ('Nguyên liệu', 'Nguyên liệu thô đầu vào'),
  ('Bán thành phẩm', 'Sản phẩm đã sơ chế'),
  ('Thành phẩm', 'Sản phẩm hoàn chỉnh')
ON CONFLICT DO NOTHING;

-- ==========================================
-- 2. STORES
-- ==========================================
INSERT INTO stores (name, type, address, phone) VALUES
  ('Bếp Trung Tâm', 'central_kitchen', '123 Nguyễn Huệ, Q1, TP.HCM', '028-1234-5678'),
  ('Chi nhánh Quận 1', 'franchise', '456 Lê Lợi, Q1, TP.HCM', '028-1111-2222'),
  ('Chi nhánh Quận 3', 'franchise', '789 Võ Văn Tần, Q3, TP.HCM', '028-3333-4444'),
  ('Chi nhánh Quận 7', 'franchise', '321 Nguyễn Thị Thập, Q7, TP.HCM', '028-5555-6666')
ON CONFLICT DO NOTHING;

-- ==========================================
-- 3. ITEMS (dùng category name lookup)
-- ==========================================
INSERT INTO items (name, sku, category_id, unit, type, description)
SELECT q.name, q.sku, c.id, q.unit, q.item_type, q.desc
FROM (VALUES
  ('Bột mì',            'NL001', 'Nguyên liệu',    'kg',  'material',         'Bột mì đa dụng'),
  ('Đường cát',         'NL002', 'Nguyên liệu',    'kg',  'material',         'Đường cát trắng'),
  ('Muối',              'NL003', 'Nguyên liệu',    'kg',  'material',         'Muối tinh'),
  ('Bơ',                'NL004', 'Nguyên liệu',    'kg',  'material',         'Bơ lạt'),
  ('Trứng gà',          'NL005', 'Nguyên liệu',    'pcs', 'material',         'Trứng gà tươi'),
  ('Sữa tươi',          'NL006', 'Nguyên liệu',    'l',   'material',         'Sữa tươi nguyên kem'),
  ('Thịt heo xay',      'NL007', 'Nguyên liệu',    'kg',  'material',         'Thịt heo xay nhuyễn'),
  ('Pate gan',           'NL008', 'Nguyên liệu',    'kg',  'material',         'Pate gan heo'),
  ('Bột bánh mì',       'BTP001','Bán thành phẩm',  'kg',  'semi_finished',    'Bột đã nhào sẵn'),
  ('Nhân thịt',          'BTP002','Bán thành phẩm',  'kg',  'semi_finished',    'Nhân thịt đã ướp'),
  ('Nước sốt đặc biệt', 'BTP003','Bán thành phẩm',  'l',   'semi_finished',    'Nước sốt gia truyền'),
  ('Bánh mì thịt',      'TP001', 'Thành phẩm',     'pcs', 'finished_product', 'Bánh mì thịt nguội'),
  ('Bánh mì pate',      'TP002', 'Thành phẩm',     'pcs', 'finished_product', 'Bánh mì pate gan'),
  ('Bánh mì đặc biệt',  'TP003', 'Thành phẩm',     'pcs', 'finished_product', 'Bánh mì đặc biệt full topping'),
  ('Bánh mì chả',       'TP004', 'Thành phẩm',     'pcs', 'finished_product', 'Bánh mì chả lụa')
) AS q(name, sku, cat_name, unit, item_type, "desc")
JOIN categories c ON c.name = q.cat_name
ON CONFLICT (sku) DO NOTHING;

-- ==========================================
-- 4. RECIPES (BOM)
-- ==========================================

-- Bánh mì thịt = Bột bánh mì + Nhân thịt + Nước sốt
INSERT INTO recipe_details (product_id, material_id, quantity)
SELECT p.id, m.id, q.qty
FROM (VALUES
  ('TP001', 'BTP001', 0.15),
  ('TP001', 'BTP002', 0.05),
  ('TP001', 'BTP003', 0.02)
) AS q(p_sku, m_sku, qty)
JOIN items p ON p.sku = q.p_sku
JOIN items m ON m.sku = q.m_sku
ON CONFLICT (product_id, material_id) DO NOTHING;

-- Bánh mì pate = Bột bánh mì + Pate
INSERT INTO recipe_details (product_id, material_id, quantity)
SELECT p.id, m.id, q.qty
FROM (VALUES
  ('TP002', 'BTP001', 0.15),
  ('TP002', 'NL008', 0.03)
) AS q(p_sku, m_sku, qty)
JOIN items p ON p.sku = q.p_sku
JOIN items m ON m.sku = q.m_sku
ON CONFLICT (product_id, material_id) DO NOTHING;

-- Bánh mì đặc biệt = Bột bánh mì + Nhân thịt + Pate + Nước sốt
INSERT INTO recipe_details (product_id, material_id, quantity)
SELECT p.id, m.id, q.qty
FROM (VALUES
  ('TP003', 'BTP001', 0.15),
  ('TP003', 'BTP002', 0.05),
  ('TP003', 'NL008', 0.03),
  ('TP003', 'BTP003', 0.03)
) AS q(p_sku, m_sku, qty)
JOIN items p ON p.sku = q.p_sku
JOIN items m ON m.sku = q.m_sku
ON CONFLICT (product_id, material_id) DO NOTHING;

-- Bánh mì chả = Bột bánh mì + Nhân thịt
INSERT INTO recipe_details (product_id, material_id, quantity)
SELECT p.id, m.id, q.qty
FROM (VALUES
  ('TP004', 'BTP001', 0.15),
  ('TP004', 'BTP002', 0.06)
) AS q(p_sku, m_sku, qty)
JOIN items p ON p.sku = q.p_sku
JOIN items m ON m.sku = q.m_sku
ON CONFLICT (product_id, material_id) DO NOTHING;

-- Bột bánh mì = Bột mì + Đường + Muối + Bơ + Trứng + Sữa
INSERT INTO recipe_details (product_id, material_id, quantity)
SELECT p.id, m.id, q.qty
FROM (VALUES
  ('BTP001', 'NL001', 0.8),
  ('BTP001', 'NL002', 0.05),
  ('BTP001', 'NL003', 0.01),
  ('BTP001', 'NL004', 0.05),
  ('BTP001', 'NL005', 2.0),
  ('BTP001', 'NL006', 0.1)
) AS q(p_sku, m_sku, qty)
JOIN items p ON p.sku = q.p_sku
JOIN items m ON m.sku = q.m_sku
ON CONFLICT (product_id, material_id) DO NOTHING;

-- Nhân thịt = Thịt heo + Muối + Nước sốt
INSERT INTO recipe_details (product_id, material_id, quantity)
SELECT p.id, m.id, q.qty
FROM (VALUES
  ('BTP002', 'NL007', 0.8),
  ('BTP002', 'NL003', 0.01),
  ('BTP002', 'BTP003', 0.05)
) AS q(p_sku, m_sku, qty)
JOIN items p ON p.sku = q.p_sku
JOIN items m ON m.sku = q.m_sku
ON CONFLICT (product_id, material_id) DO NOTHING;

-- ==========================================
-- 5. INVENTORY CK (store lookup by name)
-- ==========================================
INSERT INTO inventory (store_id, item_id, quantity, min_stock_level, max_stock_level)
SELECT s.id, i.id, q.qty, q.min_s, q.max_s
FROM (VALUES
  ('NL001', 85,  20, 200),
  ('NL002', 45,  10, 100),
  ('NL003', 20,  5,  50),
  ('NL004', 15,  5,  50),
  ('NL005', 100, 20, 200),
  ('NL006', 30,  10, 60),
  ('NL007', 21,  10, 50),
  ('NL008', 8,   5,  20),
  ('BTP001', 25, 10, 50),
  ('BTP002', 12, 5,  30),
  ('BTP003', 5,  3,  20)
) AS q(sku, qty, min_s, max_s)
JOIN items i ON i.sku = q.sku
JOIN stores s ON s.name = 'Bếp Trung Tâm'
ON CONFLICT (store_id, item_id) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  min_stock_level = EXCLUDED.min_stock_level,
  max_stock_level = EXCLUDED.max_stock_level;

-- ==========================================
-- 6. PRODUCTION PLANS
-- ==========================================

-- Plan A: completed
INSERT INTO production_plans (plan_code, start_date, end_date, status, notes) VALUES
  ('PP-260301-001', '2026-03-01', '2026-03-01', 'completed', 'Đã hoàn thành sản xuất bán thành phẩm')
ON CONFLICT (plan_code) DO NOTHING;

DO $$
DECLARE pid INTEGER;
BEGIN
  SELECT id INTO pid FROM production_plans WHERE plan_code = 'PP-260301-001';
  IF pid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production_details WHERE plan_id = pid) THEN
    INSERT INTO production_details (plan_id, item_id, quantity_planned, quantity_produced, status)
    SELECT pid, i.id, q.qty, q.qty, 'completed'
    FROM (VALUES ('BTP001', 50), ('BTP002', 20)) AS q(sku, qty)
    JOIN items i ON i.sku = q.sku;
  END IF;
END $$;

-- Plan B: in_progress
INSERT INTO production_plans (plan_code, start_date, status, notes) VALUES
  ('PP-260302-002', '2026-03-02', 'in_progress', 'Sản xuất bán thành phẩm - đang chạy')
ON CONFLICT (plan_code) DO NOTHING;

DO $$
DECLARE pid INTEGER;
BEGIN
  SELECT id INTO pid FROM production_plans WHERE plan_code = 'PP-260302-002';
  IF pid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production_details WHERE plan_id = pid) THEN
    INSERT INTO production_details (plan_id, item_id, quantity_planned, quantity_produced, status)
    SELECT pid, i.id, q.qty, q.produced, q.st
    FROM (VALUES
      ('BTP001', 60, 30, 'in_progress'),
      ('BTP002', 25, 0,  'pending'),
      ('BTP003', 8,  0,  'pending')
    ) AS q(sku, qty, produced, st)
    JOIN items i ON i.sku = q.sku;
  END IF;
END $$;

-- Plan C: planned
INSERT INTO production_plans (plan_code, start_date, end_date, status, notes) VALUES
  ('PP-260302-001', '2026-03-02', '2026-03-03', 'planned', 'Kế hoạch sản xuất thành phẩm cuối tuần')
ON CONFLICT (plan_code) DO NOTHING;

DO $$
DECLARE pid INTEGER;
BEGIN
  SELECT id INTO pid FROM production_plans WHERE plan_code = 'PP-260302-001';
  IF pid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM production_details WHERE plan_id = pid) THEN
    INSERT INTO production_details (plan_id, item_id, quantity_planned, quantity_produced, status)
    SELECT pid, i.id, q.qty, 0, 'pending'
    FROM (VALUES
      ('TP001', 200),
      ('TP002', 100),
      ('TP003', 50),
      ('TP004', 80)
    ) AS q(sku, qty)
    JOIN items i ON i.sku = q.sku;
  END IF;
END $$;

-- ==========================================
-- 7. VERIFY
-- ==========================================
SELECT '=== ITEMS ===' AS info;
SELECT id, name, sku, type FROM items ORDER BY type, id;

SELECT '=== RECIPES ===' AS info;
SELECT p.name AS product, m.name AS material, rd.quantity, m.unit
FROM recipe_details rd
JOIN items p ON rd.product_id = p.id
JOIN items m ON rd.material_id = m.id
ORDER BY p.name, m.name;

SELECT '=== PLANS ===' AS info;
SELECT id, plan_code, status, start_date FROM production_plans ORDER BY id;

SELECT '=== DETAILS ===' AS info;
SELECT pp.plan_code, i.name, pd.quantity_planned, pd.quantity_produced, pd.status
FROM production_details pd
JOIN production_plans pp ON pd.plan_id = pp.id
JOIN items i ON pd.item_id = i.id
ORDER BY pp.id, pd.id;

SELECT '=== CK INVENTORY ===' AS info;
SELECT i.name, inv.quantity, inv.min_stock_level, i.unit
FROM inventory inv
JOIN items i ON inv.item_id = i.id
WHERE inv.store_id = (SELECT id FROM stores WHERE name = 'Bếp Trung Tâm')
ORDER BY i.type, i.name;
