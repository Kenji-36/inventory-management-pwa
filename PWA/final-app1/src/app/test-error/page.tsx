'use client';

import * as Sentry from '@sentry/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorBoundaryTest } from '@/components/error-boundary-test';
import { ErrorTrigger } from './error-trigger';

export default function TestErrorPage() {
  const throwErrorDirect = () => {
    // エラーを直接Sentryに送信（エラーページは表示されない）
    const error = new Error('[TEST-2] 直接送信テストエラー');
    Sentry.captureException(error, {
      tags: {
        test_type: 'direct_send',
        test_number: '2'
      },
      level: 'error'
    });
    console.log('✅ [TEST-2] エラーをSentryに送信しました');
    alert('✅ エラーをSentryに送信しました\n\nブラウザのコンソールとSentry Dashboardを確認してください');
  };

  const captureMessage = () => {
    Sentry.captureMessage('[TEST-3] テストメッセージ - 情報送信テスト', {
      level: 'info',
      tags: {
        test_type: 'message',
        test_number: '3'
      }
    });
    console.log('✅ [TEST-3] メッセージをSentryに送信しました');
    alert('✅ メッセージをSentryに送信しました\n\nブラウザのコンソールとSentry Dashboardを確認してください');
  };

  const captureException = () => {
    try {
      throw new Error('[TEST-4] 手動キャプチャエラー - try-catchテスト');
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          test_type: 'try_catch',
          test_number: '4'
        },
        level: 'warning'
      });
      console.log('✅ [TEST-4] エラーをSentryに送信しました');
      alert('✅ エラーをSentryに送信しました\n\nブラウザのコンソールとSentry Dashboardを確認してください');
    }
  };

  const testApiError = async () => {
    try {
      // 存在しないAPIエンドポイントを呼び出してエラーを発生させる
      const response = await fetch('/api/test-sentry-error-endpoint-' + Date.now());
      if (!response.ok) {
        throw new Error('[TEST-5] APIエラーテスト - 404 Not Found');
      }
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          test_type: 'api_error',
          test_number: '5'
        },
        level: 'error'
      });
      console.log('✅ [TEST-5] APIエラーをSentryに送信しました');
      alert('✅ APIエラーをSentryに送信しました\n\nブラウザのコンソールとSentry Dashboardを確認してください');
    }
  };

  return (
    <ErrorBoundaryTest>
      <div className="container mx-auto p-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Sentry エラー監視テスト</CardTitle>
            <CardDescription>
              各ボタンをクリックして、Sentryにエラーが送信されることを確認してください
            </CardDescription>
            <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
              <p><strong>Sentry DSN:</strong> {process.env.NEXT_PUBLIC_SENTRY_DSN ? '✅ 設定済み' : '❌ 未設定'}</p>
              <p><strong>環境:</strong> {process.env.NODE_ENV}</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">1. エラーを発生させる（推奨）</h3>
              <p className="text-sm text-gray-600 mb-3">
                実際のエラーを発生させて、エラーバウンダリーとSentryの動作を確認します
              </p>
              <ErrorTrigger />
            </div>

            <div>
              <h3 className="font-semibold mb-2">2. エラーを直接送信</h3>
              <p className="text-sm text-gray-600 mb-3">
                エラーページを表示せずに、Sentryにエラーを送信します
              </p>
              <Button onClick={throwErrorDirect} variant="destructive" className="w-full">
                📤 エラーを直接送信
              </Button>
            </div>

          <div>
            <h3 className="font-semibold mb-2">3. メッセージを送信</h3>
            <p className="text-sm text-gray-600 mb-3">
              情報メッセージをSentryに送信します（エラーではありません）
            </p>
            <Button onClick={captureMessage} variant="outline" className="w-full">
              📝 メッセージを送信
            </Button>
          </div>

          <div>
            <h3 className="font-semibold mb-2">4. エラーを手動キャプチャ</h3>
            <p className="text-sm text-gray-600 mb-3">
              try-catchでエラーをキャプチャしてSentryに送信します
            </p>
            <Button onClick={captureException} variant="secondary" className="w-full">
              ⚠️ エラーをキャプチャ
            </Button>
          </div>

          <div>
            <h3 className="font-semibold mb-2">5. APIエラーをテスト</h3>
            <p className="text-sm text-gray-600 mb-3">
              API呼び出しエラーをSentryに送信します
            </p>
            <Button onClick={testApiError} variant="outline" className="w-full">
              🌐 APIエラーをテスト
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

          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <h4 className="font-semibold text-yellow-900 mb-2">💡 各テストの違い</h4>
            <ul className="text-sm text-yellow-800 space-y-2">
              <li><strong>1. エラーを発生させる:</strong> エラーバウンダリーが動作し、画面が切り替わります</li>
              <li><strong>2. エラーを直接送信:</strong> 画面は変わらず、Sentryにのみ送信されます</li>
              <li><strong>3. メッセージを送信:</strong> エラーではない情報メッセージを送信します</li>
              <li><strong>4. エラーをキャプチャ:</strong> try-catchでエラーを処理してSentryに送信します</li>
              <li><strong>5. APIエラーをテスト:</strong> API呼び出しのエラーをSentryに送信します</li>
            </ul>
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
    </ErrorBoundaryTest>
  );
}
