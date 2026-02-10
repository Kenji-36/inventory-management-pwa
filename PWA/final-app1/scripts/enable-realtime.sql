-- ============================================
-- 在庫注文管理システム - Realtime機能の有効化
-- Supabase Realtime
-- ============================================

-- ============================================
-- 1. Realtimeの有効化（stockテーブル）
-- ============================================

-- stockテーブルのRealtimeを有効化
ALTER PUBLICATION supabase_realtime ADD TABLE stock;

-- ============================================
-- 2. Realtimeの有効化確認
-- ============================================

-- 現在のRealtimeテーブル一覧を確認
SELECT 
  schemaname,
  tablename,
  pubname
FROM 
  pg_publication_tables
WHERE 
  pubname = 'supabase_realtime'
ORDER BY 
  schemaname, tablename;

-- ============================================
-- 3. （オプション）他のテーブルもRealtimeを有効化
-- ============================================

-- productsテーブルのRealtimeを有効化（商品情報の変更を監視）
ALTER PUBLICATION supabase_realtime ADD TABLE products;

-- ordersテーブルのRealtimeを有効化（注文の追加を監視）
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- order_detailsテーブルのRealtimeを有効化（注文詳細の追加を監視）
ALTER PUBLICATION supabase_realtime ADD TABLE order_details;

-- ============================================
-- 完了メッセージ
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Realtime機能の有効化が完了しました！';
  RAISE NOTICE '';
  RAISE NOTICE '📡 Realtimeが有効なテーブル:';
  RAISE NOTICE '  - stock（在庫）';
  RAISE NOTICE '  - products（商品）';
  RAISE NOTICE '  - orders（注文）';
  RAISE NOTICE '  - order_details（注文詳細）';
  RAISE NOTICE '';
  RAISE NOTICE '次のステップ: アプリケーションでリアルタイム更新を確認';
END $$;
