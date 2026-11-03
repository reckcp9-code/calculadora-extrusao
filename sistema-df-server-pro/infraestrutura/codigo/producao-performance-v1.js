(function(){
'use strict';
if(window.DF_PRODUCAO_PERFORMANCE_V1)return;window.DF_PRODUCAO_PERFORMANCE_V1=true;
const nativeInterval=window.setInterval.bind(window),nativeTimeout=window.setTimeout.bind(window);
function src(fn){try{return typeof fn==='function'?Function.prototype.toString.call(fn):String(fn||'')}catch(e){return''}}
window.setInterval=function(fn,delay){
  let ms=Number(delay)||0;
  const s=src(fn),args=[].slice.call(arguments,2);
  // A sincronização da equipe rodava três rotinas pesadas juntas a cada 10 s.
  // Mantém a sincronização automática, mas reduz a frequência para evitar travadas no Safari/iPhone.
  if(ms>=8000&&ms<=12000&&/syncRemote\(false\).*syncLocal\(false\).*refreshMembers\(false\)/s.test(s))ms=30000;
  return nativeInterval(function(){
    if(document.hidden&&ms<15000)return;
    try{return typeof fn==='function'?fn.apply(window,args):Function(String(fn))()}catch(e){nativeTimeout(()=>{throw e},0)}
  },ms);
};
})();
