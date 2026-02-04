"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Package, AlertCircle } from "lucide-react";
import type { Order, OrderWithDetails } from "@/types";

interface OrderDetailModalProps {
  order: Order;
  onClose: () => void;
}

export function OrderDetailModal({ order, onClose }: OrderDetailModalProps) {
  const [details, setDetails] = useState<OrderWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/orders/${order.注文ID}`);
        const data = await response.json();

        if (data.success) {
          setDetails(data.data);
        } else {
          setError(data.error || "データの取得に失敗しました");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError("サーバーに接続できません");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [order.注文ID]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between flex-shrink-0">
          <CardTitle>注文詳細 #{order.注文ID}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>
        <CardContent className="overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
              <p className="text-gray-500 mt-4">読み込み中...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
              <p className="text-red-500">{error}</p>
            </div>
          ) : details ? (
            <div className="space-y-6">
              {/* 注文情報 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">注文日時</span>
                    <p className="font-medium">{details.注文日}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">商品点数</span>
                    <p className="font-medium">{details.商品数}点</p>
                  </div>
                </div>
              </div>

              {/* 商品一覧 */}
              <div>
                <h3 className="font-medium mb-3">注文商品</h3>
                <div className="space-y-3">
                  {details.details.map((item) => (
                    <div
                      key={item.明細ID}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                          <Package className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                          <div className="font-medium">
                            {item.product?.商品名 || `商品ID: ${item.商品ID}`}
                          </div>
                          <div className="text-sm text-gray-500">
                            {item.product?.サイズ && `サイズ: ${item.product.サイズ}`}
                            {item.product?.商品コード && ` | ${item.product.商品コード}`}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">
                          ¥{item["単価(税込)"].toLocaleString()} × {item.数量}
                        </div>
                        <div className="font-medium">
                          ¥{item["小計(税込)"].toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 合計 */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">小計（税抜）</span>
                  <span>¥{details["注文金額(税抜)"].toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">消費税</span>
                  <span>
                    ¥
                    {(
                      details["注文金額(税込)"] - details["注文金額(税抜)"]
                    ).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>合計（税込）</span>
                  <span>¥{details["注文金額(税込)"].toLocaleString()}</span>
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
