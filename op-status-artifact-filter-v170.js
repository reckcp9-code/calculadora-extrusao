(function(){
'use strict';
if(window.DFStatusArtifactFilterV170)return;window.DFStatusArtifactFilterV170=true;
var KEY='df_formula_ops_auto_v2',busy=false;
function load(){try{var a=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(a)?a:[]}catch(e){return[]}}
function save(a){try{localStorage.setItem(KEY,JSON.stringify(a))}catch(e){}}
function syntheticValue(v){var s=String(v||'').trim();return /^DFSTATUS-/i.test(s)||/^DFOPSTATUS5-/i.test(s)||/^DFOP-STATUS\d*-/i.test(s)||/^DFSTATUS[234]\./i.test(s)}
function isArtifact(x){if(!x)return false;return syntheticValue(x.id)||syntheticValue(x.qr)||syntheticValue(x.sourceId)}
function hideRows(){try{document.querySelectorAll('.dfCloudPhotoRow').forEach(function(r){if(/DFSTATUS-|DFOPSTATUS5-|DFOP-STATUS\d*-|DFSTATUS[234]\./i.test(String(r.textContent||'')))r.remove()})}catch(e){}}
function refresh(){try{var m=document.getElementById('dfOpMonth');if(m)m.dispatchEvent(new Event('change'))}catch(e){}}
function cleanup(){if(busy)return;busy=true;try{var a=load(),b=a.filter(function(x){return !isArtifact(x)});if(b.length!==a.length){save(b);refresh();try{window.dispatchEvent(new CustomEvent('df-op-status-artifacts-cleaned',{detail:{removed:a.length-b.length}}))}catch(e){}}hideRows()}finally{busy=false}}
function later(ms){setTimeout(cleanup,ms||0)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){later(100)},{once:true});else later(100);
window.addEventListener('df-op-remote-merged',function(){later(20)});
window.addEventListener('df-op-cloud-synced',function(){later(20)});
window.addEventListener('pageshow',function(){later(120)});
window.addEventListener('online',function(){later(250)});
document.addEventListener('visibilitychange',function(){if(!document.hidden)later(150)});
document.addEventListener('click',function(e){var t=e.target;if(t&&t.closest&&t.closest('#dfFormulaOps'))later(120)},true);
})();
