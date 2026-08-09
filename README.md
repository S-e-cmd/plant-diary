# 植物栽培管理日誌

Cloudflare Pages 配信用のWebアプリです。

## Cloudflare Pages

- フレームワークプリセット：なし
- ビルドコマンド：空欄
- ビルド出力ディレクトリ：`/`
- 本番ブランチ：`main`

`main` ブランチへ変更が反映されると、Cloudflare Pagesが自動デプロイします。

## ファイル

- `index.html`：アプリ画面、クライアント状態、表示・入力処理
- `client/weather-runtime.js` / `client/weather-utils.js`：天気判定責務
- `client/download-utils.js`：ブラウザBlobダウンロード責務
- `_worker.js`：`/api` とGAS間の通信境界、静的アセット配信
- `worker/gas-transport.js`：GASへのHTTP通信と上流JSON解析
- `scripts/test-worker-contract.mjs`：Worker通信契約の回帰テスト
- `scripts/check-client-contract.mjs`：クライアント構文・主要契約・分離済み責務の静的チェック
- `scripts/test-download-utils.mjs`：ブラウザダウンロードutilityの単体回帰テスト
- `package.json`：整備用チェックの統一実行入口
- `ai-context.json` / `llms.txt`：AI向け引き継ぎ入口
- `docs/`：現在構成、データ契約、UI制約、整備状況

GASコード、APIキー、スプレッドシート設定はこのリポジトリへ保存しません。

## 整備チェック

Node.js 18以降で、追加パッケージなしで実行できます。

```bash
npm test
```

個別実行も可能です。

```bash
npm run test:worker
npm run test:client
npm run test:download
npm run test:weather
```

Worker側は、静的配信、`OPTIONS /api`、POST制限、空body、GASへの送信形式、正常JSON応答、JSON不正時と通信失敗時の既存エラー契約を確認します。

クライアント側は、`index.html` のインラインJavaScriptと `client/*.js` を構文確認対象にします。same-origin `/api`、既存LocalStorageキー、主要DOM ID、天気判定・bootstrap周辺の主要関数と既存閾値を横断的に確認し、分離済みmoduleが `index.html` から実際に読み込まれていることも確認します。

ダウンロード責務については、Blob生成・object URL生成/解放・anchor downloadを `client/download-utils.js` に限定し、`index.html` へ再混在しないことを静的チェックします。専用テストではファイル名、MIME type、click、URL解放まで確認します。

クライアント分割は、DOM ID、state構造、LocalStorageキー、API payload、既存UI挙動を維持しながら、小さい責務単位で段階的に進めます。
