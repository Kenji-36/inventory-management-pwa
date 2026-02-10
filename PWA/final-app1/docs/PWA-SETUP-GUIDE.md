# 📱 PWA（Progressive Web App）セットアップガイド

このガイドでは、アプリをPWAとしてインストールし、オフライン対応を確認する方法を説明します。

## 🎯 PWAの特徴

- ✅ **ホーム画面に追加**: アプリのようにインストール可能
- ✅ **オフライン対応**: インターネット接続がなくても一部機能が利用可能
- ✅ **高速起動**: Service Workerによるキャッシュで高速表示
- ✅ **プッシュ通知**: 在庫アラートなどの通知を受信可能（今後実装予定）
- ✅ **自動更新**: 新しいバージョンが利用可能になると自動通知

---

## ステップ1: PWA機能の確認

### 1.1 実装済みファイル

以下のファイルが実装されています：

| ファイル | 説明 |
|---------|------|
| `public/manifest.json` | PWAマニフェスト（アプリ名、アイコン、テーマカラー等） |
| `public/sw.js` | Service Worker（キャッシュ戦略、オフライン対応） |
| `src/components/providers/pwa-provider.tsx` | PWAプロバイダー（インストールプロンプト、更新通知） |
| `src/app/offline/page.tsx` | オフラインページ |
| `public/icons/icon.svg` | アプリアイコン（SVG） |
| `public/icons/icon-192x192.svg` | アプリアイコン（192x192） |
| `public/icons/icon-512x512.svg` | アプリアイコン（512x512） |

### 1.2 機能確認

1. **開発サーバーを起動**

```bash
npm run dev
```

2. **ブラウザで開く**

```
http://localhost:3000
```

3. **開発者ツールを開く**（F12）

4. **Application タブ > Service Workers** を確認

以下が表示されれば成功です：

```
✅ Service Worker registered
Status: activated
```

---

## ステップ2: PWAとしてインストール

### 2.1 デスクトップ（Chrome/Edge）

1. ブラウザのアドレスバー右側に**インストールアイコン**（⊕）が表示される
2. クリックして「インストール」を選択
3. または、画面右下に表示される**インストールプロンプト**から「インストール」をクリック

### 2.2 モバイル（iOS Safari）

1. Safari でアプリを開く
2. 画面下部の**共有ボタン**（□↑）をタップ
3. **「ホーム画面に追加」**をタップ
4. アプリ名を確認して**「追加」**をタップ

### 2.3 モバイル（Android Chrome）

1. Chrome でアプリを開く
2. 画面右下に表示される**インストールプロンプト**から「インストール」をタップ
3. または、メニュー（⋮）> **「ホーム画面に追加」**をタップ

---

## ステップ3: オフライン機能のテスト

### 3.1 オフラインモードの有効化

**方法1: 開発者ツール**

1. 開発者ツール（F12）を開く
2. **Network タブ**を選択
3. **Offline** にチェックを入れる

**方法2: 実際にネットワークを切断**

1. Wi-Fiをオフにする
2. または、機内モードをオンにする

### 3.2 オフライン動作の確認

1. **ページをリロード**（F5）
2. 以下を確認：
   - ✅ ページが表示される（キャッシュから読み込み）
   - ✅ 既存のデータが表示される
   - ✅ 新しいデータの取得に失敗した場合、オフラインページが表示される

### 3.3 オンラインに戻る

1. ネットワーク接続を復元
2. **「再接続を試す」**ボタンをクリック
3. データが自動的に同期される

---

## ステップ4: キャッシュ戦略の理解

### 4.1 キャッシュの種類

| キャッシュ名 | 内容 | 戦略 |
|-------------|------|------|
| `inventory-management-v1` | 静的アセット（HTML、CSS、JS、アイコン） | Install時にキャッシュ |
| `runtime-cache-v1` | 動的コンテンツ（APIレスポンス、画像） | Network First |

### 4.2 キャッシュ戦略

**Network First（ネットワーク優先）**
- まずネットワークからデータを取得
- 失敗した場合はキャッシュから返す
- 常に最新のデータを表示

**Cache First（キャッシュ優先）**
- まずキャッシュからデータを取得
- キャッシュにない場合はネットワークから取得
- 高速表示が可能

### 4.3 キャッシュのクリア

**開発者ツールから**

1. 開発者ツール（F12）を開く
2. **Application タブ > Storage**
3. **Clear site data** をクリック

**プログラムから**

```javascript
// Service Workerのキャッシュをクリア
caches.keys().then((names) => {
  names.forEach((name) => {
    caches.delete(name);
  });
});
```

---

## ステップ5: 更新通知の確認

### 5.1 新しいバージョンのデプロイ

1. コードを変更
2. `public/sw.js` の `CACHE_NAME` を更新

```javascript
const CACHE_NAME = 'inventory-management-v2'; // v1 → v2
```

3. アプリをリロード

### 5.2 更新プロンプトの表示

画面右下に**更新プロンプト**が表示されます：

```
🔄 新しいバージョン
アプリの新しいバージョンが利用可能です
[更新] [後で]
```

### 5.3 更新の適用

1. **「更新」**ボタンをクリック
2. ページが自動的にリロードされる
3. 新しいバージョンが適用される

---

## ✅ PWAセットアップ完了チェックリスト

- [ ] Service Workerが正常に登録されている
- [ ] マニフェストファイルが読み込まれている
- [ ] アプリアイコンが表示される
- [ ] インストールプロンプトが表示される
- [ ] PWAとしてインストールできる
- [ ] オフラインページが表示される
- [ ] オフライン時もキャッシュからページが表示される
- [ ] オンラインに戻ると自動的に同期される
- [ ] 更新プロンプトが表示される

---

## 🔧 トラブルシューティング

### Service Workerが登録されない

**症状**: 開発者ツールに Service Worker が表示されない

**解決方法**:
1. HTTPSまたはlocalhostで実行しているか確認
2. `public/sw.js` ファイルが存在するか確認
3. ブラウザのキャッシュをクリア
4. Service Workerの登録を解除して再登録

```javascript
navigator.serviceWorker.getRegistrations().then((registrations) => {
  registrations.forEach((registration) => {
    registration.unregister();
  });
});
```

### インストールプロンプトが表示されない

**症状**: インストールボタンが表示されない

**解決方法**:
1. `manifest.json` が正しく読み込まれているか確認
2. アプリがPWAの要件を満たしているか確認：
   - ✅ HTTPS（またはlocalhost）
   - ✅ Service Worker登録済み
   - ✅ マニフェストファイル
   - ✅ アイコン（192x192、512x512）
3. 既にインストール済みの場合は表示されない

### オフラインページが表示されない

**症状**: オフライン時に真っ白なページが表示される

**解決方法**:
1. Service Workerのキャッシュに `/offline` が含まれているか確認
2. `src/app/offline/page.tsx` が存在するか確認
3. Service Workerを再登録

### キャッシュが更新されない

**症状**: コードを変更してもアプリに反映されない

**解決方法**:
1. `CACHE_NAME` を変更（例: `v1` → `v2`）
2. 開発者ツールで **Update on reload** にチェック
3. ハードリロード（Ctrl + Shift + R）

---

## 📚 参考資料

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Workbox（Service Workerライブラリ）](https://developers.google.com/web/tools/workbox)

---

## 🎉 次のステップ

PWAのセットアップが完了したら、次は**エラーハンドリングとユーザーフィードバックの改善**に進みます！
