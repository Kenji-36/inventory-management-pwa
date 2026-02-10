# 📦 Supabase Storage セットアップガイド

このガイドでは、商品画像管理に必要なSupabase Storageの設定を行います。

## 🎯 目的

商品画像をSupabase Storageに保存し、アプリケーションから画像のアップロード・表示・削除を行えるようにします。

---

## ステップ1: Supabase Dashboardにアクセス

1. ブラウザで [Supabase Dashboard](https://supabase.com/dashboard) を開く
2. プロジェクト `rboyrpltnaxcbqhrimwr` を選択

---

## ステップ2: Storageバケットの作成

### 2.1 Storageページに移動

左サイドバーから **Storage** をクリック

### 2.2 新規バケットの作成

1. **「New bucket」** ボタンをクリック
2. 以下の設定を入力：

| 項目 | 設定値 |
|------|--------|
| **Name** | `product-images` |
| **Public bucket** | ✅ **Yes** （チェックを入れる） |
| **File size limit** | `5242880` (5MB) |
| **Allowed MIME types** | `image/jpeg, image/png, image/webp` |

3. **「Create bucket」** をクリック

---

## ステップ3: ストレージポリシーの設定

### 3.1 SQL Editorを開く

左サイドバーから **SQL Editor** をクリック

### 3.2 SQLスクリプトを実行

以下のSQLスクリプトをコピー＆ペーストして実行：

```sql
-- ============================================
-- ストレージポリシーの削除（既存の場合）
-- ============================================

DROP POLICY IF EXISTS "product_images_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "product_images_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "product_images_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "product_images_delete_policy" ON storage.objects;

-- ============================================
-- ストレージポリシーの作成
-- ============================================

-- 全ユーザーが画像を閲覧可能
CREATE POLICY "product_images_select_policy"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- 認証済みユーザーが画像をアップロード可能
CREATE POLICY "product_images_insert_policy"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'products'
);

-- 認証済みユーザーが画像を更新可能
CREATE POLICY "product_images_update_policy"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images'
  AND auth.role() = 'authenticated'
);

-- 認証済みユーザーが画像を削除可能
CREATE POLICY "product_images_delete_policy"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images'
  AND auth.role() = 'authenticated'
);
```

### 3.3 実行結果の確認

以下のメッセージが表示されれば成功です：

```
Success. No rows returned
```

---

## ステップ4: バケット設定の確認

### 4.1 Storageページに戻る

左サイドバーから **Storage** をクリック

### 4.2 バケット一覧の確認

`product-images` バケットが表示されていることを確認

### 4.3 バケット設定の確認

1. `product-images` バケットをクリック
2. 右上の **「Settings」** をクリック
3. 以下の設定を確認：
   - ✅ **Public bucket**: Yes
   - ✅ **File size limit**: 5242880 (5MB)
   - ✅ **Allowed MIME types**: image/jpeg, image/png, image/webp

---

## ✅ セットアップ完了チェックリスト

- [ ] `product-images` バケットが作成されている
- [ ] バケットが **Public** に設定されている
- [ ] ファイルサイズ制限が **5MB** に設定されている
- [ ] 許可されたMIMEタイプが設定されている
- [ ] ストレージポリシーが正常に作成されている

---

## 🎉 次のステップ

ストレージのセットアップが完了したら、次は**画像アップロードAPIの実装**に進みます。

開発サーバーを起動して、画像管理機能の実装を開始してください！

```bash
npm run dev
```

---

## 🔧 トラブルシューティング

### バケットが作成できない

- プロジェクトの権限を確認してください
- ブラウザのキャッシュをクリアして再試行してください

### ポリシーの作成に失敗する

- SQL Editorで既存のポリシーを確認してください：

```sql
SELECT * FROM pg_policies WHERE tablename = 'objects';
```

- 既存のポリシーを削除してから再試行してください

### 画像がアップロードできない

- バケットが **Public** に設定されているか確認してください
- ストレージポリシーが正しく設定されているか確認してください
- 認証が正常に機能しているか確認してください

---

## 📚 参考資料

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Storage Policies](https://supabase.com/docs/guides/storage/security/access-control)
