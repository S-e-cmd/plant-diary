import assert from 'node:assert/strict';
import { quickKey, quickTemplate, isFavorite } from '../client/quick-input-utils.js';

function referenceQuickKey(x){return[x.action,x.plantName,x.place,x.category,x.material,x.pesticide,x.liquidFertilizer,x.dilution,x.sprayTarget,x.targetPest].map(v=>String(v||'').trim()).join('|')}
function referenceQuickTemplate(x,createId){return{qid:x.qid||createId(),plantName:x.plantName||'',place:x.place||'',category:x.category||'その他',action:x.action||'',quantity:x.quantity||'',material:x.material||'',pesticide:x.pesticide||'',liquidFertilizer:x.liquidFertilizer||'',dilution:x.dilution||'',sprayTarget:x.sprayTarget||'',targetPest:x.targetPest||'',memo:x.memo||''}}
function referenceIsFavorite(x,favorites){const k=referenceQuickKey(x);return favorites.some(v=>referenceQuickKey(v)===k)}

const vectors=[
 {},
 {action:'水やり'},
 {action:' 水やり ',plantName:'牡丹',place:'東側',category:'灌水'},
 {action:'消毒',category:'消毒',pesticide:'薬剤A',dilution:'1000倍',sprayTarget:'葉',targetPest:'病害'},
 {qid:'saved',action:'液肥',category:'液肥',liquidFertilizer:'液肥A',memo:'朝'}
];

for(const [i,x] of vectors.entries()){
  assert.equal(quickKey(x),referenceQuickKey(x),`quickKey parity ${i}`);
  const id=`id-${i}`;
  assert.deepEqual(quickTemplate(x,()=>id),referenceQuickTemplate(x,()=>id),`quickTemplate parity ${i}`);
}

const favorites=vectors.slice(1).map((x,i)=>referenceQuickTemplate(x,()=>`fav-${i}`));
for(const [i,x] of vectors.entries())assert.equal(isFavorite(x,favorites),referenceIsFavorite(x,favorites),`isFavorite parity ${i}`);

console.log('quick input semantic parity: ok');
