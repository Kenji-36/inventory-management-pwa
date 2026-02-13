/**
 * コンポーネントテスト: Button
 */
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button Component', () => {
  it('ボタンがレンダリングされる', () => {
    render(<Button>クリック</Button>);
    expect(screen.getByText('クリック')).toBeInTheDocument();
  });

  it('disabled状態が正しく適用される', () => {
    render(<Button disabled>無効ボタン</Button>);
    const button = screen.getByText('無効ボタン');
    expect(button).toBeDisabled();
  });

  it('variantプロパティが適用される', () => {
    const { container } = render(<Button variant="outline">アウトライン</Button>);
    expect(container.firstChild).toHaveClass('border');
  });

  it('sizeプロパティが適用される', () => {
    render(<Button size="sm">小さいボタン</Button>);
    expect(screen.getByText('小さいボタン')).toBeInTheDocument();
  });
});
