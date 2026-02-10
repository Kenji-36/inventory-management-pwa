# Supabase セットアップガイド

## 目次
1. [Supabaseアカウント作成](#1-supabaseアカウント作成)
2. [プロジェクト作成](#2-プロジェクト作成)
3. [データベーススキーマ作成](#3-データベーススキーマ作成)
4. [画像ストレージ設定](#4-画像ストレージ設定)
5. [認証設定](#5-認証設定)
6. [環境変数設定](#6-環境変数設定)
7. [Supabase Clientのインストール](#7-supabase-clientのインストール)
8. [TypeScript型定義の生成](#8-typescript型定義の生成)

---

## 1. Supabaseアカウント作成

### 1.1 サインアップ

1. https://supabase.com/ にアクセス

2. 「Start your project」をクリック

3. サインアップ方法を選択:
   - GitHub アカウント（推奨）
   - Google アカウント
   - メールアドレス

4. アカウント情報を入力して登録完了

### 1.2 メール認証

1. 登録したメールアドレスに確認メールが届く

2. メール内のリンクをクリックして認証完了

---

## 2. プロジェクト作成

### 2.1 新規プロジェクト作成

1. Supabaseダッシュボードにログイン

2. 「New Project」をクリック

3. プロジェクト情報を入力:
   ```
   Name: inventory-management
   Database Password: [強力なパスワードを生成・保存]
   Region: Northeast Asia (Tokyo) - ap-northeast-1
   Pricing Plan: Free
   ```

4. 「Create new project」をクリック

5. プロジェクトの作成を待つ（約2分）

### 2.2 プロジェクト情報の確認

プロジェクトが作成されたら、以下の情報を確認・保存します：

1. 「Settings」→「API」を開く

2. 以下の情報をコピー:
   ```
   Project URL: https://xxxxx.supabase.co
   anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (秘密)
   ```

> ⚠️ **重要**: `service_role key` は絶対に公開しないでください

---

## 3. データベーススキーマ作成

### 3.1 SQL Editorを開く

1. 左サイドバーの「SQL Editor」をクリック

2. 「New query」をクリック

### 3.2 テーブル作成スクリプト

以下のSQLを実行してテーブルを作成します：

```sql
-- ========================================
-- 1. 更新日時自動更新関数
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 2. products テーブル（商品）
-- ========================================
CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  image_url TEXT,
  size VARCHAR(50) NOT NULL,
  product_code VARCHAR(100) NOT NULL,
  jan_code VARCHAR(13) UNIQUE NOT NULL,
  price_excluding_tax INTEGER NOT NULL CHECK (price_excluding_tax >= 0),
  price_including_tax INTEGER NOT NULL CHECK (price_including_tax >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_products_product_code ON products(product_code);
CREATE INDEX idx_products_jan_code ON products(jan_code);
CREATE INDEX idx_products_name ON products USING gin(to_tsvector('japanese', name));

-- 更新日時トリガー
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 3. stock テーブル（在庫）
-- ========================================
CREATE TABLE stock (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  last_stocked_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id)
);

-- インデックス
CREATE INDEX idx_stock_product_id ON stock(product_id);
CREATE INDEX idx_stock_quantity ON stock(quantity);

-- 更新日時トリガー
CREATE TRIGGER update_stock_updated_at
  BEFORE UPDATE ON stock
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 4. orders テーブル（注文）
-- ========================================
CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,
  item_count INTEGER NOT NULL CHECK (item_count > 0),
  total_price_excluding_tax INTEGER NOT NULL CHECK (total_price_excluding_tax >= 0),
  total_price_including_tax INTEGER NOT NULL CHECK (total_price_including_tax >= 0),
  order_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_orders_order_date ON orders(order_date DESC);

-- ========================================
-- 5. order_details テーブル（注文詳細）
-- ========================================
CREATE TABLE order_details (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_excluding_tax INTEGER NOT NULL CHECK (unit_price_excluding_tax >= 0),
  unit_price_including_tax INTEGER NOT NULL CHECK (unit_price_including_tax >= 0),
  subtotal_excluding_tax INTEGER NOT NULL CHECK (subtotal_excluding_tax >= 0),
  subtotal_including_tax INTEGER NOT NULL CHECK (subtotal_including_tax >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_order_details_order_id ON order_details(order_id);
CREATE INDEX idx_order_details_product_id ON order_details(product_id);

-- 更新日時トリガー
CREATE TRIGGER update_order_details_updated_at
  BEFORE UPDATE ON order_details
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 6. users テーブル（ユーザー）
-- ========================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- 更新日時トリガー
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 7. 新規ユーザー自動登録トリガー
-- ========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- 8. 在庫減算用関数
-- ========================================
CREATE OR REPLACE FUNCTION decrement_stock(
  p_product_id BIGINT,
  p_quantity INTEGER
)
RETURNS void AS $$
BEGIN
  UPDATE stock
  SET quantity = quantity - p_quantity
  WHERE product_id = p_product_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION '商品ID % の在庫が見つかりません', p_product_id;
  END IF;
END;
$$ LANGUAGE plpgsql;
```

### 3.3 実行

1. SQLをコピーしてSQL Editorに貼り付け

2. 「Run」ボタンをクリック

3. 「Success. No rows returned」と表示されれば成功

### 3.4 テーブル確認

1. 左サイドバーの「Table Editor」をクリック

2. 作成されたテーブルが表示されることを確認:
   - products
   - stock
   - orders
   - order_details
   - users

---

## 4. 画像ストレージ設定

### 4.1 Storageバケット作成

1. 左サイドバーの「Storage」をクリック

2. 「Create a new bucket」をクリック

3. バケット情報を入力:
   ```
   Name: product-images
   Public bucket: ON（チェックを入れる）
   File size limit: 5MB
   Allowed MIME types: image/jpeg, image/png, image/webp
   ```

4. 「Create bucket」をクリック

### 4.2 Storageポリシー設定

1. 作成した「product-images」バケットをクリック

2. 「Policies」タブをクリック

3. 「New Policy」をクリック

4. 以下のポリシーを作成:

#### ポリシー1: 画像閲覧（全ユーザー）

```sql
CREATE POLICY "product_images_select_policy"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');
```

#### ポリシー2: 画像アップロード（認証済みユーザー）

```sql
CREATE POLICY "product_images_insert_policy"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images'
  AND auth.role() = 'authenticated'
);
```

#### ポリシー3: 画像削除（認証済みユーザー）

```sql
CREATE POLICY "product_images_delete_policy"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images'
  AND auth.role() = 'authenticated'
);
```

---

## 5. 認証設定

### 5.1 Email認証の有効化

1. 左サイドバーの「Authentication」をクリック

2. 「Providers」タブをクリック

3. 「Email」プロバイダーを確認（デフォルトで有効）

4. 「Email」をクリックして設定を確認:
   ```
   Enable Email provider: ON
   Confirm email: ON（メール確認を必須にする）
   Secure email change: ON
   ```

5. 「Save」をクリック

### 5.2 Google OAuth Provider設定

1. 「Providers」タブで「Google」を探して「Enable」をクリック

2. Google OAuth情報を入力:
   ```
   Client ID: [Google Cloud Consoleから取得]
   Client Secret: [Google Cloud Consoleから取得]
   ```

3. 「Authorized redirect URIs」をコピー:
   ```
   https://[your-project-ref].supabase.co/auth/v1/callback
   ```

4. Google Cloud Consoleで上記URIを承認済みリダイレクトURIに追加

5. 「Save」をクリック

### 5.3 メールテンプレートのカスタマイズ（オプション）

1. 「Authentication」→「Email Templates」を開く

2. 以下のテンプレートをカスタマイズ可能:
   - Confirm signup（新規登録確認）
   - Invite user（ユーザー招待）
   - Magic Link（マジックリンクログイン）
   - Change Email Address（メールアドレス変更）
   - Reset Password（パスワードリセット）

3. 日本語化する場合は、各テンプレートを編集

### 5.4 リダイレクトURL設定

1. 「Authentication」→「URL Configuration」を開く

2. 「Site URL」を設定:
   ```
   Development: http://localhost:3000
   Production: https://your-app.vercel.app
   ```

3. 「Redirect URLs」に以下を追加:
   ```
   http://localhost:3000
   http://localhost:3000/api/auth/callback
   https://your-app.vercel.app
   https://your-app.vercel.app/api/auth/callback
   ```

4. 「Save」をクリック

> 💡 **ヒント**: 
> - Email認証では、ユーザーがメール内のリンクをクリックした後、Site URLにリダイレクトされます
> - Google OAuth認証では、`/api/auth/callback` にリダイレクトされます

---

## 6. 環境変数設定

### 6.1 .env.local ファイルを更新

既存の `.env.local` に以下を追加:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... # サーバーサイドのみ

# Google OAuth（既存）
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

### 6.2 .env.example を更新

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# NextAuth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

# アプリケーション設定
NODE_ENV=development
```

---

## 7. Supabase Clientのインストール

### 7.1 パッケージインストール

```bash
npm install @supabase/supabase-js @supabase/ssr
```

### 7.2 Supabase Clientの作成

#### クライアントサイド用

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
```

#### サーバーサイド用

```typescript
// lib/supabase-server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

export function createClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Server Component内でのset呼び出しは無視
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Server Component内でのremove呼び出しは無視
          }
        },
      },
    }
  );
}
```

---

## 8. TypeScript型定義の生成

### 8.1 Supabase CLIのインストール

```bash
npm install -g supabase
```

### 8.2 ログイン

```bash
supabase login
```

ブラウザが開くのでログインを完了します。

### 8.3 型定義の生成

```bash
supabase gen types typescript --project-id [your-project-ref] > types/supabase.ts
```

`[your-project-ref]` は、プロジェクトURLの `https://xxxxx.supabase.co` の `xxxxx` 部分です。

### 8.4 生成された型定義の確認

`types/supabase.ts` に以下のような型定義が生成されます:

```typescript
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: number
          name: string
          image_url: string | null
          size: string
          product_code: string
          jan_code: string
          price_excluding_tax: number
          price_including_tax: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          image_url?: string | null
          size: string
          product_code: string
          jan_code: string
          price_excluding_tax: number
          price_including_tax: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          image_url?: string | null
          size?: string
          product_code?: string
          jan_code?: string
          price_excluding_tax?: number
          price_including_tax?: number
          created_at?: string
          updated_at?: string
        }
      }
      // ... 他のテーブル
    }
  }
}
```

---

## 9. 動作確認

### 9.1 データベース接続テスト

```typescript
// scripts/test-supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function testConnection() {
  console.log('Supabase接続テスト開始...');

  // テストデータ挿入
  const { data: product, error: insertError } = await supabase
    .from('products')
    .insert({
      name: 'テスト商品',
      size: 'M',
      product_code: 'TEST-001',
      jan_code: '1234567890123',
      price_excluding_tax: 1000,
      price_including_tax: 1100,
    })
    .select()
    .single();

  if (insertError) {
    console.error('挿入エラー:', insertError);
    return;
  }

  console.log('商品を挿入しました:', product);

  // データ取得
  const { data: products, error: selectError } = await supabase
    .from('products')
    .select('*');

  if (selectError) {
    console.error('取得エラー:', selectError);
    return;
  }

  console.log('商品一覧:', products);

  // テストデータ削除
  const { error: deleteError } = await supabase
    .from('products')
    .delete()
    .eq('id', product.id);

  if (deleteError) {
    console.error('削除エラー:', deleteError);
    return;
  }

  console.log('テストデータを削除しました');
  console.log('✅ Supabase接続テスト成功！');
}

testConnection();
```

実行:

```bash
npx tsx scripts/test-supabase.ts
```

---

## 10. トラブルシューティング

### エラー: "Invalid API key"

- 環境変数が正しく設定されているか確認
- `.env.local` を再読み込み（開発サーバーを再起動）

### エラー: "Row Level Security policy violation"

- RLSポリシーが正しく設定されているか確認
- 認証が必要な操作の場合、ログインしているか確認

### エラー: "Foreign key constraint violation"

- 外部キー制約を確認
- 参照先のデータが存在するか確認

### 型定義が生成されない

- Supabase CLIが最新版か確認: `supabase --version`
- プロジェクトIDが正しいか確認
- ログインしているか確認: `supabase login`

---

## 11. 次のステップ

1. ✅ Supabaseセットアップ完了
2. 📝 データ移行スクリプトの作成
3. 🔧 API実装の移行
4. 🎨 フロントエンドの更新
5. 🖼️ 画像管理機能の実装

---

*作成日: 2026年2月7日*
*最終更新日: 2026年2月7日*
