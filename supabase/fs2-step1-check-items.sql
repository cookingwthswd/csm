-- ==========================================
-- STEP 1: Kiểm tra items hiện có
-- ==========================================
SELECT id, name, sku, type, unit FROM items ORDER BY id;

-- ==========================================
-- STEP 2: Thêm items còn thiếu (nếu cần)
-- ==========================================
INSERT INTO items (name, sku, category_id, unit, type, description) VALUES
  ('Bột mì', 'NL001', 1, 'kg', 'material', 'Bột mì đa dụng'),
  ('Đường cát', 'NL002', 1, 'kg', 'material', 'Đường cát trắng'),
  ('Muối', 'NL003', 1, 'kg', 'material', 'Muối tinh'),
  ('Bơ', 'NL004', 1, 'kg', 'material', 'Bơ lạt'),
  ('Trứng gà', 'NL005', 1, 'pcs', 'material', 'Trứng gà tươi'),
  ('Sữa tươi', 'NL006', 1, 'l', 'material', 'Sữa tươi nguyên kem'),
  ('Thịt heo xay', 'NL007', 1, 'kg', 'material', 'Thịt heo xay nhuyễn'),
  ('Pate gan', 'NL008', 1, 'kg', 'material', 'Pate gan heo'),
  ('Bột bánh mì', 'BTP001', 2, 'kg', 'semi_finished', 'Bột đã nhào sẵn'),
  ('Nhân thịt', 'BTP002', 2, 'kg', 'semi_finished', 'Nhân thịt đã ướp'),
  ('Nước sốt đặc biệt', 'BTP003', 2, 'l', 'semi_finished', 'Nước sốt gia truyền'),
  ('Bánh mì thịt', 'TP001', 3, 'pcs', 'finished_product', 'Bánh mì thịt nguội'),
  ('Bánh mì pate', 'TP002', 3, 'pcs', 'finished_product', 'Bánh mì pate gan'),
  ('Bánh mì đặc biệt', 'TP003', 3, 'pcs', 'finished_product', 'Bánh mì đặc biệt full topping'),
  ('Bánh mì chả', 'TP004', 3, 'pcs', 'finished_product', 'Bánh mì chả lụa')
ON CONFLICT (sku) DO NOTHING;
