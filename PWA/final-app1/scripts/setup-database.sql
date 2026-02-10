-- ============================================
-- 在庫注文管理システム - データベーススキーマ
-- Supabase PostgreSQL
-- ============================================

-- ============================================
-- 1. テーブル作成
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
-- 2. インデックス作成
-- ============================================

-- productsテーブル
CREATE INDEX IF NOT EXISTS idx_products_product_code ON products(product_code);
CREATE INDEX IF NOT EXISTS idx_products_jan_code ON products(jan_code);
CREATE INDEX IF NOT EXISTS idx_products_name ON products USING gin(to_tsvector('english', name));

-- stockテーブル
CREATE INDEX IF NOT EXISTS idx_stock_product_id ON stock(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_quantity ON stock(quantity);

-- ordersテーブル
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders(order_date DESC);

-- order_detailsテーブル
CREATE INDEX IF NOT EXISTS idx_order_details_order_id ON order_details(order_id);
CREATE INDEX IF NOT EXISTS idx_order_details_product_id ON order_details(product_id);

-- usersテーブル
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================
-- 3. トリガー設定（updated_at自動更新）
-- ============================================

-- updated_at自動更新関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- productsテーブル
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at 
  BEFORE UPDATE ON products
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- stockテーブル
DROP TRIGGER IF EXISTS update_stock_updated_at ON stock;
CREATE TRIGGER update_stock_updated_at 
  BEFORE UPDATE ON stock
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- order_detailsテーブル
DROP TRIGGER IF EXISTS update_order_details_updated_at ON order_details;
CREATE TRIGGER update_order_details_updated_at 
  BEFORE UPDATE ON order_details
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- usersテーブル
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. Row Level Security (RLS) 設定
-- ============================================

-- 4.1 productsテーブル
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 全ユーザーが読み取り可能
DROP POLICY IF EXISTS "products_select_policy" ON products;
CREATE POLICY "products_select_policy" ON products
  FOR SELECT USING (true);

-- 認証済みユーザーのみ挿入可能
DROP POLICY IF EXISTS "products_insert_policy" ON products;
CREATE POLICY "products_insert_policy" ON products
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 認証済みユーザーのみ更新可能
DROP POLICY IF EXISTS "products_update_policy" ON products;
CREATE POLICY "products_update_policy" ON products
  FOR UPDATE USING (auth.role() = 'authenticated');

-- 管理者のみ削除可能
DROP POLICY IF EXISTS "products_delete_policy" ON products;
CREATE POLICY "products_delete_policy" ON products
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- 4.2 stockテーブル
ALTER TABLE stock ENABLE ROW LEVEL SECURITY;

-- 認証済みユーザーが読み取り可能
DROP POLICY IF EXISTS "stock_select_policy" ON stock;
CREATE POLICY "stock_select_policy" ON stock
  FOR SELECT USING (auth.role() = 'authenticated');

-- 認証済みユーザーが更新可能
DROP POLICY IF EXISTS "stock_update_policy" ON stock;
CREATE POLICY "stock_update_policy" ON stock
  FOR UPDATE USING (auth.role() = 'authenticated');

-- 認証済みユーザーが挿入可能
DROP POLICY IF EXISTS "stock_insert_policy" ON stock;
CREATE POLICY "stock_insert_policy" ON stock
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 4.3 ordersテーブル
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 認証済みユーザーが読み取り可能
DROP POLICY IF EXISTS "orders_select_policy" ON orders;
CREATE POLICY "orders_select_policy" ON orders
  FOR SELECT USING (auth.role() = 'authenticated');

-- 認証済みユーザーが挿入可能
DROP POLICY IF EXISTS "orders_insert_policy" ON orders;
CREATE POLICY "orders_insert_policy" ON orders
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 4.4 order_detailsテーブル
ALTER TABLE order_details ENABLE ROW LEVEL SECURITY;

-- 認証済みユーザーが読み取り可能
DROP POLICY IF EXISTS "order_details_select_policy" ON order_details;
CREATE POLICY "order_details_select_policy" ON order_details
  FOR SELECT USING (auth.role() = 'authenticated');

-- 認証済みユーザーが挿入可能
DROP POLICY IF EXISTS "order_details_insert_policy" ON order_details;
CREATE POLICY "order_details_insert_policy" ON order_details
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 4.5 usersテーブル
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 認証済みユーザーが読み取り可能
DROP POLICY IF EXISTS "users_select_policy" ON users;
CREATE POLICY "users_select_policy" ON users
  FOR SELECT USING (auth.role() = 'authenticated');

-- 自分のレコードのみ更新可能
DROP POLICY IF EXISTS "users_update_own_policy" ON users;
CREATE POLICY "users_update_own_policy" ON users
  FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- 5. 在庫減算用関数
-- ============================================

-- 注文作成時に在庫を減算する関数
CREATE OR REPLACE FUNCTION decrease_stock(
  p_product_id BIGINT,
  p_quantity INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  current_stock INTEGER;
BEGIN
  -- 現在の在庫数を取得（行ロック）
  SELECT quantity INTO current_stock
  FROM stock
  WHERE product_id = p_product_id
  FOR UPDATE;

  -- 在庫が足りない場合はエラー
  IF current_stock IS NULL THEN
    RAISE EXCEPTION '商品ID % の在庫情報が見つかりません', p_product_id;
  END IF;

  IF current_stock < p_quantity THEN
    RAISE EXCEPTION '商品ID % の在庫が不足しています（在庫: %, 必要: %）', 
      p_product_id, current_stock, p_quantity;
  END IF;

  -- 在庫を減算
  UPDATE stock
  SET quantity = quantity - p_quantity,
      updated_at = NOW()
  WHERE product_id = p_product_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. ユーザー自動登録トリガー
-- ============================================

-- 新規ユーザー登録時に自動でusersテーブルに追加
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- トリガーの作成
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- 7. Realtime有効化
-- ============================================

-- Realtimeを有効化（Supabase Dashboard > Database > Replication でも設定可能）
ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE stock;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_details;

-- ============================================
-- 完了メッセージ
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ データベーススキーマのセットアップが完了しました！';
  RAISE NOTICE '📋 作成されたテーブル:';
  RAISE NOTICE '  - products (商品)';
  RAISE NOTICE '  - stock (在庫)';
  RAISE NOTICE '  - orders (注文)';
  RAISE NOTICE '  - order_details (注文詳細)';
  RAISE NOTICE '  - users (ユーザー)';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Row Level Security (RLS) が有効化されました';
  RAISE NOTICE '⚡ Realtime が有効化されました';
  RAISE NOTICE '';
  RAISE NOTICE '次のステップ: 画像ストレージの設定';
END $$;
