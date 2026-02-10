# Vercelデプロイガイド

## 実施日
2026-02-06

## 前提条件

### 必要なアカウント
- [x] Vercelアカウント（https://vercel.com）
- [x] GitHubアカウント（リポジトリ連携用）
- [x] Google Cloud Platform アカウント
- [x] Google Spreadsheet（データベース）

### 準備済みの設定
- [x] Google OAuth 2.0 クライアントID
- [x] Google Sheets API サービスアカウント
- [x] Google Spreadsheet ID
- [x] NextAuth Secret

---

## デプロイ手順

### ステップ1: Gitリポジトリの準備

#### 1.1 変更をコミット

```bash
# 現在の変更を確認
git status

# セキュリティ対策ファイルを追加
git add .env.example
git add docs/security-analysis.md
git add docs/security-implementation.md
git add src/lib/api-auth.ts
git add src/lib/error-handler.ts
git add src/lib/validation.ts

# その他の変更を追加
git add next.config.ts
git add src/app/api/
git add docs/requirements.md

# コミット
git commit -m "セキュリティ対策の実装とVercelデプロイ準備"
```

#### 1.2 GitHubリポジトリへプッシュ

```bash
# リモートリポジトリを追加（まだの場合）
git remote add origin https://github.com/your-username/inventory-management.git

# プッシュ
git push -u origin master
```

**重要**: `.env.local` が `.gitignore` に含まれていることを確認してください。

---

### ステップ2: Vercelプロジェクトの作成

#### 2.1 Vercelにログイン

1. https://vercel.com にアクセス
2. GitHubアカウントでログイン

#### 2.2 新規プロジェクトのインポート

1. ダッシュボードで「Add New...」→「Project」をクリック
2. GitHubリポジトリを選択
3. 「Import」をクリック

#### 2.3 プロジェクト設定

| 項目 | 設定値 |
|------|--------|
| Project Name | `inventory-management` または任意の名前 |
| Framework Preset | Next.js |
| Root Directory | `./` |
| Build Command | `npm run build` |
| Output Directory | `.next` |
| Install Command | `npm install` |

---

### ステップ3: 環境変数の設定

Vercelダッシュボードの「Settings」→「Environment Variables」で以下を設定：

#### 3.1 Google OAuth認証用

```
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

#### 3.2 Google Sheets API用

```
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
your-private-key-here
-----END PRIVATE KEY-----"
GOOGLE_SPREADSHEET_ID=your-spreadsheet-id
```

**注意**: `GOOGLE_PRIVATE_KEY` は改行を含む複数行の値です。Vercelでは以下のように設定：
1. 値をダブルクォートで囲む
2. 改行は `\n` として入力

#### 3.3 NextAuth.js用

```
NEXTAUTH_URL=https://your-app-name.vercel.app
NEXTAUTH_SECRET=your-nextauth-secret
```

**`NEXTAUTH_SECRET` の生成方法**:
```bash
openssl rand -base64 32
```

#### 3.4 アプリケーション設定

```
NODE_ENV=production
```

#### 3.5 環境変数の適用範囲

全ての環境変数に以下を設定：
- ✅ Production
- ✅ Preview
- ✅ Development

---

### ステップ4: Google Cloud Platformの設定更新

#### 4.1 OAuth 2.0 リダイレクトURIの追加

1. Google Cloud Console にアクセス
2. 「APIとサービス」→「認証情報」
3. OAuth 2.0 クライアントIDを選択
4. 「承認済みのリダイレクトURI」に追加：

```
https://your-app-name.vercel.app/api/auth/callback/google
```

#### 4.2 Google Spreadsheet の共有設定確認

1. Google Spreadsheet を開く
2. 「共有」をクリック
3. サービスアカウントのメールアドレスに「編集者」権限を付与：
   ```
   your-service-account@your-project.iam.gserviceaccount.com
   ```

---

### ステップ5: デプロイの実行

#### 5.1 自動デプロイ

Vercelは自動的にビルドとデプロイを開始します。

#### 5.2 デプロイステータスの確認

1. Vercelダッシュボードの「Deployments」タブを確認
2. ビルドログを確認
3. エラーがないことを確認

#### 5.3 デプロイ完了

デプロイが成功すると、以下のURLでアクセス可能：
- Production: `https://your-app-name.vercel.app`
- Preview: `https://your-app-name-git-branch-name.vercel.app`

---

### ステップ6: 本番環境での動作確認

#### 6.1 基本機能の確認

| 機能 | 確認項目 | 状態 |
|------|----------|------|
| 認証 | Googleログインが動作する | [ ] |
| ダッシュボード | データが正しく表示される | [ ] |
| 在庫管理 | 商品一覧が表示される | [ ] |
| 在庫管理 | 在庫数の更新ができる | [ ] |
| 在庫管理 | CSV インポート/エクスポートが動作する | [ ] |
| 注文管理 | 注文一覧が表示される | [ ] |
| 注文管理 | 新規注文が作成できる | [ ] |
| 注文管理 | バーコードスキャンが動作する | [ ] |
| PWA | オフラインページが表示される | [ ] |
| PWA | ホーム画面に追加できる | [ ] |

#### 6.2 セキュリティの確認

| 項目 | 確認内容 | 状態 |
|------|----------|------|
| HTTPS | 全ページがHTTPSで配信される | [ ] |
| 認証 | 未ログイン時にログインページへリダイレクト | [ ] |
| API | 未認証APIリクエストが401エラーを返す | [ ] |
| レート制限 | 大量リクエストが429エラーを返す | [ ] |
| セキュリティヘッダー | ブラウザの開発者ツールで確認 | [ ] |

#### 6.3 パフォーマンスの確認

1. **Lighthouse スコアの確認**
   - Chrome DevTools → Lighthouse
   - Performance, Accessibility, Best Practices, SEO を確認

2. **Core Web Vitals**
   - LCP (Largest Contentful Paint) < 2.5s
   - FID (First Input Delay) < 100ms
   - CLS (Cumulative Layout Shift) < 0.1

---

## トラブルシューティング

### ビルドエラーが発生する場合

#### エラー: "Module not found"

**原因**: 依存パッケージがインストールされていない

**解決策**:
```bash
# ローカルで確認
npm install
npm run build

# package-lock.json をコミット
git add package-lock.json
git commit -m "Update package-lock.json"
git push
```

#### エラー: "Environment variable not found"

**原因**: 環境変数が設定されていない

**解決策**:
1. Vercelダッシュボードで環境変数を確認
2. 全ての必須変数が設定されているか確認
3. 再デプロイ

---

### 認証エラーが発生する場合

#### エラー: "Redirect URI mismatch"

**原因**: OAuth リダイレクトURIが登録されていない

**解決策**:
1. Google Cloud Console で OAuth 2.0 クライアントIDを確認
2. 本番環境のURLを「承認済みのリダイレクトURI」に追加
3. 数分待ってから再試行

#### エラー: "Invalid client"

**原因**: `GOOGLE_CLIENT_ID` または `GOOGLE_CLIENT_SECRET` が間違っている

**解決策**:
1. Google Cloud Console で正しい値を確認
2. Vercelの環境変数を更新
3. 再デプロイ

---

### Google Sheets API エラーが発生する場合

#### エラー: "Permission denied"

**原因**: サービスアカウントに権限がない

**解決策**:
1. Google Spreadsheet を開く
2. サービスアカウントのメールアドレスに「編集者」権限を付与
3. 数分待ってから再試行

#### エラー: "Invalid credentials"

**原因**: `GOOGLE_PRIVATE_KEY` の形式が間違っている

**解決策**:
1. 秘密鍵をコピー（改行を含む）
2. Vercelで値を設定する際、ダブルクォートで囲む
3. 改行は `\n` として入力
4. 再デプロイ

---

### PWAが動作しない場合

#### 問題: "ホーム画面に追加"が表示されない

**原因**: HTTPS でない、または manifest.json が見つからない

**解決策**:
1. HTTPSでアクセスしているか確認
2. `/manifest.json` にアクセスできるか確認
3. ブラウザのキャッシュをクリア

#### 問題: Service Worker が登録されない

**原因**: 開発環境でPWAが無効になっている

**解決策**:
- 本番環境（Vercel）でのみPWAが有効
- `next.config.ts` の `disable: process.env.NODE_ENV === "development"` を確認

---

## パフォーマンス最適化

### 1. 画像最適化

```typescript
// next.config.ts に追加
images: {
  domains: ['your-image-domain.com'],
  formats: ['image/avif', 'image/webp'],
}
```

### 2. キャッシュ戦略

Vercelは自動的に以下をキャッシュ：
- 静的ファイル（CSS, JS, 画像）
- API レスポンス（Cache-Control ヘッダーに基づく）

### 3. Edge Functions（オプション）

高速化のため、一部のAPIをEdge Functionsに移行：

```typescript
// src/app/api/products/route.ts
export const runtime = 'edge';
```

---

## 監視とメンテナンス

### 1. Vercel Analytics の有効化

1. Vercelダッシュボードで「Analytics」タブを開く
2. 「Enable Analytics」をクリック
3. リアルタイムのトラフィックとパフォーマンスを監視

### 2. ログの確認

1. Vercelダッシュボードで「Logs」タブを開く
2. エラーログを定期的に確認
3. 異常なアクセスパターンを検知

### 3. 定期的な更新

```bash
# 依存パッケージの更新
npm update

# セキュリティ脆弱性のチェック
npm audit

# 修正
npm audit fix
```

---

## カスタムドメインの設定（オプション）

### 1. ドメインの追加

1. Vercelダッシュボードで「Settings」→「Domains」
2. カスタムドメインを入力
3. DNSレコードを設定

### 2. DNS設定

| タイプ | 名前 | 値 |
|--------|------|-----|
| A | @ | 76.76.21.21 |
| CNAME | www | cname.vercel-dns.com |

### 3. SSL証明書

Vercelが自動的にSSL証明書を発行・更新します。

---

## セキュリティチェックリスト（本番環境）

- [ ] 全ての環境変数が正しく設定されている
- [ ] `.env.local` がGitにコミットされていない
- [ ] OAuth リダイレクトURIが本番URLに設定されている
- [ ] Google Spreadsheet の共有設定が正しい
- [ ] HTTPSで全ページが配信されている
- [ ] セキュリティヘッダーが設定されている
- [ ] レート制限が動作している
- [ ] エラーメッセージが本番モードになっている
- [ ] 不要なログが出力されていない
- [ ] CORS設定が適切（必要に応じて）

---

## バックアップとリカバリ

### Google Spreadsheet のバックアップ

1. **定期的なエクスポート**
   - 週次でCSVエクスポート
   - Google Drive に保存

2. **バージョン履歴の確認**
   - Google Spreadsheet の「ファイル」→「変更履歴」

### Vercelデプロイのロールバック

1. Vercelダッシュボードで「Deployments」
2. 以前のデプロイを選択
3. 「Promote to Production」をクリック

---

## サポートとリソース

### 公式ドキュメント
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Google Cloud Platform](https://cloud.google.com/docs)

### コミュニティ
- [Vercel Discord](https://vercel.com/discord)
- [Next.js GitHub Discussions](https://github.com/vercel/next.js/discussions)

---

## 更新履歴

| 日付 | 内容 |
|------|------|
| 2026-02-06 | 初版作成 |
