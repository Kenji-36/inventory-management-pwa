# 在庫注文管理システム

商品の在庫管理、売上管理を一元化するPWAアプリケーション

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green.svg)
![Test](https://github.com/Kenji-36/inventory-management-pwa/workflows/Test/badge.svg)
![E2E Tests](https://github.com/Kenji-36/inventory-management-pwa/workflows/E2E%20Tests/badge.svg)

## ✨ 主な機能

### 📦 在庫管理
- **商品一覧表示**: SKU入れ子構造で商品を整理
- **商品検索**: 商品名、商品コード、JANコードで検索
- **在庫数量更新**: リアルタイムで在庫を更新
- **バーコードスキャン**: カメラを使用したJANコードスキャン
- **商品画像管理**: 画像のアップロード、表示、削除
- **CSV入出力**: 商品データの一括インポート・エクスポート

### 🛒 注文管理
- **注文一覧表示**: 全注文の履歴を表示
- **注文詳細表示**: 注文内容の詳細確認
- **新規注文作成**: バーコードスキャンまたは一覧から商品を追加
- **在庫自動減算**: 注文確定時に自動で在庫を減算

### 📊 ダッシュボード
- **売上推移グラフ**: 日別/週別/月別の売上推移
- **注文数サマリー**: 本日/今週/今月の注文数
- **在庫情報サマリー**: 総商品数、在庫切れ商品数
- **商品別売上分析**: 売上上位商品ランキング

### 🔐 認証・セキュリティ
- **Google OAuth認証**: Googleアカウントでログイン
- **Row Level Security**: Supabaseのセキュリティ機能
- **権限管理**: 管理者/一般ユーザーの権限設定

### 📱 PWA対応
- **オフライン対応**: Service Workerによるキャッシュ
- **インストール可能**: ホーム画面に追加
- **プッシュ通知**: 在庫アラート通知（オプション）

### ⚡ リアルタイム機能
- **在庫リアルタイム更新**: Supabase Realtimeによる即時反映
- **複数ユーザー同時編集**: 複数デバイスでの同時操作対応

## 🛠️ 技術スタック

### フロントエンド
- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui**
- **html5-qrcode** (バーコードスキャン)
- **Recharts** (グラフ表示)

### バックエンド
- **Supabase PostgreSQL** (データベース)
- **Supabase Auth** (認証)
- **Supabase Storage** (画像ストレージ)
- **Supabase Realtime** (リアルタイム更新)

### インフラ
- **Vercel** (ホスティング)
- **Supabase** (BaaS)

### 監視・分析
- **Sentry** (エラートラッキング)
- **Vercel Analytics** (アクセス解析)

## 📋 システム要件

- Node.js 18以上
- npm または pnpm
- Supabaseアカウント
- Googleアカウント（OAuth認証用）

## 🚀 クイックスタート

### ✅ セットアップ完了済み

このプロジェクトは**完全にセットアップ済み**で、すぐに使用できます！

### 1. 開発サーバーの起動

```bash
npm run dev
```

### 2. ブラウザでアクセス

```
http://localhost:3000
```

### 3. ログイン

Googleアカウントでログインしてください。

---

## 📊 現在の状態

- ✅ **データベース**: Supabase PostgreSQL（セットアップ完了）
- ✅ **サンプルデータ**: 商品30件、在庫30件、注文5件
- ✅ **認証**: Google OAuth（設定完了）
- ✅ **ストレージ**: Supabase Storage（設定完了）
- ✅ **リアルタイム**: Supabase Realtime（有効化済み）
- ✅ **PWA**: Service Worker、Manifest（実装済み）

詳細は [セットアップ完了レポート](./SETUP-COMPLETED.md) を参照してください。

---

## 🆕 新規セットアップ（別環境で構築する場合）

別の環境で一から構築する場合は、以下の手順を実行してください：

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd final-app1
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数の設定

`.env.local`ファイルを作成:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Supabaseセットアップ

詳細なセットアップ手順は [完全セットアップガイド](./docs/COMPLETE-SETUP-GUIDE.md) を参照してください。

## 📸 スクリーンショット

### ダッシュボード
売上推移、注文数、在庫情報を一目で確認

### 在庫管理
商品一覧、在庫数量の更新、バーコードスキャン

### 注文管理
注文一覧、新規注文作成、注文詳細表示

### 商品詳細
商品情報の表示、画像アップロード、在庫編集

## 🗂️ プロジェクト構造

```
final-app1/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # 認証関連ページ
│   │   ├── api/               # APIルート
│   │   ├── inventory/         # 在庫管理ページ
│   │   ├── orders/            # 注文管理ページ
│   │   ├── offline/           # オフラインページ
│   │   ├── error.tsx          # エラーページ
│   │   ├── global-error.tsx   # グローバルエラーページ
│   │   ├── loading.tsx        # ローディングページ
│   │   └── page.tsx           # ダッシュボード
│   ├── components/            # Reactコンポーネント
│   │   ├── dashboard/         # ダッシュボードコンポーネント
│   │   ├── inventory/         # 在庫管理コンポーネント
│   │   ├── orders/            # 注文管理コンポーネント
│   │   ├── products/          # 商品管理コンポーネント
│   │   ├── layout/            # レイアウトコンポーネント
│   │   ├── providers/         # プロバイダーコンポーネント
│   │   └── ui/                # UIコンポーネント
│   ├── hooks/                 # カスタムフック
│   ├── lib/                   # ユーティリティ関数
│   └── types/                 # TypeScript型定義
├── public/                    # 静的ファイル
│   ├── icons/                 # PWAアイコン
│   ├── manifest.json          # PWAマニフェスト
│   └── sw.js                  # Service Worker
├── scripts/                   # SQLスクリプト
│   ├── setup-database.sql     # データベーススキーマ作成
│   ├── complete-setup.sql     # 完全セットアップ
│   ├── setup-storage.sql      # Storageポリシー設定
│   ├── enable-realtime.sql    # Realtime有効化
│   └── fix-auth-issue.sql     # 認証問題修正
├── docs/                      # ドキュメント
│   ├── requirements.md        # 要件定義書
│   ├── COMPLETE-SETUP-GUIDE.md # 完全セットアップガイド
│   ├── STORAGE-SETUP-GUIDE.md # Storageセットアップガイド
│   ├── REALTIME-SETUP-GUIDE.md # Realtimeセットアップガイド
│   ├── PWA-SETUP-GUIDE.md     # PWAセットアップガイド
│   ├── ERROR-HANDLING-GUIDE.md # エラーハンドリングガイド
│   ├── setup-supabase.md      # Supabaseセットアップガイド
│   └── vercel-deployment.md   # Vercelデプロイガイド
├── archive/                   # アーカイブ（旧ファイル）
└── PROGRESS-SUMMARY.md        # 開発進捗サマリー
```

## 📚 ドキュメント

### 主要ドキュメント
- [要件定義書](./docs/requirements.md) - システムの全体要件
- [開発進捗サマリー](./PROGRESS-SUMMARY.md) - 実装済み機能の一覧

### セットアップガイド
- [完全セットアップガイド](./docs/COMPLETE-SETUP-GUIDE.md) - 総合セットアップ手順
- [Supabaseセットアップガイド](./docs/setup-supabase.md) - Supabase基本設定
- [Storageセットアップガイド](./docs/STORAGE-SETUP-GUIDE.md) - 画像ストレージ設定
- [Realtimeセットアップガイド](./docs/REALTIME-SETUP-GUIDE.md) - リアルタイム機能設定
- [PWAセットアップガイド](./docs/PWA-SETUP-GUIDE.md) - PWA機能設定

### 開発ガイド
- [エラーハンドリングガイド](./docs/ERROR-HANDLING-GUIDE.md) - エラー処理とユーザーフィードバック

### デプロイ
- [Vercelデプロイガイド](./docs/vercel-deployment.md) - 本番環境へのデプロイ

## 🧪 テスト

```bash
# 単体テスト
npm run test

# E2Eテスト
npm run test:e2e
```

## 🚢 デプロイ

### Vercelへのデプロイ

1. Vercelアカウントを作成
2. GitHubリポジトリを接続
3. 環境変数を設定
4. デプロイ

詳細は [Vercelデプロイガイド](./docs/vercel-deployment.md) を参照

## 🤝 コントリビューション

プルリクエストを歓迎します。大きな変更の場合は、まずIssueを開いて変更内容を議論してください。

## 📄 ライセンス

[MIT](./LICENSE)

## 👥 作成者

- **開発者**: NANGOU
- **メール**: saablow@yahoo.co.jp

## 🙏 謝辞

- [Supabase](https://supabase.com/) - バックエンドインフラ
- [Next.js](https://nextjs.org/) - フロントエンドフレームワーク
- [shadcn/ui](https://ui.shadcn.com/) - UIコンポーネント
- [Vercel](https://vercel.com/) - ホスティング

## 📞 サポート

問題が発生した場合は、以下の方法でサポートを受けられます:

- [GitHub Issues](https://github.com/your-repo/issues)
- メール: saablow@yahoo.co.jp

---

**バージョン**: 2.0.0 (Supabase移行版)  
**最終更新**: 2026年2月10日
