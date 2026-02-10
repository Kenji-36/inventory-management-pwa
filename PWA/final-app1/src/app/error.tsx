"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // エラーをログに記録
    console.error("Application Error:", error);
    
    // TODO: 本番環境では外部ログサービスに送信
    // logError("global-error", error, { digest: error.digest });
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-0 shadow-2xl">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-100 to-rose-100 flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            エラーが発生しました
          </h1>
          
          <p className="text-gray-600 mb-6">
            申し訳ございません。予期しないエラーが発生しました。
            <br />
            もう一度お試しください。
          </p>

          {process.env.NODE_ENV === "development" && (
            <div className="mb-6 p-4 bg-gray-100 rounded-lg text-left">
              <p className="text-xs font-mono text-gray-700 break-all">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-xs text-gray-500 mt-2">
                  Digest: {error.digest}
                </p>
              )}
            </div>
          )}

          <div className="space-y-3">
            <Button onClick={reset} className="w-full gap-2">
              <RefreshCw className="w-4 h-4" />
              再試行
            </Button>
            
            <Link href="/" className="block">
              <Button variant="outline" className="w-full gap-2">
                <Home className="w-4 h-4" />
                ホームに戻る
              </Button>
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t">
            <p className="text-sm text-gray-500">
              問題が解決しない場合は、ページをリロードするか、
              <br />
              管理者にお問い合わせください。
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
