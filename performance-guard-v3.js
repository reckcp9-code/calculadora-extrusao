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
  return nativeInterval(function(){if(document.hidden&&Number(delay)<5000)return;try{return typeof fn==='function'?fn.apply(window,args):Function(String(fn))()}catch(e){nativeTimeout(()=>{throw e},0)}},delay);
};
})();
