(function(){
'use strict';
if(window.DFProducaoOpsExcluirV1)return;window.DFProducaoOpsExcluirV1=true;
const OPS_KEY='df_producao_ops_setores_test_v3';
const QR_KEY='df_op_qr_registry_test_setores_v3';
const PHOTO_DB='df_producao_ops_fotos_test_v1';
const $=s=>document.querySelector(s);
function css(){if(document.getElementById('dfProdDeleteCss'))return;const s=document.createElement('style');s.id='dfProdDeleteCss';s.textContent=`.dfProdDeleteBtn{width:100%;margin-top:9px;border:1px solid #7f1d1d;background:#230b0b;color:#fca5a5;border-radius:11px;padding:10px;font-size:11px;font-weight:950}.dfProdDeleteBtn:active{transform:scale(.99)}`;document.head.appendChild(s)}
function readOps(){try{const a=JSON.parse(localStorage.getItem(OPS_KEY)||'[]');return Array.isArray(a)?a:[]}catch(e){return[]}}
function activePane(){return String($('#dfProdOpsGeradas .dfPogTabs button.on')?.dataset?.pog||'')}
function removeRegistry(id){try{const r=JSON.parse(localStorage.getItem(QR_KEY)||'{}');if(r&&typeof r==='object'&&r[id]){delete r[id];localStorage.setItem(QR_KEY,JSON.stringify(r))}}catch(e){}}
function deletePhotos(opId){return new Promise(resolve=>{try{const req=indexedDB.open(PHOTO_DB,1);req.onupgradeneeded=()=>{const d=req.result;if(!d.objectStoreNames.contains('photos'))d.createObjectStore('photos',{keyPath:'id'})};req.onerror=()=>resolve();req.onsuccess=()=>{const db=req.result,tx=db.transaction('photos','readwrite'),st=tx.objectStore('photos'),all=st.getAll();all.onerror=()=>resolve();all.onsuccess=()=>{(all.result||[]).forEach(p=>{if(String(p&&p.opId||'')===String(opId))try{st.delete(p.id)}catch(e){}})};tx.oncomplete=()=>resolve();tx.onerror=()=>resolve()}}catch(e){resolve()}})}
async function removeOp(id){const ops=readOps(),op=ops.find(x=>String(x&&x.id||'')===String(id));if(!op)return;if(!confirm('Excluir esta OP?\n\n'+id+'\n\nEssa ação remove a OP, o vínculo do QR e as fotos dela neste teste.'))return;const next=ops.filter(x=>String(x&&x.id||'')!==String(id));try{localStorage.setItem(OPS_KEY,JSON.stringify(next))}catch(e){alert('Não foi possível excluir esta OP.');return}removeRegistry(id);await deletePhotos(id);const pane=activePane()||'ready';try{window.DFProducaoOpsGeradasV2?.render?.(pane)}catch(e){}setTimeout(scan,40)}
function scan(){css();const pane=activePane();if(!['ready','pending','now'].includes(pane))return;const ids=new Set(readOps().map(o=>String(o&&o.id||'')));document.querySelectorAll('#dfPogPane .dfPogItem').forEach(row=>{if(row.querySelector('.dfProdDeleteBtn'))return;const id=String(row.querySelector('strong')?.textContent||'').trim();if(!id||!ids.has(id))return;const b=document.createElement('button');b.type='button';b.className='dfProdDeleteBtn';b.textContent='🗑️ EXCLUIR';b.onclick=e=>{e.preventDefault();e.stopPropagation();removeOp(id)};row.appendChild(b)})}
function boot(){css();let t=0;const run=()=>{clearTimeout(t);t=setTimeout(scan,30)};document.addEventListener('click',e=>{if(e.target&&e.target.closest&&e.target.closest('#dfProdOpsGeradas [data-pog]'))setTimeout(scan,60)},true);const mo=new MutationObserver(run);mo.observe(document.documentElement,{childList:true,subtree:true});setTimeout(scan,500);setTimeout(scan,1200)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
