(function(){
  'use strict';
  if(window.DFOpSyncLiteV2)return;
  window.DFOpSyncLiteV2=true;

  const OPS_KEY='df_formula_ops_auto_v2';
  const REG_KEY='df_op_qr_registry_v1';
  const GENERAL_BACKUP_KEY='df_cloud_last_backup_v1';
  const API='https://df-extrusor-api.reck-cp9.workers.dev';
  const TOKEN_KEY='df_secure_token_v2';
  const DEVICE_KEY='df_licenseauth_device_v1';
  const ACCESS_KEY='df_auto_access_credential_v1';
  let busy=false,lastHash='',timer=0,renewPromise=null,lastGeneralBackup='';

  const $=id=>document.getElementById(id);
  function quickHash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0).toString(16)}
  function cloudHash(){return quickHash(String(localStorage.getItem(OPS_KEY)||'')+'|'+String(localStorage.getItem(REG_KEY)||''))}
  function deviceId(){try{if(window.DFDeviceIdentity&&typeof window.DFDeviceIdentity.get==='function'){const id=String(window.DFDeviceIdentity.get()||'').trim();if(id)return id}}catch(e){}return String(localStorage.getItem(DEVICE_KEY)||'').trim()}
  function tokenPayload(token){try{let s=String(token||'').split('.')[0]||'';s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';return JSON.parse(decodeURIComponent(Array.from(atob(s)).map(c=>'%'+c.charCodeAt(0).toString(16).padStart(2,'0')).join('')))}catch(e){return null}}
  function b64(bytes){let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
  function unb64(s){s=String(s||'').replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';const bin=atob(s);return Uint8Array.from(bin,c=>c.charCodeAt(0))}

  async function renewSession(force){
    let token=String(sessionStorage.getItem(TOKEN_KEY)||'').trim(),p=tokenPayload(token);
    if(token&&!force&&p&&p.owner)return token;
    if(renewPromise)return renewPromise;
    renewPromise=(async()=>{
      const credential=String(localStorage.getItem(ACCESS_KEY)||'').trim(),dev=deviceId();
      if(!credential||!dev)throw new Error('sem acesso automático');
      const r=await fetch(API+'/access/session',{method:'POST',headers:{'Content-Type':'application/json','X-DF-Device':dev},body:JSON.stringify({credential,deviceId:dev}),cache:'no-store'});
      let j={};try{j=await r.json()}catch(e){}
      if(!r.ok||j.ok===false)throw new Error(j.error||'sessão indisponível');
      token=String(j.token||'').trim();if(!token)throw new Error('sessão vazia');
      sessionStorage.setItem(TOKEN_KEY,token);return token;
    })();
    try{return await renewPromise}finally{renewPromise=null}
  }

  async function apiPost(path,body,retry){
    const token=await renewSession(false),dev=deviceId();
    const r=await fetch(API+path,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token,'X-DF-Device':dev},body:JSON.stringify(body||{}),cache:'no-store'});
    let j={};try{j=await r.json()}catch(e){}
    if((!r.ok||j.ok===false)&&r.status===401&&retry!==false){await renewSession(true);return apiPost(path,body,false)}
    if(!r.ok||j.ok===false)throw new Error(j.error||('HTTP '+r.status));
    return j;
  }
  async function deriveKey(owner){const raw=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('DF-EXTRUSOR-BACKUP-v2|'+owner));return crypto.subtle.importKey('raw',raw,{name:'AES-GCM'},false,['encrypt','decrypt'])}
  async function encrypt(data,owner){const key=await deriveKey(owner),iv=crypto.getRandomValues(new Uint8Array(12)),plain=new TextEncoder().encode(JSON.stringify(data)),ct=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,plain);return{v:2,alg:'A256GCM',kdf:'owner-v1',iv:b64(iv),ct:b64(new Uint8Array(ct))}}
  async function decrypt(env,owner){if(!env||env.alg!=='A256GCM')throw new Error('backup inválido');const key=await deriveKey(owner),plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(env.iv)},key,unb64(env.ct));return JSON.parse(new TextDecoder().decode(plain))}

  function setState(text,type){
    let e=$('dfOpSyncLiteState');
    const hero=document.querySelector('#dfFormulaOps .dfOpsHero');
    if(!hero)return;
    if(!e){e=document.createElement('div');e.id='dfOpSyncLiteState';e.style.cssText='margin-top:7px;font-size:10px;font-weight:850;color:#94a3b8';hero.appendChild(e)}
    if(e.textContent!==text)e.textContent=text;
    e.style.color=type==='ok'?'#86efac':type==='warn'?'#fde68a':'#94a3b8';
  }

  async function sync(force){
    if(busy||document.hidden||navigator.onLine===false)return false;
    if(!localStorage.getItem(ACCESS_KEY))return false;
    const h=cloudHash();
    if(!force&&h===lastHash)return true;
    busy=true;
    try{
      const token=await renewSession(false),owner=String(tokenPayload(token)?.owner||'').trim();if(!owner)throw new Error('sem proprietário');
      const loaded=await apiPost('/backup/load',{});
      let snap={v:2,createdAt:new Date().toISOString(),origin:location.origin,data:{}};
      if(loaded.backup){try{snap=await decrypt(loaded.backup,owner)}catch(e){}}
      if(!snap||typeof snap!=='object')snap={};if(!snap.data||typeof snap.data!=='object')snap.data={};
      const ops=localStorage.getItem(OPS_KEY),reg=localStorage.getItem(REG_KEY);
      if(ops!==null)snap.data[OPS_KEY]=ops;if(reg!==null)snap.data[REG_KEY]=reg;
      snap.v=Math.max(2,Number(snap.v)||2);snap.createdAt=new Date().toISOString();snap.origin=location.origin;snap.opSyncVersion=3;
      await apiPost('/backup/save',{backup:await encrypt(snap,owner),clientTime:snap.createdAt});
      lastHash=h;lastGeneralBackup=String(localStorage.getItem(GENERAL_BACKUP_KEY)||'');
      setState('☁️ Dados das OPs sincronizados','ok');
      return true;
    }catch(e){setState('☁️ Dados das OPs aguardando sincronização','warn');return false}
    finally{busy=false}
  }

  async function restoreIfEmpty(){
    try{
      const local=JSON.parse(localStorage.getItem(OPS_KEY)||'[]');
      if(Array.isArray(local)&&local.length)return;
      if(navigator.onLine===false||!localStorage.getItem(ACCESS_KEY))return;
      const token=await renewSession(false),owner=String(tokenPayload(token)?.owner||'').trim();if(!owner)return;
      const loaded=await apiPost('/backup/load',{});if(!loaded.backup)return;
      const snap=await decrypt(loaded.backup,owner),ops=snap?.data?.[OPS_KEY],reg=snap?.data?.[REG_KEY];
      if(ops){
        localStorage.setItem(OPS_KEY,String(ops));if(reg)localStorage.setItem(REG_KEY,String(reg));
        lastHash=cloudHash();setState('☁️ Dados das OPs restaurados','ok');
        const month=$('dfOpMonth');if(month)month.dispatchEvent(new Event('change'));
      }
    }catch(e){}
  }

  function schedule(ms,force){clearTimeout(timer);timer=setTimeout(()=>sync(!!force),ms||700)}
  function checkGeneralBackup(){
    const now=String(localStorage.getItem(GENERAL_BACKUP_KEY)||'');
    if(now&&now!==lastGeneralBackup){lastGeneralBackup=now;schedule(600,true)}
  }

  function boot(){
    lastGeneralBackup=String(localStorage.getItem(GENERAL_BACKUP_KEY)||'');
    setTimeout(()=>{restoreIfEmpty();schedule(1200,false)},700);
    window.addEventListener('df-op-qr-created',()=>schedule(700,false));
    window.addEventListener('df-op-saved',()=>schedule(700,true));
    window.addEventListener('df-general-backup-saved',()=>schedule(650,true));
    window.addEventListener('online',()=>schedule(500,true));
    document.addEventListener('visibilitychange',()=>{if(!document.hidden){checkGeneralBackup();schedule(500,false)}});
    setInterval(()=>{if(!document.hidden)checkGeneralBackup()},45000);
  }

  window.DFOpSyncLite={sync:(force)=>sync(!!force)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();