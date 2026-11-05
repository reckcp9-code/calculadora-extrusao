(function(){'use strict';if(window.DFOpNameAtCreationV1)return;window.DFOpNameAtCreationV1=true;
const API='https://df-extrusor-api.reck-cp9.workers.dev',REG='df_op_qr_registry_v1',QUEUE='df_op_name_create_queue_v1',TEAM='df_op_team_v1';
const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||'null')??f}catch(e){return f}},write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
const clean=x=>String(x??'').trim(),name=x=>clean(x).replace(/\s+/g,' '),id=x=>clean(x).toUpperCase();
function team(){try{return window.DFOpCloud?.team?.()||read(TEAM,{})}catch(e){return read(TEAM,{})}}
function register(d){const op=id(d?.id),e=d?.expected||{},n=name(e.produto||e.title||e.cliente||'');if(!op||!n)return;const q=read(QUEUE,{});q[op]={opCode:op,productName:n,teamId:clean(team()?.teamId),createdAt:clean(d.createdAt)||new Date().toISOString()};write(QUEUE,q);flush()}
let busy=false;async function flush(){if(busy||navigator.onLine===false)return;const t=team(),tid=clean(t?.teamId);if(!tid)return;const q=read(QUEUE,{}),items=Object.values(q).filter(x=>x.teamId===tid);if(!items.length)return;busy=true;
try{let token='';try{token=clean(sessionStorage.getItem('df_secure_token_v2'))}catch(e){};let device='';try{device=clean(window.DFDeviceIdentity?.get?.()||localStorage.getItem('df_licenseauth_device_v1'))}catch(e){}
if(!token||!device){try{await window.DFOpProductD1Authority?.sync?.(false)}catch(e){};return;}
const response=await fetch(API+'/op/product/sync',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token,'X-DF-Device':device},body:JSON.stringify({teamId:tid,fillOnly:true,products:items.map(x=>({opCode:x.opCode,productName:x.productName}))}),cache:'no-store'});
if(!response.ok)return;const j=await response.json();if(j.ok===false)return;
const next=read(QUEUE,{});items.forEach(x=>{if(next[x.opCode]?.createdAt===x.createdAt)delete next[x.opCode]});write(QUEUE,next);try{window.DFOpProductD1Authority?.pull?.(false)}catch(e){}
}catch(e){}finally{busy=false}}
window.addEventListener('df-op-qr-created',e=>register(e.detail));
// QR records can be persisted before the creation event listener runs. Recover them safely.
function scanRegistry(){const reg=read(REG,{}),tid=clean(team()?.teamId),done=read('df_op_name_create_scanned_v1:'+tid,{});if(!tid)return;let changed=false;for(const key of Object.keys(reg||{})){const row=reg[key],code=id(row?.id||key);if(!code||!row||typeof row!=='object'||done[code])continue;const e=row.expected||{},n=name(e.produto||e.title||e.cliente||'');if(!n)continue;register({...row,id:code});done[code]=true;changed=true;}if(changed)write('df_op_name_create_scanned_v1:'+tid,done);}

window.addEventListener('online',flush);window.addEventListener('df-team-joined',flush);window.addEventListener('df-team-changed',flush);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)flush()});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{scanRegistry();flush()});else {scanRegistry();flush();}
setInterval(()=>{if(!document.hidden){scanRegistry();flush()}},45000);
})();
