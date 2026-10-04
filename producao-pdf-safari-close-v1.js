(function(){
'use strict';
if(window.DF_PRODUCAO_PDF_SAFARI_CLOSE_V1)return;window.DF_PRODUCAO_PDF_SAFARI_CLOSE_V1=true;

function isStandalone(){
  try{return (window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches)||window.navigator.standalone===true}catch(e){return false}
}
function viewerHtml(url){
  var safe=String(url||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  return '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>OP — DF EXTRUSOR PRO</title><style>*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#e9ecef;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial}.bar{position:fixed;z-index:20;top:0;left:0;right:0;height:calc(58px + env(safe-area-inset-top));padding-top:env(safe-area-inset-top);display:flex;align-items:center;background:rgba(255,255,255,.96);border-bottom:1px solid #d1d5db;box-shadow:0 1px 8px rgba(0,0,0,.08)}.close{margin-left:12px;width:42px;height:42px;border:0;border-radius:50%;background:#fff;color:#111;font:400 30px/1 system-ui;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 7px rgba(0,0,0,.18);-webkit-tap-highlight-color:transparent}.title{font-size:14px;font-weight:800;margin-left:12px;color:#111}.pdf{position:fixed;left:0;right:0;bottom:0;top:calc(58px + env(safe-area-inset-top));width:100%;height:calc(100% - 58px - env(safe-area-inset-top));border:0;background:#e9ecef}.fallback{position:fixed;z-index:5;left:50%;top:50%;transform:translate(-50%,-50%);background:#fff;border:1px solid #d1d5db;border-radius:14px;padding:14px 18px;color:#111;text-decoration:none;font-weight:800}</style></head><body><div class="bar"><button class="close" type="button" aria-label="Fechar" onclick="(function(){try{window.close()}catch(e){}setTimeout(function(){try{if(!window.closed){if(history.length>1)history.back();else location.href=\'./op-producao.html\'}}catch(e){}},80)})()">×</button><div class="title">OP DE PRODUÇÃO</div></div><a class="fallback" href="'+safe+'">ABRIR PDF</a><iframe class="pdf" src="'+safe+'" title="PDF da OP" onload="try{document.querySelector(\'.fallback\').style.display=\'none\'}catch(e){}"></iframe></body></html>';
}
function makeFacade(real){
  var facade={};
  facade.document=real.document;
  facade.close=function(){try{return real.close()}catch(e){}};
  facade.focus=function(){try{return real.focus()}catch(e){}};
  facade.closed=false;
  var loc={};
  loc.replace=function(url){
    try{real.document.open();real.document.write(viewerHtml(url));real.document.close();real.focus()}catch(e){try{real.location.href=url}catch(x){}}
  };
  try{Object.defineProperty(loc,'href',{set:function(url){loc.replace(url)},get:function(){try{return real.location.href}catch(e){return''}}})}catch(e){}
  facade.location=loc;
  return facade;
}
function wrap(fn){
  if(typeof fn!=='function'||fn.__dfSafariClose)return fn;
  function patched(o){
    if(isStandalone())return fn.call(this,o);
    var realOpen=window.open;
    window.open=function(){
      var real=realOpen.apply(window,arguments);
      return real?makeFacade(real):real;
    };
    try{return fn.call(this,o)}finally{window.open=realOpen}
  }
  patched.__dfSafariClose=true;
  patched.__dfNativePdf=true;
  patched.__dfOriginal=fn;
  return patched;
}
function patch(){
  var api=window.DF_PRODUCAO_OP_TEST;
  if(!api||typeof api.print!=='function'||!api.print.__dfNativePdf)return false;
  if(!api.print.__dfSafariClose)api.print=wrap(api.print);
  return true;
}
function watch(ms){var end=Date.now()+(ms||10000);(function tick(){patch();if(Date.now()<end)setTimeout(tick,100)})()}
function loadGerarNova(){
  if(window.DF_PRODUCAO_GERAR_NOVA_V1||document.querySelector('script[data-df-gerar-nova]'))return;
  var s=document.createElement('script');s.src='./producao-gerar-nova-v1.js?v=20261004-gerar-nova-v1';s.async=false;s.dataset.dfGerarNova='1';document.head.appendChild(s);
}
function loadOpList(){
  if(window.DF_PRODUCAO_OP_LISTA_V2||document.querySelector('script[data-df-op-lista-v2]'))return;
  var s=document.createElement('script');s.src='./producao-op-lista-v2.js?v=20261004-op-lista-v2-fix';s.async=false;s.dataset.dfOpListaV2='1';document.head.appendChild(s);
}
watch(30000);loadGerarNova();loadOpList();
window.addEventListener('pageshow',function(){watch(5000);loadGerarNova();loadOpList()},true);
window.addEventListener('focus',function(){watch(2500);loadGerarNova();loadOpList()},true);
document.addEventListener('visibilitychange',function(){if(!document.hidden){watch(2500);loadGerarNova();loadOpList()}},true);
})();