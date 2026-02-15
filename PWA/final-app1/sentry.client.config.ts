import * as Sentry from "@sentry/nextjs";

// DSNが設定されている場合のみSentryを初期化
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // エラーのサンプリングレート（100% = 全エラーを送信）
    tracesSampleRate: 1.0,

    // デバッグモード（開発時のみ有効）
    debug: false,

    // エラーの再現に役立つ情報を収集
    replaysOnErrorSampleRate: 1.0,
    
    // セッションリプレイのサンプリングレート（10%のセッションを記録）
    replaysSessionSampleRate: 0.1,

    // 環境の設定
    environment: process.env.NODE_ENV,

    // リリースバージョンの設定
    release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
  });
}
