# World Cup 2026 Tracker

2026年ワールドカップの順位表、試合結果、決勝トーナメント、最少失点、最多得点を表示するWebアプリです。

## 重要な費用ルール

- 有料サービスは禁止
- 無料プランのみ使用
- クレジットカードや支払い方法を登録しない
- 従量課金や自動課金を有効にしない
- 有料サービスが必要な場合は、導入前に必ずユーザーへ報告する

詳細は [PROJECT_POLICY.md](./PROJECT_POLICY.md) を参照してください。

## 公開構成

公開版はCloudflare PagesとPages Functionsを使用します。

```text
ブラウザ
  ↓
Cloudflare Pages
  ↓
Pages Functions
  ↓
Football-Data.org
```

APIトークンはCloudflareのSecretに保存します。JavaScriptやGitHubリポジトリには保存しません。

公開手順は [PUBLIC_DEPLOYMENT.md](./PUBLIC_DEPLOYMENT.md) を参照してください。

## 主な機能

- スマートフォン・タブレット・PC対応
- 順位表と試合結果
- 勝点、得点、失点、得失点差
- 決勝トーナメントの勝ち上がり表
- 最少失点ランキング
- 応募対象国と応募者情報
- 国別最多得点ランキング
- 1時間ごとの自動更新
- API接続失敗時のデモデータ表示

## ローカルで画面を確認

```powershell
python -m http.server 8080
```

ブラウザで次を開きます。

```text
http://localhost:8080
```

通常のPythonサーバーではPages Functionsが動かないため、ローカル画面ではデモデータへ切り替わります。本番のCloudflare PagesではライブAPIを利用できます。

## GitHubへアップロードしないファイル

```text
js/config.local.js
.dev.vars
```

これらは`.gitignore`へ登録済みです。

## ディレクトリ構成

```text
.
├── assets/
├── css/
├── functions/
│   └── api/
│       └── [[path]].js
├── js/
├── .dev.vars.example
├── .gitignore
├── index.html
├── PROJECT_POLICY.md
├── PUBLIC_DEPLOYMENT.md
└── README.md
```

