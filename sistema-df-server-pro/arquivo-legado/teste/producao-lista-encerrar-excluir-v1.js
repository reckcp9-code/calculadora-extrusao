(function(){
'use strict';
if(window.DFProducaoListaEncerrarExcluirV1)return;
window.DFProducaoListaEncerrarExcluirV1=true;

const OPS_KEY='df_producao_ops_setores_test_v3';
const QR_KEY='df_op_qr_registry_test_setores_v3';
const TOMB_KEY='df_producao_ops_tombstones_test_v1';
const PHOTO_DB='df_producao_ops_fotos_test_v1';

function load(k,f){try{const v=JSON.parse(localStorage.getItem(k)||'');return v==null?f:v}catch(e){return f}}
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}
function norm(s){return String(s||'').trim().toUpperCase()}

function removeRegistry(id){
  const r=load(QR_KEY,{});
  if(r&&typeof r==='object'){
    Object.keys(r).forEach(k=>{if(norm(k)===norm(id))delete r[k]});
    save(QR_KEY,r);
  }
}

function markTombstone(id){
  const t=load(TOMB_KEY,{}),now=new Date().toISOString();
  t[norm(id)]={id:id,deletedAt:now,ts:Date.now()};
  save(TOMB_KEY,t);
}

function deletePhotos(opId){
  return new Promise(resolve=>{
    try{
      const req=indexedDB.open(PHOTO_DB,1);
      req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains('photos'))db.createObjectStore('photos',{keyPath:'id'})};
      req.onerror=()=>resolve();
      req.onsuccess=()=>{
        const db=req.result,tx=db.transaction('photos','readwrite'),st=tx.objectStore('photos'),all=st.getAll();
        all.onerror=()=>resolve();
        all.onsuccess=()=>{(all.result||[]).forEach(p=>{if(norm(p&&p.opId)===norm(opId))try{st.delete(p.id)}catch(e){}})};
        tx.oncomplete=()=>resolve();tx.onerror=()=>resolve();
      };
    }catch(e){resolve()}
  });
}

async function deleteOp(id,row){
  const ops=load(OPS_KEY,[]),op=(Array.isArray(ops)?ops:[]).find(x=>norm(x&&x.id)===norm(id));
  if(!op)return;
  if(!confirm('Excluir esta OP?\n\n'+id+'\n\nEla será removida da Produção e não voltará pela sincronização.'))return;
  const next=ops.filter(x=>norm(x&&x.id)!==norm(id));
  if(!save(OPS_KEY,next)){alert('Não foi possível excluir esta OP.');return}
  removeRegistry(id);
  markTombstone(id);
  await deletePhotos(id);
  if(row&&row.remove)row.remove();
  try{window.dispatchEvent(new CustomEvent('df-producao-op-deleted',{detail:{id}}))}catch(e){}
}

function decorate(){
  document.querySelectorAll('.dfPrItem').forEach(row=>{
    const btn=row.querySelector('button[data-close],button.dfPrBtn.red');
    if(!btn)return;
    const txt=String(btn.textContent||'').trim().toUpperCase();
    if(txt==='ENCERRAR'||btn.hasAttribute('data-close')){
      btn.textContent='EXCLUIR';
      btn.dataset.dfDeleteOp='1';
      btn.classList.add('dfPrDeleteReplacement');
    }
  });
}

document.addEventListener('click',function(e){
  const btn=e.target&&e.target.closest?e.target.closest('button[data-df-delete-op="1"],button.dfPrDeleteReplacement'):null;
  if(!btn)return;
  e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
  const row=btn.closest('.dfPrItem');
  const id=String(row&&row.querySelector('strong')&&row.querySelector('strong').textContent||'').trim();
  if(id)deleteOp(id,row);
},true);

const mo=new MutationObserver(()=>decorate());
mo.observe(document.documentElement,{childList:true,subtree:true,characterData:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(decorate,50),{once:true});
else setTimeout(decorate,50);
setTimeout(decorate,400);setTimeout(decorate,1000);
})();
