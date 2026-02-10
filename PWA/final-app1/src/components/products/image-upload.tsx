"use client";

import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import Image from "next/image";

interface ImageUploadProps {
  productId: number;
  currentImageUrl?: string | null;
  onUploadSuccess?: (imageUrl: string) => void;
  onDeleteSuccess?: () => void;
}

export function ImageUpload({
  productId,
  currentImageUrl,
  onUploadSuccess,
  onDeleteSuccess,
}: ImageUploadProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(currentImageUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { success: toastSuccess, error: toastError } = useToast();

  // ファイル選択ハンドラー
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // ファイルサイズチェック（5MB）
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toastError("ファイルサイズが大きすぎます（最大5MB）");
      return;
    }

    // ファイル形式チェック
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toastError("対応していない画像形式です（JPEG、PNG、WebPのみ）");
      return;
    }

    // プレビュー表示
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // アップロード実行
    handleUpload(file);
  };

  // 画像アップロード
  const handleUpload = async (file: File) => {
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/api/products/${productId}/image`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "画像のアップロードに失敗しました");
      }

      setImageUrl(data.data.imageUrl);
      setPreviewUrl(null);
      toastSuccess("画像をアップロードしました");
      onUploadSuccess?.(data.data.imageUrl);
    } catch (error) {
      console.error("Upload error:", error);
      toastError(error instanceof Error ? error.message : "画像のアップロードに失敗しました");
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
      // ファイル入力をリセット
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // 画像削除
  const handleDelete = async () => {
    if (!confirm("画像を削除しますか？")) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/products/${productId}/image`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "画像の削除に失敗しました");
      }

      setImageUrl(null);
      toastSuccess("画像を削除しました");
      onDeleteSuccess?.();
    } catch (error) {
      console.error("Delete error:", error);
      toastError(error instanceof Error ? error.message : "画像の削除に失敗しました");
    } finally {
      setIsDeleting(false);
    }
  };

  // ファイル選択ダイアログを開く
  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* 画像表示エリア */}
      <div className="relative w-full aspect-square max-w-md mx-auto border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50">
        {previewUrl ? (
          // プレビュー表示
          <div className="relative w-full h-full">
            <Image
              src={previewUrl}
              alt="プレビュー"
              fill
              className="object-contain"
            />
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-2"></div>
                <p>アップロード中...</p>
              </div>
            </div>
          </div>
        ) : imageUrl ? (
          // 既存画像表示
          <div className="relative w-full h-full group">
            <Image
              src={imageUrl}
              alt="商品画像"
              fill
              className="object-contain"
            />
            {/* 削除ボタン */}
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <X className="h-4 w-4" />
              )}
            </Button>
          </div>
        ) : (
          // 画像なし
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <ImageIcon className="h-16 w-16 mb-2" />
            <p className="text-sm">画像が登録されていません</p>
          </div>
        )}
      </div>

      {/* アップロードボタン */}
      <div className="flex justify-center">
        <Button
          onClick={openFileDialog}
          disabled={isUploading || isDeleting}
          className="w-full max-w-md"
        >
          <Upload className="h-4 w-4 mr-2" />
          {imageUrl ? "画像を変更" : "画像をアップロード"}
        </Button>
      </div>

      {/* 非表示のファイル入力 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* ヘルプテキスト */}
      <p className="text-xs text-gray-500 text-center">
        対応形式: JPEG、PNG、WebP（最大5MB）
      </p>
    </div>
  );
}
