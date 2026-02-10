-- ============================================
-- 在庫データの初期化
-- ============================================

-- 1. 現在の状況確認
SELECT 
  '現在の状況' as status,
  (SELECT COUNT(*) FROM products) as products_count,
  (SELECT COUNT(*) FROM stock) as stock_count,
  (SELECT COALESCE(SUM(quantity), 0) FROM stock) as total_quantity;

-- 2. 商品テーブルの確認（最初の5件）
SELECT 
  '商品サンプル' as label,
  id, 
  name, 
  size, 
  jan_code
FROM products
ORDER BY id
LIMIT 5;

-- 3. 在庫テーブルの確認（最初の5件）
SELECT 
  '在庫サンプル' as label,
  id, 
  product_id, 
  quantity,
  updated_at
FROM stock
ORDER BY product_id
LIMIT 5;

-- 4. 在庫レコードが存在しない商品を確認
SELECT 
  '在庫レコードなし' as label,
  p.id,
  p.name,
  p.size
FROM products p
LEFT JOIN stock s ON s.product_id = p.id
WHERE s.id IS NULL
LIMIT 10;

-- 5. 在庫レコードが存在しない商品に対して在庫を作成
INSERT INTO stock (product_id, quantity, updated_at)
SELECT 
  p.id,
  10 as quantity,
  NOW() as updated_at
FROM products p
LEFT JOIN stock s ON s.product_id = p.id
WHERE s.id IS NULL
ON CONFLICT (product_id) DO NOTHING;

-- 6. 既存の在庫を全て10に更新
UPDATE stock 
SET 
  quantity = 10,
  updated_at = NOW();

-- 7. 最終結果確認
SELECT 
  '最終結果' as status,
  (SELECT COUNT(*) FROM products) as products_count,
  (SELECT COUNT(*) FROM stock) as stock_count,
  (SELECT COALESCE(SUM(quantity), 0) FROM stock) as total_quantity;

-- 8. 更新後のサンプル（最初の10件）
SELECT 
  '更新後サンプル' as label,
  s.id,
  s.product_id,
  p.name,
  p.size,
  s.quantity,
  s.updated_at
FROM stock s
JOIN products p ON p.id = s.product_id
ORDER BY s.product_id
LIMIT 10;
