/**
 * コンポーネントテスト: Card
 */
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

describe('Card Component', () => {
  it('カードがレンダリングされる', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>テストタイトル</CardTitle>
        </CardHeader>
        <CardContent>テストコンテンツ</CardContent>
      </Card>
    );

    expect(screen.getByText('テストタイトル')).toBeInTheDocument();
    expect(screen.getByText('テストコンテンツ')).toBeInTheDocument();
  });

  it('カードの構造が正しい', () => {
    const { container } = render(
      <Card>
        <CardHeader>
          <CardTitle>タイトル</CardTitle>
        </CardHeader>
        <CardContent>コンテンツ</CardContent>
      </Card>
    );

    const card = container.firstChild;
    expect(card).toBeInTheDocument();
  });
});
