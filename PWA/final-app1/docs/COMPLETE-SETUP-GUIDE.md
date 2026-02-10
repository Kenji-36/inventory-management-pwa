# 🚀 在庫注文管理システム - 完全セットアップガイド

このガイドでは、アプリケーションの完全なセットアップ手順を説明します。

---

## 📋 目次

1. [前提条件](#1-前提条件)
2. [Supabaseプロジェクトのセットアップ](#2-supabaseプロジェクトのセットアップ)
3. [データベースのセットアップ](#3-データベースのセットアップ)
4. [Storageのセットアップ](#4-storageのセットアップ)
5. [Realtimeのセットアップ](#5-realtimeのセットアップ)
6. [アプリケーションの起動](#6-アプリケーションの起動)
7. [PWAのセットアップ](#7-pwaのセットアップ)
8. [動作確認](#8-動作確認)

---

## 1. 前提条件

### 1.1 必要なツール

- ✅ **Node.js**: v18.17以上
- ✅ **npm**: v9以上
- ✅ **Git**: 最新版
- ✅ **ブラウザ**: Chrome, Edge, Safari（最新版）

### 1.2 Supabaseアカウント

[Supabase](https://supabase.com/) でアカウントを作成してください（無料）。

---

## 2. Supabaseプロジェクトのセットアップ

### 2.1 プロジェクトの作成

1. [Supabase Dashboard](https://supabase.com/dashboard) にログイン
2. **「New project」**をクリック
3. 以下の情報を入力：
   - **Name**: `inventory-management`
   - **Database Password**: 強力なパスワード（保存しておく）
   - **Region**: `Northeast Asia (Tokyo)`
4. **「Create new project」**をクリック

### 2.2 環境変数の取得

プロジェクトが作成されたら、以下の情報を取得：

1. **Settings** > **API** を開く
2. 以下をコピー：
   - **Project URL**: `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role**: `SUPABASE_SERVICE_ROLE_KEY`

### 2.3 環境変数の設定

`.env.local` ファイルを開き、以下を更新：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## 3. データベースのセットアップ

### 3.1 データベーススキーマの作成

1. Supabase Dashboard > **SQL Editor** を開く
2. `scripts/setup-database.sql` の内容をコピー＆ペースト
3. **「Run」**をクリック

### 3.2 サンプルデータの投入

1. SQL Editorで `scripts/complete-setup.sql` の内容を実行
2. 以下のテーブルにデータが投入されます：
   - `products`: 30件の商品
   - `stock`: 30件の在庫
   - `orders`: 5件の注文
   - `order_details`: 40件の注文詳細

### 3.3 データの確認

1. Supabase Dashboard > **Table Editor** を開く
2. `products` テーブルを選択
3. 30件のデータが表示されることを確認

📘 **詳細**: [Supabaseセットアップガイド](./setup-supabase.md)

---

## 4. Storageのセットアップ

### 4.1 Storageバケットの作成

1. Supabase Dashboard > **Storage** を開く
2. **「New bucket」**をクリック
3. 以下の設定を入力：
   - **Name**: `product-images`
   - **Public bucket**: ✅ Yes
   - **File size limit**: `5242880` (5MB)
   - **Allowed MIME types**: `image/jpeg, image/png, image/webp`
4. **「Create bucket」**をクリック

### 4.2 Storageポリシーの設定

1. SQL Editorで `scripts/setup-storage.sql` の内容を実行
2. 以下のポリシーが作成されます：
   - 全ユーザーが画像を閲覧可能
   - 認証済みユーザーが画像をアップロード可能
   - 認証済みユーザーが画像を削除可能

📘 **詳細**: [Storageセットアップガイド](./STORAGE-SETUP-GUIDE.md)

---

## 5. Realtimeのセットアップ

### 5.1 Realtimeの有効化

1. SQL Editorで `scripts/enable-realtime.sql` の内容を実行
2. 以下のテーブルでRealtimeが有効化されます：
   - `stock`（在庫）
   - `products`（商品）
   - `orders`（注文）
   - `order_details`（注文詳細）

### 5.2 Realtimeの確認

```sql
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
```

📘 **詳細**: [Realtimeセットアップガイド](./REALTIME-SETUP-GUIDE.md)

---

## 6. アプリケーションの起動

### 6.1 依存パッケージのインストール

```bash
npm install
```

### 6.2 開発サーバーの起動

```bash
npm run dev
```

### 6.3 ブラウザでアクセス

```
http://localhost:3000
```

### 6.4 ログイン

1. **「Googleでログイン」**をクリック
2. Googleアカウントでログイン
3. ダッシュボードが表示されることを確認

---

## 7. PWAのセットアップ

### 7.1 Service Workerの確認

1. 開発者ツール（F12）を開く
2. **Application** タブ > **Service Workers** を確認
3. 以下が表示されれば成功：

```
✅ Service Worker registered
Status: activated
```

### 7.2 PWAとしてインストール

**デスクトップ（Chrome/Edge）**:
- アドレスバー右側の**インストールアイコン**（⊕）をクリック

**モバイル（iOS Safari）**:
- 共有ボタン（□↑）> **「ホーム画面に追加」**

**モバイル（Android Chrome）**:
- 画面右下の**インストールプロンプト**から「インストール」

📘 **詳細**: [PWAセットアップガイド](./PWA-SETUP-GUIDE.md)

---

## 8. 動作確認

### 8.1 ダッシュボード

- ✅ 売上推移グラフが表示される
- ✅ 注文数サマリーが表示される
- ✅ 在庫情報サマリーが表示される
- ✅ 商品別売上ランキングが表示される

### 8.2 在庫管理

- ✅ 商品一覧が表示される
- ✅ 商品画像が表示される
- ✅ 商品検索ができる
- ✅ 在庫数を変更できる
- ✅ バーコードスキャンができる

### 8.3 注文管理

- ✅ 注文一覧が表示される
- ✅ 注文詳細が表示される
- ✅ 新規注文を作成できる
- ✅ バーコードスキャンで商品を追加できる

### 8.4 商品画像管理

- ✅ 商品詳細ページで画像をアップロードできる
- ✅ 画像を削除できる
- ✅ 商品一覧でサムネイルが表示される

### 8.5 リアルタイム機能

- ✅ 複数ブラウザで在庫更新が同期される
- ✅ Toast通知が表示される

### 8.6 オフライン機能

- ✅ オフライン時もページが表示される
- ✅ オフラインページが表示される
- ✅ オンラインに戻ると自動的に同期される

---

## ✅ セットアップ完了チェックリスト

### Supabase

- [ ] プロジェクトが作成されている
- [ ] 環境変数が設定されている
- [ ] データベーススキーマが作成されている
- [ ] サンプルデータが投入されている
- [ ] Storageバケットが作成されている
- [ ] Storageポリシーが設定されている
- [ ] Realtimeが有効化されている

### アプリケーション

- [ ] 依存パッケージがインストールされている
- [ ] 開発サーバーが起動している
- [ ] ログインができる
- [ ] ダッシュボードが表示される
- [ ] 在庫管理ができる
- [ ] 注文管理ができる
- [ ] 商品画像管理ができる
- [ ] リアルタイム機能が動作する
- [ ] PWAとしてインストールできる
- [ ] オフライン機能が動作する

---

## 🔧 トラブルシューティング

### データベース接続エラー

**症状**: `Error: Failed to connect to database`

**解決方法**:
1. `.env.local` の環境変数を確認
2. Supabaseプロジェクトが起動しているか確認
3. データベースパスワードが正しいか確認

### 認証エラー

**症状**: `認証が必要です` と表示される

**解決方法**:
1. `scripts/fix-auth-issue.sql` を実行
2. ブラウザのキャッシュをクリア
3. 再ログイン

### 画像アップロードエラー

**症状**: 画像がアップロードできない

**解決方法**:
1. Storageバケットが作成されているか確認
2. Storageポリシーが設定されているか確認
3. ファイルサイズが5MB以下か確認
4. ファイル形式がJPEG、PNG、WebPか確認

### Realtimeが動作しない

**症状**: 在庫更新が同期されない

**解決方法**:
1. `scripts/enable-realtime.sql` を実行
2. ブラウザコンソールで `[Realtime] Status: SUBSCRIBED` が表示されるか確認
3. ブラウザをリロード

---

## 📚 関連ドキュメント

- [Supabaseセットアップガイド](./setup-supabase.md)
- [Storageセットアップガイド](./STORAGE-SETUP-GUIDE.md)
- [Realtimeセットアップガイド](./REALTIME-SETUP-GUIDE.md)
- [PWAセットアップガイド](./PWA-SETUP-GUIDE.md)
- [エラーハンドリングガイド](./ERROR-HANDLING-GUIDE.md)
- [要件定義書](./requirements.md)

---

## 🎉 セットアップ完了！

おめでとうございます！在庫注文管理システムのセットアップが完了しました。

次のステップ：
1. ✅ アプリケーションを使ってみる
2. ✅ カスタマイズする
3. ✅ 本番環境にデプロイする

**本番環境へのデプロイ**: [Vercelデプロイガイド](./vercel-deployment.md)
