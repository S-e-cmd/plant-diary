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
- `_worker.js`：`/api` とGAS間の通信境界、静的アセット配信
- `scripts/test-worker-contract.mjs`：Worker通信契約の回帰テスト
- `scripts/check-client-contract.mjs`：クライアント構文・主要契約の静的チェック
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
```

Worker側は、静的配信、`OPTIONS /api`、POST制限、空body、GASへの送信形式、正常JSON応答、JSON不正時と通信失敗時の既存エラー契約を確認します。

クライアント側は、`index.html` のインラインJavaScriptに加えて、今後分離する `client/*.js` も構文確認対象にします。same-origin `/api`、既存LocalStorageキー、主要DOM ID、天気判定・bootstrap周辺の主要関数と既存閾値を横断的に確認し、外部JSへ分離した場合は `index.html` から実際に読み込まれていることも確認します。

クライアント分割は、DOM ID、state構造、LocalStorageキー、API payload、既存UI挙動を維持しながら、小さい責務単位で段階的に進めます。
