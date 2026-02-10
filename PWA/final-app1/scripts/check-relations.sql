-- ============================================
-- テーブル間のリレーションを確認
-- ============================================

-- 1. 商品と在庫の結合確認（最初の5件）
SELECT 
  p.id as product_id,
  p.name,
  p.size,
  s.id as stock_id,
  s.product_id as stock_product_id,
  s.quantity
FROM products p
LEFT JOIN stock s ON s.product_id = p.id
ORDER BY p.id
LIMIT 5;

-- 2. 在庫レコードがない商品を確認
SELECT 
  'Missing stock records' as issue,
  COUNT(*) as count
FROM products p
LEFT JOIN stock s ON s.product_id = p.id
WHERE s.id IS NULL;

-- 3. 外部キー制約の確認
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('products', 'stock');
