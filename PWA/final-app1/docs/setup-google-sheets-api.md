# Google Sheets API 設定ガイド（初学者向け）

このガイドでは、Google Sheets API を使用してスプレッドシートと連携するための
サービスアカウントの作成方法を説明します。

---

## 目次
1. [Google Sheets API を有効化](#1-google-sheets-api-を有効化)
2. [サービスアカウントを作成](#2-サービスアカウントを作成)
3. [秘密鍵をダウンロード](#3-秘密鍵をダウンロード)
4. [スプレッドシートを準備](#4-スプレッドシートを準備)
5. [スプレッドシートを共有](#5-スプレッドシートを共有)
6. [環境変数を設定](#6-環境変数を設定)
7. [動作確認](#7-動作確認)

---

## 前提条件

- ステップ2（Google OAuth設定）で作成したGoogle Cloudプロジェクトがあること
- Google Cloud Console にアクセスできること

---

## 1. Google Sheets API を有効化

### 手順

1. **Google Cloud Console** にアクセス：
   
   👉 https://console.cloud.google.com/

2. 画面上部で **ステップ2で作成したプロジェクト** を選択

3. 左側のメニューから **「APIとサービス」** → **「ライブラリ」** をクリック

4. 検索ボックスに **「Google Sheets API」** と入力

5. **「Google Sheets API」** をクリック

6. **「有効にする」** ボタンをクリック

   > ✅ 「API が有効です」と表示されれば完了

---

## 2. サービスアカウントを作成

サービスアカウントは、アプリケーションがGoogle APIにアクセスするための専用アカウントです。

### 手順

1. 左側のメニューから **「APIとサービス」** → **「認証情報」** をクリック

2. 画面上部の **「+ 認証情報を作成」** をクリック

3. **「サービス アカウント」** を選択

4. **サービスアカウントの詳細** を入力：

   | 項目 | 入力値 |
   |------|--------|
   | サービス アカウント名 | `inventory-sheets-service` |
   | サービス アカウントID | 自動生成（そのままでOK） |
   | サービス アカウントの説明 | `在庫管理システム用Sheets API連携` |

5. **「作成して続行」** をクリック

6. **ロールの選択**（省略可能）：
   - 何も選択せず **「続行」** をクリック
   
   > 💡 スプレッドシートへのアクセスはシートの共有設定で制御するため、ここでのロール設定は不要です

7. **ユーザーアクセスの許可**（省略可能）：
   - 何も入力せず **「完了」** をクリック

8. サービスアカウントが作成されました！

---

## 3. 秘密鍵をダウンロード

### 手順

1. **「認証情報」** ページで、作成したサービスアカウントをクリック
   
   例: `inventory-sheets-service@your-project.iam.gserviceaccount.com`

2. **「キー」** タブをクリック

3. **「鍵を追加」** → **「新しい鍵を作成」** をクリック

4. キーのタイプで **「JSON」** を選択

5. **「作成」** をクリック

6. **JSONファイルが自動でダウンロードされます**

   > 🔴 **重要**: このファイルは大切に保管してください！
   > - ファイル名の例: `your-project-xxxxxxxxxxxx.json`
   > - 再ダウンロードはできません

7. ダウンロードしたJSONファイルを開くと、以下のような内容が確認できます：

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "xxxxxxxxxxxx",
  "private_key": "-----BEGIN PRIVATE KEY-----\nxxxxxxxx\n-----END PRIVATE KEY-----\n",
  "client_email": "inventory-sheets-service@your-project.iam.gserviceaccount.com",
  "client_id": "xxxxxxxxxxxx",
  ...
}
```

必要な情報：
- `client_email` → 環境変数 `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `private_key` → 環境変数 `GOOGLE_PRIVATE_KEY`

---

## 4. スプレッドシートを準備

### 手順

1. **Google スプレッドシート** にアクセス：
   
   👉 https://docs.google.com/spreadsheets/

2. **「空白」** をクリックして新しいスプレッドシートを作成

3. スプレッドシートに名前をつける：
   - 例: `在庫管理システムDB`

4. **シートを5つ作成** し、それぞれに名前をつけます：

   | シート名 | 用途 |
   |----------|------|
   | 商品 | 商品マスタ |
   | 在庫情報 | 在庫数量管理 |
   | 注文情報 | 注文ヘッダー |
   | 注文詳細 | 注文明細 |
   | ユーザマスタ | ユーザー管理 |

   > 💡 シート名は下部のタブをダブルクリックして変更できます

5. **各シートにヘッダー行を入力**：

### 商品シート（1行目）
```
商品ID | 商品名 | 画像URL | サイズ | 商品コード | JANコード | 税抜価格 | 税込価格 | 作成日 | 更新日
```

### 在庫情報シート（1行目）
```
在庫ID | 商品ID | 在庫数 | 最終入庫日 | 作成日 | 更新日
```

### 注文情報シート（1行目）
```
注文ID | 商品数 | 注文金額(税抜) | 注文金額(税込) | 注文日
```

### 注文詳細シート（1行目）
```
明細ID | 注文ID | 商品ID | 数量 | 単価(税抜) | 単価(税込) | 小計(税抜) | 小計(税込) | 作成日 | 更新日
```

### ユーザマスタシート（1行目）
```
idno | user_id | email | name | role | created_at | updated_at
```

6. **スプレッドシートIDをメモ**：
   
   URLから取得します：
   ```
   https://docs.google.com/spreadsheets/d/【ここがスプレッドシートID】/edit
   ```
   
   例: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`

---

## 5. スプレッドシートを共有

サービスアカウントにスプレッドシートへのアクセス権限を付与します。

### 手順

1. スプレッドシートを開いた状態で、右上の **「共有」** ボタンをクリック

2. **「ユーザーやグループを追加」** に、サービスアカウントのメールアドレスを入力：
   
   ```
   inventory-sheets-service@your-project.iam.gserviceaccount.com
   ```
   
   > 💡 これはJSONファイルの `client_email` の値です

3. 権限を **「編集者」** に設定

4. **「送信」** をクリック
   
   > 「このユーザーはGoogleアカウントを持っていないため、通知を送信できません」と表示されても問題ありません

5. 共有完了！

---

## 6. 環境変数を設定

プロジェクトの `.env.local` ファイルに以下を追加します：

```env
# Google Sheets API用（サービスアカウント）
GOOGLE_SERVICE_ACCOUNT_EMAIL=inventory-sheets-service@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBg...(長い文字列)...\n-----END PRIVATE KEY-----\n"
GOOGLE_SPREADSHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
```

### GOOGLE_PRIVATE_KEY の注意点

JSONファイルの `private_key` の値をそのままコピーしてください。

**重要なポイント**：
- 値全体を **ダブルクォート（"）で囲む**
- `\n` はそのまま（実際の改行に変換しない）
- 先頭の `-----BEGIN PRIVATE KEY-----` から末尾の `-----END PRIVATE KEY-----\n` まで含める

### 完成した .env.local の例

```env
# Google OAuth認証用
GOOGLE_CLIENT_ID=xxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx

# Google Sheets API用（サービスアカウント）
GOOGLE_SERVICE_ACCOUNT_EMAIL=inventory-sheets-service@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASC...(省略)...\n-----END PRIVATE KEY-----\n"
GOOGLE_SPREADSHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms

# NextAuth.js用
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

# アプリケーション設定
NODE_ENV=development
```

---

## 7. 動作確認

### 手順

1. 開発サーバーを再起動：
   ```bash
   npm run dev
   ```

2. ブラウザで以下にアクセス：
   ```
   http://localhost:3000/api/test-sheets
   ```

3. 接続成功なら、シートのデータがJSON形式で表示されます

---

## トラブルシューティング

### エラー: "The caller does not have permission"

**原因**: サービスアカウントにスプレッドシートへのアクセス権がない

**解決方法**:
1. スプレッドシートの共有設定を確認
2. サービスアカウントのメールアドレスが正しく追加されているか確認
3. 権限が「編集者」になっているか確認

### エラー: "Requested entity was not found"

**原因**: スプレッドシートIDが正しくない

**解決方法**:
1. スプレッドシートのURLから正しいIDをコピー
2. 環境変数 `GOOGLE_SPREADSHEET_ID` を更新

### エラー: "invalid_grant" または認証エラー

**原因**: GOOGLE_PRIVATE_KEY の形式が正しくない

**解決方法**:
1. JSONファイルから `private_key` の値を再度コピー
2. 値全体をダブルクォートで囲む
3. `\n` をそのまま保持（改行に変換しない）

### エラー: "API has not been used in project"

**原因**: Google Sheets API が有効化されていない

**解決方法**:
1. Google Cloud Console → API とサービス → ライブラリ
2. Google Sheets API を検索して有効化

---

## サンプルデータのインポート

`db/` フォルダにあるCSVファイルのデータをスプレッドシートにインポートできます。

### 手順

1. スプレッドシートでシートを選択

2. **ファイル** → **インポート** をクリック

3. **アップロード** タブでCSVファイルを選択

4. インポートオプション：
   - インポート場所: **現在のシートに追加する**
   - 区切り文字: **カンマ**

5. **データをインポート** をクリック

---

## 参考リンク

- [Google Sheets API ドキュメント](https://developers.google.com/sheets/api)
- [サービスアカウントについて](https://cloud.google.com/iam/docs/service-accounts)
- [Node.js クライアントライブラリ](https://github.com/googleapis/google-api-nodejs-client)

---

*作成日: 2026年2月4日*
