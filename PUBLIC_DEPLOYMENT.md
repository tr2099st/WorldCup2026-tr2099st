# GitHub・Cloudflare Pages公開手順

このプロジェクトは、APIトークンをブラウザやGitHubへ公開しない構成になっています。

## 公開構成

```text
友人のブラウザ
  ↓
Cloudflare Pages（HTML・CSS・JavaScript）
  ↓
Pages Functions（functions/api/[[path]].js）
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

## Cloudflare Pagesへ接続

1. Cloudflareの無料アカウントへログインします。
2. 「Workers & Pages」を開きます。
3. 「Create application」から「Pages」を選びます。
4. 「Connect to Git」を選び、作成したGitHubリポジトリを指定します。
5. Framework presetは「None」を選びます。
6. Build commandは空欄にします。
7. Build output directoryは `/` または空欄にします。
8. Freeプランであることを確認してデプロイします。

支払い方法や有料プランを要求された場合は、登録せず作業を停止してください。

## APIトークンをCloudflareへ登録

1. 作成したPagesプロジェクトを開きます。
2. 「Settings」→「Variables and Secrets」を開きます。
3. Production環境へSecretを追加します。
4. 名前を次のとおり入力します。

```text
FOOTBALL_DATA_API_TOKEN
```

5. 値へFootball-Data.orgの新しいAPIトークンを貼り付けます。
6. 「Encrypt」またはSecretとして保存します。
7. Pagesプロジェクトを再デプロイします。

トークンをGitHub、README、JavaScript、チャットへ貼らないでください。

## 動作確認

Cloudflareから発行されたURLを開き、画面上部の状態が次になれば成功です。

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
