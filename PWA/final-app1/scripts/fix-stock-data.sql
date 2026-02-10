-- ============================================
-- 在庫データの修復
-- 全商品の在庫数をリセットし、適切な初期値を設定
-- ============================================

-- 1. 現在の在庫状況を確認
SELECT 
  p.id AS product_id,
  p.name AS product_name,
  p.size,
  COALESCE(s.quantity, -1) AS current_quantity
FROM products p
LEFT JOIN stock s ON s.product_id = p.id
ORDER BY p.id;

-- 2. stockテーブルにデータがない商品にレコードを追加
INSERT INTO stock (product_id, quantity, last_stocked_date)
SELECT p.id, 0, CURRENT_DATE
FROM products p
WHERE NOT EXISTS (
  SELECT 1 FROM stock s WHERE s.product_id = p.id
);

-- 3. 在庫数を適切な値に更新
UPDATE stock
SET 
  quantity = CASE 
    WHEN product_id % 6 = 0 THEN 0      -- 一部を在庫切れ
    WHEN product_id % 4 = 0 THEN 1      -- 一部を在庫少
    WHEN product_id % 3 = 0 THEN 3      -- 一部を少なめ
    WHEN product_id % 2 = 0 THEN 8      -- 偶数は中程度
    ELSE 15                              -- その他は多め
  END,
  last_stocked_date = CURRENT_DATE - (product_id % 14) * INTERVAL '1 day',
  updated_at = NOW();

-- 4. 更新後の在庫状況を確認
SELECT 
  p.id AS product_id,
  p.name AS product_name,
  p.size,
  s.quantity AS new_quantity,
  s.last_stocked_date
FROM products p
JOIN stock s ON s.product_id = p.id
ORDER BY p.id;

-- 5. 完了メッセージ
DO $$
DECLARE
  total_products INT;
  total_stock INT;
  out_of_stock INT;
BEGIN
  SELECT COUNT(*) INTO total_products FROM products;
  SELECT SUM(quantity) INTO total_stock FROM stock;
  SELECT COUNT(*) INTO out_of_stock FROM stock WHERE quantity = 0;
  
  RAISE NOTICE '✅ 在庫データの修復が完了しました！';
  RAISE NOTICE '  商品数: %', total_products;
  RAISE NOTICE '  合計在庫: %', total_stock;
  RAISE NOTICE '  在庫切れ: %件', out_of_stock;
END $$;
