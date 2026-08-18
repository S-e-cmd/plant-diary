import assert from 'node:assert/strict';
import {
  quickKey,
  quickTemplate,
  isFavoriteRecord,
  recentQuickCandidates
} from '../client/quick-input-utils.js';

const base = {
  action: '消毒',
  plantName: '牡丹',
  place: '西側',
  category: '消毒',
  pesticide: '薬剤A',
  dilution: '1000倍',
  sprayTarget: '葉面',
  targetPest: '病害'
};

assert.equal(
  quickKey(base),
  '消毒|牡丹|西側|消毒||薬剤A||1000倍|葉面|病害',
  'quickKey preserves the existing field order'
);

const template = quickTemplate(base, () => 'fixed-id');
assert.deepEqual(template, {
  qid: 'fixed-id',
  plantName: '牡丹',
  place: '西側',
  category: '消毒',
  action: '消毒',
  quantity: '',
  material: '',
  pesticide: '薬剤A',
  liquidFertilizer: '',
  dilution: '1000倍',
  sprayTarget: '葉面',
  targetPest: '病害',
  memo: ''
});

assert.equal(isFavoriteRecord(base, [template]), true, 'matching quick content is favorite');
assert.equal(isFavoriteRecord({ ...base, pesticide: '薬剤B' }, [template]), false, 'different quick content is not favorite');

const actuals = [
  { ...base, id: '1', date: '2026-08-10' },
  { ...base, id: '2', date: '2026-08-18' },
  { ...base, id: '3', date: '2026-08-17', pesticide: '薬剤B' },
  { id: '4', date: '2026-08-16', action: '' },
  { ...base, id: '5', date: '2026-08-15', pesticide: '薬剤C' }
];

const recent = recentQuickCandidates(actuals, [template], 8);
assert.deepEqual(
  recent.map(x => x.id),
  ['3', '5'],
  'recent quick candidates exclude favorites, blanks, and duplicate content while keeping newest first'
);

assert.equal(recentQuickCandidates(actuals, [], 1).length, 1, 'recent quick candidate limit is preserved');

console.log('quick input utility contract: ok');
