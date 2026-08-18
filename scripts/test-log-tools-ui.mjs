import assert from 'node:assert/strict';
import { renderAnalysisHtml, renderTrashHtml, renderUsageHtml } from '../client/log-tools-ui.js';

const analysis = renderAnalysisHtml({
  month: '2026-08',
  actualCount: 12,
  pendingCount: 3,
  byPlant: [{ name: 'ダリア', count: 7 }],
  byCategory: [{ name: '消毒', count: 4 }]
});
assert.match(analysis, /2026-08/);
assert.match(analysis, /12/);
assert.match(analysis, /ダリア/);
assert.match(analysis, /消毒/);

const usage = renderUsageHtml({
  usage: [{ kind: '薬剤', name: 'アファーム', count: 2, last: '2026-08-18', plants: ['ダリア'] }]
});
assert.match(usage, /アファーム/);
assert.match(usage, /使用 2回/);
assert.match(usage, /ダリア/);
assert.match(usage, /2026/);

const trash = renderTrashHtml([
  { type: 'plan', id: 'p1', date: '2026-08-17', action: '消毒', plantName: 'ダリア' }
]);
assert.match(trash, /予定/);
assert.match(trash, /消毒/);
assert.match(trash, /data-restore-entry="plan:p1"/);
assert.match(trash, /復元/);

assert.match(renderUsageHtml({ usage: [] }), /使用履歴はありません/);
assert.match(renderTrashHtml([]), /削除済みの記録はありません/);

console.log('ok - log tools UI rendering contract');
