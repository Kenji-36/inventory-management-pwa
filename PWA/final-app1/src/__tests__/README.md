# テストガイド

このディレクトリには、在庫注文管理システムの自動テストが含まれています。

## テストの実行

### すべてのテストを実行
```bash
npm test
```

### ウォッチモードで実行（ファイル変更時に自動実行）
```bash
npm run test:watch
```

### カバレッジレポート付きで実行
```bash
npm run test:coverage
```

### E2Eテストを実行
```bash
npm run test:e2e
```

### E2EテストをUIモードで実行
```bash
npm run test:e2e:ui
```

### E2Eテストレポートを表示
```bash
npm run test:e2e:report
```

## テストの種類

### 1. 単体テスト (Unit Tests)

#### バリデーションテスト (`validation.test.ts`)
入力値検証関数のテスト

- `validateProduct`: 商品データの検証
- `validateStockQuantity`: 在庫数量の検証
- `validateFileSize`: ファイルサイズの検証
- `sanitizeString`: 文字列のサニタイズ

#### API認証ヘルパーテスト (`api-auth.test.ts`)
API認証・在庫数量検証のテスト

- `validateStockQuantity`: 在庫数量の範囲チェック
- 正の整数、ゼロ、負の値、上限値のテスト

### 2. 統合テスト (Integration Tests)

#### 商品APIテスト (`integration/api-products.test.ts`)
- 商品データの検証
- JANコード形式チェック
- 価格の整合性チェック
- 商品検索シナリオ
- 在庫管理シナリオ

#### 注文APIテスト (`integration/api-orders.test.ts`)
- 注文作成シナリオ
- 注文データの形式検証
- 注文のバリデーション

### 3. コンポーネントテスト (Component Tests)

#### Buttonコンポーネント (`components/button.test.tsx`)
- ボタンのレンダリング
- disabled状態の適用
- variantプロパティの適用
- sizeプロパティの適用

#### Cardコンポーネント (`components/card.test.tsx`)
- カードのレンダリング
- カードヘッダーとコンテンツの表示
- カード構造の検証

### 4. E2Eテスト (End-to-End Tests)

#### ログイン機能 (`e2e/login.spec.ts`)
- ログインページの表示
- Googleログインボタンの表示
- 未認証時のリダイレクト動作

#### 在庫管理機能 (`e2e/inventory.spec.ts`)
- 在庫管理ページの表示
- 商品一覧の表示確認
- 検索機能の存在確認

### 5. パフォーマンステスト (Performance Tests)

#### APIパフォーマンス (`performance/api-performance.test.ts`)
- 大量データ処理（1000件）が100ms以内
- 商品検索が10ms以内
- 在庫計算（1000件）が50ms以内
- CSVパース処理（100行）が100ms以内
- メモリリークチェック（10000件）

## テスト結果

### 最新のテスト結果（2026年2月13日）

- **単体・統合・コンポーネントテスト**: 41/41 成功
- **E2Eテスト**: 5/5 成功
- **実行時間**: 約18秒（単体・統合）、約58秒（E2E）

詳細は [TEST-RESULTS.md](../../docs/TEST-RESULTS.md) を参照してください。

## 新しいテストの追加

### 例1: 新しいバリデーション関数のテスト

```typescript
// src/__tests__/validation.test.ts
describe('新しいバリデーション関数', () => {
  it('有効なデータを受け入れる', () => {
    const result = validateNewFunction(validData);
    expect(result.valid).toBe(true);
  });

  it('無効なデータを拒否する', () => {
    const result = validateNewFunction(invalidData);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
```

### 例2: 新しいE2Eテストの追加

```typescript
// e2e/new-feature.spec.ts
import { test, expect } from '@playwright/test';

test.describe('新機能', () => {
  test('新機能が正しく動作する', async ({ page }) => {
    await page.goto('/new-feature');
    await expect(page.locator('h1')).toBeVisible();
  });
});
```

## テストのベストプラクティス

1. **明確なテスト名**: テストが何を検証しているか一目でわかるように
2. **独立性**: 各テストは他のテストに依存しない
3. **境界値テスト**: 最小値、最大値、境界値をテスト
4. **エラーケース**: 正常系だけでなく異常系もテスト
5. **パフォーマンス**: 処理時間の上限を設定
6. **E2E認証**: 認証が必要なページは適切にハンドリング

## CI/CD統合

GitHub Actionsでの自動テスト実行を推奨:

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
      - run: npx playwright install
      - run: npm run test:e2e
```

## 参考リンク

- [Jest公式ドキュメント](https://jestjs.io/)
- [Testing Library公式ドキュメント](https://testing-library.com/)
- [Playwright公式ドキュメント](https://playwright.dev/)
