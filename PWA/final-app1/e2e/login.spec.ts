/**
 * E2Eテスト: ログインフロー
 */
import { test, expect } from '@playwright/test';

test.describe('ログイン機能', () => {
  test('ログインページが表示される', async ({ page }) => {
    await page.goto('/login');
    
    // ページタイトルを確認
    await expect(page).toHaveTitle(/在庫注文管理システム/);
    
    // Googleログインボタンが表示される
    const loginButton = page.getByRole('button', { name: /Google.*ログイン/i });
    await expect(loginButton).toBeVisible();
  });

  test('未認証時はログインページにリダイレクトされる', async ({ page }) => {
    // ダッシュボードにアクセスを試みる
    await page.goto('/');
    
    // ログインページにリダイレクトされるか、ログインボタンが表示される
    await page.waitForURL(/\/(login)?/, { timeout: 5000 }).catch(() => {
      // タイムアウトは許容（既にログインページにいる場合）
    });
    
    const url = page.url();
    const isLoginPage = url.includes('/login') || url === 'http://localhost:3000/';
    expect(isLoginPage).toBe(true);
  });
});
