# 在庫が0と表示される問題のトラブルシューティング

## 📋 問題の診断手順

### ステップ1: データベースの状態を確認

ブラウザで以下のURLを開いてください：

```
http://localhost:3000/api/debug/check-stock
```

#### 確認するポイント

表示されたJSONデータで以下を確認：

```json
{
  "success": true,
  "stats": {
    "stock": {
      "total": ???,        // 在庫レコードの総数
      "totalQuantity": ???, // 合計在庫数
      "withStock": ???,     // 在庫がある商品数
      "zeroStock": ???      // 在庫が0の商品数
    },
    "products": {
      "total": ???          // 商品の総数
    }
  }
}
```

### ステップ2: 問題のパターン別対処法

#### パターンA: `stock.total` が 0 の場合
**原因**: 在庫レコード自体が存在しない

**解決方法**: 
```
http://localhost:3000/api/debug/reset-stock
```
にアクセスして在庫を初期化

#### パターンB: `stock.total` は存在するが `totalQuantity` が 0 の場合
**原因**: 在庫レコードは存在するが、全て数量が0

**解決方法**: 
```
http://localhost:3000/api/debug/reset-stock
```
にアクセスして在庫を10に設定

#### パターンC: `totalQuantity` は0以上だが画面に0と表示される場合
**原因**: フロントエンドのデータ取得またはキャッシュの問題

**解決方法**:
1. ブラウザで **Ctrl+Shift+R** (Windows) または **Cmd+Shift+R** (Mac) で強制リロード
2. ブラウザの開発者ツール (F12) を開く
3. Console タブでエラーがないか確認
4. Network タブで `/api/products` のレスポンスを確認

### ステップ3: 在庫の初期化

以下のURLにアクセス：

```
http://localhost:3000/api/debug/reset-stock
```

#### 成功時の表示例

```json
{
  "success": true,
  "message": "在庫データをリセットしました",
  "data": {
    "products": {
      "total": 45  // 商品数
    },
    "before": {
      "count": 0,        // リセット前の在庫レコード数
      "totalStock": 0    // リセット前の合計在庫数
    },
    "created": {
      "count": 45        // 新規作成した在庫レコード数
    },
    "after": {
      "count": 45,       // リセット後の在庫レコード数
      "totalStock": 450  // リセット後の合計在庫数 (45商品 × 10個)
    }
  }
}
```

### ステップ4: 確認

1. **強制リロード**: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)
2. **在庫管理ページを開く**: http://localhost:3000/inventory
3. **各商品の在庫数が表示されることを確認**

## 🔍 詳細な診断（開発者向け）

### ブラウザの開発者ツールで確認

1. F12 キーを押して開発者ツールを開く
2. **Console タブ**: エラーメッセージを確認
3. **Network タブ**: 
   - `/api/products` のレスポンスを確認
   - レスポンスに `stock` データが含まれているか確認

### API レスポンスの構造

正常な場合、`/api/products` のレスポンスは以下の構造：

```json
{
  "success": true,
  "data": [
    {
      "商品ID": 1,
      "商品名": "リネンシャツ",
      "サイズ": "S",
      "stock": {
        "在庫数": 10,  // ← ここが0以外であるべき
        "最終更新日時": "2024-01-01T00:00:00Z"
      }
    }
  ]
}
```

## 🛠️ SQLスクリプトを使用する方法（代替手段）

APIでうまくいかない場合、Supabase SQL Editorで以下のスクリプトを実行：

### scripts/initialize-stock.sql

```sql
-- 在庫レコードが存在しない商品に対して在庫を作成
INSERT INTO stock (product_id, quantity, updated_at)
SELECT 
  p.id,
  10 as quantity,
  NOW() as updated_at
FROM products p
LEFT JOIN stock s ON s.product_id = p.id
WHERE s.id IS NULL
ON CONFLICT (product_id) DO NOTHING;

-- 既存の在庫を全て10に更新
UPDATE stock 
SET 
  quantity = 10,
  updated_at = NOW();
```

## ❓ よくある質問

### Q1: reset-stock を実行したのに画面が変わらない
**A**: ブラウザのキャッシュが原因です。**Ctrl+Shift+R** で強制リロードしてください。

### Q2: エラーメッセージが表示される
**A**: エラーメッセージの内容をコピーして報告してください。

### Q3: 一部の商品だけ在庫が0
**A**: 特定の商品の在庫レコードが作成されていない可能性があります。`reset-stock` を実行してください。

## 📞 サポート

上記の手順で解決しない場合は、以下の情報を提供してください：

1. `/api/debug/check-stock` のレスポンス（全文）
2. `/api/debug/reset-stock` のレスポンス（全文）
3. ブラウザのコンソールに表示されているエラー（あれば）
4. `/api/products` のレスポンス（最初の1商品分）
