export const SEARCH_TEXT_FIELDS=['plantName','place','category','action','quantity','material','pesticide','liquidFertilizer','dilution','sprayTarget','targetPest','observation','memo'];

export function hasActiveSearch(search={}){return!!(search.q||search.start||search.end||search.type||search.status||search.category||search.special)}

export function matchesSearch(item,search={}){
  const q=String(search.q||'').trim().toLowerCase();
  const date=item?.date||item?.startDate||'';
  const text=SEARCH_TEXT_FIELDS.map(key=>item?.[key]).filter(Boolean).join(' ').toLowerCase();
  const special=!search.special||(search.special==='spray'&&!!item?.pesticide)||(search.special==='liquid'&&!!item?.liquidFertilizer);
  return(!search.start||date>=search.start)&&(!search.end||date<=search.end)&&(!q||text.includes(q))&&(!search.type||item?.type===search.type)&&(!search.status||item?.status===search.status)&&(!search.category||item?.category===search.category)&&special;
}

export function filterByDateRange(items,range){return(items||[]).filter(item=>item?.date&&item.date>=range.start&&item.date<=range.end)}

export function sortLogs(items,direction='desc'){
  const rows=[...(items||[])];
  rows.sort((a,b)=>{const c=(b?.date||b?.startDate||'').localeCompare(a?.date||a?.startDate||'');return direction==='desc'?c:-c});
  return rows;
}

export function paginateLogs(items,page=1,pageSize=20){
  const rows=items||[];
  const pages=Math.max(1,Math.ceil(rows.length/pageSize));
  const current=Math.min(Math.max(1,page),pages);
  const start=(current-1)*pageSize;
  return{pages,page:current,start,items:rows.slice(start,start+pageSize),total:rows.length};
}
