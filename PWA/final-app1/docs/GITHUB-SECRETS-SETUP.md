# GitHub Secrets 設定ガイド

## 📚 GitHub Secretsとは？

GitHub Secretsは、APIキーやパスワードなどの機密情報を安全に保管する機能です。
これらの情報はGitHub Actionsのワークフロー内で使用できますが、コードには直接書き込まれません。

---

## 🔐 設定が必要なシークレット

このプロジェクトでは、以下のシークレットが必要です：

| シークレット名 | 説明 | 取得方法 |
|--------------|------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | SupabaseプロジェクトのURL | Supabase Dashboard |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase匿名キー | Supabase Dashboard |

---

## 📝 設定手順（画像付き）

### ステップ1: GitHubリポジトリを開く

1. ブラウザで https://github.com/Kenji-36/inventory-management-pwa を開く
2. ログインしていることを確認

### ステップ2: Settings（設定）を開く

1. リポジトリページの上部メニューから **Settings** をクリック
   ```
   Code  Issues  Pull requests  Actions  Projects  Wiki  Security  Insights  Settings
                                                                                  ↑ここ
   ```

### ステップ3: Secrets and variablesを開く

1. 左側のメニューから **Secrets and variables** をクリック
2. **Actions** をクリック
   ```
   左メニュー:
   ├── General
   ├── Collaborators
   ├── ...
   ├── Secrets and variables
   │   └── Actions  ← ここをクリック
   ```

### ステップ4: 新しいシークレットを追加

1. **New repository secret** ボタン（緑色）をクリック

### ステップ5: NEXT_PUBLIC_SUPABASE_URL を追加

1. **Name** 欄に `NEXT_PUBLIC_SUPABASE_URL` と入力
2. **Secret** 欄にSupabase URLを貼り付け
   - Supabase Dashboard → Settings → API → Project URL
   - 例: `https://xxxxxxxxxxxxx.supabase.co`
3. **Add secret** ボタンをクリック

### ステップ6: NEXT_PUBLIC_SUPABASE_ANON_KEY を追加

1. 再度 **New repository secret** ボタンをクリック
2. **Name** 欄に `NEXT_PUBLIC_SUPABASE_ANON_KEY` と入力
3. **Secret** 欄にSupabase Anon Keyを貼り付け
   - Supabase Dashboard → Settings → API → Project API keys → anon public
   - 例: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
4. **Add secret** ボタンをクリック

---

## ✅ 設定確認

設定が完了すると、以下のように表示されます：

```
Repository secrets

NEXT_PUBLIC_SUPABASE_ANON_KEY     Updated 1 minute ago
NEXT_PUBLIC_SUPABASE_URL          Updated 2 minutes ago
```

**注意**: シークレットの値は表示されません（セキュリティのため）

---

## 🔍 Supabase情報の取得方法

### Supabase Dashboardへのアクセス

1. https://supabase.com にアクセス
2. ログイン
3. プロジェクト一覧から該当プロジェクトを選択

### Project URLの取得

1. 左メニューから **Settings**（歯車アイコン）をクリック
2. **API** をクリック
3. **Project URL** をコピー
   ```
   Project URL
   https://xxxxxxxxxxxxx.supabase.co
   [Copy]  ← このボタンをクリック
   ```

### Anon Keyの取得

1. 同じページの下部 **Project API keys** セクション
2. **anon** **public** キーをコピー
   ```
   anon public
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   [Copy]  ← このボタンをクリック
   ```

---

## 🚨 重要な注意事項

### ❌ やってはいけないこと

1. **シークレットをコードに直接書かない**
   ```typescript
   // ❌ ダメな例
   const supabaseUrl = "https://xxxxx.supabase.co";
   ```

2. **シークレットをGitにコミットしない**
   - `.env.local` ファイルは `.gitignore` に含まれているか確認

3. **シークレットをSlack/Discord等で共有しない**
   - 必ずGitHub Secretsを使用

### ✅ やるべきこと

1. **環境変数として使用**
   ```typescript
   // ✅ 良い例
   const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
   ```

2. **定期的にキーをローテーション**
   - 漏洩の疑いがある場合は即座に再生成

3. **最小権限の原則**
   - 必要最小限の権限のみを持つキーを使用

---

## 🔄 シークレットの更新方法

既存のシークレットを更新する場合：

1. Secrets and variables → Actions ページを開く
2. 更新したいシークレット名をクリック
3. **Update secret** ボタンをクリック
4. 新しい値を入力
5. **Update secret** ボタンをクリック

---

## 🐛 トラブルシューティング

### エラー: "Secret not found"

**原因**: シークレット名が間違っている  
**解決**: 
- シークレット名を確認（大文字小文字を区別）
- スペースや特殊文字が含まれていないか確認

### エラー: "Invalid credentials"

**原因**: シークレットの値が間違っている  
**解決**:
- Supabase Dashboardから正しい値を再度コピー
- 余分なスペースが入っていないか確認

### ワークフローでシークレットが使えない

**原因**: ワークフローファイルの記述ミス  
**解決**:
```yaml
# ✅ 正しい書き方
env:
  NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}

# ❌ 間違った書き方
env:
  NEXT_PUBLIC_SUPABASE_URL: secrets.NEXT_PUBLIC_SUPABASE_URL  # ${{ }} がない
```

---

## 📚 参考リンク

- [GitHub Secrets公式ドキュメント](https://docs.github.com/ja/actions/security-guides/encrypted-secrets)
- [Supabase API設定](https://supabase.com/docs/guides/api)

---

**作成日**: 2026年2月13日  
**最終更新**: 2026年2月13日
