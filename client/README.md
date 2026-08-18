# Client modules

`index.html` から責務を分離した現行クライアントモジュールです。

## Active runtime modules

- `weather-runtime.js` / `weather-utils.js` — 天気コード名、降雨・強風判定、作業リスク、天候依存予定判定、作業可能時間帯。
- `download-utils.js` — CSV出力で使用するブラウザBlobダウンロード処理。
- `log-date-utils.js` / `log-list-utils.js` / `log-runtime.js` — 日・週・月境界、期限判定、検索、期間抽出、並び順、ページング。`index.html` は表示だけを担当し、一覧処理はruntimeへ委譲する。
- `quick-input-utils.js` / `quick-input-runtime.js` — クイック入力の同一性、テンプレート生成、お気に入り判定、最近使った内容、追加・解除。LocalStorage保存とDOM描画はUI責務として `index.html` に残す。
- `rotation-utils.js` / `rotation-runtime.js` — ローテーション予定判定、未完了枠、実施履歴、current / next / after表示モデル、次周要否。画面HTML生成とGAS mutationは別責務のまま。
- `plan-bulk-utils.js` — 一括操作対象IDの正規化、`YYYY-MM-DD` 実在日付検証、完了・延期・見送りのAPI payload生成。
- `startup-loader.js` — Workerがアプリinline scriptより前へ挿入する起動専用loader。初回は `bootstrapCore`、同日スナップショットがある場合は即時表示、完全 `bootstrap` は裏で更新する。

## Startup ownership

起動時fetchの差し替えは `startup-loader.js` だけが担当します。旧 `startup-runtime.js` / `startup-snapshot.js` は二重fetchラップになるため削除しました。`weather-runtime.js` は天気判断だけを担当し、起動制御を持ちません。

## Runtime contracts

- Log: `scripts/test-log-contract.mjs` / `scripts/test-log-runtime.mjs`
- Quick input: `scripts/test-quick-input-utils.mjs` / `scripts/test-quick-input-runtime.mjs`
- Rotation: `scripts/test-rotation-utils.mjs` / `scripts/test-rotation-runtime.mjs`
- Bulk plan: `scripts/test-plan-bulk-utils.mjs`
- Startup: `scripts/test-startup-loader.mjs`

さらに `scripts/check-client-contract.mjs` が `index.html` のactive runtime配線を固定し、旧inline処理の再混入を検出します。

## Rule

runtime境界はUI描画やGASの業務ロジックを取り込みません。DOM契約、LocalStorageキー、API payload、20件ページング、ローテーション履歴、既存表示文言を維持したまま、データ処理責務だけを分離します。
