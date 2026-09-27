(function(){
'use strict';
if(window.DFOpTestSnapshot)return;
const API='https://df-extrusor-api.reck-cp9.workers.dev';
const OPS='df_formula_ops_auto_v2',REG='df_op_qr_registry_v1';
let snapshot=null,loading=null;
function payload(t){try{let x=String(t||'').split('.')[0].replace(/-/g,'+').replace(/_/g,'/');while(x.length%4)x+='=';return JSON.parse(decodeURIComponent(Array.from(atob(x),c=>'%'+c.charCodeAt(0).toString(16).padStart(2,'0')).join('')))}catch(e){return null}}
function bytes(s){s=String(s||'').replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';return Uint8Array.from(atob(s),c=>c.charCodeAt(0))}
async function load(){
 if(loading)return loading;
 loading=(async()=>{
  try{
   let token=String(sessionStorage.getItem('df_secure_token_v2')||'');
   const dev=window.DFDeviceIdentity?.get?.()||localStorage.getItem('df_licenseauth_device_v1')||'';
   if(!payload(token)?.owner){
    const credential=localStorage.getItem('df_auto_access_credential_v1')||'';
    if(!credential||!dev)return null;
    const a=await fetch(API+'/access/session',{method:'POST',headers:{'Content-Type':'application/json','X-DF-Device':dev},body:JSON.stringify({credential,deviceId:dev}),cache:'no-store'});
    if(!a.ok)return null;
    token=String((await a.json()).token||'');
   }
   const owner=String(payload(token)?.owner||'');if(!owner)return null;
   const r=await fetch(API+'/backup/load',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token,'X-DF-Device':dev},body:'{}',cache:'no-store'});
   if(!r.ok)return null;
   const env=(await r.json()).backup;
   if(!env||env.alg!=='A256GCM')return null;
   const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('DF-EXTRUSOR-BACKUP-v2|'+owner));
   const key=await crypto.subtle.importKey('raw',digest,{name:'AES-GCM'},false,['decrypt']);
   const raw=await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(env.iv)},key,bytes(env.ct));
   const data=JSON.parse(new TextDecoder().decode(raw)).data||{};
   const ops=JSON.parse(data[OPS]||'[]'),reg=JSON.parse(data[REG]||'{}');
   if(!Array.isArray(ops)||!ops.length)return null;
   snapshot={ops,registry:reg};
   window.dispatchEvent(new Event('df-op-test-snapshot'));
   return snapshot;
  }catch(e){return null}
 })();
 try{return await loading}finally{loading=null}
}
window.DFOpTestSnapshot={load,get:()=>snapshot};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(load,800),{once:true});else setTimeout(load,800);
window.addEventListener('pageshow',()=>setTimeout(load,150));
})();