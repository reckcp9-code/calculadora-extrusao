(function(){
'use strict';
if(window.DFOpProntasPhotoRecoveryV2)return;window.DFOpProntasPhotoRecoveryV2=true;

const OPS_KEY='df_formula_ops_auto_v2';
const REG_KEY='df_op_qr_registry_v1';
const DB='df_ops_fotos_v2';
let running=false,timer=0;
const $=id=>document.getElementById(id);
function load(k,f){try{const v=JSON.parse(localStorage.getItem(k)||'');return v==null?f:v}catch(e){return f}}
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}
function validQr(v){return /^DFOP-\d{8}-\d{6}-[A-Z0-9-]+$/i.test(String(v||'').trim())}
function registry(){const r=load(REG_KEY,{});return r&&typeof r==='object'&&!Array.isArray(r)?r:{}}
function expectedFor(id){return registry()[id]?.expected||null}
function buildMaterials(exp,prod){return (Array.isArray(exp?.materials)?exp.materials:[]).map(m=>({name:m.name,pct:+m.pct||0,kg:prod>0?prod*(+m.pct||0)/100:0}))}
function dbOpen(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB,1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
async function allPhotos(){try{const d=await dbOpen();return await new Promise((resolve,reject)=>{const tx=d.transaction('photos','readonly'),st=tx.objectStore('photos'),rq=st.getAll();rq.onsuccess=()=>resolve(Array.isArray(rq.result)?rq.result:[]);rq.onerror=()=>reject(rq.error)})}catch(e){return[]}}
function ymd(v){const s=String(v||'');const m=s.match(/^(\d{4}-\d{2}-\d{2})/);return m?m[1]:new Date().toISOString().slice(0,10)}
function refreshUi(openProntas){const m=$('dfOpMonth');if(m)try{m.dispatchEvent(new Event('change',{bubbles:true}))}catch(e){};try{window.DFOpTeamDateCanonical?.run?.()}catch(e){};if(openProntas)setTimeout(()=>{try{$('dfFormTabOps')?.click()}catch(e){};setTimeout(()=>{try{document.querySelector('.dfOpsTabs [data-pane="ok"]')?.click()}catch(e){}},80)},40)}
function emit(rec){try{window.dispatchEvent(new CustomEvent('df-op-save-ui-refresh',{detail:{record:rec,recovered:true}}))}catch(e){};try{window.dispatchEvent(new CustomEvent('df-op-saved',{detail:{record:rec,recovered:true}}))}catch(e){}}
async function recover(openProntas){if(running)return false;running=true;try{
  const photos=await allPhotos();if(!photos.length){if(openProntas)refreshUi(true);return false}
  let ops=load(OPS_KEY,[]);if(!Array.isArray(ops))ops=[];let changed=false,last=null;
  for(const p of photos){
    const id=String(p?.qr||p?.id||'').trim();if(!validQr(id)||p?.manualPending===true)continue;
    const prod=Number(p?.produzido??p?.production),ap=Number(p?.apara??p?.scrap);
    if(!(prod>0)||!Number.isFinite(ap)||ap<0)continue;
    let i=ops.findIndex(o=>String(o?.id||'').trim()===id||String(o?.qr||'').trim()===id);
    const old=i>=0?ops[i]:{},exp=expectedFor(id)||{};
    const rec={...old,id,qr:id,createdAt:old.createdAt||p.savedAt||new Date().toISOString(),updatedAt:new Date().toISOString(),data:old.data||ymd(p.savedAt),numero:old.numero||'',operador:old.operador||'',maquina:old.maquina||'',produto:exp.title||old.produto||'',largura:+exp.largura||old.largura||0,micra:+exp.micra||old.micra||0,gm:+exp.gm||old.gm||0,produzido:prod,apara:ap,bobinas:old.bobinas||0,materials:(old.materials&&old.materials.length)?old.materials:buildMaterials(exp,prod),expectedTotal:+exp.totalKg||old.expectedTotal||0,ocrConfidence:100,status:'ok',reasons:[],manualConfirmed:true,manualConfirmedAt:old.manualConfirmedAt||p.savedAt||new Date().toISOString(),source:old.source||'foto+recuperacao-prontas-v2'};
    if(i>=0){const before=JSON.stringify(ops[i]);ops[i]=rec;if(JSON.stringify(rec)!==before)changed=true}else{ops.unshift(rec);changed=true}
    if(!last||String(rec.manualConfirmedAt||rec.updatedAt)>String(last.manualConfirmedAt||last.updatedAt))last=rec;
  }
  if(changed){save(OPS_KEY,ops);if(last)emit(last)}
  try{if(window.DFOpCloud&&typeof window.DFOpCloud.sync==='function')await window.DFOpCloud.sync(true)}catch(e){}
  refreshUi(!!openProntas);return changed;
}finally{running=false}}
function schedule(ms,open){clearTimeout(timer);timer=setTimeout(()=>recover(!!open),ms==null?120:ms)}

document.addEventListener('click',e=>{if(e.target?.closest?.('[data-pane="ok"]'))schedule(30,true)},true);
window.addEventListener('pageshow',()=>schedule(120,false));
window.addEventListener('df-ui-ready',()=>schedule(300,false));
window.addEventListener('df-op-cloud-synced',()=>schedule(100,false));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule(180,false)});
function boot(){setTimeout(()=>recover(false),700);setTimeout(()=>recover(false),1800)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.DFOpProntasPhotoRecovery={recover:()=>recover(true)};
})();
