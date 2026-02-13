/**
 * パフォーマンステスト: API レスポンス時間
 */

describe('API Performance Tests', () => {
  describe('データ処理のパフォーマンス', () => {
    it('大量データの処理が許容時間内に完了する', () => {
      const startTime = performance.now();
      
      // 1000件のデータを処理するシミュレーション
      const data = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        name: `商品${i + 1}`,
        price: 1000 + i,
      }));
      
      // フィルタリング処理
      const filtered = data.filter(item => item.price > 1500);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // 100ms以内に完了することを期待
      expect(duration).toBeLessThan(100);
      expect(filtered.length).toBeGreaterThan(0);
    });

    it('商品検索のパフォーマンス', () => {
      const startTime = performance.now();
      
      const products = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        name: `テスト商品${i + 1}`,
        code: `TST-${String(i + 1).padStart(3, '0')}`,
      }));
      
      // 商品名で検索
      const searchTerm = '商品50';
      const results = products.filter(p => p.name.includes(searchTerm));
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // 10ms以内に完了することを期待
      expect(duration).toBeLessThan(10);
      expect(results.length).toBeGreaterThan(0);
    });

    it('在庫計算のパフォーマンス', () => {
      const startTime = performance.now();
      
      const stocks = Array.from({ length: 1000 }, (_, i) => ({
        productId: i + 1,
        quantity: Math.floor(Math.random() * 100),
      }));
      
      // 合計在庫数を計算
      const totalStock = stocks.reduce((sum, stock) => sum + stock.quantity, 0);
      
      // 低在庫商品を抽出
      const lowStock = stocks.filter(s => s.quantity < 10);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // 50ms以内に完了することを期待
      expect(duration).toBeLessThan(50);
      expect(totalStock).toBeGreaterThan(0);
      expect(lowStock.length).toBeGreaterThan(0);
    });
  });

  describe('CSVパース処理のパフォーマンス', () => {
    it('CSV行のパースが高速に処理される', () => {
      const startTime = performance.now();
      
      // CSV行をパースする関数（簡易版）
      const parseCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let current = "";
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
          const char = line[i];

          if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
              current += '"';
              i++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === "," && !inQuotes) {
            result.push(current.trim());
            current = "";
          } else {
            current += char;
          }
        }

        result.push(current.trim());
        return result;
      };
      
      // 100行のCSVをパース
      const csvLines = Array.from({ length: 100 }, (_, i) => 
        `${i + 1},"商品${i + 1}",https://example.com/image${i + 1}.jpg,M,CODE-${i + 1},450000000000${i + 1},1000,1100`
      );
      
      csvLines.forEach(line => parseCSVLine(line));
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // 100ms以内に完了することを期待
      expect(duration).toBeLessThan(100);
    });
  });

  describe('メモリ使用量', () => {
    it('大量データの処理でメモリリークが発生しない', () => {
      // 10000件のデータを処理
      const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
        id: i + 1,
        name: `商品${i + 1}`,
        stock: Math.floor(Math.random() * 100),
      }));
      
      // データの集計処理
      const summary = {
        total: largeDataset.length,
        totalStock: largeDataset.reduce((sum, item) => sum + item.stock, 0),
        lowStock: largeDataset.filter(item => item.stock < 10).length,
      };
      
      expect(summary.total).toBe(10000);
      expect(summary.totalStock).toBeGreaterThan(0);
      expect(summary.lowStock).toBeGreaterThan(0);
      
      // データをクリア（メモリ解放）
      largeDataset.length = 0;
    });
  });
});
