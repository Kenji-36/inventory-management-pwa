-- ============================================================
-- 入出庫履歴テーブル セットアップスクリプト
-- 
-- 実行方法: Supabase Dashboard > SQL Editor で実行
-- 
-- このスクリプトは以下を行います:
-- 1. 入出庫履歴（stock_movements）テーブルの作成
-- 2. RLSポリシーの設定
-- 3. インデックスの追加
-- ============================================================

-- ============================================================
-- 1. 入出庫履歴テーブルの作成
-- ============================================================

-- stock_movements: 在庫の入出庫をすべて記録するテーブル
-- いつ、誰が、どの商品を、何個、なぜ変更したかを記録
CREATE TABLE IF NOT EXISTS stock_movements (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  
  -- 移動の種類
  -- 'in': 入庫（仕入れ、返品受入など）
  -- 'out': 出庫（販売、廃棄など）
  -- 'adjust': 棚卸調整
  -- 'order': 注文による出庫
  movement_type TEXT NOT NULL CHECK (movement_type IN ('in', 'out', 'adjust', 'order')),
  
  -- 数量（正の値: 入庫、負の値: 出庫）
  quantity INTEGER NOT NULL,
  
  -- 変更前後の在庫数
  previous_quantity INTEGER NOT NULL,
  new_quantity INTEGER NOT NULL,
  
  -- 理由・メモ
  reason TEXT,
  
  -- 関連する注文ID（注文による出庫の場合）
  order_id BIGINT REFERENCES orders(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. インデックスの追加（検索パフォーマンス向上）
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_user_id ON stock_movements(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_movements_order_id ON stock_movements(order_id);

-- ============================================================
-- 3. RLSの有効化とポリシー設定
-- ============================================================

ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- 認証済みユーザーは入出庫履歴を閲覧可能
DROP POLICY IF EXISTS "認証ユーザーは入出庫履歴を閲覧可能" ON stock_movements;
CREATE POLICY "認証ユーザーは入出庫履歴を閲覧可能" ON stock_movements
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- サービスロール（API）からの挿入を許可
DROP POLICY IF EXISTS "入出庫履歴の挿入を許可" ON stock_movements;
CREATE POLICY "入出庫履歴の挿入を許可" ON stock_movements
  FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- 4. 確認クエリ
-- ============================================================

SELECT 'stock_movements テーブル作成完了' AS status,
       count(*) AS record_count
FROM stock_movements;
