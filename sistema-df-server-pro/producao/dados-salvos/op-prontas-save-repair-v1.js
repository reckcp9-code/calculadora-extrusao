(function(){
'use strict';
if(window.DFOpProntasSaveRepairV2)return;window.DFOpProntasSaveRepairV2=true;

const KEY='df_formula_ops_auto_v2';
let timer=0,lastEmit='';
const $=id=>document.getElementById(id);
function load(){try{const a=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(a)?a:[]}catch(e){return[]}}
function save(a){try{localStorage.setItem(KEY,JSON.stringify(a));return true}catch(e){return false}}
function validQr(v){return /^DFOP-/i.test(String(v||'').trim())}
function ready(o){
  if(!o||!validQr(o.qr||o.id)||!(Number(o.produzido)>0)||!(Number(o.apara)>=0))return false;
  if(o.manualConfirmed)return true;
  return o.source==='foto-equipe';
}
function repair(){
  const a=load();let changed=false,last=null;
  for(const o of a){
    if(!ready(o))continue;
    if(o.status!=='ok'||(Array.isArray(o.reasons)&&o.reasons.length)){
      o.status='ok';o.reasons=[];changed=true;
    }
    if(!last||String(o.manualConfirmedAt||o.updatedAt||o.createdAt||'')>String(last.manualConfirmedAt||last.updatedAt||last.createdAt||''))last=o;
  }
  if(changed)save(a);
  return {changed,last};
}
function refreshUi(){
  const y=window.scrollY||0,m=$('dfOpMonth');
  if(m)try{m.dispatchEvent(new Event('change',{bubbles:true}))}catch(e){}
  try{window.DFOpTeamDateCanonical?.run?.()}catch(e){}
  requestAnimationFrame(()=>requestAnimationFrame(()=>{try{window.scrollTo(0,y)}catch(e){}}));
}
function emitSaved(o){
  if(!o)return;const k=String(o.id||'')+'|'+String(o.manualConfirmedAt||o.updatedAt||'');if(!k||k===lastEmit)return;lastEmit=k;
  try{window.dispatchEvent(new CustomEvent('df-op-saved',{detail:{record:o,repair:true}}))}catch(e){}
}
function run(opts){
  opts=opts||{};const r=repair();
  if(r.changed||opts.refresh)refreshUi();
  if(opts.emit&&r.last)emitSaved(r.last);
  return r.changed;
}
function schedule(ms,opts){clearTimeout(timer);timer=setTimeout(()=>run(opts),ms||80)}

// Depois de salvar uma baixa, atualiza PRONTAS no lugar, sem recarregar a página
// e sem clicar em abas automaticamente (isso fazia a tela pular para o topo).
document.addEventListener('click',e=>{
  if(!e.target?.closest?.('#dfManualSave'))return;
  setTimeout(()=>run({emit:true,refresh:true}),220);
  setTimeout(()=>run({emit:true,refresh:true}),650);
},true);

window.addEventListener('df-op-save-ui-refresh',()=>schedule(30,{emit:true,refresh:true}));
window.addEventListener('df-op-remote-merged',()=>schedule(80,{refresh:true}));
window.addEventListener('pageshow',()=>schedule(120,{}));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule(150,{})});

function boot(){setTimeout(()=>run({}),450)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.DFOpProntasSaveRepair={repair:()=>run({refresh:true})};
})();
