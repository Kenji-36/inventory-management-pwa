"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Camera, AlertCircle } from "lucide-react";

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    let html5QrcodeScanner: any = null;
    let isMounted = true;

    const startScanner = async () => {
      try {
        console.log('🎥 カメラ初期化開始...');
        
        // html5-qrcodeをdynamic importする
        const { Html5Qrcode } = await import("html5-qrcode");

        if (!isMounted) return;

        html5QrcodeScanner = new Html5Qrcode("barcode-reader");
        scannerRef.current = html5QrcodeScanner;

        console.log('🎥 スキャナー起動中...');

        // カメラの設定を緩和して、より多くのデバイスで動作するように
        const config = {
          fps: 10,
          qrbox: { width: 250, height: 150 },
          aspectRatio: 1.5,
          disableFlip: false,
          formatsToSupport: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], // 全てのバーコード形式をサポート
        };

        // カメラIDを指定せず、facingModeのみで起動を試みる
        try {
          await html5QrcodeScanner.start(
            { facingMode: "environment" },
            config,
            (decodedText: string) => {
              // スキャン成功
              console.log("✅ スキャン成功:", decodedText);
              onScan(decodedText);
            },
            (errorMessage: string) => {
              // スキャン中のエラー（無視）
            }
          );
        } catch (startError: any) {
          console.warn('⚠️ environment カメラで失敗、user カメラを試行:', startError);
          
          // environment（背面カメラ）で失敗した場合、user（前面カメラ）を試す
          await html5QrcodeScanner.start(
            { facingMode: "user" },
            config,
            (decodedText: string) => {
              console.log("✅ スキャン成功:", decodedText);
              onScan(decodedText);
            },
            (errorMessage: string) => {
              // スキャン中のエラー（無視）
            }
          );
        }

        if (isMounted) {
          console.log('✅ スキャナー起動完了');
          setIsScanning(true);
        }
      } catch (err: any) {
        console.error("❌ Scanner error:", err);
        console.error("Error details:", {
          name: err.name,
          message: err.message,
          stack: err.stack,
        });
        
        if (!isMounted) return;

        // エラーの種類に応じたメッセージを表示
        let errorMessage = "カメラにアクセスできません。";
        
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          errorMessage = "カメラの使用が拒否されました。ブラウザの設定からカメラの使用を許可してください。";
        } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          errorMessage = "カメラが見つかりません。カメラが接続されているか確認してください。";
        } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
          errorMessage = "カメラが他のアプリで使用中です。他のアプリを終了してから再試行してください。";
        } else if (err.name === "OverconstrainedError") {
          errorMessage = "カメラの設定に問題があります。別のカメラを試してください。";
        } else if (err.name === "SecurityError") {
          errorMessage = "セキュリティエラー: HTTPSまたはlocalhostでアクセスしてください。";
        } else if (err.message && err.message.includes("Permission")) {
          errorMessage = "カメラの使用が拒否されました。ブラウザの設定を確認してください。";
        } else if (err.message) {
          errorMessage = `エラー: ${err.message}`;
        }
        
        setError(errorMessage);
      }
    };

    // 少し遅延させてから起動（DOMの準備を待つ）
    const timer = setTimeout(() => {
      startScanner();
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .then(() => console.log('🛑 スキャナー停止'))
          .catch((err: any) => console.error("Stop error:", err));
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg bg-white shadow-2xl border-2 border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg pb-4">
          <CardTitle className="flex items-center gap-2 text-white">
            <Camera className="w-5 h-5" />
            バーコードスキャン
          </CardTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full"
          >
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>
        <CardContent className="bg-white p-6">
          {error ? (
            <div className="text-center py-6">
              <div className="bg-red-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-12 h-12 text-red-500" />
              </div>
              <p className="text-red-600 font-semibold mb-6 text-lg">{error}</p>
              
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-xl p-5 mb-6 text-left shadow-sm">
                <p className="font-bold text-blue-900 mb-3 text-base flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  カメラ許可の手順
                </p>
                <ol className="list-decimal list-inside space-y-2 text-blue-800 text-sm">
                  <li className="pl-2">アドレスバーの左側の<strong className="text-blue-900">🔒</strong>または<strong className="text-blue-900">ⓘ</strong>をクリック</li>
                  <li className="pl-2"><strong className="text-blue-900">「カメラ」</strong>の項目を探す</li>
                  <li className="pl-2"><strong className="text-blue-900">「許可」</strong>を選択</li>
                  <li className="pl-2">下の<strong className="text-blue-900">「再試行」</strong>ボタンをクリック</li>
                </ol>
              </div>

              <div className="flex gap-3 justify-center">
                <Button
                  variant="default"
                  onClick={() => window.location.reload()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                >
                  再試行
                </Button>
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="border-gray-300 hover:bg-gray-100 px-6"
                >
                  閉じる
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div
                id="barcode-reader"
                className="w-full rounded-xl overflow-hidden border-2 border-gray-200 shadow-inner bg-gray-900"
              />
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mt-4">
                <p className="text-center text-sm text-green-800 font-medium flex items-center justify-center gap-2">
                  <span className="animate-pulse">📱</span>
                  バーコードをカメラに向けてください
                </p>
              </div>
              {!isScanning && (
                <div className="text-center py-8">
                  <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
                  <p className="text-sm text-gray-600 mt-3 font-medium">
                    カメラを起動中...
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
