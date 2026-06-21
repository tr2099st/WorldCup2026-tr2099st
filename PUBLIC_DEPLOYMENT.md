# GitHub・Cloudflare Workers公開手順

このプロジェクトは、Cloudflare Workersの静的アセット機能とWorker APIを使い、APIトークンをブラウザやGitHubへ公開しない構成になっています。

## 公開構成

```text
友人のブラウザ
  ↓
Cloudflare Worker Static Assets（HTML・CSS・JavaScript）
  ↓
Worker API（worker.js）
  ↓
Football-Data.org API
```

APIトークンはCloudflareのSecretに保存され、Webページのソースには含まれません。

## GitHubへアップロードするもの

「ワールドカップアプリ」フォルダをGitHub Desktopでリポジトリとして追加し、以下をコミットします。

```text
assets/
css/
functions/
js/
worker.js
wrangler.jsonc
.dev.vars.example
.gitignore
index.html
PROJECT_POLICY.md
PUBLIC_DEPLOYMENT.md
README.md
```

## アップロード禁止

以下のファイルは秘密情報を含むため、絶対にGitHubへアップロードしません。

```text
js/config.local.js
.dev.vars
```

`.gitignore`には登録済みです。GitHub DesktopまたはGitコマンドを使えば自動的に除外されます。

GitHubのWeb画面から手動アップロードする場合は、上記2ファイルが選択されていないことを必ず確認してください。

## GitHub上の正しいファイル配置

`app.js`、`services`、`ui`をリポジトリ直下へ置いてはいけません。すべて`js`フォルダ内に配置します。

```text
js/
├── app.js
├── config.js
├── api/
│   └── footballDataApi.js
├── data/
│   └── demoData.js
├── services/
│   └── worldCupService.js
└── ui/
    └── render.js
```

次の配置は誤りです。

```text
app.js
services/
ui/
```

GitHubのWeb画面で更新する場合は、ローカルの`js`フォルダ自体をアップロードしてください。`js`フォルダの中身だけをリポジトリ直下へドラッグしないでください。

## Cloudflare Workersへ接続

1. Cloudflareの無料アカウントへログインします。
2. 「Workers & Pages」を開きます。
3. GitHubリポジトリに接続したWorkerを開きます。
4. Build commandは空欄、Deploy commandは `npx wrangler deploy` にします。
5. Root directoryは `/` のままにします。
6. Freeプランであることを確認してデプロイします。

支払い方法や有料プランを要求された場合は、登録せず作業を停止してください。

## APIトークンをCloudflareへ登録

1. 作成したWorkerプロジェクトを開きます。
2. 「Settings」→「Variables and Secrets」を開きます。
3. Production環境へSecretを追加します。
4. 名前を次のとおり入力します。

```text
FOOTBALL_DATA_API_TOKEN
```

5. 値へFootball-Data.orgの新しいAPIトークンを貼り付けます。
6. 「Encrypt」またはSecretとして保存します。
7. GitHubへ変更をコミットしてWorkerを再デプロイします。

トークンをGitHub、README、JavaScript、チャットへ貼らないでください。

## 「静的アセットだけのWorker」と表示された場合

以前のリポジトリにはWorker本体がなかったため、Cloudflareが静的アセット専用と認識していました。

現在は次のファイルを追加済みです。

```text
worker.js
wrangler.jsonc
```

これらをGitHubへアップロードして再デプロイすると、`/api/*`ではWorkerが実行され、それ以外では静的サイトが表示されます。

## 動作確認

Cloudflareから発行されたWorkers URLを開き、画面上部の状態が次になれば成功です。

```text
2026年大会・ライブAPI
```

以下になった場合は、Secret名や値を確認してください。

```text
2026年大会・デモデータ
```

## 無料枠を守る仕組み

- ブラウザの自動更新は1時間ごと
- Pages Function側でも成功レスポンスを1時間キャッシュ
- Football-Data.orgへのアクセス回数を抑制
- Cloudflare Freeプランのみを使用
- 課金設定や支払い方法は登録しない
