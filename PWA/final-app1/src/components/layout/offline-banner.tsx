"use client";

import { useState, useEffect } from "react";
import { WifiOff, Wifi } from "lucide-react";

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => {
      setIsOffline(false);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 3000);
    };

    setIsOffline(!navigator.onLine);

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (!isOffline && !showReconnected) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[100] text-center text-sm font-medium py-2 px-4 transition-colors ${
        isOffline
          ? "bg-amber-500 text-white"
          : "bg-green-500 text-white"
      }`}
    >
      {isOffline ? (
        <span className="inline-flex items-center gap-2">
          <WifiOff className="w-4 h-4" />
          オフラインです - キャッシュデータを表示中
        </span>
      ) : (
        <span className="inline-flex items-center gap-2">
          <Wifi className="w-4 h-4" />
          オンラインに復帰しました
        </span>
      )}
    </div>
  );
}
