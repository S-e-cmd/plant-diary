import assert from 'node:assert/strict';
import { isRotationPlan, activeRotationPlans, rotationActuals } from '../client/rotation-utils.js';

function referenceIsRotationPlan(x){return x.type==='plan'&&x.rotationName&&Number(x.rotationOrder)>0}
function referenceActiveRotationPlans(plans){return plans.filter(x=>referenceIsRotationPlan(x)&&x.status!=='完了'&&x.status!=='中止')}
function referenceRotationActuals(actuals,name){return actuals.filter(x=>x.rotationName===name).sort((a,b)=>(a.date||'').localeCompare(b.date||''))}

const plans=[
  {id:'1',type:'plan',rotationName:'春',rotationOrder:'1',status:'未完了'},
  {id:'2',type:'plan',rotationName:'春',rotationOrder:2,status:'延期'},
  {id:'3',type:'plan',rotationName:'春',rotationOrder:3,status:'完了'},
  {id:'4',type:'plan',rotationName:'春',rotationOrder:4,status:'中止'},
  {id:'5',type:'actual',rotationName:'春',rotationOrder:5,status:''},
  {id:'6',type:'plan',rotationName:'',rotationOrder:6,status:'未完了'},
  {id:'7',type:'plan',rotationName:'春',rotationOrder:'0',status:'未完了'}
];
for(const x of plans)assert.equal(Boolean(isRotationPlan(x)),Boolean(referenceIsRotationPlan(x)),`isRotationPlan parity ${x.id}`);
assert.deepEqual(activeRotationPlans(plans).map(x=>x.id),referenceActiveRotationPlans(plans).map(x=>x.id));

const actuals=[
  {id:'1',rotationName:'春',date:'2026-07-03'},
  {id:'2',rotationName:'秋',date:'2026-07-01'},
  {id:'3',rotationName:'春',date:'2026-07-01'},
  {id:'4',rotationName:'春',date:'2026-07-02'},
  {id:'5',rotationName:'春',date:''}
];
assert.deepEqual(rotationActuals(actuals,'春').map(x=>x.id),referenceRotationActuals(actuals,'春').map(x=>x.id));

console.log('rotation semantic parity: ok');
