(function(){
'use strict';
if(window.DFOpLifecycleAuthorityV2)return;window.DFOpLifecycleAuthorityV2=true;

const API='https://df-extrusor-api.reck-cp9.workers.dev';
const TOKEN_KEY='df_secure_token_v2';
const DEVICE_KEY='df_licenseauth_device_v1';
const ACCESS_KEY='df_auto_access_credential_v1';
const OPS_KEY='df_formula_ops_auto_v2';
const TEAM_KEY='df_op_team_v1';
const TOMBSTONE_KEY='df_deleted_ops_v1';
const DB='df_ops_fotos_v2';
let busy=false,timer=0,retryBusy=false;

const $=id=>document.getElementById(id);
const validQr=v=>/^DFOP-\d{8}-\d{6}-[A-Z0-9-]+$/i.test(String(v||'').trim());
const norm=v=>String(v||'').trim().toUpperCase();
function num(v){const n=Number(v);return Number.isFinite(n)?n:0}
function parseNum(v){let s=String(v??'').trim().replace(/\s/g,'');if(!s)return NaN;if(s.includes(',')&&s.includes('.'))s=s.replace(/\./g,'').replace(',','.');else s=s.replace(',','.');const n=parseFloat(s);return Number.isFinite(n)?n:NaN}
function loadJson(k,f){try{const v=JSON.parse(localStorage.getItem(k)||'');return v==null?f:v}catch(e){return f}}
function saveJson(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}
function loadOps(){const a=loadJson(OPS_KEY,[]);return Array.isArray(a)?a:[]}
function loadDeleted(){const d=loadJson(TOMBSTONE_KEY,{});return d&&typeof d==='object'&&!Array.isArray(d)?d:{}}
function saveDeleted(d){saveJson(TOMBSTONE_KEY,d)}
function teamInfo(){const t=loadJson(TEAM_KEY,null);return t&&typeof t==='object'?t:null}
function stamp(v){const n=Date.parse(String(v||''));return Number.isFinite(n)?n:0}
function completed(o){return !!(o&&validQr(o.qr||o.id)&&num(o.produzido)>0&&Number.isFinite(Number(o.apara))&&Number(o.apara)>=0&&(o.status==='ok'||o.manualConfirmed||o.source==='foto-equipe'))}
function completionStamp(o){
  if(!o)return 0;
  if(o.manualConfirmed){const t=stamp(o.manualConfirmedAt);if(t)return t}
  if(o.source==='foto-equipe'){const t=stamp(o.cloudSyncedAt);if(t)return t}
  if(/^foto\+recuperacao-prontas/i.test(String(o.source||''))){const t=stamp(o.manualConfirmedAt||o.createdAt);if(t)return t}
  return 0;
}
function idOf(o){return norm(o&&(o.id||o.qr))}
function findOp(sourceId){const id=norm(sourceId);return loadOps().find(o=>idOf(o)===id||norm(o&&o.qr)===id)||null}
function tombstoneFor(sourceId){return loadDeleted()[norm(sourceId)]||null}
function clearTombstone(sourceId){const id=norm(sourceId);if(!id)return false;const d=loadDeleted();if(!d[id])return false;delete d[id];saveDeleted(d);try{window.dispatchEvent(new CustomEvent('df-op-revived',{detail:{id}}))}catch(e){}return true}
function addTombstone(sourceId,cloudIds,rec){const id=norm(sourceId);if(!id)return;const d=loadDeleted();d[id]={at:Date.now(),cloudIds:Array.from(new Set((cloudIds||[]).map(String).filter(Boolean))),produto:String(rec?.produto||''),produzido:num(rec?.produzido),apara:num(rec?.apara)};saveDeleted(d)}
function setPendingCloudIds(sourceId,ids){const id=norm(sourceId),d=loadDeleted();if(!d[id])return;d[id].cloudIds=Array.from(new Set((ids||[]).map(String).filter(Boolean)));saveDeleted(d)}

function syncBackupSoon(){setTimeout(()=>{try{window.DFOpSyncLite?.sync?.(true)}catch(e){}},250)}
function refresh(){
  try{const m=$('dfOpMonth');if(m)m.dispatchEvent(new Event('change',{bubbles:true}))}catch(e){}
  try{window.DFOpTeamDateCanonical?.run?.()}catch(e){}
  try{window.dispatchEvent(new CustomEvent('df-op-lifecycle-updated'))}catch(e){}
}

function reconcile(){
  if(busy)return false;busy=true;
  try{
    const d=loadDeleted(),keys=Object.keys(d);if(!keys.length)return false;
    let ops=loadOps(),changedOps=false,changedDel=false;
    for(const rawId of keys){
      const id=norm(rawId),del=d[rawId]||d[id]||{},cut=Number(del.at)||0;
      const matching=ops.filter(o=>idOf(o)===id||norm(o&&o.qr)===id);
      const newer=matching.find(o=>completed(o)&&completionStamp(o)>cut+250);
      if(newer){delete d[rawId];if(rawId!==id)delete d[id];changedDel=true;continue}
      const before=ops.length;ops=ops.filter(o=>idOf(o)!==id&&norm(o&&o.qr)!==id);if(ops.length!==before)changedOps=true;
    }
    if(changedDel)saveDeleted(d);
    if(changedOps)saveJson(OPS_KEY,ops);
    if(changedDel||changedOps){refresh();syncBackupSoon()}
    return changedDel||changedOps;
  }catch(e){return false}finally{busy=false}
}

function beforeManualSave(){
  const prod=parseNum($('dfManualProd')?.value),ap=parseNum($('dfManualApara')?.value);
  if(!(prod>0)||!Number.isFinite(ap)||ap<0||ap>prod)return;
  const txt=String($('dfManualConfirm')?.textContent||'');
  const m=txt.match(/DFOP-\d{8}-\d{6}-[A-Z0-9-]+/i);if(!m)return;
  const id=norm(m[0]);
  if(clearTombstone(id)){try{sessionStorage.setItem('df_op_revived_now',id)}catch(e){}}
}

function deviceId(){try{if(window.DFDeviceIdentity&&typeof window.DFDeviceIdentity.get==='function'){const id=String(window.DFDeviceIdentity.get()||'').trim();if(id)return id}}catch(e){}try{return String(localStorage.getItem(DEVICE_KEY)||'').trim()}catch(e){return''}}
function tokenPayload(token){try{let s=String(token||'').split('.')[0]||'';s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';return JSON.parse(decodeURIComponent(Array.from(atob(s)).map(c=>'%'+c.charCodeAt(0).toString(16).padStart(2,'0')).join('')))}catch(e){return null}}
async function renewSession(force){let token='';try{token=String(sessionStorage.getItem(TOKEN_KEY)||'').trim()}catch(e){}const p=tokenPayload(token);if(token&&!force&&p&&p.owner)return token;let credential='';try{credential=String(localStorage.getItem(ACCESS_KEY)||'').trim()}catch(e){}const dev=deviceId();if(!credential||!dev)throw new Error('Acesso automático indisponível.');const r=await fetch(API+'/access/session',{method:'POST',headers:{'Content-Type':'application/json','X-DF-Device':dev},body:JSON.stringify({credential,deviceId:dev}),cache:'no-store'});let j={};try{j=await r.json()}catch(e){}if(!r.ok||j.ok===false)throw new Error(j.error||'Não foi possível renovar a sessão.');token=String(j.token||'').trim();if(!token)throw new Error('Sessão vazia.');try{sessionStorage.setItem(TOKEN_KEY,token)}catch(e){}return token}
async function apiPost(path,body,retry){const token=await renewSession(false),dev=deviceId();const r=await fetch(API+path,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token,'X-DF-Device':dev},body:JSON.stringify(body||{}),cache:'no-store'});let j={};try{j=await r.json()}catch(e){}if(r.status===401&&retry!==false){await renewSession(true);return apiPost(path,body,false)}if(!r.ok||j.ok===false)throw new Error(j.error||('HTTP '+r.status));return j}

function dbOpen(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{const d=r.result;if(!d.objectStoreNames.contains('photos'))d.createObjectStore('photos',{keyPath:'id'})};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
async function deleteLocal(sourceId){if(!sourceId)return;try{const d=await dbOpen();await new Promise((res,rej)=>{const tx=d.transaction('photos','readwrite');tx.objectStore('photos').delete(sourceId);tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error)})}catch(e){}}

function monthFor(rec){const s=String(rec?.data||rec?.createdAt||'');const m=s.match(/^(\d{4}-\d{2})/);if(m)return m[1];return String($('dfOpMonth')?.value||new Date().toISOString().slice(0,7)).slice(0,7)}
async function findCloudIds(sourceId,rec){
  const ids=new Set();if(rec?.cloudPhotoId)ids.add(String(rec.cloudPhotoId));
  const team=teamInfo();if(!team?.teamId)return [...ids];
  try{const j=await apiPost('/op/photo/list',{teamId:team.teamId,month:monthFor(rec)},true);for(const p of (Array.isArray(j.photos)?j.photos:[])){const sid=norm(p&&(p.sourceId||p.qr));if(sid===norm(sourceId)&&p.id)ids.add(String(p.id))}}catch(e){}
  return [...ids]
}
function removeLocalRecord(sourceId,cloudIds){const id=norm(sourceId),cloud=new Set((cloudIds||[]).map(String)),ops=loadOps(),next=ops.filter(o=>{if(!o)return false;if(id&&(idOf(o)===id||norm(o.qr)===id))return false;if(o.cloudPhotoId&&cloud.has(String(o.cloudPhotoId)))return false;return true});if(next.length!==ops.length)saveJson(OPS_KEY,next)}
async function deleteCloudIds(ids){const failed=[];for(const id of ids||[]){try{await apiPost('/op/photo/delete',{id},true)}catch(e){failed.push(String(id))}}return failed}

async function deleteSource(sourceId,cloudId,button){
  const id=norm(sourceId);if(!id)return;
  const rec=findOp(id);
  if(!confirm('Excluir esta OP e a foto?\n\nA produção e a apara serão retiradas dos totais. Se você ler e der baixa nesta mesma OP novamente, ela poderá entrar nos totais de novo.'))return;
  const old=button?.textContent||'';if(button){button.disabled=true;button.textContent='⏳ APAGANDO...'}
  try{
    let cloudIds=await findCloudIds(id,rec);if(cloudId&&!cloudIds.includes(String(cloudId)))cloudIds.push(String(cloudId));
    addTombstone(id,cloudIds,rec);
    const failed=await deleteCloudIds(cloudIds);setPendingCloudIds(id,failed);
    await deleteLocal(id);removeLocalRecord(id,cloudIds);refresh();syncBackupSoon();
    try{window.dispatchEvent(new CustomEvent('df-op-record-deleted',{detail:{id}}))}catch(e){}
    try{window.DFOpCloud?.sync?.(true)}catch(e){}
    if(failed.length)alert('✅ OP removida dos totais. A foto da nuvem ficou marcada para nova tentativa de exclusão quando a conexão permitir.');
    else alert('✅ OP e foto excluídas. Se você der baixa nessa mesma OP novamente, ela volta a entrar normalmente nos totais.');
    schedule(80);
  }catch(e){if(button){button.disabled=false;button.textContent=old}alert('Não consegui concluir a exclusão: '+String(e?.message||e))}
}

async function retryCloudDeletes(){
  if(retryBusy||navigator.onLine===false||document.hidden)return;
  const d=loadDeleted(),entries=Object.entries(d).filter(([,x])=>Array.isArray(x?.cloudIds)&&x.cloudIds.length);if(!entries.length)return;
  retryBusy=true;
  try{for(const [id,x] of entries){const failed=await deleteCloudIds(x.cloudIds);setPendingCloudIds(id,failed)}}finally{retryBusy=false}
}

function addStyle(){if($('dfLifecycleStyle'))return;const s=document.createElement('style');s.id='dfLifecycleStyle';s.textContent='.dfLifecycleDelete{width:100%!important;border:1px solid #dc2626!important;background:#2a0d0d!important;color:#fecaca!important;border-radius:12px!important;padding:12px 10px!important;font-size:12px!important;font-weight:950!important;margin-top:8px!important}.dfLifecycleDelete:disabled{opacity:.55!important}.dfCloudPhotoBtns .dfLifecycleDelete{grid-column:1/-1!important;margin-top:0!important}';document.head.appendChild(s)}
function sourceFromRow(row){const b=row?.querySelector('b,strong');const t=String(b?.textContent||row?.textContent||'');const m=t.match(/DFOP-\d{8}-\d{6}-[A-Z0-9-]+/i);return m?norm(m[0]):''}
function enhance(){
  addStyle();reconcile();
  document.querySelectorAll('#dfOkList .dfOpList,#dfPendingList .dfOpList').forEach(row=>{
    const view=row.querySelector('[data-view]');if(!view)return;const id=norm(view.getAttribute('data-view'));if(!id)return;
    if(tombstoneFor(id)){row.remove();return}
    if(row.querySelector('[data-life-delete-op]'))return;
    const b=document.createElement('button');b.type='button';b.className='dfLifecycleDelete';b.dataset.lifeDeleteOp=id;b.textContent='🗑️ EXCLUIR OP E FOTO';view.insertAdjacentElement('afterend',b);
  });
  document.querySelectorAll('#dfCloudPhotosBox .dfCloudPhotoRow').forEach(row=>{
    const open=row.querySelector('[data-cloud-open]');if(!open)return;const cloudId=String(open.getAttribute('data-cloud-open')||'').trim(),id=sourceFromRow(row);if(!cloudId||!id)return;
    if(tombstoneFor(id)){row.remove();return}
    if(row.querySelector('[data-life-delete-cloud]'))return;
    let box=row.querySelector('.dfCloudPhotoBtns');if(!box){box=document.createElement('div');box.className='dfCloudPhotoBtns';row.appendChild(box)}
    const b=document.createElement('button');b.type='button';b.className='dfCloudPhotoBtn dfLifecycleDelete';b.dataset.lifeDeleteCloud=cloudId;b.dataset.lifeSource=id;b.textContent='🗑️ EXCLUIR OP E FOTO';box.appendChild(b);
  });
}
function schedule(ms){clearTimeout(timer);timer=setTimeout(enhance,ms==null?80:ms)}
function afterManualSave(){setTimeout(()=>{reconcile();refresh();schedule(40)},80);setTimeout(()=>{reconcile();refresh();schedule(40)},350)}

document.addEventListener('click',e=>{
  const manual=e.target?.closest?.('#dfManualSave');if(manual){beforeManualSave();afterManualSave();return}
  const op=e.target?.closest?.('[data-life-delete-op]');if(op){e.preventDefault();e.stopImmediatePropagation();deleteSource(op.dataset.lifeDeleteOp,'',op);return}
  const cloud=e.target?.closest?.('[data-life-delete-cloud]');if(cloud){e.preventDefault();e.stopImmediatePropagation();deleteSource(cloud.dataset.lifeSource,cloud.dataset.lifeDeleteCloud,cloud);return}
  const legacy=e.target?.closest?.('[data-delphoto]');if(legacy){e.preventDefault();e.stopImmediatePropagation();deleteSource(legacy.getAttribute('data-delphoto'),'',legacy);return}
  if(e.target?.closest?.('#dfFormulaOps,[data-pane="ok"],[data-pane="pending"],[data-pane="archive"],[data-pane="month"]'))schedule(100);
},true);

['df-op-saved','df-op-save-ui-refresh','df-op-remote-merged','df-op-cloud-synced','df-op-phantoms-cleaned','df-cloud-photos-rendered'].forEach(ev=>window.addEventListener(ev,()=>{reconcile();schedule(70)}));
window.addEventListener('online',()=>{retryCloudDeletes();schedule(150)});
window.addEventListener('pageshow',()=>{reconcile();retryCloudDeletes();schedule(150)});
document.addEventListener('visibilitychange',()=>{if(!document.hidden){reconcile();retryCloudDeletes();schedule(180)}});
window.addEventListener('df-ui-ready',()=>{reconcile();schedule(120)});

function boot(){addStyle();reconcile();setTimeout(()=>{reconcile();enhance()},350);setTimeout(()=>{reconcile();enhance()},1200)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.DFOpLifecycleAuthority={reconcile,clearTombstone,deleteSource};
})();
