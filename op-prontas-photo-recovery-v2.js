(function(){
'use strict';
if(window.DFOpProntasPhotoRecoveryV3)return;window.DFOpProntasPhotoRecoveryV3=true;

const OPS_KEY='df_formula_ops_auto_v2';
const REG_KEY='df_op_qr_registry_v1';
const DB='df_ops_fotos_v2';
let running=false,timer=0,lastScanAt=0,scannedOnce=false;
const $=id=>document.getElementById(id);
function load(k,f){try{const v=JSON.parse(localStorage.getItem(k)||'');return v==null?f:v}catch(e){return f}}
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}
function validQr(v){return /^DFOP-\d{8}-\d{6}-[A-Z0-9-]+$/i.test(String(v||'').trim())}
function registry(){const r=load(REG_KEY,{});return r&&typeof r==='object'&&!Array.isArray(r)?r:{}}
function expectedFor(id){return registry()[id]?.expected||null}
function buildMaterials(exp,prod){return (Array.isArray(exp?.materials)?exp.materials:[]).map(m=>({name:m.name,pct:+m.pct||0,kg:prod>0?prod*(+m.pct||0)/100:0}))}
function dbOpen(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB,1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
function ymd(v){const s=String(v||'');const m=s.match(/^(\d{4}-\d{2}-\d{2})/);return m?m[1]:new Date().toISOString().slice(0,10)}
function norm(v){return String(v||'').trim().toUpperCase()}

async function scanPhotoMetadata(existing){
  const found=[];
  try{
    const d=await dbOpen();
    await new Promise((resolve,reject)=>{
      const tx=d.transaction('photos','readonly'),st=tx.objectStore('photos'),rq=st.openCursor();
      rq.onsuccess=()=>{
        const c=rq.result;if(!c)return resolve();
        const p=c.value||{},id=String(p.qr||p.id||'').trim(),key=norm(id);
        if(validQr(id)&&!existing.has(key)&&p.manualPending!==true){
          const prod=Number(p.produzido??p.production),ap=Number(p.apara??p.scrap);
          if(prod>0&&Number.isFinite(ap)&&ap>=0){
            found.push({id,prod,ap,savedAt:p.savedAt||''});existing.add(key);
          }
        }
        c.continue();
      };
      rq.onerror=()=>reject(rq.error);
    });
  }catch(e){}
  return found;
}
function refreshUi(){
  const y=window.scrollY||0,m=$('dfOpMonth');
  if(m)try{m.dispatchEvent(new Event('change',{bubbles:true}))}catch(e){}
  try{window.DFOpTeamDateCanonical?.run?.()}catch(e){}
  requestAnimationFrame(()=>requestAnimationFrame(()=>{try{window.scrollTo(0,y)}catch(e){}}));
}
function emit(rec){
  try{window.dispatchEvent(new CustomEvent('df-op-save-ui-refresh',{detail:{record:rec,recovered:true}}))}catch(e){}
  try{window.dispatchEvent(new CustomEvent('df-op-saved',{detail:{record:rec,recovered:true}}))}catch(e){}
}
async function recover(force){
  if(running||document.hidden)return false;
  const now=Date.now();
  if(!force&&scannedOnce&&now-lastScanAt<30000)return false;
  running=true;lastScanAt=now;
  try{
    let ops=load(OPS_KEY,[]);if(!Array.isArray(ops))ops=[];
    const existing=new Set();ops.forEach(o=>{[o?.id,o?.qr].forEach(v=>{const k=norm(v);if(k)existing.add(k)})});
    const missing=await scanPhotoMetadata(existing);scannedOnce=true;
    if(!missing.length)return false;
    let last=null;
    for(const p of missing){
      const exp=expectedFor(p.id)||{};
      const rec={id:p.id,qr:p.id,createdAt:p.savedAt||new Date().toISOString(),updatedAt:p.savedAt||new Date().toISOString(),data:ymd(p.savedAt),numero:'',operador:'',maquina:'',produto:exp.title||'',largura:+exp.largura||0,micra:+exp.micra||0,gm:+exp.gm||0,produzido:p.prod,apara:p.ap,bobinas:0,materials:buildMaterials(exp,p.prod),expectedTotal:+exp.totalKg||0,ocrConfidence:100,status:'ok',reasons:[],manualConfirmed:true,manualConfirmedAt:p.savedAt||new Date().toISOString(),source:'foto+recuperacao-prontas-v3'};
      ops.unshift(rec);last=rec;
    }
    save(OPS_KEY,ops);refreshUi();if(last)emit(last);return true;
  }finally{running=false}
}
function schedule(ms,force){clearTimeout(timer);timer=setTimeout(()=>recover(!!force),ms==null?120:ms)}

// Recuperação leve e idempotente: só procura fotos que ainda NÃO possuem registro de OP.
document.addEventListener('click',e=>{if(e.target?.closest?.('[data-pane="ok"]'))schedule(80,false)},true);
window.addEventListener('pageshow',()=>schedule(300,false));
document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule(350,false)});
function boot(){setTimeout(()=>recover(false),900)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.DFOpProntasPhotoRecovery={recover:()=>recover(true)};
})();
