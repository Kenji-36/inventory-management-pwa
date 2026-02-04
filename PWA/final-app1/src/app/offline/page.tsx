"use client";

import { WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
            <WifiOff className="w-10 h-10 text-gray-400" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            オフラインです
          </h1>
          
          <p className="text-gray-600 mb-6">
            インターネットに接続されていません。
            <br />
            接続を確認して、もう一度お試しください。
          </p>

          <div className="space-y-3">
            <Button onClick={handleRetry} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              再接続を試す
            </Button>
          </div>

          <div className="mt-8 pt-6 border-t">
            <p className="text-sm text-gray-500">
              このアプリはオフラインでも一部の機能が利用可能です。
              <br />
              オンラインに戻ると自動的にデータが同期されます。
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
