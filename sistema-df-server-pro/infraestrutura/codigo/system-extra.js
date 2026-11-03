(function(){
  const APP_VERSION='1.0.47';
  const CACHE_TAG='20260908-boot-stable-v97';
  const BASE=location.pathname.includes('/secure-frontend/')?'../':'./';
  const VERSION_URL=BASE+'app-version.json';
  let versionTimer=0;

  function addStyle(){
    if(document.getElementById('dfSystemStyle'))return;
    const st=document.createElement('style');
    st.id='dfSystemStyle';
    st.textContent=[
      '.dfSystemBar{position:relative;z-index:20;display:flex;gap:8px;align-items:center;justify-content:space-between;background:rgba(8,11,19,.94);border:1px solid #334155;border-radius:16px;padding:8px 10px;margin:-4px 0 12px;box-shadow:0 10px 26px rgba(0,0,0,.25);backdrop-filter:blur(8px)}',
      '.dfSystemVer{font:800 12px system-ui;color:#facc15;white-space:nowrap}',
      '.dfSystemActions{display:flex;gap:7px;align-items:center}',
      '.dfSystemBtn{border:0;border-radius:12px;background:#f59e0b;color:#111827;font:900 11px system-ui;padding:9px 10px;cursor:pointer;box-shadow:inset 0 -2px 0 rgba(0,0,0,.18)}',
      '.dfSystemBtn.alt{background:#1e293b;color:#f8fafc;border:1px solid #475569;box-shadow:none}',
      '.dfSystemBtn.ok{background:#166534;color:#fff;border:1px solid #22c55e;box-shadow:none}',
      '.dfSystemBtn:active{transform:translateY(1px)}',
      '@media(max-width:560px){.dfSystemBar{margin:0 0 10px;padding:8px;align-items:flex-start}.dfSystemVer{font-size:11px;padding-top:8px}.dfSystemActions{flex-direction:column;align-items:stretch}.dfSystemBtn{font-size:10px;padding:8px 8px}}'
    ].join('');
    document.head.appendChild(st);
  }

  async function latestVersionData(){
    try{
      const r=await fetch(VERSION_URL+'?t='+Date.now(),{cache:'no-store'});
      if(!r.ok)return null;
      return await r.json();
    }catch(e){return null}
  }

  function setVersionLabel(version){
    const el=document.querySelector('.dfSystemVer');
    const v=String(version||APP_VERSION).trim()||APP_VERSION;
    if(el)el.textContent='DF EXTRUSOR PRO v'+v;
  }

  async function syncVersionLabel(){
    if(document.hidden)return;
    const data=await latestVersionData();
    setVersionLabel(data&&data.version?data.version:APP_VERSION);
  }

  function clearBrowserCaches(){
    const jobs=[];
    try{if('caches' in window)jobs.push(caches.keys().then(keys=>Promise.all(keys.map(k=>caches.delete(k)))))}catch(e){}
    return Promise.allSettled(jobs);
  }

  async function updateServiceWorkerNow(){
    if(!('serviceWorker' in navigator))return;
    try{
      const reg=await navigator.serviceWorker.getRegistration(BASE);
      if(reg)await reg.update();
    }catch(e){console.warn('DF SW update:',e)}
  }

  async function refreshClean(){
    const btn=document.getElementById('dfSystemRefresh');
    if(btn)btn.textContent='ATUALIZANDO...';
    await clearBrowserCaches();
    await updateServiceWorkerNow();
    const data=await latestVersionData();
    if(data&&data.version)setVersionLabel(data.version);
    const url=new URL(location.href);
    url.searchParams.set('v',String(data&&data.version||CACHE_TAG));
    url.searchParams.set('t',Date.now());
    location.replace(url.toString());
  }

  async function notifyState(){
    const btn=document.getElementById('dfSystemNotify');if(!btn)return;
    let p='unsupported';
    try{if(typeof window.dfPushStatus==='function')p=await window.dfPushStatus();else p=window.dfNotificationPermission?window.dfNotificationPermission():('Notification' in window?Notification.permission:'unsupported')}catch(e){}
    btn.style.display='';
    if(p==='push'){btn.textContent='✓ ATUALIZAÇÕES ATIVAS';btn.className='dfSystemBtn ok';btn.title='Web Push ativo neste aparelho, inclusive com o app fechado'}
    else if(p==='granted'){btn.textContent='🔔 CONCLUIR ATUALIZAÇÕES';btn.className='dfSystemBtn alt';btn.title='Permissão liberada; falta concluir a assinatura Web Push'}
    else if(p==='unsupported'){btn.style.display='none'}
    else{btn.textContent='🔔 ATIVAR ATUALIZAÇÕES';btn.className='dfSystemBtn alt';btn.title='Receber avisos quando o DF EXTRUSOR PRO for atualizado'}
  }

  async function enableNotify(){
    const btn=document.getElementById('dfSystemNotify');
    try{
      if(typeof window.dfPushStatus==='function'){
        const state=await window.dfPushStatus();
        if(state==='push'){
          if(typeof window.dfClearAppBadge==='function')await window.dfClearAppBadge();
          await notifyState();
          return;
        }
      }
      if(btn)btn.textContent='ATIVANDO...';
      if(typeof window.dfEnableNotifications==='function')await window.dfEnableNotifications();
      else alert('O sistema de atualizações ainda está carregando. Tente novamente em alguns segundos.');
    }catch(e){console.warn(e)}
    await notifyState();
  }

  function addBar(){
    addStyle();
    let bar=document.getElementById('dfSystemBar');
    if(!bar){
      bar=document.createElement('div');
      bar.id='dfSystemBar';
      bar.className='dfSystemBar';
      bar.innerHTML='<span class="dfSystemVer">DF EXTRUSOR PRO v'+APP_VERSION+'</span><div class="dfSystemActions"><button id="dfSystemNotify" class="dfSystemBtn alt" type="button">🔔 ATIVAR ATUALIZAÇÕES</button><button id="dfSystemRefresh" class="dfSystemBtn" type="button">↻ ATUALIZAR</button></div>';
      const app=document.getElementById('appContent');
      const tabs=app?app.querySelector('.tabs'):document.querySelector('.tabs');
      if(tabs&&tabs.parentNode)tabs.parentNode.insertBefore(bar,tabs);
      else if(app)app.insertBefore(bar,app.firstChild);
      else document.body.insertBefore(bar,document.body.firstChild);
    }
    const btn=document.getElementById('dfSystemRefresh');
    if(btn&&!btn.dfRefreshBound){btn.dfRefreshBound=true;btn.addEventListener('click',refreshClean)}
    const nbtn=document.getElementById('dfSystemNotify');
    if(nbtn&&!nbtn.dfNotifyBound){nbtn.dfNotifyBound=true;nbtn.addEventListener('click',enableNotify)}
    notifyState();
    syncVersionLabel();
  }

  function loadVendedor(){
    if(document.getElementById('dfVendedorScript'))return;
    const s=document.createElement('script');
    s.id='dfVendedorScript';
    s.src='./vendedor-extra.js?v=20260908-boot-stable-v97';
    document.body.appendChild(s);
  }

  function scheduleVersionSync(){
    clearInterval(versionTimer);
    versionTimer=setInterval(function(){if(!document.hidden)syncVersionLabel()},5*60*1000);
  }

  function init(){
    addBar();
    loadVendedor();
    scheduleVersionSync();
  }

  window.addEventListener('df-notify-status',notifyState);
  window.addEventListener('df-ui-ready',addBar);
  document.addEventListener('visibilitychange',function(){if(!document.hidden){notifyState();syncVersionLabel()}});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();