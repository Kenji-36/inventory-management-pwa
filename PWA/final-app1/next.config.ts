import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";
import { withSentryConfig } from "@sentry/nextjs";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
  fallbacks: {
    document: "/offline",
  },
});

const nextConfig: NextConfig = {
  // Turbopack設定（Next.js 16対応）
  turbopack: {},

  // Sentry用のinstrumentationを有効化（Next.js 16ではデフォルトで有効）
  // experimental: {
  //   instrumentationHook: true,
  // },

  // 外部画像の許可（Supabase Storage）- 環境変数から動的に取得
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'rboyrpltnaxcbqhrimwr.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  // セキュリティヘッダー
  async headers() {
    // Supabase URLからホスト名を取得
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rboyrpltnaxcbqhrimwr.supabase.co';
    const supabaseHost = new URL(supabaseUrl).hostname;

    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=()",
          },
          {
            // Content Security Policy - XSS防御の中核
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              `img-src 'self' https://${supabaseHost} data: blob:`,
              `connect-src 'self' https://${supabaseHost} wss://${supabaseHost} https://accounts.google.com https://www.googleapis.com`,
              "font-src 'self' data:",
              "frame-src 'self' https://accounts.google.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'",
            ].join("; "),
          },
        ],
      },
      {
        // APIルートにCORS制限を設定
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: process.env.NEXT_PUBLIC_APP_URL || "https://inventory-management-pwa.vercel.app",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
          {
            key: "Access-Control-Max-Age",
            value: "86400",
          },
        ],
      },
    ];
  },
};

// Sentry設定でラップ（環境変数が設定されている場合のみ）
const config = withPWA(nextConfig);

// Sentryが有効な場合のみSentry設定を適用
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  module.exports = withSentryConfig(config, {
    // Sentry組織とプロジェクト
    org: process.env.SENTRY_ORG || "kenji-lf",
    project: process.env.SENTRY_PROJECT || "inventory-management-pwa",

    // ビルドログを抑制（CIでは表示）
    silent: !process.env.CI,

    // ソースマップのアップロード設定
    widenClientFileUpload: true,

    // 広告ブロッカー回避のためのトンネルルート
    tunnelRoute: "/monitoring",

    // ソースマップの設定
    sourcemaps: {
      disable: false, // ソースマップを有効化
    },
  });
} else {
  module.exports = config;
}

export default module.exports;
