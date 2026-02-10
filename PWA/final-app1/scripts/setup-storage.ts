/**
 * Supabase Storage セットアップスクリプト
 * 
 * このスクリプトは以下を実行します:
 * 1. product-images バケットの作成
 * 2. ストレージポリシーの設定
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// 環境変数を読み込み
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 環境変数が設定されていません');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupStorage() {
  console.log('🚀 Supabase Storage セットアップを開始します...\n');

  try {
    // 1. バケットの存在確認
    console.log('📦 バケットの確認中...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ バケット一覧の取得に失敗:', listError);
      throw listError;
    }

    const bucketExists = buckets?.some(bucket => bucket.name === 'product-images');

    if (bucketExists) {
      console.log('✅ product-images バケットは既に存在します');
    } else {
      // 2. バケットの作成
      console.log('📦 product-images バケットを作成中...');
      const { data: bucket, error: createError } = await supabase.storage.createBucket('product-images', {
        public: true, // 公開バケット（認証なしで画像を閲覧可能）
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
      });

      if (createError) {
        console.error('❌ バケットの作成に失敗:', createError);
        throw createError;
      }

      console.log('✅ product-images バケットを作成しました');
    }

    // 3. ストレージポリシーの設定
    console.log('\n🔒 ストレージポリシーを設定中...');
    
    // 注: ポリシーはSupabase Dashboardで手動設定するか、SQLで設定する必要があります
    console.log(`
📝 以下のSQLをSupabase Dashboard > SQL Editorで実行してください:

-- 1. 全ユーザーが画像を閲覧可能
CREATE POLICY "product_images_select_policy"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- 2. 認証済みユーザーが画像をアップロード可能
CREATE POLICY "product_images_insert_policy"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images'
  AND auth.role() = 'authenticated'
);

-- 3. 認証済みユーザーが画像を更新可能
CREATE POLICY "product_images_update_policy"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images'
  AND auth.role() = 'authenticated'
);

-- 4. 認証済みユーザーが画像を削除可能
CREATE POLICY "product_images_delete_policy"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images'
  AND auth.role() = 'authenticated'
);
    `);

    console.log('\n✅ セットアップが完了しました！');
    console.log('\n📌 次のステップ:');
    console.log('1. Supabase Dashboard > Storage > product-images を確認');
    console.log('2. 上記のSQLをSQL Editorで実行してポリシーを設定');
    console.log('3. 画像アップロード機能をテスト');

  } catch (error) {
    console.error('\n❌ セットアップ中にエラーが発生しました:', error);
    process.exit(1);
  }
}

setupStorage();
