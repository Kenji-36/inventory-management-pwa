'use client';

import * as Sentry from '@sentry/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestErrorPage() {
  const throwError = () => {
    throw new Error('これはテストエラーです - Sentry動作確認用');
  };

  const captureMessage = () => {
    Sentry.captureMessage('テストメッセージ - Sentry動作確認', 'info');
    alert('✅ メッセージをSentryに送信しました\n\nSentry Dashboardで確認してください');
  };

  const captureException = () => {
    try {
      throw new Error('手動でキャプチャしたエラー');
    } catch (error) {
      Sentry.captureException(error);
      alert('✅ エラーをSentryに送信しました\n\nSentry Dashboardで確認してください');
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Sentry エラー監視テスト</CardTitle>
          <CardDescription>
            各ボタンをクリックして、Sentryにエラーが送信されることを確認してください
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">1. エラーを発生させる（推奨）</h3>
            <p className="text-sm text-gray-600 mb-3">
              実際のエラーを発生させて、エラーページとSentryの動作を確認します
            </p>
            <Button onClick={throwError} variant="destructive" className="w-full">
              🚨 エラーを発生させる
            </Button>
          </div>

          <div>
            <h3 className="font-semibold mb-2">2. メッセージを送信</h3>
            <p className="text-sm text-gray-600 mb-3">
              情報メッセージをSentryに送信します（エラーではありません）
            </p>
            <Button onClick={captureMessage} variant="outline" className="w-full">
              📝 メッセージを送信
            </Button>
          </div>

          <div>
            <h3 className="font-semibold mb-2">3. エラーを手動キャプチャ</h3>
            <p className="text-sm text-gray-600 mb-3">
              エラーを発生させずに、Sentryにエラー情報を送信します
            </p>
            <Button onClick={captureException} variant="secondary" className="w-full">
              ⚠️ エラーをキャプチャ
            </Button>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">📊 確認方法</h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>ボタンをクリック</li>
              <li>Sentry Dashboard を開く</li>
              <li>「Issues」タブでエラーを確認</li>
              <li>エラーの詳細（スタックトレース等）を確認</li>
            </ol>
          </div>

          <div className="mt-4">
            <Button
              onClick={() => window.location.href = '/'}
              variant="ghost"
              className="w-full"
            >
              ← ホームに戻る
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
