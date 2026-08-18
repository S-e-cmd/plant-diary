# 植物栽培管理日誌

Cloudflare Pages 配信用のWebアプリです。

## Cloudflare Pages

- フレームワークプリセット：なし
- ビルドコマンド：空欄
- ビルド出力ディレクトリ：`/`
- 本番ブランチ：`main`

`main` ブランチへ変更が反映されると、Cloudflare Pagesが自動デプロイします。

## ファイル

- `index.html`：アプリ画面、クライアント状態、DOM描画・入力・操作イベント
- `styles.css`：画面全体のスタイル、レスポンシブ表示、機能別の表示ルール
- `client/weather-runtime.js` / `client/weather-utils.js`：天気判定責務
- `client/download-utils.js`：ブラウザBlobダウンロード責務
- `client/log-date-utils.js` / `client/log-list-utils.js` / `client/log-runtime.js`：ログ期間・検索・並び順・ページング・予定状態判定
- `client/quick-input-utils.js` / `client/quick-input-runtime.js`：クイック入力の同一性、候補生成、お気に入り処理
- `client/rotation-utils.js` / `client/rotation-runtime.js`：ローテーション判定、current / next / after表示モデル
- `client/plan-bulk-utils.js`：一括予定操作payloadと延期日の実在日付検証
- `client/startup-loader.js`：初回起動の `bootstrapCore` / 同日スナップショット / full bootstrap裏更新
- `_worker.js`：`/api` とGAS間の通信境界、静的アセット配信、起動loaderのHTML内埋め込み
- `worker/gas-transport.js`：GASへのHTTP通信と上流JSON解析
- `worker/api-contract.js`：ブラウザAPI名・payloadからGAS契約への互換変換
- `scripts/`：Worker、API、クライアント、起動、ログ、クイック入力、ローテーション等の回帰チェック
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
npm run test:api
npm run test:client
npm run test:download
npm run test:log
npm run test:quick
npm run test:rotation
npm run test:plan-bulk
npm run test:startup
npm run test:weather
```

Worker側は、静的配信、起動loader埋め込み、`OPTIONS /api`、POST制限、空body、GASへの送信形式、正常JSON応答、JSON不正時・通信失敗時・timeout時の既存エラー契約を確認します。

クライアント側は、`index.html` のインラインJavaScriptと `client/*.js` を構文確認対象にします。same-origin `/api`、既存LocalStorageキー、主要DOM ID、主要runtimeの実配線を横断的に確認し、分離済み責務がinlineへ逆戻りしないことも確認します。

ログ、クイック入力、ローテーション、一括予定操作はデータ処理を外部runtimeへ移し、DOM描画と操作イベントは現在 `index.html` に残しています。分離時はDOM ID、state構造、LocalStorageキー、API payload、既存UI挙動を維持します。

## 既知のUI接続欠落

ログ画面の `履歴分析`、`資材・薬剤の使用履歴`、`削除済みの記録` は表示されていますが、現行 `index.html` ではイベント未接続です。GAS側には既存契約があり、`getAnalysis` で履歴分析・使用履歴、full `bootstrap` の `trash` と `restore` で削除済み記録の復元を実装できます。バックエンド新設ではなくUI配線の残作業として扱います。
