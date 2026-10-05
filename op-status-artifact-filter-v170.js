(function(){
'use strict';
if(window.DFStatusArtifactFilterV171)return;window.DFStatusArtifactFilterV171=true;
var KEY='df_formula_ops_auto_v2',busy=false,monthTimer=0,syncTimer=0,syncBusy=false,syncRetries=0;
function load(){try{var a=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(a)?a:[]}catch(e){return[]}}
function save(a){try{localStorage.setItem(KEY,JSON.stringify(a))}catch(e){}}
function norm(v){return String(v||'').trim().toUpperCase().replace(/\s+/g,'')}
function syntheticValue(v){var s=String(v||'').trim();return /^DFSTATUS-/i.test(s)||/^DFOPSTATUS5-/i.test(s)||/^DFOP-STATUS\d*-/i.test(s)||/^DFSTATUS[234]\./i.test(s)}
function isArtifact(x){if(!x)return false;return syntheticValue(x.id)||syntheticValue(x.qr)||syntheticValue(x.sourceId)}
function hideRows(){try{document.querySelectorAll('.dfCloudPhotoRow').forEach(function(r){if(/DFSTATUS-|DFOPSTATUS5-|DFOP-STATUS\d*-|DFSTATUS[234]\./i.test(String(r.textContent||'')))r.remove()})}catch(e){}}
function refresh(){try{var m=document.getElementById('dfOpMonth');if(m)m.dispatchEvent(new Event('change',{bubbles:true}))}catch(e){}}
function currentMonth(){var d=new Date();return String(d.getFullYear())+'-'+String(d.getMonth()+1).padStart(2,'0')}
function selectedMonth(){var m=document.getElementById('dfOpMonth'),v=String(m&&m.value||'').slice(0,7);return /^\d{4}-\d{2}$/.test(v)?v:currentMonth()}
function recordForRow(row){try{var b=row&&row.querySelector&&row.querySelector('[data-view]'),id=norm(b&&b.getAttribute('data-view'));if(!id)return null;var a=load();for(var i=0;i<a.length;i++){var o=a[i]||{},ids=[o.id,o.qr,o.numero,o.op,o.codigo].map(norm);if(ids.indexOf(id)>=0)return o}}catch(e){}return null}
function filterReadyByBaixaMonth(){try{var host=document.getElementById('dfOkList');if(!host)return;var wanted=currentMonth(),rows=Array.from(host.children).filter(function(r){return r.classList&&r.classList.contains('dfOpList')}),visible=0;rows.forEach(function(r){var o=recordForRow(r),m=String(o&&o.data||'').slice(0,7),show=!m||m===wanted;r.style.display=show?'':'none';r.dataset.dfMonthFiltered=show?'0':'1';if(show)visible++});var old=host.querySelector(':scope > .dfMonthOnlyEmpty');if(old)old.remove();if(rows.length&&!visible){var e=document.createElement('div');e.className='dfOpsTiny dfMonthOnlyEmpty';e.style.marginTop='8px';e.textContent='Nenhuma OP concluída neste mês.';host.appendChild(e)}}catch(e){}}
function scheduleMonthFilter(ms){clearTimeout(monthTimer);monthTimer=setTimeout(filterReadyByBaixaMonth,ms||30)}
function cleanup(){if(busy)return;busy=true;try{var a=load(),b=a.filter(function(x){return !isArtifact(x)});if(b.length!==a.length){save(b);refresh();try{window.dispatchEvent(new CustomEvent('df-op-status-artifacts-cleaned',{detail:{removed:a.length-b.length}}))}catch(e){}}hideRows();filterReadyByBaixaMonth()}finally{busy=false}}
function later(ms){setTimeout(cleanup,ms||0)}
async function syncAndRender(withPhotos){
  if(syncBusy||document.hidden)return false;
  var auth=window.DFOpServerAuthority;
  if(!auth||typeof auth.sync!=='function'){
    if(syncRetries<12){syncRetries++;scheduleSync(180,withPhotos)}
    return false;
  }
  syncRetries=0;syncBusy=true;
  try{
    var ok=await auth.sync(true,selectedMonth());
    refresh();scheduleMonthFilter(30);
    if(withPhotos&&window.DFOpCloud&&typeof window.DFOpCloud.sync==='function'){
      try{await window.DFOpCloud.sync(true)}catch(e){}
      refresh();scheduleMonthFilter(30);
    }
    setTimeout(function(){refresh();scheduleMonthFilter(30)},320);
    if(ok===false)setTimeout(function(){scheduleSync(0,withPhotos)},700);
    return ok!==false;
  }catch(e){
    refresh();scheduleMonthFilter(30);return false;
  }finally{syncBusy=false}
}
function scheduleSync(ms,withPhotos){clearTimeout(syncTimer);syncTimer=setTimeout(function(){syncAndRender(!!withPhotos)},ms==null?250:ms)}
function paneIsArchive(){var b=document.querySelector('[data-pane="archive"].on');return !!b}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){later(100);scheduleSync(1500,true)},{once:true});else{later(100);scheduleSync(1500,true)}
window.addEventListener('df-op-remote-merged',function(){later(20);setTimeout(function(){refresh();scheduleMonthFilter(20)},30)});
window.addEventListener('df-op-cloud-synced',function(){later(20);setTimeout(function(){refresh();scheduleMonthFilter(20)},30)});
window.addEventListener('df-op-d1-applied',function(){setTimeout(function(){refresh();scheduleMonthFilter(20);if(paneIsArchive()&&window.DFOpCloud&&typeof window.DFOpCloud.sync==='function')window.DFOpCloud.sync(true)},40)});
window.addEventListener('df-cloud-photos-rendered',function(){scheduleMonthFilter(20)});
window.addEventListener('pageshow',function(){later(120);scheduleSync(700,true)});
window.addEventListener('online',function(){later(250);scheduleSync(500,true)});
document.addEventListener('visibilitychange',function(){if(!document.hidden){later(150);scheduleSync(650,true)}});
document.addEventListener('change',function(e){if(e.target&&e.target.id==='dfOpMonth')scheduleMonthFilter(30)},true);
document.addEventListener('click',function(e){var t=e.target,b=t&&t.closest&&t.closest('[data-pane]'),p=b&&b.getAttribute('data-pane');if(t&&t.closest&&t.closest('#dfFormulaOps'))scheduleMonthFilter(80);if(p==='ok'||p==='month'||p==='archive')scheduleSync(450,p==='archive')},true);
try{new MutationObserver(function(muts){for(var i=0;i<muts.length;i++){var t=muts[i].target;if(t&&t.closest&&(t.id==='dfOkList'||t.closest('#dfOkList'))){scheduleMonthFilter(20);break}}}).observe(document.documentElement,{childList:true,subtree:true})}catch(e){}
})();
