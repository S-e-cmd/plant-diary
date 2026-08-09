export function isRotationPlan(x){return x?.type==='plan'&&x?.rotationName&&Number(x?.rotationOrder)>0}

export function activeRotationPlans(plans){return(plans||[]).filter(x=>isRotationPlan(x)&&x.status!=='完了'&&x.status!=='中止')}

export function rotationActuals(actuals,name){return(actuals||[]).filter(x=>x.rotationName===name).sort((a,b)=>(a.date||'').localeCompare(b.date||''))}
