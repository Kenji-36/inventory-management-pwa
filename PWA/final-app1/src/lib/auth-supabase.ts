/**
 * Supabase 認証ヘルパー
 */

import { supabase } from "@/lib/supabase";
import { supabaseServer } from "@/lib/supabase-server";

/**
 * クライアントサイドで現在のユーザーを取得
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }
  
  return user;
}

/**
 * クライアントサイドでセッションを取得
 */
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session) {
    return null;
  }
  
  return session;
}

/**
 * サーバーサイドで現在のユーザーを取得
 */
export async function getCurrentUserServer() {
  const { data: { user }, error } = await supabaseServer.auth.getUser();
  
  if (error || !user) {
    return null;
  }
  
  return user;
}

/**
 * サーバーサイドでセッションを取得
 */
export async function getSessionServer() {
  const { data: { session }, error } = await supabaseServer.auth.getSession();
  
  if (error || !session) {
    return null;
  }
  
  return session;
}

/**
 * ログアウト
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    console.error('ログアウトエラー:', error);
    throw error;
  }
}
