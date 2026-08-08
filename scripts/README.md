# Maintenance scripts

- `test-worker-contract.mjs` — Workerの通信契約確認。
- `check-client-contract.mjs` — クライアント構文・主要契約確認。
- `test-weather-utils.mjs` — staged weather utilityの純粋関数テスト。
- `test-weather-parity.mjs` — inline天気処理とstaged moduleの切替前ガード。

これらは追加パッケージなしのNode.js 18+で実行する想定です。
