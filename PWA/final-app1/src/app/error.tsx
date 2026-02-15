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
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">
          エラーが発生しました
        </h2>
        <p className="text-gray-600 mb-6">
          申し訳ございません。予期しないエラーが発生しました。
          <br />
          問題が解決しない場合は、管理者にお問い合わせください。
        </p>
        <div className="space-y-3">
          <Button onClick={reset} className="w-full">
            再試行
          </Button>
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
            className="w-full"
          >
            ホームに戻る
          </Button>
        </div>
        {error.digest && (
          <p className="mt-4 text-xs text-gray-400">
            エラーID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
