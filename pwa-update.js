(function(){
  'use strict';
  const VERSION_URL='./app-version.json';
  const LAST_VERSION='df_last_version_seen_v1';
  const LAST_NOTIFY='df_last_version_notified_v1';
  let reg=null;

  function ensureManifest(){
    if(document.querySelector('link[rel="manifest"]'))return;
    const link=document.createElement('link');
    link.rel='manifest';
    link.href='./manifest.webmanifest';
    document.head.appendChild(link);
  }

  async function registerSW(){
    if(!('serviceWorker' in navigator))return null;
    try{
      reg=await navigator.serviceWorker.register('./sw.js',{scope:'./'});
      return reg;
    }catch(e){
      console.warn('DF SW:',e);
      return null;
    }
  }

  async function showDeviceNotification(title,body){
    if(!('Notification' in window)||Notification.permission!=='granted')return;
    try{
      const r=reg||await navigator.serviceWorker.ready;
      if(r&&r.showNotification){
        await r.showNotification(title,{body,icon:'./logo.svg',badge:'./logo.svg',tag:'df-extrusor-update',renotify:true,data:{url:'./'}});
      }
    }catch(e){console.warn(e)}
  }

  function removeBanner(){
    const el=document.getElementById('dfUpdateBanner');
    if(el)el.remove();
  }

  function showBanner(data){
    if(document.getElementById('dfUpdateBanner'))return;
    const box=document.createElement('div');
    box.id='dfUpdateBanner';
    box.style.cssText='position:fixed;left:50%;transform:translateX(-50%);bottom:18px;z-index:99999;width:min(92vw,520px);background:#111827;color:#f8fafc;border:1px solid #f59e0b;border-radius:16px;padding:14px;box-shadow:0 18px 45px rgba(0,0,0,.45);font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial';
    box.innerHTML='<div style="font-weight:900;color:#facc15;margin-bottom:4px">'+String(data.title||'DF EXTRUSOR PRO atualizado')+'</div><div style="font-size:13px;line-height:1.4;margin-bottom:10px">'+String(data.message||'Uma nova versão está disponível.')+'</div><div style="display:flex;gap:8px;justify-content:flex-end"><button id="dfUpdateLater" style="border:1px solid #475569;background:#0f172a;color:#e2e8f0;border-radius:10px;padding:8px 11px;font-weight:800;cursor:pointer">DEPOIS</button><button id="dfUpdateNow" style="border:0;background:#f59e0b;color:#111827;border-radius:10px;padding:8px 11px;font-weight:900;cursor:pointer">ATUALIZAR AGORA</button></div>';
    document.body.appendChild(box);
    document.getElementById('dfUpdateLater').onclick=removeBanner;
    document.getElementById('dfUpdateNow').onclick=async()=>{
      try{localStorage.setItem(LAST_VERSION,String(data.version||''));}catch(e){}
      try{if('caches' in window){const keys=await caches.keys();await Promise.all(keys.map(k=>caches.delete(k)));}}catch(e){}
      const u=new URL(location.href);u.searchParams.set('v',String(data.version||Date.now()));u.searchParams.set('t',Date.now());location.replace(u.toString());
    };
  }

  async function checkVersion(){
    try{
      const r=await fetch(VERSION_URL+'?t='+Date.now(),{cache:'no-store'});
      if(!r.ok)return;
      const data=await r.json();
      const current=String(data.version||'').trim();
      if(!current)return;
      const seen=localStorage.getItem(LAST_VERSION);
      if(!seen){localStorage.setItem(LAST_VERSION,current);return;}
      if(seen===current)return;
      showBanner(data);
      const notified=localStorage.getItem(LAST_NOTIFY);
      if(notified!==current){
        await showDeviceNotification(data.title||'DF EXTRUSOR PRO atualizado',data.message||'Nova versão disponível.');
        try{localStorage.setItem(LAST_NOTIFY,current);}catch(e){}
      }
    }catch(e){console.warn('DF version:',e)}
  }

  async function enableNotifications(){
    if(!('Notification' in window)){
      alert('Este navegador não oferece notificações web.');
      return false;
    }
    const permission=await Notification.requestPermission();
    if(permission!=='granted'){
      alert('Notificações não foram permitidas. Você pode liberar depois nas configurações do navegador.');
      return false;
    }
    await registerSW();
    await showDeviceNotification('DF EXTRUSOR PRO','Notificações de atualização ativadas neste aparelho.');
    window.dispatchEvent(new CustomEvent('df-notify-status',{detail:{permission:'granted'}}));
    return true;
  }

  window.dfEnableNotifications=enableNotifications;
  window.dfNotificationPermission=()=>('Notification' in window?Notification.permission:'unsupported');
  window.dfCheckForUpdate=checkVersion;

  async function init(){
    ensureManifest();
    await registerSW();
    setTimeout(checkVersion,1200);
    setInterval(checkVersion,15*60*1000);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkVersion();});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
