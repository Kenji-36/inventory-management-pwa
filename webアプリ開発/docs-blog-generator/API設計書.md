# ブログ記事執筆支援Webアプリケーション API設計書

## 1. ドキュメント情報

**文書バージョン**: 1.0  
**作成日**: 2025年12月1日  
**最終更新日**: 2025年12月1日  
**関連ドキュメント**: システム設計書.md、機能要件書.md  
**APIバージョン**: v1

---

## 2. API概要

### 2.1 基本情報

| 項目 | 内容 |
|------|------|
| **ベースURL** | `https://your-domain.vercel.app/api` |
| **プロトコル** | HTTPS |
| **認証方式** | なし（MVP）/ Bearer Token（将来） |
| **データ形式** | JSON |
| **文字エンコーディング** | UTF-8 |
| **タイムゾーン** | UTC |

### 2.2 共通仕様

#### 2.2.1 リクエストヘッダー

```http
Content-Type: application/json
Accept: application/json
```

#### 2.2.2 レスポンス形式

**成功時**:
```json
{
  "success": true,
  "data": {
    // レスポンスデータ
  },
  "metadata": {
    "timestamp": "2025-12-01T12:00:00Z",
    "requestId": "uuid-string"
  }
}
```

**エラー時**:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ",
    "details": {} // オプション
  },
  "metadata": {
    "timestamp": "2025-12-01T12:00:00Z",
    "requestId": "uuid-string"
  }
}
```

#### 2.2.3 HTTPステータスコード

| コード | 説明 | 使用場面 |
|--------|------|----------|
| 200 | OK | 正常処理 |
| 201 | Created | リソース作成成功 |
| 400 | Bad Request | 入力値エラー |
| 401 | Unauthorized | 認証エラー（将来） |
| 403 | Forbidden | 権限エラー（将来） |
| 404 | Not Found | リソース未存在 |
| 429 | Too Many Requests | レート制限超過 |
| 500 | Internal Server Error | サーバーエラー |
| 502 | Bad Gateway | 外部API エラー |
| 504 | Gateway Timeout | タイムアウト |

---

## 3. エンドポイント一覧

### 3.1 エンドポイント概要

| エンドポイント | メソッド | 説明 | 認証 |
|---------------|---------|------|------|
| `/api/generate/headline` | POST | 見出し生成 | 不要 |
| `/api/generate/outline` | POST | 目次生成 | 不要 |
| `/api/generate/content` | POST | 本文生成（単一） | 不要 |
| `/api/generate/content/batch` | POST | 本文生成（一括） | 不要 |
| `/api/generate/content/stream` | POST | 本文生成（ストリーミング） | 不要 |
| `/api/health` | GET | ヘルスチェック | 不要 |

---

## 4. エンドポイント詳細

### 4.1 見出し生成API

#### 4.1.1 基本情報

```
POST /api/generate/headline
```

**説明**: 入力されたテーマをもとに、ブログ記事の見出し候補を複数生成します。

**レート制限**: 100リクエスト/時間

#### 4.1.2 リクエスト

**パラメータ**:

| パラメータ | 型 | 必須 | 説明 | 制約 |
|-----------|-----|------|------|------|
| `theme` | string | ✅ | 記事のテーマ | 1-500文字 |
| `count` | number | ❌ | 生成する見出しの数 | 1-10、デフォルト: 5 |
| `language` | string | ❌ | 言語 | "ja" or "en"、デフォルト: "ja" |
| `tone` | string | ❌ | トーン | "casual" or "formal"、デフォルト: "casual" |

**リクエスト例**:
```json
{
  "theme": "初心者向けのSEO対策の基本",
  "count": 5,
  "language": "ja",
  "tone": "casual"
}
```

**cURL例**:
```bash
curl -X POST https://your-domain.vercel.app/api/generate/headline \
  -H "Content-Type: application/json" \
  -d '{
    "theme": "初心者向けのSEO対策の基本",
    "count": 5
  }'
```

#### 4.1.3 レスポンス

**成功時（200 OK）**:
```json
{
  "success": true,
  "data": {
    "headlines": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "text": "初心者でも分かる！SEO対策の基本ステップ",
        "description": "この見出しでは、SEOの基礎から実践まで、初心者にも分かりやすく解説します。",
        "estimatedWordCount": 3000
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "text": "【2025年版】誰でもできるSEO対策完全ガイド",
        "description": "最新のSEOトレンドを踏まえた実践的な内容で、すぐに使えるテクニックを紹介します。",
        "estimatedWordCount": 3500
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "text": "SEO対策で検索順位を上げる7つの方法",
        "description": "具体的な施策を7つのステップで紹介し、実践しやすい構成になっています。",
        "estimatedWordCount": 2800
      }
    ]
  },
  "metadata": {
    "timestamp": "2025-12-01T12:00:00Z",
    "requestId": "req_abc123",
    "model": "gpt-4-turbo",
    "generationTime": 3.2,
    "tokensUsed": {
      "input": 150,
      "output": 420,
      "total": 570
    }
  }
}
```

**エラー時（400 Bad Request）**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "テーマは1文字以上500文字以内で入力してください",
    "details": {
      "field": "theme",
      "value": "",
      "constraint": "min: 1, max: 500"
    }
  },
  "metadata": {
    "timestamp": "2025-12-01T12:00:00Z",
    "requestId": "req_abc124"
  }
}
```

**エラー時（502 Bad Gateway）**:
```json
{
  "success": false,
  "error": {
    "code": "AI_SERVICE_ERROR",
    "message": "AI APIの呼び出しに失敗しました。しばらく待ってから再試行してください。",
    "details": {
      "provider": "openai",
      "statusCode": 500
    }
  },
  "metadata": {
    "timestamp": "2025-12-01T12:00:00Z",
    "requestId": "req_abc125"
  }
}
```

#### 4.1.4 バリデーション

| フィールド | ルール | エラーメッセージ |
|-----------|--------|-----------------|
| `theme` | 必須 | "テーマは必須項目です" |
| `theme` | 1-500文字 | "テーマは1文字以上500文字以内で入力してください" |
| `count` | 1-10 | "生成数は1から10の間で指定してください" |
| `language` | "ja" or "en" | "言語はjaまたはenを指定してください" |
| `tone` | "casual" or "formal" | "トーンはcasualまたはformalを指定してください" |

---

### 4.2 目次生成API

#### 4.2.1 基本情報

```
POST /api/generate/outline
```

**説明**: 選択された見出しをもとに、記事の目次（章立て）を生成します。

**レート制限**: 100リクエスト/時間

#### 4.2.2 リクエスト

**パラメータ**:

| パラメータ | 型 | 必須 | 説明 | 制約 |
|-----------|-----|------|------|------|
| `headline` | string | ✅ | 選択された見出し | 1-200文字 |
| `theme` | string | ✅ | 元のテーマ | 1-500文字 |
| `targetSections` | number | ❌ | 目標セクション数 | 3-10、デフォルト: 5 |
| `language` | string | ❌ | 言語 | "ja" or "en"、デフォルト: "ja" |

**リクエスト例**:
```json
{
  "headline": "初心者でも分かる！SEO対策の基本ステップ",
  "theme": "初心者向けのSEO対策の基本",
  "targetSections": 5,
  "language": "ja"
}
```

#### 4.2.3 レスポンス

**成功時（200 OK）**:
```json
{
  "success": true,
  "data": {
    "outline": [
      {
        "id": "outline_001",
        "level": 2,
        "text": "SEOとは？",
        "order": 1,
        "parentId": null,
        "estimatedWordCount": 400
      },
      {
        "id": "outline_002",
        "level": 3,
        "text": "SEOの定義",
        "order": 2,
        "parentId": "outline_001",
        "estimatedWordCount": 200
      },
      {
        "id": "outline_003",
        "level": 3,
        "text": "SEOの重要性",
        "order": 3,
        "parentId": "outline_001",
        "estimatedWordCount": 200
      },
      {
        "id": "outline_004",
        "level": 2,
        "text": "キーワード選定の方法",
        "order": 4,
        "parentId": null,
        "estimatedWordCount": 500
      },
      {
        "id": "outline_005",
        "level": 3,
        "text": "キーワードリサーチツール",
        "order": 5,
        "parentId": "outline_004",
        "estimatedWordCount": 250
      },
      {
        "id": "outline_006",
        "level": 3,
        "text": "競合分析の手法",
        "order": 6,
        "parentId": "outline_004",
        "estimatedWordCount": 250
      },
      {
        "id": "outline_007",
        "level": 2,
        "text": "コンテンツ最適化のポイント",
        "order": 7,
        "parentId": null,
        "estimatedWordCount": 600
      }
    ],
    "summary": {
      "totalSections": 7,
      "h2Count": 3,
      "h3Count": 4,
      "estimatedTotalWords": 2400
    }
  },
  "metadata": {
    "timestamp": "2025-12-01T12:05:00Z",
    "requestId": "req_abc126",
    "model": "gpt-4-turbo",
    "generationTime": 4.5,
    "tokensUsed": {
      "input": 250,
      "output": 650,
      "total": 900
    }
  }
}
```

#### 4.2.4 バリデーション

| フィールド | ルール | エラーメッセージ |
|-----------|--------|-----------------|
| `headline` | 必須 | "見出しは必須項目です" |
| `headline` | 1-200文字 | "見出しは1文字以上200文字以内で入力してください" |
| `theme` | 必須 | "テーマは必須項目です" |
| `targetSections` | 3-10 | "セクション数は3から10の間で指定してください" |

---

### 4.3 本文生成API（単一セクション）

#### 4.3.1 基本情報

```
POST /api/generate/content
```

**説明**: 目次の1つのセクションに対して本文を生成します。

**レート制限**: 100リクエスト/時間

#### 4.3.2 リクエスト

**パラメータ**:

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `outlineItem` | object | ✅ | 目次項目 |
| `outlineItem.id` | string | ✅ | 目次項目ID |
| `outlineItem.level` | number | ✅ | 見出しレベル（2 or 3） |
| `outlineItem.text` | string | ✅ | 見出しテキスト |
| `context` | object | ✅ | コンテキスト情報 |
| `context.headline` | string | ✅ | 記事の見出し |
| `context.theme` | string | ✅ | 記事のテーマ |
| `context.previousSections` | array | ❌ | 前のセクションの内容 |
| `context.nextSections` | array | ❌ | 次のセクションの見出し |
| `options` | object | ❌ | 生成オプション |
| `options.targetWordCount` | number | ❌ | 目標文字数（デフォルト: 500） |
| `options.tone` | string | ❌ | トーン（デフォルト: "casual"） |
| `options.includeExamples` | boolean | ❌ | 具体例を含める（デフォルト: true） |

**リクエスト例**:
```json
{
  "outlineItem": {
    "id": "outline_001",
    "level": 2,
    "text": "SEOとは？"
  },
  "context": {
    "headline": "初心者でも分かる！SEO対策の基本ステップ",
    "theme": "初心者向けのSEO対策の基本",
    "previousSections": [],
    "nextSections": [
      "キーワード選定の方法",
      "コンテンツ最適化のポイント"
    ]
  },
  "options": {
    "targetWordCount": 500,
    "tone": "casual",
    "includeExamples": true
  }
}
```

#### 4.3.3 レスポンス

**成功時（200 OK）**:
```json
{
  "success": true,
  "data": {
    "sectionId": "outline_001",
    "content": "SEO（Search Engine Optimization）とは、検索エンジン最適化のことを指します。\n\nGoogleやYahoo!などの検索エンジンで、自分のWebサイトが上位に表示されるように工夫することです。例えば、「東京 カフェ おすすめ」と検索したときに、あなたのカフェ紹介サイトが1ページ目に表示されるようにするための施策がSEOです。\n\n### なぜSEOが重要なのか\n\n検索結果の1ページ目に表示されるサイトは、2ページ目以降のサイトと比べて圧倒的に多くのアクセスを獲得できます。実際、検索結果の1位のサイトは、全体のクリック数の約30%を獲得すると言われています。\n\nSEO対策を行うことで、広告費をかけずに継続的にアクセスを増やすことができるため、ビジネスにとって非常に重要な施策となっています。",
    "wordCount": 487,
    "markdown": true,
    "sections": [
      {
        "type": "paragraph",
        "content": "SEO（Search Engine Optimization）とは..."
      },
      {
        "type": "heading",
        "level": 3,
        "content": "なぜSEOが重要なのか"
      },
      {
        "type": "paragraph",
        "content": "検索結果の1ページ目に表示されるサイトは..."
      }
    ]
  },
  "metadata": {
    "timestamp": "2025-12-01T12:10:00Z",
    "requestId": "req_abc127",
    "model": "gpt-4-turbo",
    "generationTime": 8.3,
    "tokensUsed": {
      "input": 450,
      "output": 1250,
      "total": 1700
    }
  }
}
```

---

### 4.4 本文生成API（一括）

#### 4.4.1 基本情報

```
POST /api/generate/content/batch
```

**説明**: 複数のセクションの本文を一括で生成します。

**レート制限**: 50リクエスト/時間

#### 4.4.2 リクエスト

**パラメータ**:

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `outlineItems` | array | ✅ | 目次項目の配列 |
| `context` | object | ✅ | コンテキスト情報 |
| `options` | object | ❌ | 生成オプション |

**リクエスト例**:
```json
{
  "outlineItems": [
    {
      "id": "outline_001",
      "level": 2,
      "text": "SEOとは？"
    },
    {
      "id": "outline_004",
      "level": 2,
      "text": "キーワード選定の方法"
    }
  ],
  "context": {
    "headline": "初心者でも分かる！SEO対策の基本ステップ",
    "theme": "初心者向けのSEO対策の基本"
  },
  "options": {
    "targetWordCount": 500,
    "tone": "casual"
  }
}
```

#### 4.4.3 レスポンス

**成功時（200 OK）**:
```json
{
  "success": true,
  "data": {
    "sections": [
      {
        "sectionId": "outline_001",
        "content": "SEO（Search Engine Optimization）とは...",
        "wordCount": 487,
        "status": "completed"
      },
      {
        "sectionId": "outline_004",
        "content": "キーワード選定は、SEO対策の中で最も重要な...",
        "wordCount": 523,
        "status": "completed"
      }
    ],
    "summary": {
      "totalSections": 2,
      "completedSections": 2,
      "failedSections": 0,
      "totalWordCount": 1010
    }
  },
  "metadata": {
    "timestamp": "2025-12-01T12:15:00Z",
    "requestId": "req_abc128",
    "model": "gpt-4-turbo",
    "generationTime": 15.7,
    "tokensUsed": {
      "input": 800,
      "output": 2500,
      "total": 3300
    }
  }
}
```

---

### 4.5 本文生成API（ストリーミング）

#### 4.5.1 基本情報

```
POST /api/generate/content/stream
```

**説明**: Server-Sent Events (SSE) を使用して、生成中の本文をリアルタイムにストリーミング配信します。

**レート制限**: 100リクエスト/時間

#### 4.5.2 リクエスト

パラメータは `/api/generate/content` と同じです。

#### 4.5.3 レスポンス

**Content-Type**: `text/event-stream`

**ストリーミングイベント**:

```
event: start
data: {"sectionId": "outline_001", "timestamp": "2025-12-01T12:20:00Z"}

event: chunk
data: {"text": "SEO（Search Engine Optimization）とは"}

event: chunk
data: {"text": "、検索エンジン最適化のことを指します。"}

event: chunk
data: {"text": "\n\nGoogleやYahoo!などの検索エンジンで"}

event: progress
data: {"wordCount": 50, "estimatedProgress": 10}

event: chunk
data: {"text": "、自分のWebサイトが上位に表示されるように"}

event: complete
data: {"sectionId": "outline_001", "totalWordCount": 487, "generationTime": 8.3}
```

**イベントタイプ**:

| イベント | 説明 | データ |
|---------|------|--------|
| `start` | 生成開始 | `{ sectionId, timestamp }` |
| `chunk` | テキストチャンク | `{ text }` |
| `progress` | 進捗状況 | `{ wordCount, estimatedProgress }` |
| `complete` | 生成完了 | `{ sectionId, totalWordCount, generationTime }` |
| `error` | エラー発生 | `{ code, message }` |

**クライアント側実装例**:
```typescript
const eventSource = new EventSource('/api/generate/content/stream');

eventSource.addEventListener('chunk', (event) => {
  const data = JSON.parse(event.data);
  appendText(data.text);
});

eventSource.addEventListener('complete', (event) => {
  const data = JSON.parse(event.data);
  console.log('完了:', data);
  eventSource.close();
});

eventSource.addEventListener('error', (event) => {
  const data = JSON.parse(event.data);
  console.error('エラー:', data);
  eventSource.close();
});
```

---

### 4.6 ヘルスチェックAPI

#### 4.6.1 基本情報

```
GET /api/health
```

**説明**: APIサーバーの稼働状態を確認します。

**レート制限**: なし

#### 4.6.2 レスポンス

**成功時（200 OK）**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "version": "1.0.0",
    "timestamp": "2025-12-01T12:25:00Z",
    "services": {
      "openai": "operational",
      "anthropic": "operational"
    }
  }
}
```

---

## 5. エラーコード一覧

### 5.1 クライアントエラー（4xx）

| コード | HTTPステータス | 説明 | 対処方法 |
|--------|---------------|------|----------|
| `INVALID_INPUT` | 400 | 入力値が不正 | リクエストパラメータを確認 |
| `VALIDATION_ERROR` | 400 | バリデーションエラー | エラー詳細を確認して修正 |
| `MISSING_REQUIRED_FIELD` | 400 | 必須フィールドが不足 | 必須パラメータを追加 |
| `INVALID_JSON` | 400 | JSONパースエラー | JSON形式を確認 |
| `UNAUTHORIZED` | 401 | 認証エラー | 認証情報を確認（将来） |
| `FORBIDDEN` | 403 | 権限エラー | アクセス権限を確認（将来） |
| `NOT_FOUND` | 404 | リソース未存在 | URLを確認 |
| `RATE_LIMIT_EXCEEDED` | 429 | レート制限超過 | しばらく待ってから再試行 |

### 5.2 サーバーエラー（5xx）

| コード | HTTPステータス | 説明 | 対処方法 |
|--------|---------------|------|----------|
| `INTERNAL_ERROR` | 500 | サーバー内部エラー | 運営に連絡 |
| `AI_SERVICE_ERROR` | 502 | AI APIエラー | しばらく待ってから再試行 |
| `SERVICE_UNAVAILABLE` | 503 | サービス利用不可 | メンテナンス情報を確認 |
| `TIMEOUT` | 504 | タイムアウト | リクエストを再送信 |
| `AI_RATE_LIMIT` | 502 | AI APIのレート制限 | しばらく待ってから再試行 |

---

## 6. レート制限

### 6.1 制限値

| エンドポイント | 制限 | ウィンドウ |
|---------------|------|-----------|
| `/api/generate/headline` | 100リクエスト | 1時間 |
| `/api/generate/outline` | 100リクエスト | 1時間 |
| `/api/generate/content` | 100リクエスト | 1時間 |
| `/api/generate/content/batch` | 50リクエスト | 1時間 |
| `/api/generate/content/stream` | 100リクエスト | 1時間 |
| 全体 | 500リクエスト | 1時間 |

### 6.2 レスポンスヘッダー

レート制限に関する情報はレスポンスヘッダーに含まれます：

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1701432000
```

| ヘッダー | 説明 |
|---------|------|
| `X-RateLimit-Limit` | 制限値 |
| `X-RateLimit-Remaining` | 残りリクエスト数 |
| `X-RateLimit-Reset` | リセット時刻（UNIXタイムスタンプ） |

### 6.3 制限超過時のレスポンス

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "リクエスト制限に達しました。しばらく待ってから再試行してください。",
    "details": {
      "limit": 100,
      "remaining": 0,
      "resetAt": "2025-12-01T13:00:00Z"
    }
  },
  "metadata": {
    "timestamp": "2025-12-01T12:30:00Z",
    "requestId": "req_abc129"
  }
}
```

---

## 7. 認証・認可（将来実装）

### 7.1 認証方式

**Bearer Token認証**:

```http
Authorization: Bearer <access_token>
```

### 7.2 トークン取得

```
POST /api/auth/login
```

**リクエスト**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**レスポンス**:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  }
}
```

---

## 8. ベストプラクティス

### 8.1 リトライ戦略

**推奨リトライ設定**:
- 最大リトライ回数: 3回
- 初回待機時間: 1秒
- 指数バックオフ: 2倍（1秒 → 2秒 → 4秒）

**リトライ対象エラー**:
- `TIMEOUT` (504)
- `AI_SERVICE_ERROR` (502)
- `SERVICE_UNAVAILABLE` (503)

**リトライ不要エラー**:
- `INVALID_INPUT` (400)
- `VALIDATION_ERROR` (400)
- `RATE_LIMIT_EXCEEDED` (429)

### 8.2 タイムアウト設定

| エンドポイント | 推奨タイムアウト |
|---------------|-----------------|
| `/api/generate/headline` | 30秒 |
| `/api/generate/outline` | 30秒 |
| `/api/generate/content` | 60秒 |
| `/api/generate/content/batch` | 120秒 |
| `/api/generate/content/stream` | 接続: 60秒、読み取り: なし |

### 8.3 エラーハンドリング例

```typescript
async function generateHeadline(theme: string) {
  try {
    const response = await fetch('/api/generate/headline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme }),
      signal: AbortSignal.timeout(30000), // 30秒タイムアウト
    });

    if (!response.ok) {
      const error = await response.json();
      
      if (error.error.code === 'RATE_LIMIT_EXCEEDED') {
        // レート制限エラー
        const resetAt = new Date(error.error.details.resetAt);
        throw new Error(`レート制限に達しました。${resetAt}以降に再試行してください。`);
      }
      
      throw new Error(error.error.message);
    }

    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('リクエストがタイムアウトしました');
    }
    throw error;
  }
}
```

---

## 9. 変更履歴

| バージョン | 日付 | 変更内容 | 担当者 |
|-----------|------|---------|--------|
| 1.0.0 | 2025-12-01 | 初版作成 | - |

---

## 10. 付録

### 10.1 OpenAPI仕様（Swagger）

完全なOpenAPI仕様は別ファイル `openapi.yaml` を参照してください。

### 10.2 Postmanコレクション

APIテスト用のPostmanコレクションは以下からダウンロード可能です：
- `blog-generator-api.postman_collection.json`

### 10.3 サンプルコード

#### TypeScript/React

```typescript
// hooks/useGenerateHeadline.ts
import { useMutation } from '@tanstack/react-query';

interface GenerateHeadlineRequest {
  theme: string;
  count?: number;
}

export function useGenerateHeadline() {
  return useMutation({
    mutationFn: async (data: GenerateHeadlineRequest) => {
      const response = await fetch('/api/generate/headline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error.message);
      }

      return response.json();
    },
    retry: (failureCount, error) => {
      // RATE_LIMIT_EXCEEDEDの場合はリトライしない
      if (error.message.includes('レート制限')) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
```

---

**文書バージョン**: 1.0  
**作成日**: 2025年12月1日  
**最終更新日**: 2025年12月1日  
**次回レビュー**: 実装完了後

