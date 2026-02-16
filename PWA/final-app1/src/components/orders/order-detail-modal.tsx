"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Package, AlertCircle, Calendar, ShoppingBag, Receipt } from "lucide-react";
import Image from "next/image";
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 fade-in">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border-0 shadow-2xl">
        {/* ヘッダー */}
        <CardHeader className="flex-shrink-0 bg-gradient-to-r from-gray-700 to-gray-800 text-white border-b-0 pb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center">
                <Receipt className="w-7 h-7 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl text-white mb-1">
                  注文詳細 #{order.注文ID}
                </CardTitle>
                <div className="flex items-center gap-3 text-white/70 text-sm">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(order.注文日).toLocaleDateString('ja-JP')}
                  </span>
                  <span className="flex items-center gap-1">
                    <ShoppingBag className="w-4 h-4" />
                    {order.商品数}点
                  </span>
                </div>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="text-white hover:bg-white/10 rounded-xl"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        {/* コンテンツ */}
        <CardContent className="overflow-y-auto flex-1 p-6 bg-gradient-to-b from-gray-50 to-white">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center mb-4">
                <div className="animate-spin w-8 h-8 border-3 border-violet-500 border-t-transparent rounded-full" />
              </div>
              <p className="text-gray-500 font-medium">読み込み中...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-6">
                <AlertCircle className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">エラーが発生しました</h3>
              <p className="text-red-500">{error}</p>
            </div>
          ) : details ? (
            <div className="space-y-6">
              {/* 注文情報カード */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                      <Calendar className="w-4 h-4" />
                      注文日時
                    </div>
                    <p className="font-semibold text-gray-900">
                      {new Date(details.注文日).toLocaleString('ja-JP', {
                        year: 'numeric', month: '2-digit', day: '2-digit',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                      <ShoppingBag className="w-4 h-4" />
                      商品点数
                    </div>
                    <p className="font-semibold text-gray-900">{details.商品数}点</p>
                  </div>
                </div>
              </div>

              {/* 商品一覧 */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-gray-600" />
                  注文商品
                </h3>
                <div className="space-y-3">
                  {details.details.map((item, index) => (
                    <div
                      key={item.明細ID}
                      className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="relative w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl overflow-hidden flex-shrink-0">
                            {item.product?.画像URL ? (
                              <Image
                                src={item.product.画像URL}
                                alt={item.product.商品名}
                                fill
                                className="object-cover"
                                sizes="56px"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-7 h-7 text-gray-600" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 mb-1">
                              {item.product?.商品名 || `商品ID: ${item.商品ID}`}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              {item.product?.サイズ && (
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                                  サイズ {item.product.サイズ}
                                </span>
                              )}
                              {item.product?.商品コード && (
                                <span className="text-xs">
                                  {item.product.商品コード}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500 mb-1">
                            ¥{item["単価(税込)"].toLocaleString()} × {item.数量}個
                          </div>
                          <div className="text-lg font-bold text-gray-900">
                            ¥{item["小計(税込)"].toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 合計セクション */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-gray-700">
                    <span className="font-medium">小計（税抜）</span>
                    <span className="text-lg font-semibold">
                      ¥{details["注文金額(税抜)"].toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-gray-700">
                    <span className="font-medium">消費税</span>
                    <span className="text-lg font-semibold">
                      ¥
                      {(
                        details["注文金額(税込)"] - details["注文金額(税抜)"]
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent my-2" />
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-gray-900">合計（税込）</span>
                    <span className="text-3xl font-bold text-gray-900">
                      ¥{details["注文金額(税込)"].toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
