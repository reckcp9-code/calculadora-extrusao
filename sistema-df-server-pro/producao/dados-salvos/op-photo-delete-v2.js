(function(){
  'use strict';
  if(window.DFOpPhotoDeleteV2)return;
  window.DFOpPhotoDeleteV2=true;

  const API='https://df-extrusor-api.reck-cp9.workers.dev';
  const TOKEN_KEY='df_secure_token_v2';
  const DEVICE_KEY='df_licenseauth_device_v1';
  const ACCESS_KEY='df_auto_access_credential_v1';

  function deviceId(){
    try{if(window.DFDeviceIdentity&&typeof window.DFDeviceIdentity.get==='function'){const id=String(window.DFDeviceIdentity.get()||'').trim();if(id)return id}}catch(e){}
    try{return String(localStorage.getItem(DEVICE_KEY)||'').trim()}catch(e){return ''}
  }

  function tokenPayload(token){
    try{let s=String(token||'').split('.')[0]||'';s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';return JSON.parse(decodeURIComponent(Array.from(atob(s)).map(c=>'%'+c.charCodeAt(0).toString(16).padStart(2,'0')).join('')))}catch(e){return null}
  }

  async function renewSession(force){
    let token='';try{token=String(sessionStorage.getItem(TOKEN_KEY)||'').trim()}catch(e){}
    const p=tokenPayload(token);if(token&&!force&&p&&p.owner)return token;
    let credential='';try{credential=String(localStorage.getItem(ACCESS_KEY)||'').trim()}catch(e){}
    const dev=deviceId();if(!credential||!dev)throw new Error('Acesso automático indisponível.');
    const r=await fetch(API+'/access/session',{method:'POST',headers:{'Content-Type':'application/json','X-DF-Device':dev},body:JSON.stringify({credential,deviceId:dev}),cache:'no-store'});
    let j={};try{j=await r.json()}catch(e){}
    if(!r.ok||j.ok===false)throw new Error(j.error||'Não foi possível renovar a sessão.');
    token=String(j.token||'').trim();if(!token)throw new Error('Sessão vazia.');
    try{sessionStorage.setItem(TOKEN_KEY,token)}catch(e){}return token;
  }

  async function apiDeletePhoto(id,retry){
    const token=await renewSession(false),dev=deviceId();
    const r=await fetch(API+'/op/photo/delete',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token,'X-DF-Device':dev},body:JSON.stringify({id}),cache:'no-store'});
    let j={};try{j=await r.json()}catch(e){}
    if(r.status===401&&retry!==false){await renewSession(true);return apiDeletePhoto(id,false)}
    if(!r.ok||j.ok===false)throw new Error(j.error||('HTTP '+r.status));return j;
  }

  function addStyle(){
    if(document.getElementById('dfPhotoDeleteStyleV2'))return;
    const s=document.createElement('style');s.id='dfPhotoDeleteStyleV2';
    s.textContent='.dfCloudDeleteBtnV2{grid-column:1/-1!important;width:100%!important;border:1px solid #dc2626!important;background:#2a0d0d!important;color:#fecaca!important;border-radius:10px!important;padding:11px 10px!important;font-size:11px!important;font-weight:950!important;margin-top:0!important}.dfCloudDeleteBtnV2:disabled{opacity:.55!important}';
    document.head.appendChild(s);
  }

  function enhance(){
    addStyle();
    document.querySelectorAll('#dfCloudPhotosBox .dfCloudPhotoRow').forEach(row=>{
      if(row.querySelector('.dfCloudDeleteBtnV2'))return;
      const open=row.querySelector('[data-cloud-open]');if(!open)return;
      const id=String(open.getAttribute('data-cloud-open')||'').trim();if(!id)return;
      let buttons=row.querySelector('.dfCloudPhotoBtns');
      if(!buttons){buttons=document.createElement('div');buttons.className='dfCloudPhotoBtns';row.appendChild(buttons)}
      const btn=document.createElement('button');btn.type='button';btn.className='dfCloudPhotoBtn dfCloudDeleteBtnV2';btn.setAttribute('data-cloud-delete-v2',id);btn.textContent='🗑️ EXCLUIR FOTO';buttons.appendChild(btn);
    });
  }

  async function deletePhoto(btn){
    const id=String(btn.getAttribute('data-cloud-delete-v2')||'').trim();if(!id)return;
    if(!confirm('Apagar esta foto da nuvem da equipe?\n\nA OP será mantida. Esta ação não pode ser desfeita.'))return;
    const old=btn.textContent;btn.disabled=true;btn.textContent='⏳ APAGANDO...';
    try{await apiDeletePhoto(id,true);const row=btn.closest('.dfCloudPhotoRow');if(row)row.remove();try{if(window.DFOpCloud&&typeof window.DFOpCloud.sync==='function')window.DFOpCloud.sync(true)}catch(e){}alert('✅ Foto apagada da nuvem. A OP foi mantida.')}catch(e){btn.disabled=false;btn.textContent=old;alert('Não consegui apagar a foto: '+String(e&&e.message||e))}
  }

  document.addEventListener('click',function(e){const b=e.target&&e.target.closest?e.target.closest('[data-cloud-delete-v2]'):null;if(!b)return;e.preventDefault();e.stopPropagation();deletePhoto(b)},true);
  function boot(){enhance();setInterval(enhance,900)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  window.addEventListener('df-ui-ready',()=>setTimeout(enhance,120));
  window.addEventListener('df-op-remote-merged',()=>setTimeout(enhance,80));
})();
