/**
 * オフライン同期キュー
 *
 * ネットワーク切断中に行われた操作（API呼び出し）をキューに保存し、
 * オンライン復帰時に自動的に再送信する。
 */

const QUEUE_KEY = 'sync_queue';

export interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  body?: string;
  createdAt: number;
  retries: number;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function addToQueue(url: string, method: string, body?: object): void {
  try {
    const queue = getQueue();
    queue.push({
      id: generateId(),
      url,
      method,
      body: body ? JSON.stringify(body) : undefined,
      createdAt: Date.now(),
      retries: 0,
    });
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // localStorage 容量不足の場合は無視
  }
}

export function getQueue(): QueuedRequest[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function removeFromQueue(id: string): void {
  const queue = getQueue().filter(item => item.id !== id);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function clearQueue(): void {
  localStorage.removeItem(QUEUE_KEY);
}

/**
 * キュー内のリクエストを順番に送信
 * 成功したものはキューから削除、失敗したものはリトライカウントを増やして残す
 */
export async function processQueue(): Promise<{
  success: number;
  failed: number;
}> {
  const queue = getQueue();
  if (queue.length === 0) return { success: 0, failed: 0 };

  let success = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      const res = await fetch(item.url, {
        method: item.method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: item.body,
      });

      if (res.ok) {
        removeFromQueue(item.id);
        success++;
      } else {
        item.retries++;
        if (item.retries >= 3) {
          removeFromQueue(item.id);
        }
        failed++;
      }
    } catch {
      item.retries++;
      failed++;
    }
  }

  // リトライカウントが更新されたアイテムを保存
  const remaining = getQueue();
  localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));

  return { success, failed };
}

/**
 * オンライン復帰時に自動でキューを処理するリスナーを設定
 */
export function setupAutoSync(onSynced?: (result: { success: number; failed: number }) => void): () => void {
  const handler = async () => {
    const queue = getQueue();
    if (queue.length > 0) {
      const result = await processQueue();
      onSynced?.(result);
    }
  };

  window.addEventListener('online', handler);
  return () => window.removeEventListener('online', handler);
}
