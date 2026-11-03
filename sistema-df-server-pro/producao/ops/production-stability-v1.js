(function(){
'use strict';
if(window.DFProductionStabilityV1)return;
window.DFProductionStabilityV1=true;

const RECOVERY_KEY='df_prod_stability_recovery_v1';
const RECOVERY_WINDOW=2*60*1000;
const HEALTH_KEY='df_prod_stability_health_v1';
const CRITICAL_RE=/(?:^|\/)(?:op-[^/?]+|formula-op-relatorio|client-stability-v127)\.js(?:[?#]|$)/i;

function now(){return Date.now()}
function safeGet(k){try{return sessionStorage.getItem(k)}catch(e){return null}}
function safeSet(k,v){try{sessionStorage.setItem(k,String(v))}catch(e){}}
function safeRemove(k){try{sessionStorage.removeItem(k)}catch(e){}}
function saveHealth(data){try{localStorage.setItem(HEALTH_KEY,JSON.stringify({...(data||{}),at:new Date().toISOString()}))}catch(e){}}
function report(message,meta){
  saveHealth({ok:false,message:String(message||'Falha de estabilidade'),meta:meta||{}});
  try{window.DFErrorMonitor?.report?.(message,{filename:'production-stability-v1.js',...(meta||{})})}catch(e){}
  try{window.dispatchEvent(new CustomEvent('df-production-stability-warning',{detail:{message,meta:meta||{}}}))}catch(e){}
}
function isCriticalScript(node){
  try{return !!(node&&node.tagName==='SCRIPT'&&CRITICAL_RE.test(String(node.src||node.getAttribute?.('src')||'')))}catch(e){return false}
}
function recover(src){
  report('Falha ao carregar módulo crítico',{file:String(src||'')});
  if(navigator.onLine===false)return;
  const last=Number(safeGet(RECOVERY_KEY)||0);
  if(last&&now()-last<RECOVERY_WINDOW)return;
  safeSet(RECOVERY_KEY,now());
  setTimeout(function(){
    try{
      const u=new URL(location.href);
      u.searchParams.set('dfrecovery',String(now()));
      location.replace(u.toString());
    }catch(e){location.reload()}
  },650);
}

function patchDynamicScripts(){
  const head=document.head;
  if(!head||head.__dfProdStableAppend)return;
  const nativeAppend=head.appendChild.bind(head);
  head.__dfProdStableAppend=nativeAppend;
  head.appendChild=function(node){
    try{
      if(isCriticalScript(node)){
        // Scripts criados dinamicamente são assíncronos por padrão. Desligar async
        // mantém a ordem de inserção e evita corrida entre módulos dependentes.
        node.async=false;
        const previousError=node.onerror;
        node.onerror=function(ev){
          try{if(typeof previousError==='function')previousError.call(this,ev)}catch(e){}
          recover(node.src||node.getAttribute?.('src')||'');
        };
      }
    }catch(e){}
    return nativeAppend(node);
  };
}

function markHealthy(){
  saveHealth({ok:true,message:'Camada de estabilidade ativa'});
  // Mantém a trava de recuperação durante o começo do boot para evitar loop.
  setTimeout(()=>safeRemove(RECOVERY_KEY),15000);
}

function boot(){
  patchDynamicScripts();
  markHealthy();
  // Alguns módulos recriam o head/DOM em fluxos de atualização; reaplica sem custo.
  window.addEventListener('df-ui-ready',patchDynamicScripts);
  window.addEventListener('pageshow',patchDynamicScripts);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
})();
