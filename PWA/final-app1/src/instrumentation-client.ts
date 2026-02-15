// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || "https://8a0cb5e15ed2e68343e6515ee771a6f3@o4510887920074752.ingest.us.sentry.io/4510887931543552";

Sentry.init({
  dsn: SENTRY_DSN,

  // Add optional integrations for additional features
  integrations: [Sentry.replayIntegration()],

  // 全エラーを送信（本番環境では調整推奨）
  tracesSampleRate: 1,

  // ログをSentryに送信
  enableLogs: true,

  // セッションリプレイのサンプリングレート（10%）
  replaysSessionSampleRate: 0.1,

  // エラー発生時のリプレイサンプリングレート（100%）
  replaysOnErrorSampleRate: 1.0,

  // PII送信を無効化（セキュリティ）
  sendDefaultPii: false,

  // 環境設定
  environment: process.env.NODE_ENV,

  // デバッグモード（開発環境のみ）
  debug: process.env.NODE_ENV === 'development',

  // イベント送信前のフック（デバッグ用）
  beforeSend(event) {
    console.log('[Sentry] Sending event:', event.event_id, event.message || event.exception?.values?.[0]?.value);
    return event;
  },
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
