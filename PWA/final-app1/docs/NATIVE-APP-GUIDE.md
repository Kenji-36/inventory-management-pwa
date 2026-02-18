# ネイティブアプリ化の検討ガイド

## 📅 作成日: 2026年2月18日

---

## 現状（PWA）の強み

| 項目 | 内容 |
|------|------|
| インストール | ブラウザから「ホーム画面に追加」で即利用可能 |
| 更新 | デプロイ後、自動で最新版に更新 |
| クロスプラットフォーム | iOS / Android / PC すべて同一コード |
| オフライン | Service Worker + キャッシュで基本対応済み |
| 開発コスト | Web技術のみで完結（React / Next.js） |

**結論: 現時点では PWA のままで十分な機能を提供できます。**

---

## ネイティブ化が必要になるケース

| ケース | 理由 |
|--------|------|
| バックグラウンドプッシュ通知が必須 | PWA のプッシュ通知は iOS Safari で制限あり |
| カメラ・Bluetooth 等のハードウェア連携 | ネイティブ API の方が安定・高機能 |
| App Store / Google Play での配布が必要 | 企業の MDM 管理やストア検索対応 |
| 高度なオフライン処理 | 大量データの同期や SQLite ローカル DB |

---

## 選択肢の比較

### 1. Capacitor（推奨）

| 項目 | 内容 |
|------|------|
| 概要 | 既存の Web アプリをそのままネイティブ化 |
| メリット | **コード変更が最小限**、Ionic チーム開発、活発なコミュニティ |
| デメリット | ネイティブ UI は使えない（Web ベース） |
| 学習コスト | **低**（既存コードをほぼそのまま利用） |
| 対応 | iOS / Android |

```bash
# 導入手順（概要）
npm install @capacitor/core @capacitor/cli
npx cap init "在庫管理" "com.example.inventory"
npx cap add ios
npx cap add android
npm run build && npx cap sync
```

### 2. React Native

| 項目 | 内容 |
|------|------|
| 概要 | React で書くネイティブアプリ |
| メリット | ネイティブ UI コンポーネントを使用、高パフォーマンス |
| デメリット | **既存コードの大幅な書き直しが必要** |
| 学習コスト | **中〜高**（React Native 固有の知識が必要） |
| 対応 | iOS / Android |

### 3. Expo（React Native ベース）

| 項目 | 内容 |
|------|------|
| 概要 | React Native をさらに簡単にしたフレームワーク |
| メリット | セットアップが簡単、OTA アップデート対応 |
| デメリット | 既存コードの書き直し必要、一部ネイティブ機能に制限 |
| 学習コスト | **中** |
| 対応 | iOS / Android / Web |

---

## 推奨ロードマップ

```
現在: PWA（十分な機能を提供中）
  ↓
必要に応じて: Capacitor でネイティブラッパー化
  ↓
さらに必要な場合: React Native / Expo で完全リビルド
```

### フェーズ1（現在）
- PWA として運用を継続
- Service Worker によるオフライン対応を強化
- Web Push API によるプッシュ通知を検討

### フェーズ2（ストア配布が必要な場合）
- Capacitor を導入
- 既存の Next.js コードをそのまま活用
- iOS / Android アプリとしてストアに公開

### フェーズ3（高度なネイティブ機能が必要な場合）
- React Native + Expo で再構築
- Supabase SDK はそのまま利用可能
- UI コンポーネントはネイティブ版に置き換え

---

## コスト見積もり

| アプローチ | 開発期間 | コスト |
|-----------|---------|--------|
| PWA のまま（現状） | 0日 | ¥0 |
| Capacitor 導入 | 3〜5日 | Apple Developer ($99/年) + Google Play ($25 一回) |
| React Native 移行 | 3〜6週間 | 上記 + 開発工数 |

---

## 参考リンク

- [Capacitor 公式](https://capacitorjs.com/)
- [React Native 公式](https://reactnative.dev/)
- [Expo 公式](https://expo.dev/)
- [PWA vs Native 比較](https://web.dev/articles/what-are-pwas)
