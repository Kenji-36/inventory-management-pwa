"use client";

import { useSession } from "next-auth/react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Database, Bell, Shield } from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();

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
                <User className="h-5 w-5 text-primary" />
                <CardTitle>アカウント情報</CardTitle>
              </div>
              <CardDescription>
                Googleアカウントでログインしています
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                {session?.user?.image && (
                  <img
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    className="h-16 w-16 rounded-full"
                  />
                )}
                <div>
                  <p className="font-medium text-lg">{session?.user?.name}</p>
                  <p className="text-gray-600">{session?.user?.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* データベース接続 */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                <CardTitle>データベース接続</CardTitle>
              </div>
              <CardDescription>
                Google Spreadsheet との連携状況
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                  <div>
                    <p className="font-medium text-yellow-800">未設定</p>
                    <p className="text-sm text-yellow-600">
                      Google Spreadsheet との連携が必要です
                    </p>
                  </div>
                  <span className="px-2 py-1 text-xs font-medium text-yellow-800 bg-yellow-200 rounded">
                    設定必要
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  連携するには、Google Cloud Platform でサービスアカウントを作成し、
                  環境変数を設定してください。
                </p>
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
                <span className="px-3 py-1 text-sm font-medium text-blue-800 bg-blue-100 rounded-full">
                  一般ユーザー
                </span>
                <span className="text-sm text-gray-500">
                  （権限はスプレッドシート連携後に反映されます）
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
