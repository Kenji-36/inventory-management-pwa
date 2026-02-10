-- ============================================
-- 在庫注文管理システム - 完全セットアップスクリプト
-- このSQLを1回実行するだけで、すべてのセットアップが完了します
-- ============================================

-- ============================================
-- STEP 1: テーブル作成
-- ============================================

-- 1.1 productsテーブル（商品）
CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  image_url TEXT,
  size VARCHAR(50) NOT NULL,
  product_code VARCHAR(100) NOT NULL,
  jan_code VARCHAR(13) UNIQUE NOT NULL,
  price_excluding_tax INTEGER NOT NULL CHECK (price_excluding_tax >= 0),
  price_including_tax INTEGER NOT NULL CHECK (price_including_tax >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.2 stockテーブル（在庫情報）
CREATE TABLE IF NOT EXISTS stock (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT UNIQUE NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  last_stocked_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.3 ordersテーブル（注文情報）
CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  item_count INTEGER NOT NULL CHECK (item_count > 0),
  total_price_excluding_tax INTEGER NOT NULL CHECK (total_price_excluding_tax >= 0),
  total_price_including_tax INTEGER NOT NULL CHECK (total_price_including_tax >= 0),
  order_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.4 order_detailsテーブル（注文詳細）
CREATE TABLE IF NOT EXISTS order_details (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_excluding_tax INTEGER NOT NULL CHECK (unit_price_excluding_tax >= 0),
  unit_price_including_tax INTEGER NOT NULL CHECK (unit_price_including_tax >= 0),
  subtotal_excluding_tax INTEGER NOT NULL CHECK (subtotal_excluding_tax >= 0),
  subtotal_including_tax INTEGER NOT NULL CHECK (subtotal_including_tax >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.5 usersテーブル（ユーザー）
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 2: インデックス作成
-- ============================================

CREATE INDEX IF NOT EXISTS idx_products_product_code ON products(product_code);
CREATE INDEX IF NOT EXISTS idx_products_jan_code ON products(jan_code);
CREATE INDEX IF NOT EXISTS idx_stock_product_id ON stock(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_quantity ON stock(quantity);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders(order_date DESC);
CREATE INDEX IF NOT EXISTS idx_order_details_order_id ON order_details(order_id);
CREATE INDEX IF NOT EXISTS idx_order_details_product_id ON order_details(product_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================
-- STEP 3: トリガー設定
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_stock_updated_at ON stock;
CREATE TRIGGER update_stock_updated_at BEFORE UPDATE ON stock
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_order_details_updated_at ON order_details;
CREATE TRIGGER update_order_details_updated_at BEFORE UPDATE ON order_details
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 4: Row Level Security (RLS)
-- ============================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- productsテーブルのポリシー
DROP POLICY IF EXISTS "products_select_policy" ON products;
CREATE POLICY "products_select_policy" ON products FOR SELECT USING (true);

DROP POLICY IF EXISTS "products_insert_policy" ON products;
CREATE POLICY "products_insert_policy" ON products FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "products_update_policy" ON products;
CREATE POLICY "products_update_policy" ON products FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "products_delete_policy" ON products;
CREATE POLICY "products_delete_policy" ON products FOR DELETE USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

-- stockテーブルのポリシー
DROP POLICY IF EXISTS "stock_select_policy" ON stock;
CREATE POLICY "stock_select_policy" ON stock FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "stock_update_policy" ON stock;
CREATE POLICY "stock_update_policy" ON stock FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "stock_insert_policy" ON stock;
CREATE POLICY "stock_insert_policy" ON stock FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ordersテーブルのポリシー
DROP POLICY IF EXISTS "orders_select_policy" ON orders;
CREATE POLICY "orders_select_policy" ON orders FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "orders_insert_policy" ON orders;
CREATE POLICY "orders_insert_policy" ON orders FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- order_detailsテーブルのポリシー
DROP POLICY IF EXISTS "order_details_select_policy" ON order_details;
CREATE POLICY "order_details_select_policy" ON order_details FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "order_details_insert_policy" ON order_details;
CREATE POLICY "order_details_insert_policy" ON order_details FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- usersテーブルのポリシー
DROP POLICY IF EXISTS "users_select_policy" ON users;
CREATE POLICY "users_select_policy" ON users FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "users_update_own_policy" ON users;
CREATE POLICY "users_update_own_policy" ON users FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- STEP 5: 在庫減算用関数
-- ============================================

CREATE OR REPLACE FUNCTION decrease_stock(
  p_product_id BIGINT,
  p_quantity INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  current_stock INTEGER;
BEGIN
  SELECT quantity INTO current_stock FROM stock WHERE product_id = p_product_id FOR UPDATE;
  
  IF current_stock IS NULL THEN
    RAISE EXCEPTION '商品ID % の在庫情報が見つかりません', p_product_id;
  END IF;

  IF current_stock < p_quantity THEN
    RAISE EXCEPTION '商品ID % の在庫が不足しています（在庫: %, 必要: %）', p_product_id, current_stock, p_quantity;
  END IF;

  UPDATE stock SET quantity = quantity - p_quantity, updated_at = NOW() WHERE product_id = p_product_id;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 6: ユーザー自動登録トリガー
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), 'user')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- STEP 7: サンプルデータ投入
-- ============================================

-- 商品データ（30件）
INSERT INTO products (name, size, product_code, jan_code, price_excluding_tax, price_including_tax) VALUES
('ポロシャツ', 'S', 'MLS-101', '4595643591894', 3500, 3850),
('ポロシャツ', 'M', 'MLS-101', '4595643591900', 3500, 3850),
('ポロシャツ', 'L', 'MLS-101', '4595643591917', 3500, 3850),
('カジュアルTシャツ', 'S', 'MCT-202', '4595643591924', 2800, 3080),
('カジュアルTシャツ', 'M', 'MCT-202', '4595643591931', 2800, 3080),
('カジュアルTシャツ', 'L', 'MCT-202', '4595643591948', 2800, 3080),
('デニムジャケット', 'S', 'MDJ-303', '4595643591955', 8200, 9020),
('デニムジャケット', 'M', 'MDJ-303', '4595643591962', 8200, 9020),
('デニムジャケット', 'L', 'MDJ-303', '4595643591979', 8200, 9020),
('チノパンツ', 'S', 'MCP-404', '4595643591986', 4500, 4950),
('チノパンツ', 'M', 'MCP-404', '4595643591993', 4500, 4950),
('チノパンツ', 'L', 'MCP-404', '4595643592006', 4500, 4950),
('スウェットパーカー', 'S', 'MSP-505', '4595643592013', 5200, 5720),
('スウェットパーカー', 'M', 'MSP-505', '4595643592020', 5200, 5720),
('スウェットパーカー', 'L', 'MSP-505', '4595643592037', 5200, 5720),
('ジーンズ', 'S', 'MJE-606', '4595643592044', 6800, 7480),
('ジーンズ', 'M', 'MJE-606', '4595643592051', 6800, 7480),
('ジーンズ', 'L', 'MJE-606', '4595643592068', 6800, 7480),
('ニットセーター', 'S', 'MNS-707', '4595643592075', 4800, 5280),
('ニットセーター', 'M', 'MNS-707', '4595643592082', 4800, 5280),
('ニットセーター', 'L', 'MNS-707', '4595643592099', 4800, 5280),
('カーディガン', 'S', 'MCA-808', '4595643592105', 5500, 6050),
('カーディガン', 'M', 'MCA-808', '4595643592112', 5500, 6050),
('カーディガン', 'L', 'MCA-808', '4595643592129', 5500, 6050),
('ショートパンツ', 'S', 'MSH-909', '4595643592136', 3200, 3520),
('ショートパンツ', 'M', 'MSH-909', '4595643592143', 3200, 3520),
('ショートパンツ', 'L', 'MSH-909', '4595643592150', 3200, 3520),
('ロングコート', 'S', 'MLC-1010', '4595643592167', 12000, 13200),
('ロングコート', 'M', 'MLC-1010', '4595643592174', 12000, 13200),
('ロングコート', 'L', 'MLC-1010', '4595643592181', 12000, 13200)
ON CONFLICT (jan_code) DO NOTHING;

-- 在庫データ
INSERT INTO stock (product_id, quantity, last_stocked_date)
SELECT id, 
  CASE 
    WHEN id % 5 = 0 THEN 0
    WHEN id % 3 = 0 THEN 2
    ELSE 10 + (id % 20)
  END,
  CURRENT_DATE - (id % 30) * INTERVAL '1 day'
FROM products
WHERE NOT EXISTS (SELECT 1 FROM stock WHERE stock.product_id = products.id);

-- 注文データ
INSERT INTO orders (item_count, total_price_excluding_tax, total_price_including_tax, order_date)
SELECT * FROM (VALUES
  (8, 25200, 27720, NOW()),
  (8, 92800, 102080, NOW() - INTERVAL '1 day'),
  (8, 36000, 39600, NOW() - INTERVAL '3 days'),
  (8, 46000, 50600, NOW() - INTERVAL '5 days'),
  (8, 34000, 37400, NOW() - INTERVAL '7 days')
) AS v(item_count, total_price_excluding_tax, total_price_including_tax, order_date)
WHERE NOT EXISTS (SELECT 1 FROM orders LIMIT 1);

-- 注文詳細データ
INSERT INTO order_details (order_id, product_id, quantity, unit_price_excluding_tax, unit_price_including_tax, subtotal_excluding_tax, subtotal_including_tax)
SELECT 
  o.id,
  p.id,
  2,
  p.price_excluding_tax,
  p.price_including_tax,
  p.price_excluding_tax * 2,
  p.price_including_tax * 2
FROM orders o
CROSS JOIN LATERAL (
  SELECT id, price_excluding_tax, price_including_tax
  FROM products
  WHERE id IN (1, 2, 3, 4)
  LIMIT 4
) p
WHERE o.id = (SELECT MIN(id) FROM orders)
  AND NOT EXISTS (SELECT 1 FROM order_details WHERE order_id = o.id)
LIMIT 4;

-- ============================================
-- STEP 8: Realtime有効化
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE stock;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_details;

-- ============================================
-- 確認クエリ
-- ============================================

SELECT 
  '✅ セットアップ完了' as status,
  (SELECT COUNT(*) FROM products) as products_count,
  (SELECT COUNT(*) FROM stock) as stock_count,
  (SELECT COUNT(*) FROM orders) as orders_count,
  (SELECT COUNT(*) FROM order_details) as details_count;
