# Sentry Auth Token 取得ガイド

## 📚 Auth Tokenとは？

Auth Token（認証トークン）は、ビルド時にソースマップをSentryにアップロードするための認証情報です。

### なぜ必要？

- ソースマップをアップロードして、本番環境のエラーを読みやすくする
- ビルドプロセスでSentry APIにアクセスする
- リリース情報を記録する

---

## 🔑 Auth Tokenの取得方法（画像付き解説）

### ステップ1: Sentry Dashboardにログイン

1. https://sentry.io にアクセス
2. GitHubアカウントでログイン

---

### ステップ2: Settings（設定）を開く

**方法1: 左下のメニューから**

1. 画面左下の **Settings**（歯車アイコン⚙️）をクリック
2. 左メニューから **Auth Tokens** をクリック

**方法2: 直接URLにアクセス**

```
https://sentry.io/settings/account/api/auth-tokens/
```

---

### ステップ3: Create New Token（新しいトークンを作成）

画面に以下のように表示されます：

```
┌─────────────────────────────────────────────────┐
│ Auth Tokens                                     │
│                                                 │
│ [Create New Token] ← このボタンをクリック      │
│                                                 │
│ Your auth tokens:                               │
│ （まだトークンがない場合は空）                  │
└─────────────────────────────────────────────────┘
```

**Create New Token** ボタンをクリック

---

### ステップ4: トークン情報を入力

以下のフォームが表示されます：

```
┌─────────────────────────────────────────────────┐
│ Create a new auth token                         │
│                                                 │
│ Name *                                          │
│ ┌─────────────────────────────────────────┐   │
│ │ inventory-management-pwa                │   │
│ └─────────────────────────────────────────┘   │
│                                                 │
│ Scopes *                                        │
│ ☐ Admin                                         │
│ ☐ Member                                        │
│ ☑ project:read         ← チェック              │
│ ☑ project:releases     ← チェック              │
│ ☑ org:read             ← チェック              │
│ ☐ project:write                                 │
│ ☐ team:read                                     │
│                                                 │
│ [Create Token]                                  │
└─────────────────────────────────────────────────┘
```

#### 入力内容

1. **Name**（トークン名）:
   ```
   inventory-management-pwa
   ```
   ※ わかりやすい名前をつける（プロジェクト名推奨）

2. **Scopes**（権限）:
   以下の3つにチェックを入れる：
   - ✅ `project:read` - プロジェクト情報の読み取り
   - ✅ `project:releases` - リリース情報の作成・更新
   - ✅ `org:read` - 組織情報の読み取り

3. **Create Token** ボタンをクリック

---

### ステップ5: トークンをコピー

⚠️ **超重要**: トークンは一度しか表示されません！

トークンが生成されると、以下のように表示されます：

```
┌─────────────────────────────────────────────────┐
│ Your new auth token                             │
│                                                 │
│ ┌─────────────────────────────────────────┐   │
│ │ sntrys_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx │   │
│ │ xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx │   │
│ └─────────────────────────────────────────┘   │
│                                                 │
│ ⚠️ Make sure to copy your token now.           │
│    You won't be able to see it again!          │
│                                                 │
│ [Copy Token] ← このボタンをクリック            │
└─────────────────────────────────────────────────┘
```

#### やること

1. **Copy Token** ボタンをクリック
2. メモ帳に貼り付けて保存
3. **絶対に他人に共有しない**

---

## 📝 取得した情報の整理

以下の4つの情報をメモ帳にまとめてください：

```env
# 1. DSN（プロジェクト作成時に取得）
NEXT_PUBLIC_SENTRY_DSN=https://xxxxxxxx@o1234567.ingest.sentry.io/1234567

# 2. Auth Token（今取得したもの）
SENTRY_AUTH_TOKEN=sntrys_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 3. Organization Slug（組織名）
SENTRY_ORG=your-organization-slug

# 4. Project Name（プロジェクト名）
SENTRY_PROJECT=inventory-management-pwa
```

---

## 🔍 Organization Slugの確認方法

### 方法1: URLから確認

Sentry DashboardのURLを見る：

```
https://sentry.io/organizations/your-org-slug/issues/
                              ↑
                         これがOrganization Slug
```

### 方法2: Settingsから確認

1. Settings → General
2. **Organization Slug** の欄を確認

---

## 💾 環境変数の設定

### ローカル環境（.env.local）

プロジェクトルートの `.env.local` ファイルに追加：

```env
# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://xxxxxxxx@o1234567.ingest.sentry.io/1234567
SENTRY_AUTH_TOKEN=sntrys_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENTRY_ORG=your-organization-slug
SENTRY_PROJECT=inventory-management-pwa
```

### Vercel環境

1. Vercel Dashboardを開く:
   ```
   https://vercel.com/kenji-36/inventory-management-pwa/settings/environment-variables
   ```

2. 以下の4つを追加:

| Name | Value | Environment |
|------|-------|-------------|
| `NEXT_PUBLIC_SENTRY_DSN` | `https://xxx@o123.ingest.sentry.io/123` | Production, Preview, Development |
| `SENTRY_AUTH_TOKEN` | `sntrys_xxxxxxxxxx` | Production, Preview, Development |
| `SENTRY_ORG` | `your-org-slug` | Production, Preview, Development |
| `SENTRY_PROJECT` | `inventory-management-pwa` | Production, Preview, Development |

3. **Save** をクリック

---

## ✅ 設定確認チェックリスト

- [ ] Sentryアカウント作成完了
- [ ] プロジェクト作成完了
- [ ] DSN取得完了
- [ ] Auth Token取得完了
- [ ] Organization Slug確認完了
- [ ] `.env.local` に環境変数追加完了
- [ ] Vercelに環境変数追加完了
- [ ] メモ帳にバックアップ保存完了

---

## 🚨 トラブルシューティング

### Q1: Auth Tokenが見つからない

**A**: 以下のURLに直接アクセス:
```
https://sentry.io/settings/account/api/auth-tokens/
```

### Q2: トークンをコピーし忘れた

**A**: 新しいトークンを作成してください。古いトークンは削除できます。

### Q3: どのScopesを選べばいい？

**A**: 最低限必要なのは以下の3つ:
- `project:read`
- `project:releases`
- `org:read`

### Q4: Organization Slugがわからない

**A**: Sentry DashboardのURLを確認:
```
https://sentry.io/organizations/[ここがOrganization Slug]/
```

### Q5: トークンが動作しない

**A**: 
1. トークンが正しくコピーされているか確認
2. Scopesが正しく設定されているか確認
3. 新しいトークンを作成して再試行

---

## 🔒 セキュリティ上の注意

### ❌ やってはいけないこと

1. **Auth TokenをGitにコミットしない**
   - `.env.local` は `.gitignore` に含まれているか確認

2. **Auth Tokenを他人に共有しない**
   - Slack、Discord、メール等で送信しない

3. **Auth Tokenをコードに直接書かない**
   ```typescript
   // ❌ ダメ
   const token = "sntrys_xxxxxxxx";
   ```

### ✅ やるべきこと

1. **環境変数として管理**
   ```typescript
   // ✅ 良い
   const token = process.env.SENTRY_AUTH_TOKEN;
   ```

2. **定期的にローテーション**
   - 漏洩の疑いがある場合は即座に削除＆再作成

3. **最小権限の原則**
   - 必要最小限のScopesのみを付与

---

## 📚 参考リンク

- [Sentry Auth Tokens公式ドキュメント](https://docs.sentry.io/api/auth/)
- [Sentry Next.js SDK](https://docs.sentry.io/platforms/javascript/guides/nextjs/)

---

**作成日**: 2026年2月13日  
**最終更新**: 2026年2月13日
