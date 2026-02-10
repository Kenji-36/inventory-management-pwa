/**
 * エラーハンドリングユーティリティ
 */

import { NextResponse } from "next/server";

/**
 * 本番環境かどうかを判定
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * エラーレスポンスを生成
 * 本番環境では詳細なエラーメッセージを隠す
 */
export function errorResponse(
  error: unknown,
  defaultMessage: string = "エラーが発生しました",
  statusCode: number = 500
): NextResponse {
  // エラーログを記録
  console.error("API Error:", error);

  // 本番環境では一般的なメッセージのみ返す
  if (isProduction()) {
    return NextResponse.json(
      {
        success: false,
        error: defaultMessage,
        timestamp: new Date().toISOString(),
      },
      { status: statusCode }
    );
  }

  // 開発環境では詳細なエラー情報を返す
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  return NextResponse.json(
    {
      success: false,
      error: errorMessage,
      stack: errorStack,
      timestamp: new Date().toISOString(),
    },
    { status: statusCode }
  );
}

/**
 * バリデーションエラーレスポンス
 */
export function validationErrorResponse(
  errors: string[] | Record<string, string>
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: "入力値が不正です",
      validationErrors: errors,
      timestamp: new Date().toISOString(),
    },
    { status: 400 }
  );
}

/**
 * 認証エラーレスポンス
 */
export function unauthorizedResponse(
  message: string = "認証が必要です"
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
    },
    { status: 401 }
  );
}

/**
 * 権限エラーレスポンス
 */
export function forbiddenResponse(
  message: string = "この操作を実行する権限がありません"
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
    },
    { status: 403 }
  );
}

/**
 * リソースが見つからないエラーレスポンス
 */
export function notFoundResponse(
  resource: string = "リソース"
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: `${resource}が見つかりません`,
      timestamp: new Date().toISOString(),
    },
    { status: 404 }
  );
}

/**
 * エラーをログに記録
 */
export function logError(
  context: string,
  error: unknown,
  additionalInfo?: Record<string, any>
): void {
  const timestamp = new Date().toISOString();
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  console.error({
    timestamp,
    context,
    error: errorMessage,
    stack: errorStack,
    ...additionalInfo,
  });

  // TODO: 本番環境では外部ログサービス（Sentry, LogRocket等）に送信
}
