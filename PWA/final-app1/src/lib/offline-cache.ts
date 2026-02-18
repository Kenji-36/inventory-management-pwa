/**
 * オフラインデータキャッシュ
 *
 * localStorage を使って直近のデータを保存し、
 * ネットワーク切断時でも閲覧可能にする。
 */

const CACHE_PREFIX = 'offline_cache_';
const CACHE_EXPIRY_MS = 30 * 60 * 1000; // 30分

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export function saveToCache<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now() };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch {
    // localStorage がいっぱいの場合は古いキャッシュを削除
    clearExpiredCache();
    try {
      const entry: CacheEntry<T> = { data, timestamp: Date.now() };
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
    } catch {
      // それでも失敗したら無視
    }
  }
}

export function loadFromCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() - entry.timestamp > CACHE_EXPIRY_MS) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

export function clearExpiredCache(): void {
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX));
    for (const key of keys) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const entry = JSON.parse(raw);
        if (Date.now() - entry.timestamp > CACHE_EXPIRY_MS) {
          localStorage.removeItem(key);
        }
      } catch {
        localStorage.removeItem(key);
      }
    }
  } catch {
    // 無視
  }
}
