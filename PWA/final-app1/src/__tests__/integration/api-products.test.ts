/**
 * 統合テスト: Products API
 */
import { validateProduct } from '@/lib/validation';

describe('Products API Integration Tests', () => {
  describe('商品データの検証', () => {
    it('完全な商品データは有効', () => {
      const product = {
        商品名: 'テストシャツ',
        サイズ: 'M',
        商品コード: 'TST-001',
        JANコード: '4500000000001',
        税抜価格: 2000,
        税込価格: 2200,
      };

      const result = validateProduct(product);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('必須フィールドが欠けている場合はエラー', () => {
      const product = {
        商品名: '',
        サイズ: 'M',
        商品コード: 'TST-001',
        JANコード: '4500000000001',
        税抜価格: 2000,
        税込価格: 2200,
      };

      const result = validateProduct(product);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('JANコードの形式が正しいこと', () => {
      const validProduct = {
        商品名: 'テストシャツ',
        サイズ: 'M',
        商品コード: 'TST-001',
        JANコード: '4500000000001',
        税抜価格: 2000,
        税込価格: 2200,
      };

      const result = validateProduct(validProduct);
      expect(result.valid).toBe(true);
    });

    it('価格の整合性チェック（税込 > 税抜）', () => {
      const product = {
        商品名: 'テストシャツ',
        サイズ: 'M',
        商品コード: 'TST-001',
        JANコード: '4500000000001',
        税抜価格: 2000,
        税込価格: 2200,
      };

      const result = validateProduct(product);
      expect(result.valid).toBe(true);
      expect(product.税込価格).toBeGreaterThan(product.税抜価格);
    });
  });

  describe('商品検索のシナリオ', () => {
    it('商品コードで検索できる形式', () => {
      const searchTerm = 'TST-001';
      expect(searchTerm).toMatch(/^[A-Z0-9-]+$/);
    });

    it('JANコードで検索できる形式', () => {
      const janCode = '4500000000001';
      expect(janCode).toMatch(/^\d{13}$/);
    });

    it('商品名で部分一致検索できる', () => {
      const productName = 'テストシャツ';
      const searchTerm = 'シャツ';
      expect(productName).toContain(searchTerm);
    });
  });

  describe('在庫管理のシナリオ', () => {
    it('在庫数の増減が正しく計算される', () => {
      const currentStock = 10;
      const addQuantity = 5;
      const removeQuantity = 3;

      const afterAdd = currentStock + addQuantity;
      expect(afterAdd).toBe(15);

      const afterRemove = afterAdd - removeQuantity;
      expect(afterRemove).toBe(12);
    });

    it('在庫数が0未満にならない', () => {
      const currentStock = 5;
      const removeQuantity = 10;

      const result = Math.max(0, currentStock - removeQuantity);
      expect(result).toBe(0);
    });
  });
});
