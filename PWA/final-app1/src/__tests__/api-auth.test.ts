/**
 * API認証ヘルパーのテスト
 */
import { validateStockQuantity } from '@/lib/validation';

describe('API Authentication Helpers', () => {
  describe('Stock Quantity Validation', () => {
    it('正の整数は有効', () => {
      expect(validateStockQuantity(100).valid).toBe(true);
    });

    it('0は有効', () => {
      expect(validateStockQuantity(0).valid).toBe(true);
    });

    it('負の数は無効', () => {
      expect(validateStockQuantity(-1).valid).toBe(false);
    });

    it('上限以内の大きな数は有効', () => {
      expect(validateStockQuantity(99999).valid).toBe(true);
    });

    it('上限を超える数は無効', () => {
      expect(validateStockQuantity(100001).valid).toBe(false);
    });
  });
});
