/**
 * Service Worker for PWA
 * 
 * 機能:
 * - オフライン対応
 * - キャッシュ戦略
 * - バックグラウンド同期
 */

const CACHE_NAME = 'inventory-management-v1';
const RUNTIME_CACHE = 'runtime-cache-v1';

// キャッシュするリソース
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
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // すべてのクライアントを即座に制御
  self.clients.claim();
});

// フェッチ時
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 外部リソース（Supabase等）はキャッシュしない
  if (url.origin !== self.location.origin) {
    return;
  }

  // APIリクエストの処理
  if (url.pathname.startsWith('/api/')) {
    // POSTリクエストはキャッシュしない（書き込み操作のため）
    if (request.method !== 'GET') {
      return; // Service Workerを通さず、直接ネットワークリクエストを実行
    }

    event.respondWith(
      fetch(request)
        .then((response) => {
          // 成功したGETレスポンスのみキャッシュ
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // オフライン時はキャッシュから返す
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // キャッシュにもない場合はオフラインページ
            return caches.match('/offline');
          });
        })
    );
    return;
  }

  // GETリクエスト以外はキャッシュしない
  if (request.method !== 'GET') {
    return;
  }

  // 通常のページリクエスト: Network First戦略
  event.respondWith(
    fetch(request)
      .then((response) => {
        // 成功したレスポンスをキャッシュ
        const responseClone = response.clone();
        caches.open(RUNTIME_CACHE).then((cache) => {
          cache.put(request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // ネットワークエラー時はキャッシュから返す
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // キャッシュにもない場合はオフラインページ
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
