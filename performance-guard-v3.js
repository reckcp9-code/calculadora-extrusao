(function(){
'use strict';
if(window.__DF_PERF_GUARD_V3)return;window.__DF_PERF_GUARD_V3=true;
const nativeInterval=window.setInterval.bind(window),nativeTimeout=window.setTimeout.bind(window);
function src(fn){try{return typeof fn==='function'?Function.prototype.toString.call(fn):String(fn||'')}catch(e){return''}}
function dormant(){return nativeInterval(function(){},86400000)}
window.setInterval=function(fn,delay){
  const s=src(fn),ms=Number(delay)||0,args=[].slice.call(arguments,2);
  if(ms>0&&ms<=1500&&/wrapTesseract|wrapQR\(\).*wrapTesseract|wrapQR;wrapTesseract/i.test(s))return dormant();
  if(ms>=10000&&ms<=15000&&/snapshotHash\s*\(|markPending\s*\(|saveNow\s*\(/i.test(s))return dormant();
  if(ms>=55000&&ms<=65000&&/ensureCard\s*\(|PENDING_KEY|saveNow\s*\(/i.test(s))return dormant();
  if(ms>=25000&&ms<=35000&&/scheduleUpload\s*\(\s*100\s*\).*scheduleRemote\s*\(\s*300\s*,\s*false\s*\)/s.test(s))delay=60000;
  // Evita rajada de sincronização da Produção no Safari/iPhone.
  if(ms>=8000&&ms<=12000&&/syncRemote\(false\).*syncLocal\(false\).*refreshMembers\(false\)/s.test(s))delay=30000;
  return nativeInterval(function(){if(document.hidden&&Number(delay)<15000)return;try{return typeof fn==='function'?fn.apply(window,args):Function(String(fn))()}catch(e){nativeTimeout(()=>{throw e},0)}},delay);
};

// Mantém o diagnóstico usando a versão real publicada do app.
const ERROR_LOG_KEY='df_error_log_v1';
let currentVersion='';
function patchDiagnosticVersions(){
  if(!currentVersion)return;
  try{
    const list=JSON.parse(localStorage.getItem(ERROR_LOG_KEY)||'[]');
    if(!Array.isArray(list)||!list.length)return;
    let changed=false;
    for(const rec of list){if(rec&&rec.version!==currentVersion){rec.version=currentVersion;changed=true}}
    if(changed)localStorage.setItem(ERROR_LOG_KEY,JSON.stringify(list));
  }catch(e){}
}
async function refreshCurrentVersion(){
  try{
    const r=await fetch('./app-version.json?t='+Date.now(),{cache:'no-store'});
    if(!r.ok)return;
    const j=await r.json();
    const v=String(j&&j.version||'').trim();
    if(v){currentVersion=v;patchDiagnosticVersions()}
  }catch(e){}
}
window.addEventListener('df-error-recorded',patchDiagnosticVersions);
window.addEventListener('pageshow',()=>setTimeout(refreshCurrentVersion,120));
window.addEventListener('focus',()=>setTimeout(refreshCurrentVersion,180));
setTimeout(refreshCurrentVersion,180);
})();
