-- ============================================================
-- ユーザー権限管理・監査ログ セットアップスクリプト
-- 
-- 実行方法: Supabase Dashboard > SQL Editor で実行
-- 
-- このスクリプトは以下を行います:
-- 1. 監査ログ（audit_logs）テーブルの作成
-- 2. RLSポリシーの設定
-- 3. 監査ログ自動記録のトリガー作成
-- ============================================================

-- ============================================================
-- 1. 監査ログテーブルの作成
-- ============================================================

-- 監査ログテーブル
-- 誰が、いつ、何をしたかを記録するテーブル
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  action TEXT NOT NULL,           -- 'create', 'update', 'delete', 'login', 'logout', 'role_change'
  target_table TEXT,              -- 対象テーブル名 ('products', 'orders', 'stock', 'users')
  target_id TEXT,                 -- 対象レコードのID
  details JSONB,                  -- 変更内容の詳細（変更前後の値など）
  ip_address TEXT,                -- IPアドレス（オプション）
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- パフォーマンス向上のためのインデックス
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_table ON audit_logs(target_table);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============================================================
-- 2. RLSの有効化
-- ============================================================

-- 監査ログテーブルのRLSを有効化
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. RLSポリシーの設定
-- ============================================================

-- ----- audit_logs テーブル -----
-- 管理者のみ監査ログを閲覧可能
DROP POLICY IF EXISTS "管理者は監査ログを閲覧可能" ON audit_logs;
CREATE POLICY "管理者は監査ログを閲覧可能" ON audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- サービスロール（API）からの挿入を許可
DROP POLICY IF EXISTS "サービスロールは監査ログを挿入可能" ON audit_logs;
CREATE POLICY "サービスロールは監査ログを挿入可能" ON audit_logs
  FOR INSERT
  WITH CHECK (true);

-- ----- users テーブル -----
-- 管理者は全ユーザーを閲覧可能
DROP POLICY IF EXISTS "管理者は全ユーザーを閲覧可能" ON users;
CREATE POLICY "管理者は全ユーザーを閲覧可能" ON users
  FOR SELECT
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM users AS u 
      WHERE u.id = auth.uid() 
      AND u.role = 'admin'
    )
  );

-- 管理者は全ユーザーのロールを更新可能
DROP POLICY IF EXISTS "管理者は全ユーザーを更新可能" ON users;
CREATE POLICY "管理者は全ユーザーを更新可能" ON users
  FOR UPDATE
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM users AS u 
      WHERE u.id = auth.uid() 
      AND u.role = 'admin'
    )
  );

-- ============================================================
-- 4. usersテーブルのroleカラム確認
-- ============================================================

-- roleカラムが存在しない場合に追加（既に存在する場合はスキップ）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'role'
  ) THEN
    ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'user';
  END IF;
END $$;

-- ============================================================
-- 5. 確認クエリ
-- ============================================================

-- テーブルが正しく作成されたか確認
SELECT 'audit_logs テーブル作成完了' AS status, 
       count(*) AS record_count 
FROM audit_logs;

-- usersテーブルのroleカラムを確認
SELECT id, email, role, created_at 
FROM users 
ORDER BY created_at DESC 
LIMIT 5;
