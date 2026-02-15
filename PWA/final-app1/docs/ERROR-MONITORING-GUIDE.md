# エラー監視・ログ管理ガイド

## 📚 はじめに

このガイドでは、本番環境で発生するエラーを早期に発見し、対応するための監視システムを構築します。

---

## 🎯 このガイドで実現すること

1. **エラートラッキング**: Sentryでエラーを自動収集
2. **アクセス解析**: Vercel Analyticsでユーザー行動を把握
3. **パフォーマンス監視**: ページ読み込み速度を監視
4. **通知設定**: エラー発生時にメール通知

---

## 📖 エラー監視とは？

### なぜ必要？

**開発環境では気づかないエラーが本番環境で発生する**ことがあります：

- 特定のブラウザでのみ発生するエラー
- 特定の操作順序で発生するエラー
- ネットワーク環境に依存するエラー
- ユーザーの環境（デバイス、OS）に依存するエラー

### エラー監視システムの役割

```
ユーザーがエラーに遭遇
  ↓
エラーが自動的にSentryに送信
  ↓
開発者にメール/Slack通知
  ↓
エラーの詳細（スタックトレース、ブラウザ情報等）を確認
  ↓
迅速に修正
```

---

## 🛠️ 必要な準備

- [x] Vercelアカウント（既に作成済み）
- [x] GitHubリポジトリ（既に作成済み）
- [ ] Sentryアカウント（これから作成）

---

## ステップ1: Sentryアカウントの作成

### 1-1. Sentryサイトにアクセス

1. https://sentry.io にアクセス
2. **Sign Up** をクリック
3. GitHubアカウントで登録（推奨）
   - **Continue with GitHub** をクリック
   - GitHubの認証を許可

### 1-2. プロジェクトを作成

1. **Create a new project** をクリック
2. プラットフォームを選択:
   - **Next.js** を選択
3. プロジェクト名を入力:
   - `inventory-management-pwa`
4. **Create Project** をクリック

### 1-3. DSN（Data Source Name）を取得

プロジェクト作成後、以下の情報が表示されます：

```
SENTRY_DSN=https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@o1234567.ingest.sentry.io/1234567
```

この値を**メモ帳にコピー**してください（後で使用します）

---

## ステップ2: Sentryパッケージのインストール

### 2-1. Sentryパッケージをインストール

ターミナルで以下のコマンドを実行：

```bash
npm install @sentry/nextjs
```

### 2-2. Sentry初期化ウィザードを実行

```bash
npx @sentry/wizard@latest -i nextjs
```

ウィザードが以下を自動的に行います：
- 設定ファイルの作成
- 環境変数の設定
- next.config.tsの更新

**質問が表示されたら**:
1. "Do you already have a Sentry account?" → **Yes**
2. "Login to Sentry" → ブラウザが開くのでログイン
3. プロジェクトを選択 → `inventory-management-pwa`
4. 設定を確認 → **Enter** で続行

---

## ステップ3: 環境変数の設定

### 3-1. ローカル環境（.env.local）

`.env.local` ファイルに以下を追加：

```env
# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://xxxxxxxx@o1234567.ingest.sentry.io/1234567
SENTRY_AUTH_TOKEN=your-auth-token-here
```

### 3-2. Vercel環境

1. Vercel Dashboardを開く
   ```
   https://vercel.com/kenji-36/inventory-management-pwa/settings/environment-variables
   ```

2. 以下の環境変数を追加:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SENTRY_DSN` | Sentryから取得したDSN |
| `SENTRY_AUTH_TOKEN` | Sentryから取得したAuth Token |

3. **Save** をクリック

---

## ステップ4: Sentryの設定ファイルを確認

ウィザードが自動的に以下のファイルを作成します：

### sentry.client.config.ts
```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // エラーのサンプリングレート（100% = 全エラーを送信）
  tracesSampleRate: 1.0,
  
  // デバッグモード（開発時のみ有効）
  debug: false,
  
  // エラーの再現に役立つ情報を収集
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
});
```

### sentry.server.config.ts
```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  debug: false,
});
```

### sentry.edge.config.ts
```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  debug: false,
});
```

---

## ステップ5: エラーハンドリングの実装

### 5-1. グローバルエラーページの作成

`src/app/error.tsx` を作成（既に存在する場合は更新）：

```typescript
'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // エラーをSentryに送信
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">エラーが発生しました</h2>
        <p className="text-gray-600 mb-6">
          申し訳ございません。予期しないエラーが発生しました。
        </p>
        <Button onClick={reset}>再試行</Button>
      </div>
    </div>
  );
}
```

### 5-2. APIエラーハンドリングの追加

既存のAPIルートにエラーハンドリングを追加：

```typescript
// 例: src/app/api/products/route.ts
import * as Sentry from '@sentry/nextjs';

export async function GET() {
  try {
    // 既存のコード
    const { data, error } = await supabaseServer
      .from('products')
      .select('*');
    
    if (error) {
      // Supabaseエラーを記録
      Sentry.captureException(error);
      throw error;
    }
    
    return NextResponse.json({ data });
  } catch (error) {
    // 予期しないエラーを記録
    Sentry.captureException(error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
```

---

## ステップ6: Vercel Analyticsの有効化

### 6-1. Vercel Analyticsパッケージをインストール

```bash
npm install @vercel/analytics
```

### 6-2. Analyticsコンポーネントを追加

`src/app/layout.tsx` を更新：

```typescript
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### 6-3. Vercel Dashboardで有効化

1. Vercel Dashboardを開く
   ```
   https://vercel.com/kenji-36/inventory-management-pwa/analytics
   ```

2. **Enable Analytics** をクリック

---

## ステップ7: テストエラーの送信

### 7-1. テストボタンの作成

開発環境でエラーが正しく送信されるかテスト：

`src/app/test-error/page.tsx` を作成：

```typescript
'use client';

import * as Sentry from '@sentry/nextjs';
import { Button } from '@/components/ui/button';

export default function TestErrorPage() {
  const throwError = () => {
    throw new Error('これはテストエラーです');
  };

  const captureMessage = () => {
    Sentry.captureMessage('テストメッセージ', 'info');
    alert('メッセージをSentryに送信しました');
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Sentryテスト</h1>
      <div className="space-y-4">
        <Button onClick={throwError}>
          エラーを発生させる
        </Button>
        <Button onClick={captureMessage} variant="outline">
          メッセージを送信
        </Button>
      </div>
    </div>
  );
}
```

### 7-2. テストの実行

1. 開発サーバーを起動
   ```bash
   npm run dev
   ```

2. ブラウザで以下にアクセス
   ```
   http://localhost:3000/test-error
   ```

3. **「エラーを発生させる」** ボタンをクリック

4. Sentry Dashboardを確認
   ```
   https://sentry.io/organizations/your-org/issues/
   ```

5. エラーが表示されることを確認 ✅

---

## ステップ8: 通知設定

### 8-1. メール通知の設定

1. Sentry Dashboardを開く
2. **Settings** → **Notifications**
3. **Email** を有効化
4. 通知頻度を設定:
   - **Immediately**: エラー発生時に即座に通知
   - **Daily Summary**: 1日1回まとめて通知

### 8-2. Slack通知の設定（オプション）

1. Sentry Dashboardで **Settings** → **Integrations**
2. **Slack** を検索
3. **Install** をクリック
4. Slackワークスペースを選択
5. 通知先チャンネルを設定

---

## ステップ9: パフォーマンス監視の設定

### 9-1. Sentryでのパフォーマンストラッキング

既に設定済み（`tracesSampleRate: 1.0`）

### 9-2. 監視する項目

- **ページ読み込み時間**
- **APIレスポンス時間**
- **データベースクエリ時間**

### 9-3. Sentry Dashboardで確認

```
https://sentry.io/organizations/your-org/performance/
```

---

## ステップ10: デプロイと動作確認

### 10-1. 変更をコミット＆プッシュ

```bash
git add .
git commit -m "feat: add Sentry error monitoring and Vercel Analytics"
git push origin main
```

### 10-2. Vercelで自動デプロイ

Vercelが自動的にデプロイを開始します。

### 10-3. 本番環境でテスト

1. 本番URLにアクセス
   ```
   https://inventory-management-pwa.vercel.app/test-error
   ```

2. エラーを発生させる

3. Sentryでエラーを確認

---

## 📊 監視ダッシュボードの見方

### Sentry Dashboard

```
https://sentry.io/organizations/your-org/issues/
```

**表示される情報**:
- エラーの種類と発生回数
- 影響を受けたユーザー数
- エラーのスタックトレース
- ブラウザ・OS情報
- ユーザーの操作履歴

### Vercel Analytics

```
https://vercel.com/kenji-36/inventory-management-pwa/analytics
```

**表示される情報**:
- ページビュー数
- ユニークビジター数
- 人気のページ
- 平均滞在時間

---

## 🐛 トラブルシューティング

### エラー1: Sentryにエラーが送信されない

**原因**: DSNが正しく設定されていない  
**解決**:
1. `.env.local` の `NEXT_PUBLIC_SENTRY_DSN` を確認
2. Vercelの環境変数を確認
3. 開発サーバーを再起動

### エラー2: ビルドエラーが発生

**原因**: Sentry設定ファイルの構文エラー  
**解決**:
1. `sentry.client.config.ts` の構文を確認
2. `next.config.ts` の設定を確認

### エラー3: Analyticsが表示されない

**原因**: Vercel Analyticsが有効化されていない  
**解決**:
1. Vercel Dashboardで Analytics を有効化
2. `@vercel/analytics` パッケージがインストールされているか確認

---

## ✅ チェックリスト

完了したらチェックを入れましょう：

- [ ] Sentryアカウント作成
- [ ] Sentryプロジェクト作成
- [ ] Sentryパッケージインストール
- [ ] 環境変数設定（ローカル＆Vercel）
- [ ] エラーハンドリング実装
- [ ] Vercel Analyticsインストール
- [ ] テストエラー送信確認
- [ ] 通知設定
- [ ] 本番環境デプロイ
- [ ] 本番環境動作確認

---

## 📈 期待される効果

1. **エラーの早期発見**: ユーザーが報告する前に発見
2. **迅速な対応**: エラーの詳細情報から原因を特定
3. **ユーザー体験の向上**: エラーを減らし、満足度向上
4. **データに基づく改善**: アクセス解析から改善点を発見

---

**作成日**: 2026年2月13日  
**対象プロジェクト**: 在庫注文管理システム（PWA）
