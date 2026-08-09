import assert from 'node:assert/strict';
import {hasActiveSearch,matchesSearch,filterByDateRange,sortLogs,paginateLogs} from '../client/log-filter-utils.js';

const rows=[
  {id:'1',type:'actual',date:'2026-08-01',category:'灌水',action:'水やり',plantName:'牡丹',place:'東側',status:'',pesticide:'',liquidFertilizer:''},
  {id:'2',type:'plan',date:'2026-08-03',category:'消毒',action:'消毒',plantName:'牡丹',place:'西側',status:'未完了',pesticide:'薬剤A'},
  {id:'3',type:'actual',date:'2026-08-02',category:'液肥',action:'液肥散布',plantName:'ダリア',place:'東側',status:'',liquidFertilizer:'液肥A'},
  {id:'4',type:'plan',startDate:'2026-08-05',category:'除草',action:'除草',status:'未完了'}
];

assert.equal(hasActiveSearch({}),false);
assert.equal(hasActiveSearch({q:'牡丹'}),true);
assert.deepEqual(rows.filter(x=>matchesSearch(x,{q:'牡丹'})).map(x=>x.id),['1','2']);
assert.deepEqual(rows.filter(x=>matchesSearch(x,{start:'2026-08-02',end:'2026-08-03'})).map(x=>x.id),['2','3']);
assert.deepEqual(rows.filter(x=>matchesSearch(x,{type:'plan'})).map(x=>x.id),['2','4']);
assert.deepEqual(rows.filter(x=>matchesSearch(x,{special:'spray'})).map(x=>x.id),['2']);
assert.deepEqual(rows.filter(x=>matchesSearch(x,{special:'liquid'})).map(x=>x.id),['3']);
assert.deepEqual(filterByDateRange(rows,{start:'2026-08-01',end:'2026-08-02'}).map(x=>x.id),['1','3']);
assert.deepEqual(sortLogs(rows,'desc').map(x=>x.id),['4','2','3','1']);
assert.deepEqual(sortLogs(rows,'asc').map(x=>x.id),['1','3','2','4']);
assert.deepEqual(paginateLogs(Array.from({length:45},(_,i)=>i+1),2,20),{pages:3,page:2,start:20,items:Array.from({length:20},(_,i)=>i+21),total:45});
assert.equal(paginateLogs([],5,20).page,1);

console.log('log filter utils: ok');
