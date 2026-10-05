(function(){
'use strict';
if(window.DF_PRODUCAO_EXCLUIR_OP_SYNC_V1)return;window.DF_PRODUCAO_EXCLUIR_OP_SYNC_V1=true;

const OPS_KEY='df_producao_ops_setores_test_v3';
const AUTO_KEY='df_producao_ops_auto_v1';
const QR_KEY='df_op_qr_registry_test_setores_v3';
const TEAM_KEY='df_producao_team_v2';
const SNAP_KEY='df_producao_team_snapshot_v2';
const PENDING_KEY='df_producao_delete_pending_v1';

const norm=v=>String(v||'').trim().toUpperCase().replace(/\s+/g,'');
function read(k,f){try{const v=JSON.parse(localStorage.getItem(k)||'');return v==null?f:v}catch(e){return f}}
function write(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}

function removeLocalEverywhere(id){
  id=norm(id);if(!id)return false;
  let changed=false;
  const ops=read(OPS_KEY,[]);
  if(Array.isArray(ops)){
    const next=ops.filter(o=>norm(o&&o.id)!==id);
    if(next.length!==ops.length){write(OPS_KEY,next);changed=true}
  }
  const auto=read(AUTO_KEY,[]);
  if(Array.isArray(auto)){
    const next=auto.filter(r=>norm(r&&(r.opId||r.id))!==id);
    if(next.length!==auto.length){write(AUTO_KEY,next);changed=true}
  }
  const qr=read(QR_KEY,{});
  if(qr&&typeof qr==='object'&&Object.prototype.hasOwnProperty.call(qr,id)){
    delete qr[id];write(QR_KEY,qr);changed=true;
  }
  return changed;
}

function markPending(id){
  id=norm(id);if(!id)return;
  const p=read(PENDING_KEY,{});p[id]={at:Date.now()};write(PENDING_KEY,p);
  const t=read(TEAM_KEY,null);
  if(t&&t.teamId){
    const snap=read(SNAP_KEY,{});
    snap[id]={hash:'__PENDING_DELETE__',teamId:String(t.teamId),ts:0,updatedAt:new Date().toISOString()};
    write(SNAP_KEY,snap);
  }
}

async function pushDelete(id){
  id=norm(id);if(!id)return;
  removeLocalEverywhere(id);
  markPending(id);
  try{await window.DFProducaoEquipeOnline?.push?.()}catch(e){}
  removeLocalEverywhere(id);
  try{window.DFRenderSavedProductionOps?.()}catch(e){}
  setTimeout(()=>{try{window.DFProducaoEquipeOnline?.pull?.()}catch(e){}},700);
}

async function flushPending(){
  const p=read(PENDING_KEY,{}),ids=Object.keys(p||{});if(!ids.length)return;
  const t=read(TEAM_KEY,null),snap=read(SNAP_KEY,{});
  for(const id of ids){
    removeLocalEverywhere(id);
    if(t&&t.teamId&&snap[id]?.hash!=='__DELETED__'){
      snap[id]={hash:'__PENDING_DELETE__',teamId:String(t.teamId),ts:0,updatedAt:new Date().toISOString()};
    }
  }
  write(SNAP_KEY,snap);
  try{await window.DFProducaoEquipeOnline?.push?.()}catch(e){}
  const after=read(SNAP_KEY,{}),pending=read(PENDING_KEY,{});let dirty=false;
  for(const id of Object.keys(pending||{})){
    removeLocalEverywhere(id);
    if(after[id]?.hash==='__DELETED__'){delete pending[id];dirty=true}
  }
  if(dirty)write(PENDING_KEY,pending);
  try{window.DFRenderSavedProductionOps?.()}catch(e){}
}

document.addEventListener('click',e=>{
  const b=e.target&&e.target.closest&&e.target.closest('[data-op-del]');
  if(!b)return;
  const id=norm(b.getAttribute('data-op-del')||'');
  if(!id)return;
  setTimeout(()=>{
    const stillExists=(read(OPS_KEY,[])||[]).some(o=>norm(o&&o.id)===id);
    if(!stillExists)pushDelete(id);
  },0);
},true);

window.addEventListener('online',()=>setTimeout(flushPending,250));
window.addEventListener('pageshow',()=>setTimeout(flushPending,450));
window.addEventListener('focus',()=>setTimeout(flushPending,350));
setTimeout(flushPending,900);
setInterval(flushPending,5000);
})();
