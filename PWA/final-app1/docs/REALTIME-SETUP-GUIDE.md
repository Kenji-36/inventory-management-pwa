# 📡 Supabase Realtime セットアップガイド

このガイドでは、在庫データの変更をリアルタイムで反映するSupabase Realtimeの設定を行います。

## 🎯 目的

在庫データが変更されたとき、他のユーザーの画面にも即座に反映されるようにします。

---

## ステップ1: Supabase Dashboardにアクセス

1. ブラウザで [Supabase Dashboard](https://supabase.com/dashboard) を開く
2. プロジェクト `rboyrpltnaxcbqhrimwr` を選択

---

## ステップ2: Realtime機能の有効化

### 2.1 SQL Editorを開く

左サイドバーから **SQL Editor** をクリック

### 2.2 SQLスクリプトを実行

以下のSQLスクリプトをコピー＆ペーストして実行：

```sql
-- stockテーブルのRealtimeを有効化
ALTER PUBLICATION supabase_realtime ADD TABLE stock;

-- productsテーブルのRealtimeを有効化
ALTER PUBLICATION supabase_realtime ADD TABLE products;

-- ordersテーブルのRealtimeを有効化
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- order_detailsテーブルのRealtimeを有効化
ALTER PUBLICATION supabase_realtime ADD TABLE order_details;

-- 有効化されたテーブルを確認
SELECT 
  schemaname,
  tablename,
  pubname
FROM 
  pg_publication_tables
WHERE 
  pubname = 'supabase_realtime'
ORDER BY 
  schemaname, tablename;
```

### 2.3 実行結果の確認

以下のテーブルが表示されれば成功です：

| schemaname | tablename | pubname |
|------------|-----------|---------|
| public | stock | supabase_realtime |
| public | products | supabase_realtime |
| public | orders | supabase_realtime |
| public | order_details | supabase_realtime |

---

## ステップ3: アプリケーションでの確認

### 3.1 開発サーバーを起動

```bash
npm run dev
```

### 3.2 ブラウザでアクセス

1. `http://localhost:3000` を開く
2. ログイン
3. **在庫管理**ページに移動

### 3.3 リアルタイム接続の確認

ブラウザの開発者ツール（F12）を開き、**Console**タブを確認：

```
[Realtime] Status: SUBSCRIBED
```

このメッセージが表示されれば、Realtime接続が成功しています！

---

## ステップ4: リアルタイム更新のテスト

### テスト方法1: 複数ブラウザで確認

1. **ブラウザ1**: 在庫管理ページを開く
2. **ブラウザ2**: 同じく在庫管理ページを開く
3. **ブラウザ1**で在庫数を変更
4. **ブラウザ2**で自動的に更新されることを確認

### テスト方法2: Supabase Dashboardで直接変更

1. **ブラウザ1**: 在庫管理ページを開く
2. **ブラウザ2**: Supabase Dashboard > Table Editor > `stock` テーブルを開く
3. **ブラウザ2**で任意の在庫数を変更
4. **ブラウザ1**で自動的に更新されることを確認

---

## 🔧 実装済みの機能

### useRealtimeStock フック

`src/hooks/useRealtimeStock.ts`

```typescript
export function useRealtimeStock(onStockUpdate?: (update: StockUpdate) => void) {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const stockChannel = supabase
      .channel('stock-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'stock'
      }, (payload) => {
        if (payload.new && onStockUpdate) {
          onStockUpdate(payload.new as StockUpdate);
        }
      })
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      stockChannel.unsubscribe();
    };
  }, [onStockUpdate]);

  return { isConnected };
}
```

### 在庫管理ページでの使用

`src/app/inventory/page.tsx`

```typescript
const { isConnected } = useRealtimeStock(
  useCallback((update) => {
    console.log('Stock updated:', update);
    info("在庫が更新されました", `商品ID: ${update.product_id} の在庫が ${update.quantity} に変更されました`);
    // データを再取得
    fetchProducts(searchTerm);
  }, [searchTerm])
);
```

---

## ✅ セットアップ完了チェックリスト

- [ ] `stock`テーブルのRealtimeが有効化されている
- [ ] `products`テーブルのRealtimeが有効化されている
- [ ] `orders`テーブルのRealtimeが有効化されている
- [ ] `order_details`テーブルのRealtimeが有効化されている
- [ ] ブラウザコンソールに `[Realtime] Status: SUBSCRIBED` が表示される
- [ ] 複数ブラウザで在庫更新が同期される

---

## 🔧 トラブルシューティング

### Realtimeが接続できない

**症状**: `[Realtime] Status: CHANNEL_ERROR` が表示される

**解決方法**:
1. Supabase DashboardでRealtimeが有効になっているか確認
2. `.env.local`の`NEXT_PUBLIC_SUPABASE_URL`と`NEXT_PUBLIC_SUPABASE_ANON_KEY`が正しいか確認
3. ブラウザのキャッシュをクリアして再試行

### 更新が反映されない

**症状**: 在庫を変更しても他のブラウザで更新されない

**解決方法**:
1. ブラウザコンソールで`[Realtime] Stock update:`が表示されるか確認
2. `useRealtimeStock`フックが正しく使用されているか確認
3. `onStockUpdate`コールバックが正しく実装されているか確認

### パフォーマンスの問題

**症状**: リアルタイム更新が遅い

**解決方法**:
1. 不要なRealtimeチャンネルを削除
2. `useCallback`を使用してコールバックをメモ化
3. データ取得の頻度を調整

---

## 📚 参考資料

- [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)
- [Realtime Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes)
- [Realtime Broadcast](https://supabase.com/docs/guides/realtime/broadcast)
