import assert from 'node:assert/strict';
import { isRotationPlan, activeRotationPlans, rotationActuals } from '../client/rotation-utils.js';

assert.equal(isRotationPlan({type:'plan',rotationName:'ダリア',rotationOrder:1}),true);
assert.equal(isRotationPlan({type:'actual',rotationName:'ダリア',rotationOrder:1}),false);
assert.equal(isRotationPlan({type:'plan',rotationName:'',rotationOrder:1}),false);
assert.equal(isRotationPlan({type:'plan',rotationName:'ダリア',rotationOrder:0}),false);

const plans=[
  {id:'1',type:'plan',rotationName:'A',rotationOrder:1,status:'未完了'},
  {id:'2',type:'plan',rotationName:'A',rotationOrder:2,status:'完了'},
  {id:'3',type:'plan',rotationName:'A',rotationOrder:3,status:'中止'},
  {id:'4',type:'plan',rotationName:'',rotationOrder:4,status:'未完了'},
  {id:'5',type:'plan',rotationName:'A',rotationOrder:5,status:'延期'}
];
assert.deepEqual(activeRotationPlans(plans).map(x=>x.id),['1','5']);

const actuals=[
  {id:'c',rotationName:'A',date:'2026-08-03'},
  {id:'x',rotationName:'B',date:'2026-08-01'},
  {id:'a',rotationName:'A',date:'2026-08-01'},
  {id:'b',rotationName:'A',date:'2026-08-02'},
  {id:'z',rotationName:'A',date:''}
];
assert.deepEqual(rotationActuals(actuals,'A').map(x=>x.id),['z','a','b','c']);

console.log('rotation utils: ok');
