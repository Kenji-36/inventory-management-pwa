"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, X, RefreshCw } from "lucide-react";

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Service Workerの登録
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('✅ Service Worker registered:', registration);

            // 更新チェック
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // 新しいバージョンが利用可能
                    setShowUpdatePrompt(true);
                  }
                });
              }
            });
          })
          .catch((error) => {
            console.error('❌ Service Worker registration failed:', error);
          });
      });
    }

    // インストールプロンプトのリスナー
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // アプリがインストールされた時
    window.addEventListener('appinstalled', () => {
      console.log('✅ PWA installed');
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // インストールボタンクリック
  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log(`User response: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  // 更新ボタンクリック
  const handleUpdate = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
      });
      window.location.reload();
    }
  };

  return (
    <>
      {children}

      {/* インストールプロンプト */}
      {showInstallPrompt && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm fade-in">
          <Card className="border-0 shadow-2xl">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
                  <Download className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    アプリをインストール
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    ホーム画面に追加して、より快適に利用できます
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleInstall}
                      size="sm"
                      className="flex-1"
                    >
                      インストール
                    </Button>
                    <Button
                      onClick={() => setShowInstallPrompt(false)}
                      size="sm"
                      variant="ghost"
                    >
                      後で
                    </Button>
                  </div>
                </div>
                <Button
                  onClick={() => setShowInstallPrompt(false)}
                  size="icon"
                  variant="ghost"
                  className="flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 更新プロンプト */}
      {showUpdatePrompt && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm fade-in">
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
                  <RefreshCw className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    新しいバージョン
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    アプリの新しいバージョンが利用可能です
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleUpdate}
                      size="sm"
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      更新
                    </Button>
                    <Button
                      onClick={() => setShowUpdatePrompt(false)}
                      size="sm"
                      variant="ghost"
                    >
                      後で
                    </Button>
                  </div>
                </div>
                <Button
                  onClick={() => setShowUpdatePrompt(false)}
                  size="icon"
                  variant="ghost"
                  className="flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
