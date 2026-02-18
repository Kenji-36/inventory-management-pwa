-- パフォーマンス最適化: データベースインデックス
-- Supabase SQL Editor で実行してください

-- 注文テーブル: 日付でのフィルタ・ソート高速化
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders (order_date DESC);

-- 注文明細: order_id による結合高速化
CREATE INDEX IF NOT EXISTS idx_order_details_order_id ON order_details (order_id);

-- 注文明細: product_id による集計高速化
CREATE INDEX IF NOT EXISTS idx_order_details_product_id ON order_details (product_id);

-- 在庫テーブル: product_id による検索高速化
CREATE INDEX IF NOT EXISTS idx_stock_product_id ON stock (product_id);

-- 在庫移動履歴: product_id + 日付でのフィルタ高速化
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_date ON stock_movements (product_id, created_at DESC);

-- 在庫移動履歴: 種類でのフィルタ高速化
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements (movement_type);

-- 監査ログ: 日付でのソート高速化
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs (created_at DESC);

-- 商品テーブル: JANコードでの検索高速化
CREATE INDEX IF NOT EXISTS idx_products_jan_code ON products (jan_code);

-- 商品テーブル: 商品コードでの検索高速化
CREATE INDEX IF NOT EXISTS idx_products_product_code ON products (product_code);
