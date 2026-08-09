import assert from 'node:assert/strict';
import { quickKey, quickTemplate, isFavorite } from '../client/quick-input-utils.js';

const item={action:' 水やり ',plantName:'牡丹',place:'東側',category:'灌水',material:'',pesticide:'',liquidFertilizer:'',dilution:'',sprayTarget:'',targetPest:''};
assert.equal(quickKey(item),'水やり|牡丹|東側|灌水||||||');
assert.equal(quickKey({}), '|||||||||');

const generated=quickTemplate({action:'除草',category:'',memo:'確認'},()=> 'generated-id');
assert.deepEqual(generated,{qid:'generated-id',plantName:'',place:'',category:'その他',action:'除草',quantity:'',material:'',pesticide:'',liquidFertilizer:'',dilution:'',sprayTarget:'',targetPest:'',memo:'確認'});

const existing=quickTemplate({qid:'fixed',action:'消毒',category:'消毒'},()=>{throw new Error('id generator must not run')});
assert.equal(existing.qid,'fixed');
assert.equal(existing.action,'消毒');
assert.equal(existing.category,'消毒');

const favorites=[quickTemplate({qid:'1',action:'水やり',plantName:'牡丹',place:'東側',category:'灌水'},()=> 'unused')];
assert.equal(isFavorite({action:'水やり',plantName:'牡丹',place:'東側',category:'灌水'},favorites),true);
assert.equal(isFavorite({action:'水やり',plantName:'牡丹',place:'西側',category:'灌水'},favorites),false);
assert.equal(isFavorite({},[]),false);

console.log('quick input utils: ok');
