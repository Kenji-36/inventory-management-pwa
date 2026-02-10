# GitHubリポジトリへの登録手順

## 📋 手順

### ステップ1: GitHubでリポジトリを作成

1. **GitHubにログイン**
   - https://github.com にアクセス

2. **新しいリポジトリを作成**
   - 右上の「+」→「New repository」をクリック

3. **リポジトリ情報を入力**
   - **Repository name**: `inventory-management-pwa`（または任意の名前）
   - **Description**: `在庫・注文管理システム（PWA対応、Supabase統合）`
   - **Public / Private**: お好みで選択
   - **Initialize this repository with**: 何もチェックしない（既存のコードがあるため）

4. **「Create repository」をクリック**

---

### ステップ2: ローカルリポジトリとGitHubを連携

リポジトリ作成後、GitHubに表示される指示に従います。

#### **コマンドプロンプトまたはPowerShellで以下を実行:**

```bash
# GitHubリポジトリをリモートとして追加
git remote add origin https://github.com/[あなたのユーザー名]/inventory-management-pwa.git

# ブランチ名をmainに変更（Gitの新しい標準）
git branch -M main

# GitHubにプッシュ
git push -u origin main
```

**注意**: `[あなたのユーザー名]` の部分は、実際のGitHubユーザー名に置き換えてください。

---

### ステップ3: 認証情報の入力

初回プッシュ時、GitHubの認証情報を求められます。

#### **方法A: Personal Access Token（推奨）**

1. **GitHub Personal Access Tokenを作成**
   - GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - 「Generate new token」→「Generate new token (classic)」
   - Note: `inventory-management-pwa`
   - Expiration: お好みで（90 days推奨）
   - Scopes: ✅ `repo` にチェック
   - 「Generate token」をクリック
   - **トークンをコピー**（一度しか表示されません）

2. **プッシュ時にトークンを使用**
   - Username: GitHubのユーザー名
   - Password: コピーしたトークン（パスワードではない）

#### **方法B: GitHub Desktop（GUIツール）**

1. **GitHub Desktopをダウンロード**
   - https://desktop.github.com/

2. **インストールしてGitHubアカウントでログイン**

3. **「Add Existing Repository」を選択**
   - フォルダを選択: `C:\Users\saabl\Desktop\AICoding\Lectures\PWA\final-app1`

4. **「Publish repository」をクリック**

---

## 🔧 コマンド実行手順（詳細）

### 現在のディレクトリを確認

```bash
pwd
# または
cd
```

**出力が以下であることを確認:**
```
C:\Users\saabl\Desktop\AICoding\Lectures\PWA\final-app1
```

### リモートリポジトリを追加

```bash
git remote add origin https://github.com/[ユーザー名]/inventory-management-pwa.git
```

**例:**
```bash
git remote add origin https://github.com/johndoe/inventory-management-pwa.git
```

### リモートが追加されたか確認

```bash
git remote -v
```

**出力:**
```
origin  https://github.com/[ユーザー名]/inventory-management-pwa.git (fetch)
origin  https://github.com/[ユーザー名]/inventory-management-pwa.git (push)
```

### ブランチ名を変更（必要に応じて）

```bash
git branch -M main
```

### GitHubにプッシュ

```bash
git push -u origin main
```

---

## ✅ 成功確認

プッシュが成功すると、以下のようなメッセージが表示されます:

```
Enumerating objects: 150, done.
Counting objects: 100% (150/150), done.
Delta compression using up to 8 threads
Compressing objects: 100% (120/120), done.
Writing objects: 100% (150/150), 500.00 KiB | 5.00 MiB/s, done.
Total 150 (delta 50), reused 0 (delta 0), pack-reused 0
To https://github.com/[ユーザー名]/inventory-management-pwa.git
 * [new branch]      main -> main
Branch 'main' set up to track remote branch 'main' from 'origin'.
```

---

## 🌐 GitHubでリポジトリを確認

1. **ブラウザでGitHubを開く**
   ```
   https://github.com/[ユーザー名]/inventory-management-pwa
   ```

2. **ファイルが全てアップロードされているか確認**

3. **README.mdが表示されているか確認**

---

## 🔒 機密情報の保護

### .gitignoreの確認

以下のファイルがコミットされていないことを確認してください:

- `.env.local` - 環境変数（Supabaseのキー）
- `node_modules/` - 依存関係
- `.next/` - ビルドファイル

これらは `.gitignore` に含まれているため、自動的に除外されます。

### 環境変数の設定

GitHubにプッシュした後、他の環境で動作させる場合:

1. `.env.example` をコピーして `.env.local` を作成
2. Supabaseの接続情報を設定
3. Google OAuthのクライアントIDを設定

---

## 📝 今後の更新手順

コードを更新した後、GitHubに反映する手順:

```bash
# 変更をステージング
git add .

# コミット
git commit -m "fix: 〇〇の修正"

# GitHubにプッシュ
git push
```

---

## 🆘 トラブルシューティング

### エラー: "remote origin already exists"

```bash
# 既存のリモートを削除
git remote remove origin

# 再度追加
git remote add origin https://github.com/[ユーザー名]/inventory-management-pwa.git
```

### エラー: "Authentication failed"

- Personal Access Tokenを再生成
- トークンの有効期限を確認
- `repo` スコープが含まれているか確認

### エラー: "Updates were rejected"

```bash
# リモートの変更を取得してマージ
git pull origin main --allow-unrelated-histories

# 再度プッシュ
git push -u origin main
```

---

## 💡 推奨: GitHub Desktopを使用

コマンドラインが苦手な場合、GitHub Desktopの使用を推奨します:

1. https://desktop.github.com/ からダウンロード
2. インストールしてGitHubアカウントでログイン
3. 「Add Existing Repository」でプロジェクトフォルダを選択
4. 「Publish repository」をクリック

GUIで簡単に操作できます。
