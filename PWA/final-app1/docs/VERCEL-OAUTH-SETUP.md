# Vercel本番環境のOAuth設定ガイド

## 問題
VercelにデプロイしたアプリでGoogleログインを使用すると、リダイレクトURLが`localhost`のままになっているため認証が失敗します。

## 解決方法

### 1. Supabaseのリダイレクト許可URLを追加

#### 手順:
1. **Supabase Dashboard** にアクセス
   - https://supabase.com/dashboard

2. プロジェクトを選択

3. 左メニューから **Authentication** → **URL Configuration** を開く

4. **Redirect URLs** セクションに以下のURLを追加:

```
https://inventory-management-pwa.vercel.app/api/auth/callback
https://inventory-management-pwa.vercel.app/**
```

5. **Save** をクリック

---

### 2. Google Cloud ConsoleのリダイレクトURIを追加

#### 手順:
1. **Google Cloud Console** にアクセス
   - https://console.cloud.google.com/

2. プロジェクトを選択

3. 左メニューから **APIs & Services** → **Credentials** を開く

4. OAuth 2.0 クライアントIDをクリック

5. **承認済みのリダイレクト URI** に以下を追加:

```
https://inventory-management-pwa.vercel.app/api/auth/callback
https://rboyrpltnaxcbqhrimwr.supabase.co/auth/v1/callback
```

6. **保存** をクリック

---

### 3. 確認

設定完了後、以下を確認:

1. Vercelアプリにアクセス: https://inventory-management-pwa.vercel.app/login
2. 「Googleでログイン」をクリック
3. Google認証画面が表示される
4. 認証後、ダッシュボードにリダイレクトされる

---

## 設定済みのURL（参考）

### Supabase Redirect URLs
- ✅ `http://localhost:3000/**` （開発環境）
- ✅ `http://localhost:3000/api/auth/callback` （開発環境）
- 🔄 `https://inventory-management-pwa.vercel.app/**` （本番環境 - 追加必要）
- 🔄 `https://inventory-management-pwa.vercel.app/api/auth/callback` （本番環境 - 追加必要）

### Google Cloud Console Authorized Redirect URIs
- ✅ `http://localhost:3000/api/auth/callback` （開発環境）
- ✅ `https://rboyrpltnaxcbqhrimwr.supabase.co/auth/v1/callback` （Supabase）
- 🔄 `https://inventory-management-pwa.vercel.app/api/auth/callback` （本番環境 - 追加必要）

---

## トラブルシューティング

### エラー: "redirect_uri_mismatch"
**原因**: Google Cloud ConsoleのリダイレクトURIが設定されていない

**解決**: 上記の手順2を実施

### エラー: "Invalid Redirect URL"
**原因**: SupabaseのRedirect URLsが設定されていない

**解決**: 上記の手順1を実施

### それでもログインできない場合
1. ブラウザのCookieをクリア
2. シークレットモードで再試行
3. Supabase Dashboard → Authentication → Logs でエラーログを確認

---

## 参考リンク
- [Supabase Auth Configuration](https://supabase.com/docs/guides/auth/redirect-urls)
- [Google OAuth 2.0 Setup](https://developers.google.com/identity/protocols/oauth2)
