# Client modules

`index.html` から段階的に責務を分離するためのクライアントモジュール置き場です。

## Active runtime modules

- `weather-runtime.js` / `weather-utils.js` — 天気コード名、降雨・強風判定、作業リスク、天候依存予定判定、作業可能時間帯。
- `download-utils.js` — CSV出力で使用するブラウザBlobダウンロード処理。

これらは `index.html` から実際に読み込まれている現行ランタイムです。

## Log extraction boundary

- `log-date-utils.js` — 日・週・月の期間境界、期限までの日数表示、予定の `undated / overdue / today / future` 判定。
- `log-list-utils.js` — ログ検索、期間抽出、昇順・降順、ページングの純粋処理。

ログ系utilityは、現在のinline実装と同値であることを `scripts/test-log-contract.mjs` で固定しています。ランタイム切替時は、検索state、20件ページング、並び順、DOM ID、表示文言を変えずに `index.html` から実処理を移します。

## Rule

分離時は未使用moduleだけを増やさず、元の関数名・閾値・DOM契約・state構造・API payloadを維持したまま、runtime wiringと回帰確認を同じ整備フロー内で完了させます。
