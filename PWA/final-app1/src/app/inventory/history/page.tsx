'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, RefreshCw, ArrowUpCircle, ArrowDownCircle,
  ClipboardCheck, ShoppingCart, TrendingUp, TrendingDown,
  AlertTriangle, PackageCheck, BarChart3, Calculator
} from 'lucide-react';

// ============================================================
// 型定義
// ============================================================

interface StockMovement {
  id: number;
  product_id: number;
  user_email: string | null;
  movement_type: string;
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  reason: string | null;
  order_id: number | null;
  created_at: string;
  products: {
    name: string;
    product_code: string;
    jan_code: string;
  } | null;
}

interface StockItem {
  product_id: number;
  product_name: string;
  product_code: string;
  current_quantity: number;
}

// ============================================================
// 入出庫履歴タブ
// ============================================================

function MovementHistory() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<string>('');

  const fetchMovements = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (filter) params.set('movement_type', filter);
      const res = await fetch(`/api/stock-movements?${params}`);
      const data = await res.json();
      if (data.success) {
        setMovements(data.data || []);
        setTotal(data.total);
      }
    } catch {
      // エラーハンドリング
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchMovements(); }, [fetchMovements]);

  const getTypeInfo = (type: string) => {
    const types: Record<string, { label: string; color: string; icon: typeof ArrowUpCircle }> = {
      in: { label: '入庫', color: 'bg-green-100 text-green-800', icon: ArrowUpCircle },
      out: { label: '出庫', color: 'bg-red-100 text-red-800', icon: ArrowDownCircle },
      adjust: { label: '棚卸調整', color: 'bg-blue-100 text-blue-800', icon: ClipboardCheck },
      order: { label: '注文出庫', color: 'bg-purple-100 text-purple-800', icon: ShoppingCart },
    };
    return types[type] || { label: type, color: 'bg-gray-100 text-gray-800', icon: ArrowUpCircle };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">読み込み中...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* フィルタ */}
      <div className="flex flex-wrap gap-2">
        {['', 'in', 'out', 'order', 'adjust'].map(type => (
          <Button
            key={type}
            variant={filter === type ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(type)}
            className={filter === type ? 'bg-gray-800 text-white' : ''}
          >
            {type === '' ? 'すべて' : getTypeInfo(type).label}
          </Button>
        ))}
        <div className="ml-auto">
          <Button variant="outline" size="sm" onClick={fetchMovements}>
            <RefreshCw className="h-4 w-4 mr-1" /> 更新
          </Button>
        </div>
      </div>

      <p className="text-sm text-gray-500">全 {total} 件</p>

      {movements.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <PackageCheck className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>入出庫履歴はまだありません</p>
          <p className="text-sm mt-1">在庫の変更を行うと、ここに履歴が記録されます</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-3 font-medium text-gray-600">日時</th>
                <th className="text-left py-3 px-3 font-medium text-gray-600">種類</th>
                <th className="text-left py-3 px-3 font-medium text-gray-600">商品</th>
                <th className="text-right py-3 px-3 font-medium text-gray-600">数量</th>
                <th className="text-right py-3 px-3 font-medium text-gray-600">変動前</th>
                <th className="text-right py-3 px-3 font-medium text-gray-600">変動後</th>
                <th className="text-left py-3 px-3 font-medium text-gray-600">担当者</th>
                <th className="text-left py-3 px-3 font-medium text-gray-600">理由</th>
              </tr>
            </thead>
            <tbody>
              {movements.map(m => {
                const typeInfo = getTypeInfo(m.movement_type);
                const Icon = typeInfo.icon;
                return (
                  <tr key={m.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-3 text-gray-500 whitespace-nowrap text-xs">
                      {new Date(m.created_at).toLocaleString('ja-JP', {
                        month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="py-2 px-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${typeInfo.color}`}>
                        <Icon className="h-3 w-3" />
                        {typeInfo.label}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-gray-900 font-medium max-w-[200px] truncate">
                      {m.products?.name || `商品ID: ${m.product_id}`}
                    </td>
                    <td className={`py-2 px-3 text-right font-bold ${m.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                    </td>
                    <td className="py-2 px-3 text-right text-gray-500">{m.previous_quantity}</td>
                    <td className="py-2 px-3 text-right text-gray-900 font-medium">{m.new_quantity}</td>
                    <td className="py-2 px-3 text-gray-500 text-xs truncate max-w-[120px]">
                      {m.user_email || '-'}
                    </td>
                    <td className="py-2 px-3 text-gray-500 text-xs truncate max-w-[150px]">
                      {m.reason || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ============================================================
// 棚卸機能タブ
// ============================================================

function StocktakingTab() {
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [adjustments, setAdjustments] = useState<Record<number, number>>({});
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const fetchStocks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products?grouped=false');
      const data = await res.json();
      if (data.success) {
        const items: StockItem[] = (data.data || []).map((p: Record<string, unknown>) => ({
          product_id: p['商品ID'] as number,
          product_name: p['商品名'] as string,
          product_code: p['商品コード'] as string,
          current_quantity: ((p['stock'] as Record<string, unknown>)?.['在庫数'] as number) ?? 0,
        }));
        setStocks(items);
      }
    } catch {
      // エラーハンドリング
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStocks(); }, [fetchStocks]);

  const handleActualChange = (productId: number, value: string) => {
    const num = parseInt(value);
    if (!isNaN(num) && num >= 0) {
      setAdjustments(prev => ({ ...prev, [productId]: num }));
    } else if (value === '') {
      setAdjustments(prev => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
    }
  };

  const getDifferences = () => {
    return stocks
      .filter(s => adjustments[s.product_id] !== undefined && adjustments[s.product_id] !== s.current_quantity)
      .map(s => ({
        ...s,
        actual: adjustments[s.product_id],
        diff: adjustments[s.product_id] - s.current_quantity,
      }));
  };

  const handleApplyAdjustments = async () => {
    const diffs = getDifferences();
    if (diffs.length === 0) {
      alert('差異がありません');
      return;
    }
    if (!confirm(`${diffs.length}件の棚卸調整を実行しますか？`)) return;

    setSaving(true);
    setResult(null);
    let successCount = 0;

    for (const diff of diffs) {
      try {
        const res = await fetch('/api/stock-movements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: diff.product_id,
            movementType: 'adjust',
            quantity: diff.actual,
            reason: `棚卸調整（差異: ${diff.diff > 0 ? '+' : ''}${diff.diff}）`,
          }),
        });
        if ((await res.json()).success) successCount++;
      } catch {
        // 個別エラーはスキップ
      }
    }

    setResult(`${successCount}/${diffs.length} 件の棚卸調整を完了しました`);
    setAdjustments({});
    await fetchStocks();
    setSaving(false);
  };

  const differences = getDifferences();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">読み込み中...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4" />
          棚卸の手順
        </h4>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>各商品の「実在庫」欄に、実際にカウントした在庫数を入力</li>
          <li>システム在庫と差異がある商品は黄色で表示されます</li>
          <li>入力が終わったら「差異を一括調整」ボタンをクリック</li>
          <li>調整結果は入出庫履歴に「棚卸調整」として記録されます</li>
        </ol>
      </div>

      {result && (
        <div className="p-3 bg-green-50 rounded-lg text-green-700 text-sm">
          {result}
        </div>
      )}

      {differences.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
          <span className="text-sm text-amber-800">
            <AlertTriangle className="h-4 w-4 inline mr-1" />
            {differences.length} 件の差異があります
          </span>
          <Button 
            size="sm" 
            onClick={handleApplyAdjustments} 
            disabled={saving}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {saving ? <RefreshCw className="h-4 w-4 animate-spin mr-1" /> : <Calculator className="h-4 w-4 mr-1" />}
            差異を一括調整
          </Button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-3 font-medium text-gray-600">商品名</th>
              <th className="text-left py-3 px-3 font-medium text-gray-600">商品コード</th>
              <th className="text-right py-3 px-3 font-medium text-gray-600">システム在庫</th>
              <th className="text-right py-3 px-3 font-medium text-gray-600">実在庫</th>
              <th className="text-right py-3 px-3 font-medium text-gray-600">差異</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map(s => {
              const actual = adjustments[s.product_id];
              const hasDiff = actual !== undefined && actual !== s.current_quantity;
              const diff = actual !== undefined ? actual - s.current_quantity : 0;
              return (
                <tr key={s.product_id} className={`border-b border-gray-100 ${hasDiff ? 'bg-amber-50' : 'hover:bg-gray-50'}`}>
                  <td className="py-2 px-3 font-medium text-gray-900 max-w-[200px] truncate">
                    {s.product_name}
                  </td>
                  <td className="py-2 px-3 text-gray-500 text-xs">{s.product_code}</td>
                  <td className="py-2 px-3 text-right text-gray-700 font-medium">{s.current_quantity}</td>
                  <td className="py-2 px-3 text-right">
                    <input
                      type="number"
                      min="0"
                      placeholder="-"
                      value={actual ?? ''}
                      onChange={e => handleActualChange(s.product_id, e.target.value)}
                      className="w-20 text-right border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </td>
                  <td className={`py-2 px-3 text-right font-bold ${
                    diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-400'
                  }`}>
                    {actual !== undefined ? (diff > 0 ? `+${diff}` : diff) : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// 在庫予測タブ
// ============================================================

function ForecastTab() {
  const [forecasts, setForecasts] = useState<Array<{
    product_id: number;
    product_name: string;
    current_quantity: number;
    avg_daily_sales: number;
    days_until_stockout: number | null;
    reorder_recommended: boolean;
  }>>([]);
  const [loading, setLoading] = useState(true);

  const fetchForecast = useCallback(async () => {
    setLoading(true);
    try {
      // 商品データと在庫を取得
      const prodRes = await fetch('/api/products?grouped=false');
      const prodData = await prodRes.json();

      // 過去の注文データを取得（直近30日分の売上データ）
      const ordersRes = await fetch('/api/orders');
      const ordersData = await ordersRes.json();

      if (!prodData.success || !ordersData.success) return;

      // 商品ごとの平均日販を計算
      const salesMap = new Map<number, number>();
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // 注文データから販売数を集計
      for (const order of ordersData.data || []) {
        const orderDate = new Date(order['注文日']);
        if (orderDate >= thirtyDaysAgo) {
          for (const detail of order['明細'] || []) {
            const pid = detail['商品ID'] as number;
            const qty = detail['数量'] as number;
            salesMap.set(pid, (salesMap.get(pid) || 0) + qty);
          }
        }
      }

      // 予測データを生成
      const forecastData = (prodData.data || []).map((p: Record<string, unknown>) => {
        const pid = p['商品ID'] as number;
        const totalSales = salesMap.get(pid) || 0;
        const avgDailySales = totalSales / 30;
        const currentQty = ((p['stock'] as Record<string, unknown>)?.['在庫数'] as number) ?? 0;
        const daysUntilStockout = avgDailySales > 0 ? Math.floor(currentQty / avgDailySales) : null;

        return {
          product_id: pid,
          product_name: p['商品名'] as string,
          current_quantity: currentQty,
          avg_daily_sales: Math.round(avgDailySales * 100) / 100,
          days_until_stockout: daysUntilStockout,
          reorder_recommended: daysUntilStockout !== null && daysUntilStockout <= 7,
        };
      });

      // 在庫切れまでの日数が短い順にソート
      forecastData.sort((a: { days_until_stockout: number | null }, b: { days_until_stockout: number | null }) => {
        if (a.days_until_stockout === null && b.days_until_stockout === null) return 0;
        if (a.days_until_stockout === null) return 1;
        if (b.days_until_stockout === null) return -1;
        return a.days_until_stockout - b.days_until_stockout;
      });

      setForecasts(forecastData);
    } catch {
      // エラーハンドリング
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchForecast(); }, [fetchForecast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">分析中...</span>
      </div>
    );
  }

  const reorderCount = forecasts.filter(f => f.reorder_recommended).length;

  return (
    <div className="space-y-4">
      <div className="p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          在庫予測について
        </h4>
        <p className="text-sm text-blue-800">
          過去30日間の販売データを基に、平均日販と在庫切れ予測日を計算しています。
          在庫切れまで7日以内の商品は発注推奨として表示されます。
        </p>
      </div>

      {reorderCount > 0 && (
        <div className="p-3 bg-red-50 rounded-lg">
          <span className="text-sm text-red-800 font-medium">
            <AlertTriangle className="h-4 w-4 inline mr-1" />
            {reorderCount} 件の商品で発注が推奨されます（7日以内に在庫切れの見込み）
          </span>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-3 font-medium text-gray-600">商品名</th>
              <th className="text-right py-3 px-3 font-medium text-gray-600">現在庫</th>
              <th className="text-right py-3 px-3 font-medium text-gray-600">平均日販</th>
              <th className="text-right py-3 px-3 font-medium text-gray-600">在庫切れ予測</th>
              <th className="text-center py-3 px-3 font-medium text-gray-600">発注推奨</th>
            </tr>
          </thead>
          <tbody>
            {forecasts.map(f => (
              <tr key={f.product_id} className={`border-b border-gray-100 ${f.reorder_recommended ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                <td className="py-2 px-3 font-medium text-gray-900 max-w-[200px] truncate">
                  {f.product_name}
                </td>
                <td className={`py-2 px-3 text-right font-medium ${f.current_quantity <= 0 ? 'text-red-600' : 'text-gray-700'}`}>
                  {f.current_quantity}
                </td>
                <td className="py-2 px-3 text-right text-gray-600">
                  {f.avg_daily_sales > 0 ? (
                    <span className="flex items-center justify-end gap-1">
                      <TrendingDown className="h-3 w-3 text-orange-500" />
                      {f.avg_daily_sales}/日
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="py-2 px-3 text-right">
                  {f.days_until_stockout !== null ? (
                    <span className={`font-bold ${
                      f.days_until_stockout <= 3 ? 'text-red-600' :
                      f.days_until_stockout <= 7 ? 'text-amber-600' :
                      'text-green-600'
                    }`}>
                      約 {f.days_until_stockout} 日
                    </span>
                  ) : (
                    <span className="text-gray-400">販売実績なし</span>
                  )}
                </td>
                <td className="py-2 px-3 text-center">
                  {f.reorder_recommended ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <TrendingUp className="h-3 w-3" />
                      要発注
                    </span>
                  ) : f.avg_daily_sales > 0 ? (
                    <span className="text-green-600 text-xs">OK</span>
                  ) : (
                    <span className="text-gray-400 text-xs">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// メインページ
// ============================================================

export default function InventoryHistoryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'history' | 'stocktaking' | 'forecast'>('history');

  const tabs = [
    { id: 'history' as const, label: '入出庫履歴', icon: PackageCheck },
    { id: 'stocktaking' as const, label: '棚卸', icon: ClipboardCheck },
    { id: 'forecast' as const, label: '在庫予測', icon: BarChart3 },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">高度な在庫管理</h1>
            <p className="text-gray-500 mt-1">入出庫履歴・棚卸・在庫予測</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => router.push('/inventory')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            在庫管理に戻る
          </Button>
        </div>

        {/* タブ */}
        <div className="flex gap-2">
          {tabs.map(tab => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab(tab.id)}
              className={activeTab === tab.id ? 'bg-gray-800 text-white' : ''}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </Button>
          ))}
        </div>

        {/* コンテンツ */}
        <Card>
          <CardHeader>
            <CardTitle>
              {activeTab === 'history' && '入出庫履歴'}
              {activeTab === 'stocktaking' && '棚卸（実在庫チェック）'}
              {activeTab === 'forecast' && '在庫予測・発注推奨'}
            </CardTitle>
            <CardDescription>
              {activeTab === 'history' && '在庫の入出庫をすべて記録・閲覧できます。担当者・理由も確認できます。'}
              {activeTab === 'stocktaking' && '実在庫とシステム在庫を比較し、差異がある場合は一括で調整できます。'}
              {activeTab === 'forecast' && '過去30日間の販売データを基に、在庫切れ予測と発注推奨を表示します。'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeTab === 'history' && <MovementHistory />}
            {activeTab === 'stocktaking' && <StocktakingTab />}
            {activeTab === 'forecast' && <ForecastTab />}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
