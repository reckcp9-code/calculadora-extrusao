(function(){
'use strict';
if(window.DFStatusArtifactFilterV170)return;window.DFStatusArtifactFilterV170=true;
var KEY='df_formula_ops_auto_v2',busy=false,monthTimer=0;
function load(){try{var a=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(a)?a:[]}catch(e){return[]}}
function save(a){try{localStorage.setItem(KEY,JSON.stringify(a))}catch(e){}}
function norm(v){return String(v||'').trim().toUpperCase().replace(/\s+/g,'')}
function syntheticValue(v){var s=String(v||'').trim();return /^DFSTATUS-/i.test(s)||/^DFOPSTATUS5-/i.test(s)||/^DFOP-STATUS\d*-/i.test(s)||/^DFSTATUS[234]\./i.test(s)}
function isArtifact(x){if(!x)return false;return syntheticValue(x.id)||syntheticValue(x.qr)||syntheticValue(x.sourceId)}
function hideRows(){try{document.querySelectorAll('.dfCloudPhotoRow').forEach(function(r){if(/DFSTATUS-|DFOPSTATUS5-|DFOP-STATUS\d*-|DFSTATUS[234]\./i.test(String(r.textContent||'')))r.remove()})}catch(e){}}
function refresh(){try{var m=document.getElementById('dfOpMonth');if(m)m.dispatchEvent(new Event('change'))}catch(e){}}
function currentMonth(){var d=new Date();return String(d.getFullYear())+'-'+String(d.getMonth()+1).padStart(2,'0')}
function recordForRow(row){try{var b=row&&row.querySelector&&row.querySelector('[data-view]'),id=norm(b&&b.getAttribute('data-view'));if(!id)return null;var a=load();for(var i=0;i<a.length;i++){var o=a[i]||{},ids=[o.id,o.qr,o.numero,o.op,o.codigo].map(norm);if(ids.indexOf(id)>=0)return o}}catch(e){}return null}
function filterReadyByBaixaMonth(){try{var host=document.getElementById('dfOkList');if(!host)return;var wanted=currentMonth(),rows=Array.from(host.children).filter(function(r){return r.classList&&r.classList.contains('dfOpList')}),visible=0;rows.forEach(function(r){var o=recordForRow(r),m=String(o&&o.data||'').slice(0,7),show=!m||m===wanted;r.style.display=show?'':'none';r.dataset.dfMonthFiltered=show?'0':'1';if(show)visible++});var old=host.querySelector(':scope > .dfMonthOnlyEmpty');if(old)old.remove();if(rows.length&&!visible){var e=document.createElement('div');e.className='dfOpsTiny dfMonthOnlyEmpty';e.style.marginTop='8px';e.textContent='Nenhuma OP concluída neste mês.';host.appendChild(e)}}catch(e){}}
function scheduleMonthFilter(ms){clearTimeout(monthTimer);monthTimer=setTimeout(filterReadyByBaixaMonth,ms||30)}
function cleanup(){if(busy)return;busy=true;try{var a=load(),b=a.filter(function(x){return !isArtifact(x)});if(b.length!==a.length){save(b);refresh();try{window.dispatchEvent(new CustomEvent('df-op-status-artifacts-cleaned',{detail:{removed:a.length-b.length}}))}catch(e){}}hideRows();filterReadyByBaixaMonth()}finally{busy=false}}
function later(ms){setTimeout(cleanup,ms||0)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){later(100)},{once:true});else later(100);
window.addEventListener('df-op-remote-merged',function(){later(20)});
window.addEventListener('df-op-cloud-synced',function(){later(20)});
window.addEventListener('df-cloud-photos-rendered',function(){scheduleMonthFilter(20)});
window.addEventListener('pageshow',function(){later(120)});
window.addEventListener('online',function(){later(250)});
document.addEventListener('visibilitychange',function(){if(!document.hidden)later(150)});
document.addEventListener('change',function(e){if(e.target&&e.target.id==='dfOpMonth')scheduleMonthFilter(30)},true);
document.addEventListener('click',function(e){var t=e.target;if(t&&t.closest&&t.closest('#dfFormulaOps'))scheduleMonthFilter(80)},true);
try{new MutationObserver(function(muts){for(var i=0;i<muts.length;i++){var t=muts[i].target;if(t&&t.closest&&(t.id==='dfOkList'||t.closest('#dfOkList'))){scheduleMonthFilter(20);break}}}).observe(document.documentElement,{childList:true,subtree:true})}catch(e){}
})();
