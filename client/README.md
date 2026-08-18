# Client modules

`index.html` から段階的に責務を分離するためのクライアントモジュール置き場です。

## Active runtime modules

- `weather-runtime.js` / `weather-utils.js` — 天気コード名、降雨・強風判定、作業リスク、天候依存予定判定、作業可能時間帯。
- `download-utils.js` — CSV出力で使用するブラウザBlobダウンロード処理。

これらは `index.html` から実際に読み込まれている現行ランタイムです。

## Log extraction boundary

- `log-date-utils.js` — 日・週・月の期間境界、期限までの日数表示、予定の `undated / overdue / today / future` 判定。
- `log-list-utils.js` — ログ検索、期間抽出、昇順・降順、ページングの純粋処理。
- `log-runtime.js` — `state` と当日値を受け取り、期間・期限判定・検索・並び順・ページングを1つのruntime境界として提供。

`scripts/test-log-contract.mjs` と `scripts/test-log-runtime.mjs` でinline相当の処理とruntime統合を固定しています。次の切替では、検索state、20件ページング、並び順、DOM ID、表示文言を変えずに `index.html` からこのruntimeへ委譲します。

## Quick input extraction boundary

- `quick-input-utils.js` — クイック入力の同一性キー、テンプレート生成、お気に入り判定、最近使った内容の重複除外・新しい順抽出。
- `quick-input-runtime.js` — `state.quickFavorites` / `state.actuals` を使ったお気に入り判定、表示グループ生成、追加・解除をまとめるruntime境界。

`scripts/test-quick-input-utils.mjs` と `scripts/test-quick-input-runtime.mjs` で固定しています。LocalStorage保存、DOM描画、入力画面への遷移はUI責務として `index.html` に残し、データ処理だけをruntimeへ委譲する方針です。

## Rotation extraction boundary

- `rotation-utils.js` — ローテーション予定判定、未完了枠抽出、実施履歴順序、表示用current/next/afterモデル、循環ローテーションの次周要否判定。
- `rotation-runtime.js` — `state.plans` / `state.actuals` を受け、表示モデルと次周要否をruntime境界として提供。

`scripts/test-rotation-utils.mjs` と `scripts/test-rotation-runtime.mjs` で固定しています。画面HTML生成、実施・見送りAPI呼び出し、GAS側の次周生成は引き続き別責務です。

## Bulk plan extraction boundary

- `plan-bulk-utils.js` — 一括操作対象IDの正規化、`YYYY-MM-DD` の実在日付検証、完了・延期・見送りのAPI payload生成。

`scripts/test-plan-bulk-utils.mjs` で純粋契約を固定しています。一括延期の実際のUIは `index.html` で延期日を入力し、同じpayload契約で `/api` へ送信する現行ランタイムです。Workerでも延期日を再検証するため、欠落・形式不正・実在しない日付はGASへ到達しません。

## Rule

分離時は未使用moduleだけを増やさず、元の閾値・DOM契約・state構造・API payloadを維持したままruntimeへ委譲します。runtime境界はUI描画やGASの業務ロジックを取り込まず、既存責務の切り分けだけを行います。
