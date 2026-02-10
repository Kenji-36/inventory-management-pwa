/**
 * 商品画像アップロードAPI
 * POST /api/products/[id]/image - 画像をアップロード
 * DELETE /api/products/[id]/image - 画像を削除
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

// 画像バリデーション設定
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const BUCKET_NAME = 'product-images';

/**
 * 画像アップロード
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);
    if (isNaN(productId)) {
      return NextResponse.json(
        { success: false, error: "無効な商品IDです" },
        { status: 400 }
      );
    }

    // フォームデータを取得
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "ファイルが指定されていません" },
        { status: 400 }
      );
    }

    // ファイルサイズチェック
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: `ファイルサイズが大きすぎます（最大${MAX_FILE_SIZE / 1024 / 1024}MB）` },
        { status: 400 }
      );
    }

    // MIMEタイプチェック
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "対応していない画像形式です（JPEG、PNG、WebPのみ）" },
        { status: 400 }
      );
    }

    // 商品の存在確認
    const { data: product, error: productError } = await supabaseServer
      .from('products')
      .select('id, name')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { success: false, error: "商品が見つかりません" },
        { status: 404 }
      );
    }

    // ファイル名を生成（商品ID_タイムスタンプ.拡張子）
    const timestamp = Date.now();
    const extension = file.name.split('.').pop() || 'jpg';
    const fileName = `products/${productId}_${timestamp}.${extension}`;

    // ファイルをArrayBufferに変換
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // バケットの存在確認と自動作成
    const { data: buckets } = await supabaseServer.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === BUCKET_NAME);
    if (!bucketExists) {
      console.log(`バケット '${BUCKET_NAME}' が存在しないため作成します`);
      const { error: createBucketError } = await supabaseServer.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: MAX_FILE_SIZE,
        allowedMimeTypes: ALLOWED_MIME_TYPES,
      });
      if (createBucketError) {
        console.error('Bucket creation error:', createBucketError);
        return NextResponse.json(
          { success: false, error: `ストレージバケットの作成に失敗しました: ${createBucketError.message}` },
          { status: 500 }
        );
      }
    }

    // Supabase Storageにアップロード
    const { error: uploadError } = await supabaseServer.storage
      .from(BUCKET_NAME)
      .upload(fileName, uint8Array, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { success: false, error: `画像のアップロードに失敗しました: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // 公開URLを取得
    const { data: urlData } = supabaseServer.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    const imageUrl = urlData.publicUrl;

    // データベースの image_url を更新
    const { error: updateError } = await supabaseServer
      .from('products')
      .update({ image_url: imageUrl })
      .eq('id', productId);

    if (updateError) {
      console.error('Database update error:', updateError);
      // アップロードした画像を削除
      await supabaseServer.storage.from(BUCKET_NAME).remove([fileName]);
      
      return NextResponse.json(
        { success: false, error: "データベースの更新に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        imageUrl,
        fileName,
        message: "画像をアップロードしました"
      }
    });

  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      { success: false, error: "画像のアップロード中にエラーが発生しました" },
      { status: 500 }
    );
  }
}

/**
 * 画像削除
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id);
    if (isNaN(productId)) {
      return NextResponse.json(
        { success: false, error: "無効な商品IDです" },
        { status: 400 }
      );
    }

    // 商品情報を取得
    const { data: product, error: productError } = await supabaseServer
      .from('products')
      .select('id, image_url')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { success: false, error: "商品が見つかりません" },
        { status: 404 }
      );
    }

    if (!product.image_url) {
      return NextResponse.json(
        { success: false, error: "削除する画像がありません" },
        { status: 400 }
      );
    }

    // URLからファイル名を抽出
    const url = new URL(product.image_url);
    const pathParts = url.pathname.split('/');
    const fileName = pathParts.slice(-2).join('/'); // products/xxx.jpg

    // Storageから画像を削除
    const { error: deleteError } = await supabaseServer.storage
      .from(BUCKET_NAME)
      .remove([fileName]);

    if (deleteError) {
      console.error('Storage delete error:', deleteError);
      // エラーでも続行（画像が既に削除されている可能性）
    }

    // データベースの image_url をクリア
    const { error: updateError } = await supabaseServer
      .from('products')
      .update({ image_url: null })
      .eq('id', productId);

    if (updateError) {
      console.error('Database update error:', updateError);
      return NextResponse.json(
        { success: false, error: "データベースの更新に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        message: "画像を削除しました"
      }
    });

  } catch (error) {
    console.error('Image delete error:', error);
    return NextResponse.json(
      { success: false, error: "画像の削除中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
