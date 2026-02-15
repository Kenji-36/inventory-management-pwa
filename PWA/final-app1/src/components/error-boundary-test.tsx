'use client';

import React, { Component, ReactNode } from 'react';
import * as Sentry from '@sentry/nextjs';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundaryTest extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // エラーをSentryに送信
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
          <div className="text-center max-w-md">
            <h2 className="text-2xl font-bold mb-4 text-red-600">
              ✅ エラーが発生しました！
            </h2>
            <p className="text-gray-600 mb-4">
              エラーがSentryに送信されました。
            </p>
            <p className="text-sm text-gray-500 mb-6 p-4 bg-gray-100 rounded">
              {this.state.error?.message}
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="w-full"
              >
                リセット
              </Button>
              <Button
                onClick={() => window.location.href = '/test-error'}
                variant="outline"
                className="w-full"
              >
                テストページに戻る
              </Button>
            </div>
            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">
                ✅ Sentryが正常に動作しています！<br />
                Sentry Dashboardの「Issues」タブでエラーを確認してください。
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
