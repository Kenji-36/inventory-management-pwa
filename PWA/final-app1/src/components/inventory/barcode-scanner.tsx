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

    const startScanner = async () => {
      try {
        // html5-qrcodeをdynamic importする
        const { Html5Qrcode } = await import("html5-qrcode");

        html5QrcodeScanner = new Html5Qrcode("barcode-reader");
        scannerRef.current = html5QrcodeScanner;

        await html5QrcodeScanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 150 },
            aspectRatio: 1.5,
          },
          (decodedText: string) => {
            // スキャン成功
            console.log("Scanned:", decodedText);
            onScan(decodedText);
          },
          (errorMessage: string) => {
            // スキャン中のエラー（無視）
          }
        );

        setIsScanning(true);
      } catch (err) {
        console.error("Scanner error:", err);
        setError(
          "カメラにアクセスできません。カメラの使用を許可してください。"
        );
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .catch((err: any) => console.error("Stop error:", err));
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
      <Card className="w-full max-w-lg mx-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            バーコードスキャン
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
              <p className="text-red-500">{error}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => window.location.reload()}
              >
                再試行
              </Button>
            </div>
          ) : (
            <>
              <div
                id="barcode-reader"
                className="w-full rounded-lg overflow-hidden"
              />
              <p className="text-center text-sm text-gray-500 mt-4">
                バーコードをカメラに向けてください
              </p>
              {!isScanning && (
                <div className="text-center py-8">
                  <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
                  <p className="text-sm text-gray-500 mt-2">
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
