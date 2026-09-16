(function(){
'use strict';
if(window.DFOpReportBackV205)return;window.DFOpReportBackV205=true;
function addBack(){
  if(document.getElementById('dfReportBackV205'))return;
  var report=document.querySelector('#dfReport');
  if(!report)return;
  var btn=document.createElement('button');
  btn.id='dfReportBackV205';
  btn.type='button';
  btn.textContent='← VOLTAR PARA FORMULAÇÃO / RELATÓRIO';
  btn.style.cssText='display:none;position:fixed;top:max(12px,env(safe-area-inset-top));left:12px;z-index:2147483647;border:1px solid #f5a000;background:#241600;color:#ffd36a;border-radius:12px;padding:10px 13px;font:800 13px system-ui,-apple-system,Segoe UI,Roboto,Arial;box-shadow:0 4px 16px #0004';
  btn.onclick=function(){try{window.close()}catch(e){} setTimeout(function(){try{history.back()}catch(e){}},80)};
  document.body.appendChild(btn);
  var before=function(){btn.style.display='block'};
  var after=function(){setTimeout(function(){btn.style.display='none'},700)};
  window.addEventListener('beforeprint',before);
  window.addEventListener('afterprint',after);
  if(window.matchMedia){try{var mq=window.matchMedia('print');var fn=function(e){btn.style.display=e.matches?'block':'none'};mq.addEventListener?mq.addEventListener('change',fn):mq.addListener(fn)}catch(e){}}
}
function init(){addBack();setTimeout(addBack,500);setTimeout(addBack,1800)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
window.addEventListener('df-ui-ready',init);
})();