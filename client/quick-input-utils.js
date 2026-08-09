export function quickKey(x){return[x?.action,x?.plantName,x?.place,x?.category,x?.material,x?.pesticide,x?.liquidFertilizer,x?.dilution,x?.sprayTarget,x?.targetPest].map(v=>String(v||'').trim()).join('|')}

export function quickTemplate(x,createId=()=>crypto.randomUUID()){return{qid:x?.qid||createId(),plantName:x?.plantName||'',place:x?.place||'',category:x?.category||'その他',action:x?.action||'',quantity:x?.quantity||'',material:x?.material||'',pesticide:x?.pesticide||'',liquidFertilizer:x?.liquidFertilizer||'',dilution:x?.dilution||'',sprayTarget:x?.sprayTarget||'',targetPest:x?.targetPest||'',memo:x?.memo||''}}

export function isFavorite(x,favorites){const k=quickKey(x);return(favorites||[]).some(v=>quickKey(v)===k)}
