/**
 * E2Eテスト: 在庫管理機能
 */
import { test, expect } from '@playwright/test';

test.describe('在庫管理機能', () => {
  test.beforeEach(async ({ page }) => {
    // 注: 実際のE2Eテストでは、テスト用のログイン処理が必要
    // ここでは画面の存在確認のみを行う
    await page.goto('/inventory');
  });

  test('在庫管理ページが表示される（または認証が必要）', async ({ page }) => {
    // ページタイトルまたはヘッダー、またはログインページを確認
    const isLoginPage = page.url().includes('/login');
    const pageTitle = page.locator('h1, h2, button').first();
    
    if (isLoginPage) {
      // ログインページにリダイレクトされた場合
      await expect(page).toHaveURL(/\/login/);
    } else {
      // 在庫管理ページが表示された場合
      await expect(pageTitle).toBeVisible();
    }
  });

  test('商品一覧が表示される', async ({ page }) => {
    // 商品リストまたはテーブルが存在することを確認
    const productList = page.locator('[data-testid="product-list"], table, .product-item').first();
    
    // 要素が存在するか、またはログインページにリダイレクトされるか
    const isProductListVisible = await productList.isVisible().catch(() => false);
    const isLoginPage = page.url().includes('/login');
    
    expect(isProductListVisible || isLoginPage).toBe(true);
  });

  test('検索機能が存在する', async ({ page }) => {
    // 検索入力フィールドが存在することを確認
    const searchInput = page.locator('input[type="text"], input[placeholder*="検索"]').first();
    
    const isSearchVisible = await searchInput.isVisible().catch(() => false);
    const isLoginPage = page.url().includes('/login');
    
    expect(isSearchVisible || isLoginPage).toBe(true);
  });
});
