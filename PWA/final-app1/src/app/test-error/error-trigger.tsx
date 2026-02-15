'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function ErrorTrigger() {
  const [shouldThrow, setShouldThrow] = useState(false);

  if (shouldThrow) {
    throw new Error('[TEST-1] エラーバウンダリーテスト - React Error Boundary');
  }

  return (
    <Button 
      onClick={() => setShouldThrow(true)} 
      variant="destructive" 
      className="w-full"
    >
      🚨 エラーを発生させる
    </Button>
  );
}
