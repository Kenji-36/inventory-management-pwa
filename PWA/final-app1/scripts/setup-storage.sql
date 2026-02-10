-- ============================================
-- 在庫注文管理システム - ストレージポリシー設定
-- Supabase Storage
-- ============================================

-- ============================================
-- 注意事項
-- ============================================
-- このSQLを実行する前に、Supabase Dashboard > Storage で
-- 'product-images' バケットを作成してください。
--
-- バケット設定:
-- - Public bucket: Yes
-- - File size limit: 5242880 (5MB)
-- - Allowed MIME types: image/jpeg, image/png, image/webp
-- ============================================

-- ============================================
-- 1. ストレージポリシーの削除（既存の場合）
-- ============================================

DROP POLICY IF EXISTS "product_images_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "product_images_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "product_images_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "product_images_delete_policy" ON storage.objects;

-- ============================================
-- 2. ストレージポリシーの作成
-- ============================================

-- 2.1 全ユーザーが画像を閲覧可能
CREATE POLICY "product_images_select_policy"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- 2.2 認証済みユーザーが画像をアップロード可能
CREATE POLICY "product_images_insert_policy"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'products'
);

-- 2.3 認証済みユーザーが画像を更新可能
CREATE POLICY "product_images_update_policy"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images'
  AND auth.role() = 'authenticated'
);

-- 2.4 認証済みユーザーが画像を削除可能
CREATE POLICY "product_images_delete_policy"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images'
  AND auth.role() = 'authenticated'
);

-- ============================================
-- 完了メッセージ
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ ストレージポリシーのセットアップが完了しました！';
  RAISE NOTICE '';
  RAISE NOTICE '📦 バケット: product-images';
  RAISE NOTICE '🔒 ポリシー:';
  RAISE NOTICE '  - 閲覧: 全ユーザー';
  RAISE NOTICE '  - アップロード: 認証済みユーザー';
  RAISE NOTICE '  - 更新: 認証済みユーザー';
  RAISE NOTICE '  - 削除: 認証済みユーザー';
  RAISE NOTICE '';
  RAISE NOTICE '次のステップ: データ移行';
END $$;
