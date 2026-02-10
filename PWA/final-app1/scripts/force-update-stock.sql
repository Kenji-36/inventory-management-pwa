-- ============================================
-- 在庫データを強制的に更新
-- ============================================

-- 現在の在庫状況を確認
SELECT 'BEFORE UPDATE' as status, COUNT(*) as total, SUM(quantity) as total_stock
FROM stock;

-- 全ての在庫を強制的に更新
UPDATE stock SET quantity = 10, updated_at = NOW();

-- 更新後の確認
SELECT 'AFTER UPDATE' as status, COUNT(*) as total, SUM(quantity) as total_stock
FROM stock;

-- 詳細確認（最初の10件）
SELECT 
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
