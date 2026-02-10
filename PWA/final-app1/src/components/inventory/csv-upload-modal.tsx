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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg bg-white shadow-2xl border-2 border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg pb-4">
          <CardTitle className="flex items-center gap-2 text-white font-bold">
            <Upload className="w-5 h-5" />
            CSV一括インポート
          </CardTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full"
          >
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6 bg-white p-6">
          {/* テンプレートダウンロード */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5 shadow-sm">
            <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              テンプレートファイル
            </h3>
            <p className="text-sm text-blue-800 mb-4">
              CSVテンプレートをダウンロードして、商品情報を入力してください。
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
              className="bg-white border-2 border-blue-300 hover:bg-blue-50 font-semibold"
            >
              <FileText className="w-4 h-4 mr-2" />
              テンプレートをダウンロード
            </Button>
          </div>

          {/* ファイル選択 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">
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
              className="border-3 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-all duration-200 bg-gradient-to-br from-gray-50 to-white"
            >
              {selectedFile ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="bg-purple-100 rounded-full p-3">
                    <FileText className="w-8 h-8 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-700 font-semibold text-lg">
                    クリックしてファイルを選択
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    または、ファイルをドラッグ＆ドロップ
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    対応形式: CSV (.csv)
                  </p>
                </>
              )}
            </div>
          </div>

          {/* 結果表示 */}
          {result && (
            <div
              className={`rounded-xl p-5 border-2 shadow-sm ${
                result.success
                  ? "bg-gradient-to-br from-green-50 to-emerald-50 text-green-800 border-green-300"
                  : "bg-gradient-to-br from-red-50 to-pink-50 text-red-800 border-red-300"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`rounded-full p-2 ${
                  result.success ? "bg-green-100" : "bg-red-100"
                }`}>
                  {result.success ? (
                    <CheckCircle className="w-6 h-6 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-6 h-6 flex-shrink-0" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-lg">{result.message}</p>
                  {result.errors && result.errors.length > 0 && (
                    <ul className="mt-3 text-sm space-y-2 bg-white/50 rounded-lg p-3 border border-red-200">
                      {result.errors.slice(0, 5).map((err, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-red-600 font-bold">•</span>
                          <span>
                            <strong>行{err.row}:</strong> {err.field} - {err.message}
                          </span>
                        </li>
                      ))}
                      {result.errors.length > 5 && (
                        <li className="text-red-600 font-semibold">
                          ...他 {result.errors.length - 5} 件のエラー
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* アクションボタン */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 h-12 border-2 border-gray-300 hover:bg-gray-100 font-semibold"
              onClick={onClose}
              disabled={isUploading}
            >
              キャンセル
            </Button>
            <Button
              className="flex-1 h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold shadow-lg disabled:opacity-50"
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin w-5 h-5 border-3 border-white border-t-transparent rounded-full" />
                  処理中...
                </span>
              ) : (
                <>
                  <Upload className="w-5 h-5 mr-2" />
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
