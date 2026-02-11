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
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);
  const scannerRef = useRef<any>(null);

  // iframe内かどうかを検出
  useEffect(() => {
    try {
      if (window.self !== window.top) {
        setIsInIframe(true);
      }
    } catch {
      setIsInIframe(true);
    }
  }, []);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current
            .stop()
            .then(() => console.log('🛑 スキャナー停止'))
            .catch(() => {});
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // ユーザーがボタンを押した後にカメラを起動
  const handleStartCamera = async () => {
    setError(null);
    setIsStarting(true);
    
    try {
      console.log('🎥 カメラ起動開始...');

      // まずブラウザのgetUserMediaでカメラ権限を取得
      console.log('🔑 カメラ権限をリクエスト中...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      console.log('✅ カメラ権限取得成功');
      // 取得したストリームは一旦停止（html5-qrcodeが再取得する）
      stream.getTracks().forEach(track => track.stop());

      // html5-qrcodeをrequireで読み込む
      console.log('📦 ライブラリ読み込み中...');
      const { Html5Qrcode } = require("html5-qrcode");
      console.log('📦 ライブラリ読み込み完了');

      // barcode-reader要素を待つ
      await new Promise(resolve => setTimeout(resolve, 200));

      const readerEl = document.getElementById("barcode-reader");
      if (!readerEl) {
        throw new Error("スキャナー要素が見つかりません");
      }
      console.log('✅ DOM要素確認OK');

      const scanner = new Html5Qrcode("barcode-reader");
      scannerRef.current = scanner;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 150 },
        aspectRatio: 1.5,
        disableFlip: false,
      };

      console.log('🎥 スキャナー起動中...');

      try {
        await scanner.start(
          { facingMode: "environment" },
          config,
          (decodedText: string) => {
            console.log("✅ スキャン成功:", decodedText);
            onScan(decodedText);
          },
          () => {}
        );
      } catch {
        console.warn('⚠️ 背面カメラ失敗、前面カメラを試行');
        await scanner.start(
          { facingMode: "user" },
          config,
          (decodedText: string) => {
            console.log("✅ スキャン成功:", decodedText);
            onScan(decodedText);
          },
          () => {}
        );
      }

      console.log('✅ スキャナー起動完了');
      setIsScanning(true);
    } catch (err: any) {
      console.error("❌ エラー:", err.name, err.message);

      let msg = "カメラにアクセスできません。";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        msg = "カメラへのアクセスがブロックされています。Chromeで直接 http://localhost:3000 を開いてください（iframe内ではカメラは使用できません）。";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        msg = "カメラが見つかりません。カメラが接続されているか確認してください。";
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        msg = "カメラが他のアプリで使用中です。他のアプリを終了してから再試行してください。";
      } else if (err.name === "SecurityError") {
        msg = "セキュリティエラー: HTTPSまたはlocalhostで直接アクセスしてください。";
      } else if (err.message) {
        msg = `エラー: ${err.message}`;
      }
      setError(msg);
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg bg-white shadow-2xl border-2 border-gray-300">
        <CardHeader className="flex flex-row items-center justify-between bg-gray-200 rounded-t-lg pb-4">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Camera className="w-5 h-5" />
            バーコードスキャン
          </CardTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="text-gray-600 hover:bg-gray-300 rounded-full"
          >
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>
        <CardContent className="bg-white p-6">
          {isInIframe ? (
            /* iframe内で開かれている場合 */
            <div className="text-center py-6">
              <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 border-2 border-gray-300">
                <AlertCircle className="w-12 h-12 text-gray-600" />
              </div>
              <p className="text-gray-700 font-bold mb-2 text-lg">
                外部ブラウザで開いてください
              </p>
              <p className="text-gray-500 text-sm mb-6">
                埋め込みブラウザではカメラを使用できません
              </p>

              <div className="bg-gray-50 border-2 border-gray-300 rounded-xl p-5 mb-6 text-left">
                <ol className="list-decimal list-inside space-y-3 text-gray-600 text-sm">
                  <li className="pl-2"><strong className="text-gray-700">Chrome</strong>ブラウザを開く</li>
                  <li className="pl-2">アドレスバーに入力：
                    <code className="block mt-1 bg-white border border-gray-300 rounded px-3 py-2 text-gray-800 font-mono text-base select-all">
                      http://localhost:3000
                    </code>
                  </li>
                  <li className="pl-2">在庫管理画面でスキャンを実行</li>
                </ol>
              </div>

              <Button
                variant="outline"
                onClick={onClose}
                className="border-gray-300 hover:bg-gray-100 px-6"
              >
                閉じる
              </Button>
            </div>
          ) : error ? (
            /* エラー画面 */
            <div className="text-center py-6">
              <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 border-2 border-gray-300">
                <AlertCircle className="w-12 h-12 text-gray-600" />
              </div>
              <p className="text-gray-700 font-semibold mb-6 text-lg">{error}</p>
              
              <div className="bg-gray-50 border-2 border-gray-300 rounded-xl p-5 mb-6 text-left">
                <p className="font-bold text-gray-700 mb-3 text-base flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  解決方法
                </p>
                <ol className="list-decimal list-inside space-y-2 text-gray-600 text-sm">
                  <li className="pl-2"><strong className="text-gray-700">Chromeブラウザ</strong>を新しいタブで開く</li>
                  <li className="pl-2">アドレスバーに<strong className="text-gray-700"> http://localhost:3000 </strong>を入力して直接アクセス</li>
                  <li className="pl-2">カメラの許可を求められたら<strong className="text-gray-700">「許可」</strong>をクリック</li>
                </ol>
                <p className="text-xs text-gray-500 mt-3 border-t border-gray-200 pt-3">
                  ※ Cursorの内蔵ブラウザやiframe内ではカメラは使用できません
                </p>
              </div>

              <div className="flex gap-3 justify-center">
                <Button
                  onClick={handleStartCamera}
                  className="bg-gray-700 hover:bg-gray-800 text-white px-6 font-bold"
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
          ) : isScanning ? (
            /* スキャン中 */
            <>
              <div
                id="barcode-reader"
                className="w-full rounded-xl overflow-hidden border-2 border-gray-300 shadow-inner bg-gray-800"
              />
              <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 mt-4">
                <p className="text-center text-sm text-gray-700 font-medium">
                  📱 バーコードをカメラに向けてください
                </p>
              </div>
            </>
          ) : isStarting ? (
            /* カメラ起動中（ライブラリが読み込まれるまでの表示） */
            <>
              <div
                id="barcode-reader"
                className="w-full rounded-xl overflow-hidden border-2 border-gray-300 shadow-inner bg-gray-800 min-h-[200px]"
              />
              <div className="text-center py-6">
                <div className="animate-spin w-10 h-10 border-4 border-gray-500 border-t-transparent rounded-full mx-auto" />
                <p className="text-sm text-gray-600 mt-3 font-medium">
                  カメラを起動中...
                </p>
              </div>
            </>
          ) : (
            /* 初期画面: ボタンを押してカメラ起動 */
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-gray-100 border-2 border-gray-300 flex items-center justify-center mx-auto mb-6">
                <Camera className="w-10 h-10 text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                カメラを起動
              </h3>
              <p className="text-gray-500 mb-6 text-sm">
                ボタンを押してカメラを起動してください
              </p>
              <Button
                onClick={handleStartCamera}
                className="bg-gray-700 hover:bg-gray-800 text-white px-8 h-12 text-base font-bold shadow-md"
              >
                <Camera className="w-5 h-5 mr-2" />
                カメラを起動
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
