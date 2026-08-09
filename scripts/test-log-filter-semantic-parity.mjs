import assert from 'node:assert/strict';
import {hasActiveSearch,matchesSearch,filterByDateRange,sortLogs,paginateLogs} from '../client/log-filter-utils.js';

function refHasActiveSearch(s){return!!(s.q||s.start||s.end||s.type||s.status||s.category||s.special)}
function refMatchesSearch(x,s){const q=s.q.trim().toLowerCase(),d=x.date||x.startDate||'',text=[x.plantName,x.place,x.category,x.action,x.quantity,x.material,x.pesticide,x.liquidFertilizer,x.dilution,x.sprayTarget,x.targetPest,x.observation,x.memo].filter(Boolean).join(' ').toLowerCase(),special=!s.special||(s.special==='spray'&&!!x.pesticide)||(s.special==='liquid'&&!!x.liquidFertilizer);return(!s.start||d>=s.start)&&(!s.end||d<=s.end)&&(!q||text.includes(q))&&(!s.type||x.type===s.type)&&(!s.status||x.status===s.status)&&(!s.category||x.category===s.category)&&special}
function refFilterRange(items,r){return items.filter(x=>x.date&&x.date>=r.start&&x.date<=r.end)}
function refSort(items,dir){return[...items].sort((a,b)=>{const c=(b.date||b.startDate||'').localeCompare(a.date||a.startDate||'');return dir==='desc'?c:-c})}
function refPage(items,page,size){const pages=Math.max(1,Math.ceil(items.length/size)),current=Math.min(page,pages),start=(current-1)*size;return{pages,page:current,start,items:items.slice(start,start+size),total:items.length}}

const items=[
 {id:'a',type:'actual',date:'2026-08-01',plantName:'牡丹',place:'東',category:'灌水',action:'水やり',memo:'朝'},
 {id:'b',type:'plan',date:'2026-08-03',plantName:'牡丹',place:'西',category:'消毒',action:'薬剤散布',status:'未完了',pesticide:'A',targetPest:'病害'},
 {id:'c',type:'actual',date:'2026-08-02',plantName:'ダリア',category:'液肥',action:'液肥',liquidFertilizer:'B'},
 {id:'d',type:'plan',startDate:'2026-08-04',category:'除草',action:'除草',status:'未完了'}
];
const searches=[
 {q:'',start:'',end:'',type:'',status:'',category:'',special:''},
 {q:'牡丹',start:'',end:'',type:'',status:'',category:'',special:''},
 {q:'病害',start:'',end:'',type:'plan',status:'未完了',category:'消毒',special:'spray'},
 {q:'',start:'2026-08-02',end:'2026-08-04',type:'',status:'',category:'',special:'liquid'}
];
for(const s of searches){
 assert.equal(hasActiveSearch(s),refHasActiveSearch(s));
 assert.deepEqual(items.filter(x=>matchesSearch(x,s)).map(x=>x.id),items.filter(x=>refMatchesSearch(x,s)).map(x=>x.id));
}
const range={start:'2026-08-01',end:'2026-08-02'};
assert.deepEqual(filterByDateRange(items,range).map(x=>x.id),refFilterRange(items,range).map(x=>x.id));
for(const dir of ['desc','asc'])assert.deepEqual(sortLogs(items,dir).map(x=>x.id),refSort(items,dir).map(x=>x.id));
for(const page of [1,2,5])assert.deepEqual(paginateLogs(items,page,2),refPage(items,page,2));

console.log('log filter semantic parity: ok');
