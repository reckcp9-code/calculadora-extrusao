(function(){
'use strict';
if(window.DFOpProntasSaveRepairV1)return;window.DFOpProntasSaveRepairV1=true;

const KEY='df_formula_ops_auto_v2';
let timer=0,lastEmit='';
const $=id=>document.getElementById(id);
function load(){try{const a=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(a)?a:[]}catch(e){return[]}}
function save(a){try{localStorage.setItem(KEY,JSON.stringify(a));return true}catch(e){return false}}
function validQr(v){return /^DFOP-/i.test(String(v||'').trim())}
function readyManual(o){return !!(o&&o.source==='foto+confirmacao-manual'&&o.manualConfirmed&&validQr(o.qr||o.id)&&Number(o.produzido)>0&&Number(o.apara)>=0)}
function readyRemote(o){return !!(o&&o.source==='foto-equipe'&&validQr(o.qr||o.id)&&Number(o.produzido)>0&&Number(o.apara)>=0)}
function repair(){
  const a=load();let changed=false,last=null;
  for(const o of a){
    if(!readyManual(o)&&!readyRemote(o))continue;
    if(o.status!=='ok'||(Array.isArray(o.reasons)&&o.reasons.length)){
      o.status='ok';o.reasons=[];o.updatedAt=o.updatedAt||new Date().toISOString();changed=true;
    }
    if(!last||String(o.manualConfirmedAt||o.updatedAt||o.createdAt||'')>String(last.manualConfirmedAt||last.updatedAt||last.createdAt||''))last=o;
  }
  if(changed)save(a);
  return {changed,last};
}
function refresh(){
  const m=$('dfOpMonth');if(m)try{m.dispatchEvent(new Event('change',{bubbles:true}))}catch(e){}
  setTimeout(()=>{try{$('dfFormTabOps')?.click()}catch(e){};setTimeout(()=>{try{document.querySelector('.dfOpsTabs [data-pane="ok"]')?.click()}catch(e){}},90)},40);
}
function emitSaved(o){
  if(!o)return;const k=String(o.id||'')+'|'+String(o.manualConfirmedAt||o.updatedAt||'');if(!k||k===lastEmit)return;lastEmit=k;
  try{window.dispatchEvent(new CustomEvent('df-op-saved',{detail:{record:o,repair:true}}))}catch(e){}
}
function run(doEmit){const r=repair();refresh();if(doEmit&&r.last)emitSaved(r.last);return r.changed}
function schedule(ms,emit){clearTimeout(timer);timer=setTimeout(()=>run(!!emit),ms||80)}

// A baixa manual salva a OP no localStorage antes de atualizar a tela. Garantimos que
// a lista PRONTAS seja redesenhada no mesmo aparelho sem depender de reload.
document.addEventListener('click',e=>{
  if(!e.target?.closest?.('#dfManualSave'))return;
  setTimeout(()=>run(true),220);
  setTimeout(()=>run(true),650);
  setTimeout(()=>run(true),1200);
},true);

window.addEventListener('df-op-save-ui-refresh',()=>schedule(30,true));
window.addEventListener('df-op-saved',()=>schedule(80,false));
window.addEventListener('df-op-remote-merged',()=>schedule(80,false));
window.addEventListener('df-op-cloud-synced',()=>schedule(80,false));
window.addEventListener('pageshow',()=>schedule(100,false));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule(120,false)});

function boot(){setTimeout(()=>run(false),350);setTimeout(()=>run(false),1200)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.DFOpProntasSaveRepair={repair:()=>run(false)};
})();
