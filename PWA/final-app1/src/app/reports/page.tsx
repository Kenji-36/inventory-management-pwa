'use client';

import { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BarChart3, RefreshCw, Download, FileSpreadsheet, FileText,
  TrendingUp, TrendingDown, Minus, ShoppingCart, DollarSign,
  Package, ArrowUpDown, Calendar, GitCompare
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend
} from 'recharts';

// ============================================================
// 型定義
// ============================================================

interface DailySales {
  date: string;
  orderCount: number;
  totalExclTax: number;
  totalInclTax: number;
  itemCount: number;
}

interface ProductSales {
  productId: number;
  productName: string;
  productCode: string;
  totalQuantity: number;
  totalExclTax: number;
  totalInclTax: number;
  orderCount: number;
}

interface PeriodSummary {
  totalOrders: number;
  totalSalesExclTax: number;
  totalSalesInclTax: number;
  totalItems: number;
  averageOrderValue: number;
  dailySales: DailySales[];
  productSales: ProductSales[];
}

interface ReportData {
  period: { start: string; end: string };
  current: PeriodSummary;
  comparison: PeriodSummary | null;
  comparisonPeriod: { start: string; end: string } | null;
}

// ============================================================
// ヘルパー関数
// ============================================================

function formatCurrency(value: number): string {
  return `¥${value.toLocaleString()}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function getChangePercent(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 100);
}

function getDefaultDates() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    start: start.toISOString().split('T')[0],
    end: now.toISOString().split('T')[0],
  };
}

// ============================================================
// 変動率バッジ
// ============================================================

function ChangeBadge({ current, previous }: { current: number; previous: number }) {
  const pct = getChangePercent(current, previous);
  if (pct === null) return <span className="text-xs text-gray-500">-</span>;

  if (pct > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full">
        <TrendingUp className="h-3 w-3" />+{pct}%
      </span>
    );
  } else if (pct < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-red-700 bg-red-100 px-1.5 py-0.5 rounded-full">
        <TrendingDown className="h-3 w-3" />{pct}%
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded-full">
      <Minus className="h-3 w-3" />0%
    </span>
  );
}

// ============================================================
// サマリーカード
// ============================================================

function SummaryCards({ data, comparison }: { data: PeriodSummary; comparison: PeriodSummary | null }) {
  const cards = [
    {
      title: '総注文数',
      value: data.totalOrders,
      format: (v: number) => `${v}件`,
      prevValue: comparison?.totalOrders,
      icon: ShoppingCart,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: '売上(税込)',
      value: data.totalSalesInclTax,
      format: formatCurrency,
      prevValue: comparison?.totalSalesInclTax,
      icon: DollarSign,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      title: '売上(税抜)',
      value: data.totalSalesExclTax,
      format: formatCurrency,
      prevValue: comparison?.totalSalesExclTax,
      icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      title: '販売商品数',
      value: data.totalItems,
      format: (v: number) => `${v}個`,
      prevValue: comparison?.totalItems,
      icon: Package,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      title: '平均注文額',
      value: data.averageOrderValue,
      format: formatCurrency,
      prevValue: comparison?.averageOrderValue,
      icon: BarChart3,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map(card => (
        <Card key={card.title} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-lg ${card.bg}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
              <span className="text-xs text-gray-500 font-medium">{card.title}</span>
            </div>
            <p className="text-lg font-bold text-gray-900">{card.format(card.value)}</p>
            {comparison && card.prevValue !== undefined && (
              <div className="mt-1 flex items-center gap-2">
                <ChangeBadge current={card.value} previous={card.prevValue} />
                <span className="text-xs text-gray-500">vs {card.format(card.prevValue)}</span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ============================================================
// 売上推移グラフ
// ============================================================

function SalesChart({ data }: { data: DailySales[] }) {
  const chartData = data.map(d => ({
    date: formatDate(d.date),
    '売上(税込)': d.totalInclTax,
    '注文数': d.orderCount,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">日別売上推移</CardTitle>
        <CardDescription>期間中の日別売上と注文数</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="text-center text-gray-500 py-8">データがありません</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickFormatter={v => `¥${(v / 1000).toFixed(0)}k`} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value: number | undefined, name: string | undefined) =>
                  name === '売上(税込)' ? formatCurrency(value ?? 0) : `${value ?? 0}件`
                }
              />
              <Legend />
              <Bar yAxisId="left" dataKey="売上(税込)" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="注文数" stroke="#f59e0b" strokeWidth={2} dot={false} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================
// 商品別売上テーブル（ソート機能付き）
// ============================================================

function ProductSalesTable({
  data,
  sortBy,
  sortOrder,
  onSort,
}: {
  data: ProductSales[];
  sortBy: string;
  sortOrder: string;
  onSort: (col: string) => void;
}) {
  const columns = [
    { key: 'productName', label: '商品名', align: 'left' as const },
    { key: 'totalQuantity', label: '販売数', align: 'right' as const },
    { key: 'totalInclTax', label: '売上(税込)', align: 'right' as const },
    { key: 'totalExclTax', label: '売上(税抜)', align: 'right' as const },
    { key: 'orderCount', label: '注文数', align: 'right' as const },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">商品別売上ランキング</CardTitle>
        <CardDescription>列ヘッダーをクリックでソートできます</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-center text-gray-500 py-8">データがありません</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-3 font-medium text-gray-500 w-8">#</th>
                  {columns.map(col => (
                    <th
                      key={col.key}
                      className={`py-3 px-3 font-medium text-gray-500 cursor-pointer hover:text-gray-900 select-none ${col.align === 'right' ? 'text-right' : 'text-left'}`}
                      onClick={() => onSort(col.key)}
                    >
                      <span className="inline-flex items-center gap-1">
                        {col.label}
                        {sortBy === col.key && (
                          <ArrowUpDown className="h-3 w-3 text-blue-500" />
                        )}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((p, idx) => (
                  <tr key={p.productId} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-3 text-gray-500 font-medium">{idx + 1}</td>
                    <td className="py-2 px-3 font-medium text-gray-900 max-w-[200px] truncate">{p.productName}</td>
                    <td className="py-2 px-3 text-right text-gray-700">{p.totalQuantity}</td>
                    <td className="py-2 px-3 text-right font-semibold text-gray-900">{formatCurrency(p.totalInclTax)}</td>
                    <td className="py-2 px-3 text-right text-gray-600">{formatCurrency(p.totalExclTax)}</td>
                    <td className="py-2 px-3 text-right text-gray-600">{p.orderCount}件</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================
// 期間比較チャート
// ============================================================

function ComparisonChart({
  current,
  comparison,
  currentPeriod,
  comparisonPeriod,
}: {
  current: DailySales[];
  comparison: DailySales[];
  currentPeriod: { start: string; end: string };
  comparisonPeriod: { start: string; end: string };
}) {
  // 日数ベースで並べて比較
  const maxLen = Math.max(current.length, comparison.length);
  const chartData = Array.from({ length: maxLen }, (_, i) => ({
    day: `${i + 1}日目`,
    [`今期(${currentPeriod.start.slice(5)}~)`]: current[i]?.totalInclTax || 0,
    [`前期(${comparisonPeriod.start.slice(5)}~)`]: comparison[i]?.totalInclTax || 0,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <GitCompare className="h-4 w-4" />
          期間比較
        </CardTitle>
        <CardDescription>
          今期 ({currentPeriod.start} ~ {currentPeriod.end}) vs
          前期 ({comparisonPeriod.start} ~ {comparisonPeriod.end})
        </CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="text-center text-gray-500 py-8">比較データがありません</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `¥${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value: number | undefined) => formatCurrency(value ?? 0)} />
              <Legend />
              <Line
                type="monotone"
                dataKey={`今期(${currentPeriod.start.slice(5)}~)`}
                stroke="#4f46e5"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey={`前期(${comparisonPeriod.start.slice(5)}~)`}
                stroke="#9ca3af"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================
// エクスポート関数
// ============================================================

// フォントキャッシュ（一度読み込んだら再利用）
let fontCache: string | null = null;

async function loadJapaneseFont(): Promise<string> {
  if (fontCache) return fontCache;

  const response = await fetch('/fonts/NotoSansJP-Regular.ttf');
  const arrayBuffer = await response.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  // ArrayBuffer を Base64 に変換
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  fontCache = btoa(binary);
  return fontCache;
}

async function exportPdf(data: ReportData) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF();

  // 日本語フォントを登録（normal と bold の両方を同じフォントで登録）
  const fontName = 'NotoSansJP';
  try {
    const fontBase64 = await loadJapaneseFont();
    doc.addFileToVFS('NotoSansJP.ttf', fontBase64);
    doc.addFont('NotoSansJP.ttf', fontName, 'normal');
    doc.addFont('NotoSansJP.ttf', fontName, 'bold');
    doc.setFont(fontName, 'normal');
  } catch (e) {
    console.warn('日本語フォント読み込み失敗:', e);
  }

  // タイトル（太字・黒）
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(18);
  doc.text('売上レポート', 14, 20);
  doc.setFontSize(10);
  doc.text(`期間: ${data.period.start} ~ ${data.period.end}`, 14, 28);
  doc.text(`出力日時: ${new Date().toLocaleString('ja-JP')}`, 14, 34);

  // 共通テーブルスタイル（全セルに適用）
  const baseStyles = {
    font: fontName,
    fontSize: 9,
    textColor: [0, 0, 0] as [number, number, number],
  };

  // ヘッダースタイル
  const headStyle = {
    font: fontName,
    fontStyle: 'normal' as const,
    fillColor: [79, 70, 229] as [number, number, number],
    textColor: [255, 255, 255] as [number, number, number],
    fontSize: 9,
  };

  // サマリー
  doc.setFontSize(13);
  doc.text('概要', 14, 46);
  autoTable(doc, {
    startY: 50,
    head: [['指標', '値']],
    body: [
      ['総注文数', `${data.current.totalOrders} 件`],
      ['売上(税込)', `¥${data.current.totalSalesInclTax.toLocaleString()}`],
      ['売上(税抜)', `¥${data.current.totalSalesExclTax.toLocaleString()}`],
      ['販売商品数', `${data.current.totalItems} 個`],
      ['平均注文額', `¥${data.current.averageOrderValue.toLocaleString()}`],
    ],
    theme: 'grid',
    styles: baseStyles,
    headStyles: headStyle,
  });

  // 商品別売上
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = ((doc as any).lastAutoTable?.finalY as number) || 120;
  doc.setFontSize(13);
  doc.text('商品別売上ランキング', 14, finalY + 10);
  autoTable(doc, {
    startY: finalY + 14,
    head: [['#', '商品名', '数量', '売上(税込)', '売上(税抜)', '注文数']],
    body: data.current.productSales.slice(0, 20).map((p, i) => [
      `${i + 1}`,
      p.productName.length > 20 ? p.productName.slice(0, 20) + '...' : p.productName,
      `${p.totalQuantity}`,
      `¥${p.totalInclTax.toLocaleString()}`,
      `¥${p.totalExclTax.toLocaleString()}`,
      `${p.orderCount}`,
    ]),
    theme: 'grid',
    styles: baseStyles,
    headStyles: headStyle,
    columnStyles: {
      0: { cellWidth: 10 },
      2: { halign: 'right' as const },
      3: { halign: 'right' as const },
      4: { halign: 'right' as const },
      5: { halign: 'right' as const },
    },
  });

  doc.save(`report_${data.period.start}_${data.period.end}.pdf`);
}

async function exportExcel(data: ReportData) {
  const XLSX = await import('xlsx');

  // サマリーシート
  const summaryData = [
    ['レポート期間', `${data.period.start} ~ ${data.period.end}`],
    ['生成日時', new Date().toLocaleString('ja-JP')],
    [''],
    ['指標', '値'],
    ['総注文数', data.current.totalOrders],
    ['売上(税込)', data.current.totalSalesInclTax],
    ['売上(税抜)', data.current.totalSalesExclTax],
    ['販売商品数', data.current.totalItems],
    ['平均注文額', data.current.averageOrderValue],
  ];

  // 商品別売上シート
  const productData = [
    ['#', '商品名', '商品コード', '販売数', '売上(税込)', '売上(税抜)', '注文数'],
    ...data.current.productSales.map((p, i) => [
      i + 1,
      p.productName,
      p.productCode,
      p.totalQuantity,
      p.totalInclTax,
      p.totalExclTax,
      p.orderCount,
    ]),
  ];

  // 日別売上シート
  const dailyData = [
    ['日付', '注文数', '売上(税込)', '売上(税抜)', '商品数'],
    ...data.current.dailySales.map(d => [
      d.date,
      d.orderCount,
      d.totalInclTax,
      d.totalExclTax,
      d.itemCount,
    ]),
  ];

  const wb = XLSX.utils.book_new();
  const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
  const ws2 = XLSX.utils.aoa_to_sheet(productData);
  const ws3 = XLSX.utils.aoa_to_sheet(dailyData);

  // 数値フォーマット（カンマ区切り）: #,##0
  const numFmt = '#,##0';

  // サマリーシート: B列（値）の数値セルにカンマ区切りを適用（B5~B9 = 行インデックス4~8）
  for (let r = 4; r <= 8; r++) {
    const cell = ws1[XLSX.utils.encode_cell({ r, c: 1 })];
    if (cell && typeof cell.v === 'number') {
      cell.z = numFmt;
    }
  }

  // 商品別売上シート: D列(販売数), E列(売上税込), F列(売上税抜), G列(注文数) にカンマ区切り
  const ws2Rows = data.current.productSales.length;
  for (let r = 1; r <= ws2Rows; r++) {
    for (const c of [3, 4, 5, 6]) { // D=3, E=4, F=5, G=6
      const cell = ws2[XLSX.utils.encode_cell({ r, c })];
      if (cell && typeof cell.v === 'number') {
        cell.z = numFmt;
      }
    }
  }

  // 日別売上シート: B列(注文数), C列(売上税込), D列(売上税抜), E列(商品数) にカンマ区切り
  const ws3Rows = data.current.dailySales.length;
  for (let r = 1; r <= ws3Rows; r++) {
    for (const c of [1, 2, 3, 4]) { // B=1, C=2, D=3, E=4
      const cell = ws3[XLSX.utils.encode_cell({ r, c })];
      if (cell && typeof cell.v === 'number') {
        cell.z = numFmt;
      }
    }
  }

  // 列幅設定
  ws1['!cols'] = [{ wch: 15 }, { wch: 20 }];
  ws2['!cols'] = [{ wch: 5 }, { wch: 30 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 10 }];
  ws3['!cols'] = [{ wch: 12 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 10 }];

  XLSX.utils.book_append_sheet(wb, ws1, 'サマリー');
  XLSX.utils.book_append_sheet(wb, ws2, '商品別売上');
  XLSX.utils.book_append_sheet(wb, ws3, '日別売上');

  XLSX.writeFile(wb, `report_${data.period.start}_${data.period.end}.xlsx`);
}

// ============================================================
// メインページ
// ============================================================

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  // フィルタ
  const defaults = getDefaultDates();
  const [startDate, setStartDate] = useState(defaults.start);
  const [endDate, setEndDate] = useState(defaults.end);
  const [compareMode, setCompareMode] = useState<string>('');

  // ソート
  const [sortBy, setSortBy] = useState('totalInclTax');
  const [sortOrder, setSortOrder] = useState('desc');

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        start: startDate,
        end: endDate,
        sort_by: sortBy,
        sort_order: sortOrder,
      });
      if (compareMode) params.set('compare', compareMode);

      const res = await fetch(`/api/reports?${params}`);
      const data = await res.json();
      if (data.success) {
        setReportData(data);
      }
    } catch {
      // エラーハンドリング
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, compareMode, sortBy, sortOrder]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const handleSort = (col: string) => {
    if (sortBy === col) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortOrder('desc');
    }
  };

  // プリセット期間
  const setPreset = (preset: string) => {
    const now = new Date();
    let start: Date;
    let end: Date = now;
    switch (preset) {
      case 'this_month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'last_month':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'last_7':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'last_30':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'last_90':
        start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'this_year':
        start = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        return;
    }
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* ヘッダー */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            レポート・分析
          </h1>
          <p className="text-gray-500 mt-1">売上データの分析・比較・エクスポート</p>
        </div>

        {/* フィルタバー */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* 期間プリセット */}
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-gray-500 flex items-center mr-1">
                  <Calendar className="h-4 w-4 mr-1" />期間:
                </span>
                {[
                  { key: 'last_7', label: '7日間' },
                  { key: 'last_30', label: '30日間' },
                  { key: 'this_month', label: '今月' },
                  { key: 'last_month', label: '先月' },
                  { key: 'last_90', label: '90日間' },
                  { key: 'this_year', label: '今年' },
                ].map(p => (
                  <Button key={p.key} variant="outline" size="sm" onClick={() => setPreset(p.key)}>
                    {p.label}
                  </Button>
                ))}
              </div>

              {/* カスタム日付 + 比較 + エクスポート */}
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">開始日</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">終了日</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">
                    <GitCompare className="h-3 w-3 inline mr-1" />比較
                  </label>
                  <select
                    value={compareMode}
                    onChange={e => setCompareMode(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    <option value="">比較なし</option>
                    <option value="prev_month">前月比</option>
                    <option value="prev_year">前年比</option>
                  </select>
                </div>

                <div className="ml-auto flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => reportData && exportPdf(reportData)}
                    disabled={!reportData || loading}
                  >
                    <FileText className="h-4 w-4 mr-1" />PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => reportData && exportExcel(reportData)}
                    disabled={!reportData || loading}
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-1" />Excel
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchReport}
                    disabled={loading}
                  >
                    <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                    更新
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ローディング */}
        {loading && (
          <div className="flex items-center justify-center p-12">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">レポートを生成中...</span>
          </div>
        )}

        {/* レポート本体 */}
        {!loading && reportData && (
          <div className="space-y-6">
            {/* サマリーカード */}
            <SummaryCards
              data={reportData.current}
              comparison={reportData.comparison}
            />

            {/* 日別売上グラフ */}
            <SalesChart data={reportData.current.dailySales} />

            {/* 期間比較グラフ */}
            {reportData.comparison && reportData.comparisonPeriod && (
              <ComparisonChart
                current={reportData.current.dailySales}
                comparison={reportData.comparison.dailySales}
                currentPeriod={reportData.period}
                comparisonPeriod={reportData.comparisonPeriod}
              />
            )}

            {/* 商品別売上テーブル */}
            <ProductSalesTable
              data={reportData.current.productSales}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={handleSort}
            />
          </div>
        )}

        {/* データなし */}
        {!loading && !reportData && (
          <Card>
            <CardContent className="p-12 text-center">
              <Download className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">レポートデータを読み込めませんでした</p>
              <Button variant="outline" size="sm" onClick={fetchReport} className="mt-3">
                再試行
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
