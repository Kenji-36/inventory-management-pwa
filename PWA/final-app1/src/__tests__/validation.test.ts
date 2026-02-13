/**
 * バリデーション関数のテスト
 */
import {
  validateProduct,
  validateStockQuantity,
  validateFileSize,
  sanitizeString,
} from '@/lib/validation';

describe('Validation Functions', () => {
  describe('validateProduct', () => {
    it('有効な商品データを検証できる', () => {
      const product = {
        商品名: 'テスト商品',
        サイズ: 'M',
        商品コード: 'TEST-001',
        JANコード: '4500000000001',
        税抜価格: 1000,
        税込価格: 1100,
      };

      const result = validateProduct(product);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('商品名が空の場合はエラーを返す', () => {
      const product = {
        商品名: '',
        サイズ: 'M',
        商品コード: 'TEST-001',
        JANコード: '4500000000001',
        税抜価格: 1000,
        税込価格: 1100,
      };

      const result = validateProduct(product);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('価格が負の場合はエラーを返す', () => {
      const product = {
        商品名: 'テスト商品',
        サイズ: 'M',
        商品コード: 'TEST-001',
        JANコード: '4500000000001',
        税抜価格: -100,
        税込価格: 1100,
      };

      const result = validateProduct(product);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateStockQuantity', () => {
    it('有効な在庫数を検証できる', () => {
      const result = validateStockQuantity(10);
      expect(result.valid).toBe(true);
    });

    it('負の在庫数はエラーを返す', () => {
      const result = validateStockQuantity(-1);
      expect(result.valid).toBe(false);
    });

    it('0は有効な在庫数', () => {
      const result = validateStockQuantity(0);
      expect(result.valid).toBe(true);
    });
  });

  describe('validateFileSize', () => {
    it('許容サイズ内のファイルは有効', () => {
      const result = validateFileSize(1024 * 1024, 5); // 1MB, 制限5MB
      expect(result.valid).toBe(true);
    });

    it('許容サイズを超えるファイルはエラー', () => {
      const result = validateFileSize(6 * 1024 * 1024, 5); // 6MB, 制限5MB
      expect(result.valid).toBe(false);
    });
  });

  describe('sanitizeString', () => {
    it('XSS攻撃を防ぐために文字列をサニタイズする', () => {
      const input = '<script>alert("xss")</script>';
      const result = sanitizeString(input);
      expect(result).not.toContain('<script>');
    });

    it('通常の文字列はそのまま返す', () => {
      const input = 'テスト商品';
      const result = sanitizeString(input);
      expect(result).toBe(input);
    });
  });
});
