(function(){
  'use strict';
  if(window.DFOpPhotoDeleteV1)return;
  window.DFOpPhotoDeleteV1=true;

  const API='https://df-extrusor-api.reck-cp9.workers.dev';
  const TOKEN_KEY='df_secure_token_v2';
  const DEVICE_KEY='df_licenseauth_device_v1';
  const ACCESS_KEY='df_auto_access_credential_v1';
  let mounted=false;

  function deviceId(){
    try{if(window.DFDeviceIdentity&&typeof window.DFDeviceIdentity.get==='function'){const id=String(window.DFDeviceIdentity.get()||'').trim();if(id)return id}}catch(e){}
    try{return String(localStorage.getItem(DEVICE_KEY)||'').trim()}catch(e){return ''}
  }

  function tokenPayload(token){
    try{let s=String(token||'').split('.')[0]||'';s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';return JSON.parse(decodeURIComponent(Array.from(atob(s)).map(c=>'%'+c.charCodeAt(0).toString(16).padStart(2,'0')).join('')))}catch(e){return null}
  }

  async function renewSession(force){
    let token='';
    try{token=String(sessionStorage.getItem(TOKEN_KEY)||'').trim()}catch(e){}
    const p=tokenPayload(token);
    if(token&&!force&&p&&p.owner)return token;
    let credential='';try{credential=String(localStorage.getItem(ACCESS_KEY)||'').trim()}catch(e){}
    const dev=deviceId();
    if(!credential||!dev)throw new Error('Acesso automático indisponível.');
    const r=await fetch(API+'/access/session',{method:'POST',headers:{'Content-Type':'application/json','X-DF-Device':dev},body:JSON.stringify({credential,deviceId:dev}),cache:'no-store'});
    let j={};try{j=await r.json()}catch(e){}
    if(!r.ok||j.ok===false)throw new Error(j.error||'Não foi possível renovar a sessão.');
    token=String(j.token||'').trim();
    if(!token)throw new Error('Sessão vazia.');
    try{sessionStorage.setItem(TOKEN_KEY,token)}catch(e){}
    return token;
  }

  async function apiDeletePhoto(id,retry){
    const token=await renewSession(false),dev=deviceId();
    const r=await fetch(API+'/op/photo/delete',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token,'X-DF-Device':dev},body:JSON.stringify({id}),cache:'no-store'});
    let j={};try{j=await r.json()}catch(e){}
    if(r.status===401&&retry!==false){await renewSession(true);return apiDeletePhoto(id,false)}
    if(!r.ok||j.ok===false)throw new Error(j.error||('HTTP '+r.status));
    return j;
  }

  function addStyle(){
    if(document.getElementById('dfPhotoDeleteStyle'))return;
    const s=document.createElement('style');
    s.id='dfPhotoDeleteStyle';
    s.textContent='.dfCloudPhotoBtns.dfHasDelete{grid-template-columns:1fr 1fr!important}.dfCloudDeleteWrap{margin-top:7px}.dfCloudDeleteBtn{width:100%;border:1px solid #b91c1c!important;background:#2a0d0d!important;color:#fecaca!important;border-radius:10px;padding:10px;font-size:11px;font-weight:900}.dfCloudDeleteBtn:disabled{opacity:.55}';
    document.head.appendChild(s);
  }

  function enhance(){
    addStyle();
    const box=document.getElementById('dfCloudPhotosBox');
    if(!box)return false;
    box.querySelectorAll('.dfCloudPhotoRow').forEach(row=>{
      const open=row.querySelector('[data-cloud-open]');
      if(!open)return;
      const id=String(open.getAttribute('data-cloud-open')||'').trim();
      if(!id||row.querySelector('[data-cloud-delete]'))return;
      const wrap=document.createElement('div');wrap.className='dfCloudDeleteWrap';
      const btn=document.createElement('button');
      btn.type='button';btn.className='dfCloudDeleteBtn';btn.setAttribute('data-cloud-delete',id);btn.textContent='🗑️ EXCLUIR FOTO';
      wrap.appendChild(btn);row.appendChild(wrap);
    });
    return true;
  }

  async function deletePhoto(btn){
    const id=String(btn.getAttribute('data-cloud-delete')||'').trim();
    if(!id)return;
    if(!confirm('Apagar esta foto da nuvem da equipe?\n\nA OP será mantida. Esta ação não pode ser desfeita.'))return;
    const old=btn.textContent;btn.disabled=true;btn.textContent='⏳ APAGANDO...';
    try{
      await apiDeletePhoto(id,true);
      const row=btn.closest('.dfCloudPhotoRow');if(row)row.remove();
      try{if(window.DFOpCloud&&typeof window.DFOpCloud.sync==='function')await window.DFOpCloud.sync(true)}catch(e){}
      alert('✅ Foto apagada da nuvem. A OP foi mantida.');
    }catch(e){
      btn.disabled=false;btn.textContent=old;
      alert('Não consegui apagar a foto: '+String(e&&e.message||e));
    }
  }

  function mount(){
    if(mounted)return;
    const pane=document.getElementById('dfPaneArchive');
    if(!pane)return;
    mounted=true;
    enhance();
    const obs=new MutationObserver(()=>enhance());
    obs.observe(pane,{childList:true,subtree:true});
  }

  document.addEventListener('click',e=>{
    const b=e.target&&e.target.closest?e.target.closest('[data-cloud-delete]'):null;
    if(b){e.preventDefault();e.stopPropagation();deletePhoto(b);return}
    setTimeout(enhance,80);
  },true);

  function boot(){let n=0;const t=setInterval(()=>{mount();enhance();if(mounted||++n>30)clearInterval(t)},250);setTimeout(()=>{mount();enhance()},1000)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  window.addEventListener('df-ui-ready',()=>setTimeout(()=>{mount();enhance()},120));
})();
