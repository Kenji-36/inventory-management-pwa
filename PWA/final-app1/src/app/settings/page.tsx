"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User as UserIcon, Database, Bell, Shield, TestTube, Loader2, RefreshCw, CheckCircle, XCircle } from "lucide-react";

interface DbStatus {
  connected: boolean;
  message: string;
  database?: string;
  tables?: { name: string; count: number }[];
  version?: string;
}

export default function SettingsPage() {
  const [supaUser, setSupaUser] = useState<User | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [userRole, setUserRole] = useState<string>('読み込み中...');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setSupaUser(user));
    // API経由で実際のロールを取得
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setUserRole(data.user.isAdmin ? '管理者' : '一般ユーザー');
        } else {
          setUserRole('不明');
        }
      })
      .catch(() => setUserRole('取得エラー'));
  }, []);
  const [seedResult, setSeedResult] = useState<{ success: boolean; message: string } | null>(null);
  const [dbStatus, setDbStatus] = useState<DbStatus | null>(null);
  const [isCheckingDb, setIsCheckingDb] = useState(false);

  // データベース接続状態を確認
  const checkDbConnection = async () => {
    setIsCheckingDb(true);
    try {
      // 各テーブルを個別にチェック（エラーがあっても他のテーブルは確認を続行）
      const tableChecks = [
        { name: "商品 (products)", table: "products" },
        { name: "在庫 (stock)", table: "stock" },
        { name: "注文 (orders)", table: "orders" },
        { name: "入出庫履歴 (stock_movements)", table: "stock_movements" },
      ];

      const results: { name: string; count: number; ok: boolean }[] = [];
      let connectedCount = 0;

      for (const check of tableChecks) {
        const { count, error } = await supabase
          .from(check.table)
          .select('*', { count: 'exact', head: true });

        if (!error) {
          results.push({ name: check.name, count: count || 0, ok: true });
          connectedCount++;
        } else {
          results.push({ name: check.name, count: 0, ok: false });
        }
      }

      // 主要テーブル（products, stock）のどちらかに接続できれば「接続成功」とする
      const coreConnected = results.slice(0, 2).some(r => r.ok);

      if (coreConnected) {
        setDbStatus({
          connected: true,
          message: "接続成功",
          database: "Supabase PostgreSQL",
          tables: results
            .filter(r => r.ok)
            .map(r => ({ name: r.name, count: r.count })),
          version: "PostgreSQL 15",
        });
      } else {
        setDbStatus({
          connected: false,
          message: "データベースに接続できません",
        });
      }
    } catch (error) {
      console.error('Database connection check error:', error);
      setDbStatus({
        connected: false,
        message: "接続テストに失敗しました",
      });
    } finally {
      setIsCheckingDb(false);
    }
  };

  // 初回ロード時に接続状態を確認
  useEffect(() => {
    checkDbConnection();
  }, []);

  const handleSeedData = async () => {
    setIsSeeding(true);
    setSeedResult(null);
    
    try {
      const response = await fetch("/api/seed-data", {
        method: "POST",
      });
      const data = await response.json();
      
      if (data.success) {
        setSeedResult({
          success: true,
          message: data.message,
        });
      } else {
        setSeedResult({
          success: false,
          message: data.error || "データの追加に失敗しました",
        });
      }
    } catch (error) {
      setSeedResult({
        success: false,
        message: "通信エラーが発生しました",
      });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6">
        {/* ページヘッダー */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">設定</h1>
          <p className="text-gray-600">アカウント設定とシステム設定</p>
        </div>

        <div className="grid gap-6">
          {/* アカウント情報 */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-primary" />
                <CardTitle>アカウント情報</CardTitle>
              </div>
              <CardDescription>
                ログイン中のアカウント
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                {supaUser?.user_metadata?.avatar_url && (
                  <img
                    src={supaUser.user_metadata.avatar_url}
                    alt={supaUser.user_metadata?.name || "User"}
                    className="h-16 w-16 rounded-full"
                  />
                )}
                <div>
                  <p className="font-medium text-lg">
                    {supaUser?.email?.split('@')[0] || "ユーザー"}
                  </p>
                  <p className="text-gray-600">{supaUser?.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* データベース接続 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  <CardTitle>データベース接続</CardTitle>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={checkDbConnection}
                  disabled={isCheckingDb}
                >
                  {isCheckingDb ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <CardDescription>
                Supabase との連携状況
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isCheckingDb && !dbStatus ? (
                  <div className="flex items-center gap-2 p-4 rounded-xl bg-gray-50 border-2 border-gray-200">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                    <span className="text-gray-600 font-medium">接続状態を確認中...</span>
                  </div>
                ) : dbStatus?.connected ? (
                  <>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="bg-green-100 rounded-full p-2">
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <p className="font-bold text-green-900 text-lg">接続済み</p>
                          <p className="text-sm text-green-700 font-medium">
                            {dbStatus.database} に正常に接続されています
                          </p>
                        </div>
                      </div>
                      <span className="px-3 py-1.5 text-sm font-bold text-green-800 bg-green-200 rounded-full shadow-sm">
                        正常
                      </span>
                    </div>

                    {/* データベース情報 */}
                    <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
                      <div className="flex items-center gap-2 mb-3">
                        <Database className="w-5 h-5 text-blue-600" />
                        <p className="text-sm font-bold text-blue-900">データベース情報</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-blue-800 font-medium">データベース:</span>
                          <span className="text-sm font-bold text-blue-900">{dbStatus.database}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-blue-800 font-medium">バージョン:</span>
                          <span className="text-sm font-bold text-blue-900">{dbStatus.version}</span>
                        </div>
                      </div>
                    </div>

                    {/* テーブル情報 */}
                    {dbStatus.tables && dbStatus.tables.length > 0 && (
                      <div className="p-4 rounded-xl bg-white border-2 border-gray-200">
                        <p className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                          <Database className="w-4 h-4" />
                          利用可能なテーブル
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {dbStatus.tables.map((table, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-300 rounded-lg hover:shadow-md transition-shadow"
                            >
                              <span className="text-sm font-semibold text-gray-800">
                                {table.name}
                              </span>
                              <span className="px-2 py-1 text-xs font-bold text-blue-700 bg-blue-100 rounded-full">
                                {table.count} 件
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-300 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="bg-red-100 rounded-full p-2">
                          <XCircle className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                          <p className="font-bold text-red-900 text-lg">接続エラー</p>
                          <p className="text-sm text-red-700 font-medium">
                            {dbStatus?.message || "接続に失敗しました"}
                          </p>
                        </div>
                      </div>
                      <span className="px-3 py-1.5 text-sm font-bold text-red-800 bg-red-200 rounded-full shadow-sm">
                        エラー
                      </span>
                    </div>
                    <div className="p-4 rounded-xl bg-yellow-50 border-2 border-yellow-200">
                      <p className="text-sm text-yellow-900 font-medium">
                        <strong>対処方法:</strong> 環境変数（.env.local）にSupabaseの接続情報が正しく設定されているか確認してください。
                      </p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 通知設定 */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <CardTitle>通知設定</CardTitle>
              </div>
              <CardDescription>
                在庫アラートやシステム通知の設定
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                この機能は今後のアップデートで追加予定です
              </p>
            </CardContent>
          </Card>

          {/* 権限情報 */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle>権限情報</CardTitle>
              </div>
              <CardDescription>
                現在のユーザー権限
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  userRole === '管理者'
                    ? 'text-blue-800 bg-blue-100'
                    : 'text-gray-800 bg-gray-100'
                }`}>
                  {userRole}
                </span>
                <span className="text-sm text-gray-500">
                  {userRole === '管理者'
                    ? '（全ての機能にアクセス可能）'
                    : '（基本機能にアクセス可能）'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* テストデータ追加 */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TestTube className="h-5 w-5 text-primary" />
                <CardTitle>テストデータ</CardTitle>
              </div>
              <CardDescription>
                売上推移グラフ用のサンプルデータを追加
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  直近30日間のサンプル注文データをSupabaseに追加します。
                  ダッシュボードの売上推移グラフを確認するために使用できます。
                </p>
                
                <Button
                  onClick={handleSeedData}
                  disabled={isSeeding}
                  className="w-full sm:w-auto"
                >
                  {isSeeding ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      追加中...
                    </>
                  ) : (
                    <>
                      <TestTube className="w-4 h-4 mr-2" />
                      テストデータを追加
                    </>
                  )}
                </Button>

                {seedResult && (
                  <div
                    className={`p-3 rounded-lg ${
                      seedResult.success
                        ? "bg-green-50 border border-green-200 text-green-800"
                        : "bg-red-50 border border-red-200 text-red-800"
                    }`}
                  >
                    <p className="text-sm font-medium">
                      {seedResult.success ? "成功" : "エラー"}
                    </p>
                    <p className="text-sm">{seedResult.message}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
