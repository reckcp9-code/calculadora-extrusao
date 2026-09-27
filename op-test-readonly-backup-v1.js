(function(){
'use strict';
if(window.DFOpTestSnapshot)return;
const API='https://df-extrusor-api.reck-cp9.workers.dev';
const OPS='df_formula_ops_auto_v2',REG='df_op_qr_registry_v1';
let snapshot=null,loading=null,manual=false;
function payload(t){try{let x=String(t||'').split('.')[0].replace(/-/g,'+').replace(/_/g,'/');while(x.length%4)x+='=';return JSON.parse(decodeURIComponent(Array.from(atob(x),c=>'%'+c.charCodeAt(0).toString(16).padStart(2,'0')).join('')))}catch(e){return null}}
function bytes(s){s=String(s||'').replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';return Uint8Array.from(atob(s),c=>c.charCodeAt(0))}
async function load(){
 if(manual)return snapshot;
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
   if(manual)return snapshot;
   snapshot={ops,registry:reg};
   window.dispatchEvent(new Event('df-op-test-snapshot'));
   return snapshot;
  }catch(e){return null}
 })();
 try{return await loading}finally{loading=null}
}
function mountImport(){
 const pane=document.getElementById('dfPaneMonth');if(!pane||document.getElementById('dfOpTestImport'))return;
 const card=pane.querySelector('.dfOpsCard');if(!card)return;
 const box=document.createElement('div');box.id='dfOpTestImport';
 box.style.cssText='border:1px solid #a16207;background:#241800;border-radius:12px;padding:11px;margin:12px 0;color:#fde68a;font-size:12px';
 box.innerHTML='<b>Conferir histórico do app instalado</b><div style="margin:5px 0 8px">Se você tiver uma cópia JSON das OPs do original, selecione aqui. A prévia apenas lê o arquivo; não grava nem altera as OPs.</div><input type="file" accept=".json,application/json" style="max-width:100%"><div data-status style="margin-top:6px"></div>';
 card.appendChild(box);
 const input=box.querySelector('input'),status=box.querySelector('[data-status]');
 input.addEventListener('change',async()=>{
  const file=input.files?.[0];if(!file)return;
  try{
   if(file.size>12*1024*1024)throw new Error('Arquivo muito grande.');
   const data=JSON.parse(await file.text()),ops=data?.ops||data?.data?.df_formula_ops_auto_v2;
   const list=typeof ops==='string'?JSON.parse(ops):ops;
   if(!Array.isArray(list)||!list.every(x=>x&&typeof x==='object'&&typeof x.id==='string'))throw new Error('Arquivo não contém uma lista válida de OPs.');
   const raw=data?.registry||data?.data?.df_op_qr_registry_v1||{},reg=typeof raw==='string'?JSON.parse(raw):raw;
   manual=true;snapshot={ops:list,registry:reg&&typeof reg==='object'?reg:{}};
   status.textContent=list.length+' OPs lidas apenas nesta sessão.';
   window.dispatchEvent(new Event('df-op-test-snapshot'));
  }catch(e){status.textContent='Não consegui ler as OPs deste arquivo: '+String(e.message||e)}
  input.value='';
 });
}
window.DFOpTestSnapshot={load,get:()=>snapshot};
setInterval(mountImport,1200);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(load,800),{once:true});else setTimeout(load,800);
window.addEventListener('pageshow',()=>setTimeout(load,150));
})();