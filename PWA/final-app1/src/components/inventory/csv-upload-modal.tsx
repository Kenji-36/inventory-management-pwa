"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Upload, FileText, AlertCircle, CheckCircle } from "lucide-react";

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface CsvUploadModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function CsvUploadModal({ onClose, onSuccess }: CsvUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message?: string;
    errors?: ValidationError[];
  } | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/csv/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setResult({
          success: true,
          message: data.message,
        });
        // 成功後、親コンポーネントに通知
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        setResult({
          success: false,
          message: data.error,
          errors: data.validationErrors,
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
      setResult({
        success: false,
        message: "アップロード中にエラーが発生しました",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    window.location.href = "/api/csv/download?type=template";
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            CSV一括インポート
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* テンプレートダウンロード */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">
              テンプレートファイル
            </h3>
            <p className="text-sm text-blue-700 mb-3">
              CSVテンプレートをダウンロードして、商品情報を入力してください。
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
              className="bg-white"
            >
              <FileText className="w-4 h-4 mr-2" />
              テンプレートをダウンロード
            </Button>
          </div>

          {/* ファイル選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CSVファイルを選択
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary hover:bg-gray-50 transition-colors"
            >
              {selectedFile ? (
                <div className="flex items-center justify-center gap-2">
                  <FileText className="w-6 h-6 text-primary" />
                  <span className="font-medium">{selectedFile.name}</span>
                  <span className="text-sm text-gray-500">
                    ({(selectedFile.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-600">
                    クリックしてファイルを選択
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    または、ファイルをドラッグ＆ドロップ
                  </p>
                </>
              )}
            </div>
          </div>

          {/* 結果表示 */}
          {result && (
            <div
              className={`rounded-lg p-4 ${
                result.success
                  ? "bg-green-50 text-green-800"
                  : "bg-red-50 text-red-800"
              }`}
            >
              <div className="flex items-start gap-2">
                {result.success ? (
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-medium">{result.message}</p>
                  {result.errors && result.errors.length > 0 && (
                    <ul className="mt-2 text-sm space-y-1">
                      {result.errors.slice(0, 5).map((err, i) => (
                        <li key={i}>
                          行{err.row}: {err.field} - {err.message}
                        </li>
                      ))}
                      {result.errors.length > 5 && (
                        <li>...他 {result.errors.length - 5} 件のエラー</li>
                      )}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* アクションボタン */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={isUploading}
            >
              キャンセル
            </Button>
            <Button
              className="flex-1"
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  処理中...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  インポート
                </>
              )}
            </Button>
          </div>

          {/* 注意事項 */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>• 商品IDが空の行は新規追加、値がある行は更新されます</p>
            <p>• 新規追加時は在庫数0で登録されます</p>
            <p>• CSVはUTF-8形式で保存してください</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
