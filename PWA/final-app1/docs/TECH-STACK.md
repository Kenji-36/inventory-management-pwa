# 技術スタック

## プロジェクト概要

在庫注文管理システム（PWA）で使用している技術スタックの一覧です。

---

## 🛠️ 技術スタック

### **フロントエンド**

| 技術 | バージョン | 用途 |
|------|----------|------|
| **Next.js** | 14 (App Router) | Reactフレームワーク、SSR/SSG |
| **React** | 18+ | UIライブラリ |
| **TypeScript** | 5+ | 型安全な開発 |
| **Tailwind CSS** | 3+ | ユーティリティファーストCSS |
| **shadcn/ui** | - | UIコンポーネントライブラリ |
| **Recharts** | 2+ | グラフ・チャート描画 |
| **html5-qrcode** | 2+ | バーコード/QRコードスキャン |
| **React Hook Form** | 7+ | フォーム管理 |
| **Zod** | 3+ | スキーマバリデーション |

### **バックエンド・データベース**

| 技術 | 用途 |
|------|------|
| **Supabase** | BaaS（Backend as a Service） |
| **PostgreSQL** | リレーショナルデータベース（Supabase） |
| **Supabase Auth** | 認証システム（Google OAuth） |
| **Supabase Storage** | 画像ストレージ |
| **Supabase Realtime** | リアルタイムデータ同期 |
| **Row Level Security (RLS)** | データベースセキュリティ |

### **認証**

| 技術 | 用途 |
|------|------|
| **Supabase Auth** | 認証基盤 |
| **Google OAuth 2.0** | ソーシャルログイン |
| **@supabase/ssr** | Cookieベースのセッション管理 |
| **PKCE Flow** | セキュアな認証フロー |

### **API・通信**

| 技術 | 用途 |
|------|------|
| **Next.js API Routes** | サーバーサイドAPI |
| **@supabase/supabase-js** | Supabaseクライアント |
| **Fetch API** | HTTP通信 |

### **テスト**

| 技術 | 用途 |
|------|------|
| **Jest** | 単体・統合テストフレームワーク |
| **React Testing Library** | Reactコンポーネントテスト |
| **@testing-library/jest-dom** | DOM matcher拡張 |
| **@testing-library/user-event** | ユーザーインタラクションテスト |
| **Playwright** | E2Eテストフレームワーク |
| **jest-environment-jsdom** | Jest用DOM環境 |

#### テストカバレッジ
- ✅ 単体テスト: バリデーション関数
- ✅ 統合テスト: API、在庫管理シナリオ
- ✅ コンポーネントテスト: Button、Card
- ✅ E2Eテスト: ログイン、在庫管理ページ
- ✅ パフォーマンステスト: データ処理、CSV、メモリ

**テスト結果**: 全41テスト成功、E2Eテスト5件成功

### **セキュリティ**

| 技術 | 用途 |
|------|------|
| **Upstash Redis** | レート制限（本番環境） |
| **CSP (Content Security Policy)** | XSS対策 |
| **CORS** | クロスオリジン制御 |
| **HTTPS/TLS** | 通信暗号化 |
| **Row Level Security** | データベースアクセス制御 |
| **HSTS** | HTTPSの強制 |
| **X-Frame-Options** | クリックジャッキング対策 |
| **X-Content-Type-Options** | MIMEタイプスニッフィング対策 |

### **PWA（Progressive Web App）**

| 技術 | 用途 |
|------|------|
| **Service Worker** | オフライン対応、キャッシュ |
| **Web App Manifest** | PWA設定（アイコン、名前、色） |
| **Workbox** | Service Worker管理 |
| **Cache API** | リソースキャッシュ |

### **開発ツール**

| 技術 | 用途 |
|------|------|
| **ESLint** | コード品質チェック |
| **Prettier** | コードフォーマット |
| **Git** | バージョン管理 |
| **GitHub** | コードホスティング |
| **npm** | パッケージ管理 |
| **TypeScript Compiler** | 型チェック |

### **デプロイ・ホスティング**

| 技術 | 用途 |
|------|------|
| **Vercel** | ホスティング・デプロイ |
| **GitHub Actions** | CI/CD（推奨） |
| **Vercel Analytics** | アクセス解析（オプション） |
| **Vercel Edge Network** | CDN・グローバル配信 |

### **その他のライブラリ**

| ライブラリ | 用途 |
|----------|------|
| **clsx** | 条件付きクラス名管理 |
| **tailwind-merge** | Tailwindクラスのマージ |
| **date-fns** | 日付操作 |
| **lucide-react** | アイコンライブラリ |
| **react-dropzone** | ファイルアップロードUI |
| **papaparse** | CSVパース |
| **class-variance-authority** | バリアントベースのスタイリング |

### **開発環境**

| 技術 | バージョン | 用途 |
|------|----------|------|
| **Node.js** | 18+ | JavaScript実行環境 |
| **VS Code (Cursor)** | - | コードエディタ |
| **Chrome DevTools** | - | デバッグ |
| **Supabase CLI** | - | Supabase管理 |
| **Windows** | - | 開発OS |

---

## 📊 アーキテクチャ構成

```
┌─────────────────────────────────────────────────────┐
│              クライアント (Browser)                  │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │  Next.js 14 (App Router)                      │ │
│  │  React 18 + TypeScript                        │ │
│  │  Tailwind CSS + shadcn/ui                     │ │
│  │  PWA (Service Worker + Manifest)              │ │
│  └───────────────────────────────────────────────┘ │
└─────────────────┬───────────────────────────────────┘
                  │
                  │ HTTPS (Vercel Edge Network)
                  │
┌─────────────────▼───────────────────────────────────┐
│              Vercel (Hosting)                       │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │  Next.js API Routes                           │ │
│  │  Middleware (認証・レート制限)                 │ │
│  │  セキュリティヘッダー (CSP, CORS, HSTS)        │ │
│  └───────────────────────────────────────────────┘ │
└─────────────────┬───────────────────────────────────┘
                  │
                  │ Supabase Client SDK
                  │
┌─────────────────▼───────────────────────────────────┐
│              Supabase (BaaS)                        │
│                                                     │
│  ┌─────────────────────────────────────┐           │
│  │  PostgreSQL (Database)              │           │
│  │  - products テーブル                │           │
│  │  - stock テーブル                   │           │
│  │  - orders テーブル                  │           │
│  │  - order_details テーブル           │           │
│  │  - users テーブル                   │           │
│  │  - Row Level Security (RLS)         │           │
│  └─────────────────────────────────────┘           │
│                                                     │
│  ┌─────────────────────────────────────┐           │
│  │  Supabase Auth                      │           │
│  │  - Google OAuth 2.0                 │           │
│  │  - PKCE Flow                        │           │
│  │  - Cookie-based Session             │           │
│  └─────────────────────────────────────┘           │
│                                                     │
│  ┌─────────────────────────────────────┐           │
│  │  Supabase Storage                   │           │
│  │  - product-images バケット          │           │
│  │  - 画像アップロード/削除            │           │
│  └─────────────────────────────────────┘           │
│                                                     │
│  ┌─────────────────────────────────────┐           │
│  │  Supabase Realtime                  │           │
│  │  - WebSocket接続                    │           │
│  │  - リアルタイムデータ同期           │           │
│  └─────────────────────────────────────┘           │
└─────────────────────────────────────────────────────┘
```

---

## 🔐 セキュリティ対策

### 実装済みセキュリティ機能

1. **認証・認可**
   - Supabase Auth（Google OAuth）
   - Cookie-based セッション管理
   - PKCE Flow（認証コード横取り対策）
   - Row Level Security（RLS）

2. **API保護**
   - 全APIルートで認証チェック
   - レート制限（Upstash Redis）
   - CORS設定

3. **セキュリティヘッダー**
   - Content-Security-Policy (CSP)
   - X-Frame-Options
   - X-Content-Type-Options
   - X-XSS-Protection
   - Referrer-Policy
   - HSTS

4. **入力検証**
   - クライアントサイド検証（Zod）
   - サーバーサイド検証
   - データベース制約（PostgreSQL）
   - XSS対策（サニタイゼーション）

5. **ファイルアップロード**
   - ファイルサイズ制限（5MB）
   - MIMEタイプ検証
   - ファイル拡張子検証
   - 認証済みユーザーのみアップロード可能

---

## 📦 主要な依存パッケージ

### プロダクション依存

```json
{
  "next": "^14.0.0",
  "react": "^18.0.0",
  "react-dom": "^18.0.0",
  "@supabase/supabase-js": "^2.0.0",
  "@supabase/ssr": "^0.0.10",
  "tailwindcss": "^3.0.0",
  "recharts": "^2.0.0",
  "html5-qrcode": "^2.0.0",
  "zod": "^3.0.0",
  "react-hook-form": "^7.0.0",
  "lucide-react": "^0.0.0",
  "date-fns": "^2.0.0"
}
```

### 開発依存

```json
{
  "typescript": "^5.0.0",
  "@types/react": "^18.0.0",
  "@types/node": "^20.0.0",
  "eslint": "^8.0.0",
  "jest": "^29.0.0",
  "@testing-library/react": "^14.0.0",
  "@testing-library/jest-dom": "^6.0.0",
  "@playwright/test": "^1.0.0",
  "jest-environment-jsdom": "^29.0.0"
}
```

---

## 🚀 パフォーマンス最適化

### 実装済み最適化

1. **画像最適化**
   - Next.js Image コンポーネント
   - 遅延読み込み（Lazy Loading）
   - WebP形式サポート

2. **コード分割**
   - Next.js 自動コード分割
   - 動的インポート（Dynamic Import）

3. **キャッシュ戦略**
   - Service Worker キャッシュ
   - Supabase クエリキャッシュ
   - Vercel Edge Cache

4. **データベース最適化**
   - インデックス作成
   - 効率的なクエリ設計
   - リアルタイム更新（必要時のみ）

---

## 📱 PWA機能

### 実装済みPWA機能

- ✅ インストール可能（Add to Home Screen）
- ✅ オフライン対応（Service Worker）
- ✅ プッシュ通知対応（基盤のみ）
- ✅ アプリアイコン（複数サイズ）
- ✅ スプラッシュスクリーン
- ✅ レスポンシブデザイン

---

## 🔗 関連ドキュメント

- [要件定義書](./requirements.md)
- [テスト結果レポート](./TEST-RESULTS.md)
- [Supabaseセットアップガイド](./setup-supabase.md)
- [Vercelデプロイガイド](./vercel-deployment.md)
- [セキュリティ分析レポート](./security-analysis.md)

---

## 📝 バージョン履歴

| バージョン | 日付 | 変更内容 |
|-----------|------|----------|
| 1.0 | 2026/02/13 | 初版作成 |

---

**作成日**: 2026年2月13日  
**プロジェクト**: 在庫注文管理システム（PWA）
