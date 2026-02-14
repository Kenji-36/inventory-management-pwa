# CI/CDパイプライン構築ガイド

## 📚 はじめに

このガイドでは、GitHub Actionsを使用したCI/CDパイプラインの構築方法を、初学者にもわかりやすく説明します。

---

## 🎯 このガイドで実現すること

1. **プルリクエスト時**: 自動的にテストを実行
2. **mainブランチへのマージ時**: 自動的にVercelにデプロイ
3. **テスト失敗時**: マージをブロック

---

## 📖 CI/CDとは？

### CI (Continuous Integration) - 継続的インテグレーション
コードを変更するたびに、自動的にテストを実行して品質をチェックします。

**例**: 
- あなたがコードを変更してGitHubにpush
- → 自動的にテストが実行される
- → テストが通れば✅、失敗すれば❌

### CD (Continuous Deployment) - 継続的デプロイ
テストが通ったコードを、自動的に本番環境にデプロイします。

**例**:
- mainブランチにマージ
- → 自動的にテストが実行される
- → テストが通れば自動的にVercelにデプロイ

---

## 🛠️ 必要な準備

- [x] GitHubアカウント
- [x] GitHubリポジトリ（既に作成済み）
- [x] Vercelアカウント（既に作成済み）
- [x] プロジェクトがVercelにデプロイ済み

---

## ステップ1: GitHub Actionsの仕組みを理解する

GitHub Actionsは「ワークフロー」という設定ファイルで動作します。

### ワークフローファイルの配置場所
```
プロジェクトルート/
  └── .github/
      └── workflows/
          └── test.yml  ← ここに設定ファイルを置く
```

### ワークフローの基本構造
```yaml
name: ワークフローの名前

on: いつ実行するか（トリガー）

jobs: 何を実行するか（ジョブ）
  job名:
    runs-on: どの環境で実行するか
    steps: 実行する手順
```

---

## ステップ2: 最初のワークフローを作成する

まずは、プルリクエスト時にテストを実行する簡単なワークフローを作成します。

### ファイル: `.github/workflows/test.yml`

```yaml
# ワークフローの名前（GitHub上で表示される）
name: Test

# いつ実行するか
on:
  # プルリクエストが作成・更新されたとき
  pull_request:
    branches: [main]
  # mainブランチにpushされたとき
  push:
    branches: [main]

# 実行するジョブ
jobs:
  # ジョブ名: test
  test:
    # Ubuntu環境で実行
    runs-on: ubuntu-latest
    
    # 実行する手順
    steps:
      # ステップ1: コードをチェックアウト（取得）
      - name: コードをチェックアウト
        uses: actions/checkout@v4
      
      # ステップ2: Node.jsをセットアップ
      - name: Node.jsをセットアップ
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      # ステップ3: 依存パッケージをインストール
      - name: 依存パッケージをインストール
        run: npm ci
      
      # ステップ4: テストを実行
      - name: テストを実行
        run: npm test
      
      # ステップ5: ビルドを実行
      - name: ビルドを実行
        run: npm run build
```

---

## ステップ3: E2Eテスト用のワークフローを作成する

E2Eテストは時間がかかるので、別のワークフローにします。

### ファイル: `.github/workflows/e2e.yml`

```yaml
name: E2E Tests

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  e2e:
    runs-on: ubuntu-latest
    
    steps:
      - name: コードをチェックアウト
        uses: actions/checkout@v4
      
      - name: Node.jsをセットアップ
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: 依存パッケージをインストール
        run: npm ci
      
      - name: Playwrightブラウザをインストール
        run: npx playwright install --with-deps chromium
      
      - name: E2Eテストを実行
        run: npm run test:e2e
        env:
          # 環境変数をGitHub Secretsから取得
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
      
      - name: テスト失敗時のスクリーンショットをアップロード
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-screenshots
          path: test-results/
```

---

## ステップ4: GitHub Secretsの設定

環境変数を安全に管理するため、GitHub Secretsを設定します。

### 設定手順

1. GitHubリポジトリページを開く
2. **Settings** タブをクリック
3. 左メニューから **Secrets and variables** → **Actions** をクリック
4. **New repository secret** をクリック
5. 以下のシークレットを追加:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | あなたのSupabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | あなたのSupabase Anon Key |

---

## ステップ5: ワークフローの動作確認

### 確認方法

1. ブランチを作成してコードを変更
   ```bash
   git checkout -b test-ci-cd
   ```

2. 変更をコミット＆プッシュ
   ```bash
   git add .
   git commit -m "test: CI/CD動作確認"
   git push origin test-ci-cd
   ```

3. GitHubでプルリクエストを作成

4. **Actions** タブで実行状況を確認
   - ✅ 緑色のチェックマーク: 成功
   - ❌ 赤色のバツマーク: 失敗

---

## ステップ6: 高度な機能を追加する

### 6.1 テストカバレッジレポート

```yaml
- name: テストカバレッジを生成
  run: npm run test:coverage

- name: カバレッジレポートをアップロード
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
```

### 6.2 並列実行でテストを高速化

```yaml
jobs:
  test:
    strategy:
      matrix:
        node-version: [18, 20]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
```

### 6.3 キャッシュで高速化

```yaml
- name: 依存パッケージをキャッシュ
  uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
```

---

## ステップ7: Vercel自動デプロイの設定

Vercelは既にGitHub連携しているので、mainブランチへのマージで自動デプロイされます。

### デプロイ前にテストを必須にする設定

1. GitHubリポジトリの **Settings** → **Branches**
2. **Branch protection rules** → **Add rule**
3. Branch name pattern: `main`
4. 以下をチェック:
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - テストワークフローを選択（Test, E2E Tests）
5. **Create** をクリック

これで、テストが通らないとmainブランチにマージできなくなります！

---

## 📊 ワークフローの実行結果を確認する

### GitHub Actionsページの見方

1. リポジトリの **Actions** タブを開く
2. 左側: ワークフロー一覧
3. 中央: 実行履歴
4. 各実行をクリック: 詳細ログ

### ステータスバッジをREADMEに追加

```markdown
![Test](https://github.com/ユーザー名/リポジトリ名/workflows/Test/badge.svg)
![E2E Tests](https://github.com/ユーザー名/リポジトリ名/workflows/E2E%20Tests/badge.svg)
```

---

## 🐛 トラブルシューティング

### よくあるエラーと解決方法

#### エラー1: `npm ci` が失敗する
**原因**: package-lock.jsonが古い  
**解決**: ローカルで `npm install` を実行してコミット

#### エラー2: テストがタイムアウトする
**原因**: テストの実行時間が長すぎる  
**解決**: `timeout-minutes` を追加
```yaml
jobs:
  test:
    timeout-minutes: 10
```

#### エラー3: 環境変数が読み込めない
**原因**: GitHub Secretsが設定されていない  
**解決**: Settings → Secrets and variables → Actions で設定

#### エラー4: Playwrightブラウザのインストールに失敗
**原因**: 依存パッケージが不足  
**解決**: `--with-deps` オプションを追加
```yaml
run: npx playwright install --with-deps chromium
```

---

## 📈 次のステップ

CI/CDパイプラインが動作したら、以下を検討しましょう：

1. **通知の設定**
   - Slack/Discord通知
   - メール通知

2. **セキュリティスキャン**
   - Dependabot（脆弱性チェック）
   - CodeQL（コード品質チェック）

3. **パフォーマンステスト**
   - Lighthouse CI
   - Bundle size チェック

4. **自動リリース**
   - セマンティックバージョニング
   - CHANGELOG自動生成

---

## 🎓 学習リソース

- [GitHub Actions公式ドキュメント](https://docs.github.com/ja/actions)
- [GitHub Actions Marketplace](https://github.com/marketplace?type=actions)
- [Vercel GitHub Integration](https://vercel.com/docs/git/vercel-for-github)

---

## ✅ チェックリスト

完了したらチェックを入れましょう：

- [ ] `.github/workflows/test.yml` を作成
- [ ] `.github/workflows/e2e.yml` を作成
- [ ] GitHub Secretsを設定
- [ ] プルリクエストでテストが実行されることを確認
- [ ] mainブランチへのマージでデプロイされることを確認
- [ ] Branch protection rulesを設定
- [ ] READMEにステータスバッジを追加

---

**作成日**: 2026年2月13日  
**対象プロジェクト**: 在庫注文管理システム（PWA）
