'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Shield, Users, ScrollText, ArrowLeft, RefreshCw,
  UserCheck, UserX, Clock, AlertTriangle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// ============================================================
// 型定義
// ============================================================

interface UserData {
  id: string;
  email: string;
  name: string | null;
  role: string;
  created_at: string;
  updated_at: string;
}

interface AuditLogData {
  id: number;
  user_id: string | null;
  user_email: string | null;
  action: string;
  target_table: string | null;
  target_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

// ============================================================
// ユーザー管理コンポーネント
// ============================================================

function UserManagement() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
      } else {
        setError(data.error);
      }
    } catch {
      setError('ユーザー一覧の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdating(userId);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });
      const data = await res.json();
      if (data.success) {
        // ユーザー一覧を再取得
        await fetchUsers();
      } else {
        alert(data.error || 'ロールの変更に失敗しました');
      }
    } catch {
      alert('ロールの変更に失敗しました');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">読み込み中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-lg text-red-700">
        <AlertTriangle className="h-5 w-5 inline mr-2" />
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          全 {users.length} ユーザー（管理者: {users.filter(u => u.role === 'admin').length}名、
          一般: {users.filter(u => u.role === 'user').length}名）
        </p>
        <Button variant="outline" size="sm" onClick={fetchUsers}>
          <RefreshCw className="h-4 w-4 mr-1" />
          更新
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-600">ユーザー</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">メール</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">ロール</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">登録日</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    {user.role === 'admin' ? (
                      <Shield className="h-4 w-4 text-amber-500" />
                    ) : (
                      <UserCheck className="h-4 w-4 text-gray-400" />
                    )}
                    <span className="font-medium text-gray-900">
                      {user.name || '(未設定)'}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 text-gray-600">{user.email}</td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.role === 'admin' 
                      ? 'bg-amber-100 text-amber-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role === 'admin' ? '管理者' : '一般ユーザー'}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-500">
                  {new Date(user.created_at).toLocaleDateString('ja-JP')}
                </td>
                <td className="py-3 px-4">
                  {updating === user.id ? (
                    <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />
                  ) : (
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className="text-sm border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-gray-300"
                    >
                      <option value="user">一般ユーザー</option>
                      <option value="admin">管理者</option>
                    </select>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// 監査ログコンポーネント
// ============================================================

function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLogData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/audit-logs?limit=50');
      const data = await res.json();
      if (data.success) {
        setLogs(data.data);
        setTotal(data.total);
      } else {
        setError(data.error);
      }
    } catch {
      setError('監査ログの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const getActionLabel = (action: string) => {
    const labels: Record<string, { text: string; color: string }> = {
      create: { text: '作成', color: 'bg-green-100 text-green-800' },
      update: { text: '更新', color: 'bg-blue-100 text-blue-800' },
      delete: { text: '削除', color: 'bg-red-100 text-red-800' },
      login: { text: 'ログイン', color: 'bg-purple-100 text-purple-800' },
      logout: { text: 'ログアウト', color: 'bg-gray-100 text-gray-800' },
      role_change: { text: 'ロール変更', color: 'bg-amber-100 text-amber-800' },
      csv_import: { text: 'CSVインポート', color: 'bg-teal-100 text-teal-800' },
      csv_export: { text: 'CSVエクスポート', color: 'bg-indigo-100 text-indigo-800' },
    };
    return labels[action] || { text: action, color: 'bg-gray-100 text-gray-800' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">読み込み中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-lg text-red-700">
        <AlertTriangle className="h-5 w-5 inline mr-2" />
        {error}
        <p className="text-sm mt-2">
          ※ 初回はSupabaseでSQLスクリプトを実行する必要があります。
        </p>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <ScrollText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
        <p>監査ログはまだありません</p>
        <p className="text-sm mt-1">操作を行うと、ここにログが記録されます</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">全 {total} 件</p>
        <Button variant="outline" size="sm" onClick={fetchLogs}>
          <RefreshCw className="h-4 w-4 mr-1" />
          更新
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-600">日時</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">ユーザー</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">操作</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">対象</th>
              <th className="text-left py-3 px-4 font-medium text-gray-600">詳細</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => {
              const actionInfo = getActionLabel(log.action);
              return (
                <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                    <Clock className="h-3 w-3 inline mr-1" />
                    {new Date(log.created_at).toLocaleString('ja-JP', {
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {log.user_email || '(不明)'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${actionInfo.color}`}>
                      {actionInfo.text}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {log.target_table && (
                      <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                        {log.target_table}
                      </span>
                    )}
                    {log.target_id && (
                      <span className="text-xs text-gray-400 ml-1">#{log.target_id}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-gray-500 text-xs max-w-xs truncate">
                    {log.details ? JSON.stringify(log.details) : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// メインページ
// ============================================================

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'users' | 'audit'>('users');
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 管理者権限チェック
    const checkAdmin = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        // usersテーブルからロールを確認
        const res = await fetch('/api/admin/users');
        if (res.status === 403) {
          setIsAdmin(false);
        } else if (res.ok) {
          setIsAdmin(true);
        } else if (res.status === 401) {
          router.push('/login');
        } else {
          setIsAdmin(false);
        }
      } catch {
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [router]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </AppLayout>
    );
  }

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <UserX className="h-16 w-16 text-red-300 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">アクセス権限がありません</h2>
          <p className="text-gray-500 mb-6">
            このページは管理者のみアクセスできます。
          </p>
          <Button onClick={() => router.push('/')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            ダッシュボードに戻る
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="h-7 w-7 text-amber-500" />
              管理者ダッシュボード
            </h1>
            <p className="text-gray-500 mt-1">ユーザー管理と操作ログの確認</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => router.push('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            戻る
          </Button>
        </div>

        {/* タブ切り替え */}
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'users' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('users')}
            className={activeTab === 'users' ? 'bg-gray-800 text-white' : ''}
          >
            <Users className="h-4 w-4 mr-2" />
            ユーザー管理
          </Button>
          <Button
            variant={activeTab === 'audit' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('audit')}
            className={activeTab === 'audit' ? 'bg-gray-800 text-white' : ''}
          >
            <ScrollText className="h-4 w-4 mr-2" />
            監査ログ
          </Button>
        </div>

        {/* コンテンツ */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {activeTab === 'users' ? (
                <>
                  <Users className="h-5 w-5" />
                  ユーザー一覧・権限管理
                </>
              ) : (
                <>
                  <ScrollText className="h-5 w-5" />
                  操作ログ（監査ログ）
                </>
              )}
            </CardTitle>
            <CardDescription>
              {activeTab === 'users'
                ? 'ユーザーのロール（権限）を変更できます。ロール変更は監査ログに記録されます。'
                : 'ユーザーの操作履歴を確認できます。直近50件を表示しています。'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeTab === 'users' ? <UserManagement /> : <AuditLogViewer />}
          </CardContent>
        </Card>

        {/* 権限の説明 */}
        {activeTab === 'users' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">権限の説明</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-amber-50 rounded-lg">
                  <h4 className="font-semibold text-amber-900 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    管理者（admin）
                  </h4>
                  <ul className="mt-2 text-sm text-amber-800 space-y-1">
                    <li>- 全機能へのアクセス</li>
                    <li>- ユーザー管理（ロール変更）</li>
                    <li>- 監査ログの閲覧</li>
                    <li>- 商品の削除</li>
                    <li>- システム設定の変更</li>
                  </ul>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    一般ユーザー（user）
                  </h4>
                  <ul className="mt-2 text-sm text-gray-700 space-y-1">
                    <li>- 在庫管理（閲覧・追加・編集）</li>
                    <li>- 注文管理（閲覧・作成）</li>
                    <li>- ダッシュボードの閲覧</li>
                    <li>- CSVインポート/エクスポート</li>
                    <li>- バーコードスキャン</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
