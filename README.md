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
- `ai-context.json` / `llms.txt`：AI向け引き継ぎ入口
- `docs/`：現在構成、データ契約、UI制約、整備状況

GASコード、APIキー、スプレッドシート設定はこのリポジトリへ保存しません。

## Worker回帰テスト

Node.js 18以降で、追加パッケージなしで実行できます。

```bash
node scripts/test-worker-contract.mjs
```

確認対象は、静的配信、`OPTIONS /api`、POST制限、空body、GASへの送信形式、正常JSON応答、JSON不正時と通信失敗時の既存エラー契約です。
