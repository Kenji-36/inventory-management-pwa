# テストガイド

## テストの実行

### 全テストを実行
```bash
npm test
```

### ウォッチモードで実行（開発中）
```bash
npm run test:watch
```

### カバレッジレポート付きで実行
```bash
npm run test:coverage
```

## テストの種類

### 1. 単体テスト
- **validation.test.ts**: バリデーション関数のテスト
  - 商品データの検証
  - 在庫数量の検証
  - ファイルサイズの検証
  - 文字列のサニタイズ

- **api-auth.test.ts**: API認証ヘルパーのテスト
  - 在庫数量のバリデーション

## テストの追加方法

### 1. テストファイルの作成
`src/__tests__/` ディレクトリに `*.test.ts` または `*.test.tsx` ファイルを作成します。

### 2. テストの記述例

```typescript
import { myFunction } from '@/lib/myModule';

describe('My Module', () => {
  it('should do something', () => {
    const result = myFunction();
    expect(result).toBe(expected);
  });
});
```

### 3. コンポーネントのテスト例

```typescript
import { render, screen } from '@testing-library/react';
import MyComponent from '@/components/MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

## テストのベストプラクティス

1. **テストは独立させる**: 各テストは他のテストに依存しないようにする
2. **わかりやすい名前**: テストの目的が明確にわかる名前をつける
3. **AAA パターン**: Arrange（準備）、Act（実行）、Assert（検証）
4. **エッジケースをテスト**: 正常系だけでなく、異常系もテストする

## 今後の拡張

以下のテストを追加予定:
- 統合テスト（API エンドポイント）
- E2E テスト（ユーザーシナリオ）
- パフォーマンステスト

## 参考リンク

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Next.js Testing](https://nextjs.org/docs/testing)
