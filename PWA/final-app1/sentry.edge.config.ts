import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // エラーのサンプリングレート
  tracesSampleRate: 1.0,

  // デバッグモード
  debug: false,

  // 環境の設定
  environment: process.env.NODE_ENV,
});
