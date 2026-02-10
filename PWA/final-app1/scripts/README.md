# データ移行スクリプト

Google Sheets から Supabase へのデータ移行を行うスクリプト集です。

## 📋 目次

1. [前提条件](#前提条件)
2. [スクリプト一覧](#スクリプト一覧)
3. [実行手順](#実行手順)
4. [トラブルシューティング](#トラブルシューティング)

---

## 前提条件

### 1. Supabaseプロジェクトの準備

以下を完了していることを確認してください：

- ✅ Supabaseアカウント作成
- ✅ プロジェクト作成
- ✅ データベーススキーマ作成（`docs/setup-supabase.md` を参照）
- ✅ 環境変数の設定

### 2. 必要なパッケージのインストール

```bash
npm install @supabase/supabase-js dotenv
```

### 3. 環境変数の設定

`.env.local` に以下の環境変数を設定：

```bash
# Google Sheets（既存）
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SPREADSHEET_ID=your-spreadsheet-id

# Supabase（新規）
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## スクリプト一覧

### 1. `backup-google-sheets.ts`

Google Sheets のデータをJSONファイルとしてバックアップします。

**用途:**
- 移行前のデータバックアップ
- データの確認・検証

**出力先:**
- `backups/backup-YYYY-MM-DDTHH-MM-SS/`
  - `products.json`: 商品データ
  - `stock.json`: 在庫データ
  - `orders.json`: 注文データ
  - `order_details.json`: 注文詳細データ
  - `users.json`: ユーザーデータ
  - `all-data.json`: 統合データ
  - `summary.json`: サマリー情報

**実行方法:**
```bash
npx tsx scripts/backup-google-sheets.ts
```

### 2. `migrate-to-supabase.ts`

Google Sheets から Supabase へデータを移行します。

**処理内容:**
1. 商品データの移行（products）
2. 在庫データの移行（stock）
3. 注文データの移行（orders）
4. 注文詳細データの移行（order_details）
5. データ整合性チェック

**実行方法:**
```bash
npx tsx scripts/migrate-to-supabase.ts
```

**注意事項:**
- ⚠️ 実行前に必ずバックアップを取得してください
- ⚠️ 既存のデータは上書きされます（IDが重複する場合はエラー）
- ⚠️ 外部キー制約があるため、実行順序が重要です

### 3. `verify-migration.ts`

移行後のデータを検証します。

**検証項目:**
1. レコード数チェック
2. 外部キー制約チェック
3. データ整合性チェック
   - 商品価格の整合性
   - 在庫数の妥当性
   - 注文金額の整合性
   - JANコードの重複チェック
4. サンプルデータの表示

**実行方法:**
```bash
npx tsx scripts/verify-migration.ts
```

---

## 実行手順

### ステップ1: バックアップ（必須）

```bash
# Google Sheets のデータをバックアップ
npx tsx scripts/backup-google-sheets.ts
```

**確認:**
- `backups/` フォルダにバックアップファイルが作成されたことを確認
- `summary.json` でデータ件数を確認

### ステップ2: Supabaseの準備

1. Supabaseプロジェクトを作成
2. データベーススキーマを作成（`docs/setup-supabase.md` を参照）
3. 環境変数を設定

**スキーマ作成の確認:**
```sql
-- Supabase SQL Editorで実行
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

以下のテーブルが存在することを確認：
- products
- stock
- orders
- order_details
- users

### ステップ3: データ移行

```bash
# Google Sheets → Supabase へデータ移行
npx tsx scripts/migrate-to-supabase.ts
```

**期待される出力:**
```
🚀 Google Sheets → Supabase データ移行を開始します
================================================

📦 商品データの移行を開始...
  取得: 30件の商品データ
  変換: 30件の商品データ
  ✅ 成功: 30件の商品を移行しました

📊 在庫データの移行を開始...
  取得: 30件の在庫データ
  変換: 30件の在庫データ
  ✅ 成功: 30件の在庫を移行しました

🛒 注文データの移行を開始...
  取得: 5件の注文データ
  変換: 5件の注文データ
  ✅ 成功: 5件の注文を移行しました

📋 注文詳細データの移行を開始...
  取得: 40件の注文詳細データ
  変換: 40件の注文詳細データ
  ✅ 成功: 40件の注文詳細を移行しました

🔍 データ整合性チェック...
  商品: 30件
  在庫: 30件
  注文: 5件
  注文詳細: 40件

  外部キー制約チェック...
  ✅ 在庫の外部キー制約: OK

✅ データ整合性チェック完了

================================================
✅ データ移行が完了しました！（所要時間: 5.23秒）
================================================
```

### ステップ4: 検証

```bash
# 移行後のデータを検証
npx tsx scripts/verify-migration.ts
```

**確認項目:**
- ✅ レコード数が正しいか
- ✅ 外部キー制約が満たされているか
- ✅ データの整合性が保たれているか
- ✅ サンプルデータが正しく表示されるか

### ステップ5: 動作確認

1. Supabase Dashboard でデータを確認
   - `Table Editor` でテーブルを開く
   - データが正しく移行されているか確認

2. アプリケーションで動作確認
   - 商品一覧が表示されるか
   - 在庫情報が正しいか
   - 注文履歴が表示されるか

---

## トラブルシューティング

### エラー: "NEXT_PUBLIC_SUPABASE_URL が必要です"

**原因:**
環境変数が設定されていません。

**解決方法:**
```bash
# .env.local を確認
cat .env.local

# 環境変数を設定
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### エラー: "duplicate key value violates unique constraint"

**原因:**
既にデータが存在しています。

**解決方法:**
```sql
-- Supabase SQL Editorで既存データを削除
TRUNCATE TABLE order_details CASCADE;
TRUNCATE TABLE orders CASCADE;
TRUNCATE TABLE stock CASCADE;
TRUNCATE TABLE products CASCADE;

-- または、IDをリセット
ALTER SEQUENCE products_id_seq RESTART WITH 1;
ALTER SEQUENCE stock_id_seq RESTART WITH 1;
ALTER SEQUENCE orders_id_seq RESTART WITH 1;
ALTER SEQUENCE order_details_id_seq RESTART WITH 1;
```

### エラー: "foreign key constraint violation"

**原因:**
外部キー制約に違反しています。

**解決方法:**
1. 移行順序を確認（products → stock → orders → order_details）
2. Google Sheets のデータを確認（存在しない商品IDを参照していないか）

### エラー: "Google Sheets API エラー"

**原因:**
Google Sheets APIの認証情報が正しくありません。

**解決方法:**
```bash
# 環境変数を確認
echo $GOOGLE_SERVICE_ACCOUNT_EMAIL
echo $GOOGLE_SPREADSHEET_ID

# サービスアカウントに権限があるか確認
# Google Sheets で「共有」→ サービスアカウントのメールアドレスを追加
```

### データが一部しか移行されない

**原因:**
Google Sheets に空行が含まれています。

**解決方法:**
スクリプトは空行を自動的にスキップしますが、データを確認してください：

```bash
# バックアップファイルを確認
cat backups/backup-*/summary.json
```

### 移行後にアプリケーションが動作しない

**原因:**
アプリケーションがまだGoogle Sheets APIを使用しています。

**解決方法:**
1. Supabase Client を実装（次のステップ）
2. API Routes を Supabase 版に更新
3. フロントエンドを更新

---

## 次のステップ

データ移行が完了したら、以下のステップに進んでください：

1. ✅ データ移行完了
2. 📝 Supabase Client の実装
3. 🔧 API Routes の更新
4. 🎨 フロントエンドの更新
5. 🧪 テスト
6. 🚀 デプロイ

詳細は `docs/requirements.md` の開発ステップを参照してください。

---

## 参考資料

- [Supabaseセットアップガイド](../docs/setup-supabase.md)
- [Supabase移行要件定義書](../docs/supabase-migration-requirements.md)
- [要件定義書](../docs/requirements.md)

---

*作成日: 2026年2月7日*
*最終更新日: 2026年2月7日*
