"use client";

import { useState, useRef, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, Image as ImageIcon, Loader2, AlertCircle } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/components/ui/toast";

interface ImageUploadProps {
  productId: number;
  currentImageUrl?: string | null;
  onUploadSuccess: (imageUrl: string) => void;
  onDeleteSuccess: () => void;
}

export function ImageUpload({
  productId,
  currentImageUrl,
  onUploadSuccess,
  onDeleteSuccess,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { success, error: showError } = useToast();

  // ファイル選択
  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // ファイルサイズチェック（5MB）
    if (file.size > 5 * 1024 * 1024) {
      setError("ファイルサイズが大きすぎます（最大5MB）");
      return;
    }

    // ファイル形式チェック
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError("対応していない画像形式です（JPEG、PNG、WebPのみ）");
      return;
    }

    // プレビュー表示
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // アップロード実行
    handleUpload(file);
  };

  // 画像アップロード
  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/products/${productId}/image`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        onUploadSuccess(data.data.imageUrl);
        setPreviewUrl(null);
        success("画像をアップロードしました", "商品画像が正常に保存されました");
      } else {
        setError(data.error || "アップロードに失敗しました");
        setPreviewUrl(null);
        showError("アップロード失敗", data.error || "画像のアップロードに失敗しました");
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError("アップロード中にエラーが発生しました");
      setPreviewUrl(null);
      showError("エラー", "アップロード中にエラーが発生しました");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 画像削除
  const handleDelete = async () => {
    if (!confirm('画像を削除してもよろしいですか？')) return;

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/products/${productId}/image`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        onDeleteSuccess();
        success("画像を削除しました", "商品画像が正常に削除されました");
      } else {
        setError(data.error || "削除に失敗しました");
        showError("削除失敗", data.error || "画像の削除に失敗しました");
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError("削除中にエラーが発生しました");
      showError("エラー", "削除中にエラーが発生しました");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* エラー表示 */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 現在の画像 */}
      {currentImageUrl && !previewUrl && (
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">現在の画像</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      削除中...
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4 mr-1" />
                      削除
                    </>
                  )}
                </Button>
              </div>
              <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-gray-100">
                <Image
                  src={currentImageUrl}
                  alt="商品画像"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 400px"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* プレビュー */}
      {previewUrl && (
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">アップロード中...</p>
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
              <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-gray-100">
                <Image
                  src={previewUrl}
                  alt="プレビュー"
                  fill
                  className="object-cover opacity-50"
                  sizes="(max-width: 768px) 100vw, 400px"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* アップロードボタン */}
      {!isUploading && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isDeleting}
            className="w-full gap-2"
            variant={currentImageUrl ? "outline" : "default"}
          >
            <Upload className="w-4 h-4" />
            {currentImageUrl ? "画像を変更" : "画像をアップロード"}
          </Button>
        </div>
      )}

      {/* 注意事項 */}
      <Card className="border-0 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-2 text-blue-600">
            <ImageIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="text-sm space-y-1">
              <p className="font-medium">画像アップロードの注意事項</p>
              <ul className="list-disc list-inside space-y-0.5 text-blue-600/80">
                <li>対応形式: JPEG、PNG、WebP</li>
                <li>最大ファイルサイズ: 5MB</li>
                <li>推奨サイズ: 800x800px以上</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
