/**
 * Service Worker for PWA
 * 
 * 機能:
 * - オフライン対応
 * - キャッシュ戦略
 * - バックグラウンド同期
 */

const CACHE_NAME = 'inventory-management-v2';
const RUNTIME_CACHE = 'runtime-cache-v2';
const IMAGE_CACHE = 'image-cache-v1';
const MAX_RUNTIME_CACHE_ITEMS = 50;
const MAX_IMAGE_CACHE_ITEMS = 30;

const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon.svg',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg'
];

// インストール時
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  
  // 新しいService Workerを即座にアクティブ化
  self.skipWaiting();
});

// アクティベーション時
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  
  const validCaches = [CACHE_NAME, RUNTIME_CACHE, IMAGE_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => !validCaches.includes(cacheName))
          .map((cacheName) => {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
  
  // すべてのクライアントを即座に制御
  self.clients.claim();
});

// キャッシュサイズ制限: 古いエントリを削除
async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    await cache.delete(keys[0]);
    return trimCache(cacheName, maxItems);
  }
}

// フェッチ時
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // GETリクエスト以外はキャッシュしない
  if (request.method !== 'GET') {
    return;
  }

  // 外部リソース（Supabase Storage の画像）: Cache First
  if (url.origin !== self.location.origin) {
    if (request.destination === 'image') {
      event.respondWith(
        caches.match(request).then((cached) => {
          if (cached) return cached;
          return fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(IMAGE_CACHE).then((cache) => {
                cache.put(request, clone);
                trimCache(IMAGE_CACHE, MAX_IMAGE_CACHE_ITEMS);
              });
            }
            return response;
          }).catch(() => new Response('', { status: 408 }));
        })
      );
      return;
    }
    return;
  }

  // APIリクエスト: Stale-While-Revalidate
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, clone);
              trimCache(RUNTIME_CACHE, MAX_RUNTIME_CACHE_ITEMS);
            });
          }
          return response;
        }).catch(() => {
          if (cached) return cached;
          return caches.match('/offline');
        });
        return cached || fetchPromise;
      })
    );
    return;
  }

  // 静的アセット（アイコン、フォント）: Cache First
  if (url.pathname.startsWith('/icons/') || url.pathname.startsWith('/fonts/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        return cached || fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // 通常のページリクエスト: Network First
  event.respondWith(
    fetch(request)
      .then((response) => {
        const clone = response.clone();
        caches.open(RUNTIME_CACHE).then((cache) => {
          cache.put(request, clone);
          trimCache(RUNTIME_CACHE, MAX_RUNTIME_CACHE_ITEMS);
        });
        return response;
      })
      .catch(() => {
        return caches.match(request).then((cached) => {
          if (cached) return cached;
          if (request.mode === 'navigate') {
            return caches.match('/offline');
          }
        });
      })
  );
});

// バックグラウンド同期
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncOrders());
  }
});

// 注文の同期処理
async function syncOrders() {
  try {
    // IndexedDBから未送信の注文を取得
    // 実装は省略（必要に応じて追加）
    console.log('[SW] Syncing orders...');
  } catch (error) {
    console.error('[SW] Sync failed:', error);
  }
}

// プッシュ通知
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : '新しい通知があります',
    icon: '/icons/icon-192x192.svg',
    badge: '/icons/icon.svg',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };
  
  event.waitUntil(
    self.registration.showNotification('在庫管理システム', options)
  );
});

// 通知クリック時
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});
