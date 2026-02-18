"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, Package, ShoppingCart, AlertTriangle, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: "low_stock" | "out_of_stock" | "new_order";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const addNotification = (n: Omit<Notification, "id" | "timestamp" | "read">) => {
    setNotifications((prev) => [
      {
        ...n,
        id: Date.now().toString(36) + Math.random().toString(36).slice(2),
        timestamp: new Date(),
        read: false,
      },
      ...prev.slice(0, 19),
    ]);
  };

  // Supabase Realtime: 在庫変動を監視
  useEffect(() => {
    const stockChannel = supabase
      .channel("stock-alerts")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "stock" },
        async (payload) => {
          const newQty = payload.new?.quantity;
          const productId = payload.new?.product_id;
          if (newQty == null || !productId) return;

          const { data: product } = await supabase
            .from("products")
            .select("name, size")
            .eq("id", productId)
            .single() as { data: { name: string; size: string } | null };

          const productName = product
            ? `${product.name}（${product.size}）`
            : `商品ID: ${productId}`;

          if (newQty === 0) {
            addNotification({
              type: "out_of_stock",
              title: "在庫切れ",
              message: `${productName} の在庫がなくなりました`,
            });
          } else if (newQty <= 5) {
            addNotification({
              type: "low_stock",
              title: "在庫残少",
              message: `${productName} の在庫が残り${newQty}個です`,
            });
          }
        }
      )
      .subscribe();

    const orderChannel = supabase
      .channel("order-alerts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          const order = payload.new;
          addNotification({
            type: "new_order",
            title: "新規注文",
            message: `注文 #${order?.id} が作成されました（¥${(order?.total_price_including_tax || 0).toLocaleString()}）`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(stockChannel);
      supabase.removeChannel(orderChannel);
    };
  }, []);

  // パネル外クリック・Escapeキーで閉じる
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") setIsOpen(false);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handler);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "out_of_stock":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case "low_stock":
        return <Package className="w-4 h-4 text-amber-500" />;
      case "new_order":
        return <ShoppingCart className="w-4 h-4 text-blue-500" />;
    }
  };

  const formatTime = (d: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "たった今";
    if (diffMin < 60) return `${diffMin}分前`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}時間前`;
    return `${Math.floor(diffHr / 24)}日前`;
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`通知${unreadCount > 0 ? `（${unreadCount}件の未読）` : ""}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="relative w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
      >
        <Bell className="w-5 h-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center" aria-hidden="true">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div role="region" aria-label="通知パネル" className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-200 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <span className="font-semibold text-gray-800 text-sm" id="notification-title">通知</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                すべて既読にする
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto" role="list" aria-labelledby="notification-title">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-gray-500 text-sm">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" aria-hidden="true" />
                通知はありません
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  role="listitem"
                  className={cn(
                    "flex items-start gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors",
                    !n.read && "bg-blue-50/50"
                  )}
                >
                  <div className="mt-0.5" aria-hidden="true">{getIcon(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{n.title}</p>
                    <p className="text-xs text-gray-600 truncate">{n.message}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {formatTime(n.timestamp)}
                    </p>
                  </div>
                  <button
                    onClick={() => removeNotification(n.id)}
                    aria-label={`${n.title}の通知を削除`}
                    className="text-gray-400 hover:text-gray-600 mt-0.5"
                  >
                    <X className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
