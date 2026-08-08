# Client modules

`index.html` から段階的に責務を分離するためのクライアントモジュール置き場です。

## 現在の状態

- `weather-utils.js` — 天気コード名、降雨・強風判定、作業リスク、天候依存予定判定、作業可能時間帯の純粋処理。

`weather-utils.js` は現在まだ `index.html` から読み込まれていません。既存ランタイムを変えずに、元のinline実装との契約比較・テストを先に整える staged extraction として追加しています。

ランタイム切替時は、元の関数名・閾値・DOM契約・state構造を維持し、`npm test` が通ることを確認してからinline実装を削除します。
