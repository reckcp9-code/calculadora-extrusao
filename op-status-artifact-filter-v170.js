(function(){
'use strict';
if(window.DFStatusArtifactFilterV170)return;window.DFStatusArtifactFilterV170=true;
var KEY='df_formula_ops_auto_v2',busy=false,monthTimer=0;
function load(){try{var a=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(a)?a:[]}catch(e){return[]}}
function save(a){try{localStorage.setItem(KEY,JSON.stringify(a))}catch(e){}}
function syntheticValue(v){var s=String(v||'').trim();return /^DFSTATUS-/i.test(s)||/^DFOPSTATUS5-/i.test(s)||/^DFOP-STATUS\d*-/i.test(s)||/^DFSTATUS[234]\./i.test(s)}
function isArtifact(x){if(!x)return false;return syntheticValue(x.id)||syntheticValue(x.qr)||syntheticValue(x.sourceId)}
function hideRows(){try{document.querySelectorAll('.dfCloudPhotoRow').forEach(function(r){if(/DFSTATUS-|DFOPSTATUS5-|DFOP-STATUS\d*-|DFSTATUS[234]\./i.test(String(r.textContent||'')))r.remove()})}catch(e){}}
function refresh(){try{var m=document.getElementById('dfOpMonth');if(m)m.dispatchEvent(new Event('change'))}catch(e){}}
function currentMonthDigits(){var d=new Date();return String(d.getFullYear())+String(d.getMonth()+1).padStart(2,'0')}
function selectedMonthDigits(){var m=document.getElementById('dfOpMonth'),v=String(m&&m.value||'').replace(/\D/g,'');return /^\d{6}$/.test(v)?v:currentMonthDigits()}
function monthFromText(v){var m=String(v||'').toUpperCase().match(/DFOP-(\d{6})\d{2}-/);return m?m[1]:''}
function rowMonth(row){if(!row)return'';var b=row.querySelector('[data-view]'),v=b&&b.getAttribute('data-view');return monthFromText(v)||monthFromText(row.textContent)}
function filterHost(id,wanted,emptyText){var host=document.getElementById(id);if(!host)return;var rows=Array.from(host.children).filter(function(r){return r.classList&&(r.classList.contains('dfOpList')||r.classList.contains('dfCloudPhotoRow'))}),visible=0;rows.forEach(function(r){var m=rowMonth(r),show=!m||m===wanted;r.style.display=show?'':'none';r.dataset.dfMonthFiltered=show?'0':'1';if(show)visible++});var old=host.querySelector(':scope > .dfMonthOnlyEmpty');if(old)old.remove();if(rows.length&&!visible){var e=document.createElement('div');e.className='dfOpsTiny dfMonthOnlyEmpty';e.style.marginTop='8px';e.textContent=emptyText;host.appendChild(e)}}
function filterMonthRows(){try{var cur=currentMonthDigits(),sel=selectedMonthDigits();filterHost('dfOkList',cur,'Nenhuma OP concluída neste mês.');filterHost('dfCloudPhotosRows',cur,'Nenhuma foto oficial das OPs Prontas deste mês.');filterHost('dfArchiveList',sel,'Nenhuma foto deste mês.')}catch(e){}}
function scheduleMonthFilter(ms){clearTimeout(monthTimer);monthTimer=setTimeout(filterMonthRows,ms||30)}
function cleanup(){if(busy)return;busy=true;try{var a=load(),b=a.filter(function(x){return !isArtifact(x)});if(b.length!==a.length){save(b);refresh();try{window.dispatchEvent(new CustomEvent('df-op-status-artifacts-cleaned',{detail:{removed:a.length-b.length}}))}catch(e){}}hideRows();filterMonthRows()}finally{busy=false}}
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
try{new MutationObserver(function(muts){for(var i=0;i<muts.length;i++){var t=muts[i].target;if(t&&t.closest&&(t.id==='dfOkList'||t.id==='dfArchiveList'||t.id==='dfCloudPhotosRows'||t.closest('#dfOkList,#dfArchiveList,#dfCloudPhotosRows'))){scheduleMonthFilter(20);break}}}).observe(document.documentElement,{childList:true,subtree:true})}catch(e){}
})();
