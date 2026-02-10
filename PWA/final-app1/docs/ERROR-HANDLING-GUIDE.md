# 🛡️ エラーハンドリング＆ユーザーフィードバックガイド

このガイドでは、アプリケーションのエラーハンドリングとユーザーフィードバックの仕組みを説明します。

## 🎯 目的

- ✅ **ユーザーフレンドリー**: わかりやすいエラーメッセージ
- ✅ **適切なフィードバック**: 操作結果を即座に通知
- ✅ **セキュリティ**: 本番環境では詳細なエラー情報を隠す
- ✅ **デバッグ**: 開発環境では詳細なエラー情報を表示
- ✅ **ログ記録**: エラーを記録して分析可能に

---

## 1. エラーハンドリングの階層

### 1.1 グローバルエラーハンドラー

**ファイル**: `src/app/global-error.tsx`

アプリケーション全体で発生した重大なエラーをキャッチします。

```typescript
export default function GlobalError({ error, reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // エラーログを記録
  console.error("Global Application Error:", error);
  
  return (
    // エラーページを表示
  );
}
```

**特徴**:
- アプリケーション全体のエラーをキャッチ
- `html`と`body`タグを含む完全なページ
- ページリロードで復旧を試みる

### 1.2 ページレベルエラーハンドラー

**ファイル**: `src/app/error.tsx`

特定のページで発生したエラーをキャッチします。

```typescript
export default function Error({ error, reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // エラーログを記録
  console.error("Application Error:", error);
  
  return (
    // エラーページを表示
  );
}
```

**特徴**:
- ページ単位でエラーをキャッチ
- レイアウトは維持される
- 「再試行」ボタンで復旧を試みる

### 1.3 APIエラーハンドラー

**ファイル**: `src/lib/error-handler.ts`

APIルートで発生したエラーを処理します。

```typescript
export function errorResponse(
  error: unknown,
  defaultMessage: string = "エラーが発生しました",
  statusCode: number = 500
): NextResponse {
  console.error("API Error:", error);

  // 本番環境では一般的なメッセージのみ
  if (isProduction()) {
    return NextResponse.json({
      success: false,
      error: defaultMessage,
      timestamp: new Date().toISOString(),
    }, { status: statusCode });
  }

  // 開発環境では詳細情報を含む
  return NextResponse.json({
    success: false,
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
  }, { status: statusCode });
}
```

**使用例**:

```typescript
export async function GET() {
  try {
    // API処理
  } catch (error) {
    return errorResponse(error, "データの取得に失敗しました");
  }
}
```

---

## 2. エラーレスポンスの種類

### 2.1 一般的なエラー

```typescript
errorResponse(error, "エラーが発生しました", 500)
```

### 2.2 バリデーションエラー

```typescript
validationErrorResponse({
  name: "商品名は必須です",
  price: "価格は0以上である必要があります"
})
```

### 2.3 認証エラー

```typescript
unauthorizedResponse("ログインが必要です")
```

### 2.4 権限エラー

```typescript
forbiddenResponse("この操作を実行する権限がありません")
```

### 2.5 リソースが見つからない

```typescript
notFoundResponse("商品")
```

---

## 3. Toast通知システム

### 3.1 基本的な使い方

**ファイル**: `src/components/ui/toast.tsx`

```typescript
import { useToast } from "@/components/ui/toast";

function MyComponent() {
  const { success, error, info, warning } = useToast();

  const handleSuccess = () => {
    success("保存しました", "データが正常に保存されました");
  };

  const handleError = () => {
    error("エラー", "データの保存に失敗しました");
  };

  const handleInfo = () => {
    info("お知らせ", "新しいバージョンが利用可能です");
  };

  const handleWarning = () => {
    warning("警告", "在庫が少なくなっています");
  };
}
```

### 3.2 Toast の種類

| 種類 | メソッド | 用途 | アイコン | カラー |
|------|---------|------|---------|--------|
| **Success** | `success()` | 操作成功 | ✓ | 緑 |
| **Error** | `error()` | エラー発生 | ✕ | 赤 |
| **Info** | `info()` | 情報通知 | ℹ | 青 |
| **Warning** | `warning()` | 警告 | ⚠ | オレンジ |

### 3.3 カスタム表示時間

```typescript
const { showToast } = useToast();

showToast({
  type: "success",
  title: "保存しました",
  message: "データが正常に保存されました",
  duration: 3000 // 3秒間表示
});
```

---

## 4. ローディング状態の管理

### 4.1 グローバルローディング

**ファイル**: `src/app/loading.tsx`

ページ遷移時に自動的に表示されます。

```typescript
export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      <p>読み込み中...</p>
    </div>
  );
}
```

### 4.2 コンポーネント内のローディング

```typescript
function MyComponent() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await api.submit();
      success("保存しました");
    } catch (error) {
      error("保存に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button disabled={isLoading}>
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          保存中...
        </>
      ) : (
        "保存"
      )}
    </Button>
  );
}
```

---

## 5. エラーログの記録

### 5.1 基本的なログ記録

```typescript
import { logError } from "@/lib/error-handler";

try {
  // 処理
} catch (error) {
  logError("order-creation", error, {
    userId: user.id,
    orderId: order.id
  });
}
```

### 5.2 本番環境でのログ記録

本番環境では、外部ログサービスにエラーを送信することを推奨します：

**Sentry の例**:

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.captureException(error, {
  tags: {
    component: "order-creation",
  },
  extra: {
    userId: user.id,
    orderId: order.id,
  },
});
```

---

## 6. ベストプラクティス

### 6.1 ユーザーフレンドリーなメッセージ

❌ **悪い例**:
```typescript
error("Error: ECONNREFUSED");
```

✅ **良い例**:
```typescript
error("接続エラー", "サーバーに接続できません。しばらくしてから再試行してください。");
```

### 6.2 適切なエラーハンドリング

```typescript
async function fetchData() {
  try {
    const response = await fetch("/api/data");
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || "データの取得に失敗しました");
    }
    
    return data.data;
  } catch (error) {
    console.error("Fetch error:", error);
    
    if (error instanceof TypeError) {
      // ネットワークエラー
      throw new Error("ネットワークエラーが発生しました");
    }
    
    throw error;
  }
}
```

### 6.3 楽観的UI更新

```typescript
const handleUpdate = async (id: number, newValue: string) => {
  // 即座にUIを更新（楽観的更新）
  setData(prev => prev.map(item => 
    item.id === id ? { ...item, value: newValue } : item
  ));
  
  try {
    await api.update(id, newValue);
    success("更新しました");
  } catch (error) {
    // エラー時は元に戻す
    setData(originalData);
    error("更新に失敗しました");
  }
};
```

### 6.4 リトライ機能

```typescript
async function fetchWithRetry(url: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      if (i === maxRetries - 1) {
        throw error;
      }
      // 指数バックオフで待機
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
}
```

---

## 7. 実装例

### 7.1 商品作成フォーム

```typescript
function ProductCreateForm() {
  const { success, error } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: ProductData) => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "商品の作成に失敗しました");
      }

      success("商品を作成しました", `${data.name} を登録しました`);
      router.push("/inventory");
    } catch (err) {
      console.error("Product creation error:", err);
      error(
        "作成に失敗しました",
        err instanceof Error ? err.message : "エラーが発生しました"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* フォームフィールド */}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            作成中...
          </>
        ) : (
          "作成"
        )}
      </Button>
    </form>
  );
}
```

---

## ✅ チェックリスト

- [ ] グローバルエラーハンドラーが実装されている
- [ ] ページレベルエラーハンドラーが実装されている
- [ ] APIエラーハンドラーが実装されている
- [ ] Toast通知システムが実装されている
- [ ] ローディング状態が適切に管理されている
- [ ] エラーログが記録されている
- [ ] ユーザーフレンドリーなエラーメッセージが表示される
- [ ] 本番環境では詳細なエラー情報が隠されている
- [ ] リトライ機能が実装されている（必要に応じて）

---

## 📚 参考資料

- [Next.js Error Handling](https://nextjs.org/docs/app/building-your-application/routing/error-handling)
- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Sentry（エラートラッキング）](https://sentry.io/)
- [LogRocket（セッションリプレイ）](https://logrocket.com/)
